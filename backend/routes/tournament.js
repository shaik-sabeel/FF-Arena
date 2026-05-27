const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Tournament = require('../models/Tournament');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// @route   POST api/tournament/create
// @desc    Create a tournament (Host/Admin only)
// @access  Private
router.post('/create', auth, async (req, res) => {
  const { title, description, gameMode, map, entryFee, prizePool, slots, matchDateTime, prizeDistribution } = req.body;

  try {
    const userObj = await User.findById(req.user.id);
    if (!userObj) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Verify host authority
    if (userObj.role !== 'host' && userObj.role !== 'admin') {
      return res.status(403).json({ msg: 'Access denied: Only Hosts or Admins are authorized to create match rooms.' });
    }

    // Ensure user has profile details completed
    if (!userObj.freeFireId || !userObj.freeFireName) {
      return res.status(400).json({ msg: 'Please complete your Free Fire ID and IGN in Profile before hosting.' });
    }

    const newTournament = new Tournament({
      title,
      description,
      gameMode,
      map,
      entryFee: Number(entryFee),
      prizePool: Number(prizePool),
      slots: Number(slots),
      matchDateTime,
      host: req.user.id,
      prizeDistribution: prizeDistribution || {
        winnerCount: 1,
        firstPlacePrize: Number(prizePool),
        secondPlacePrize: 0,
        thirdPlacePrize: 0
      }
    });

    const tournament = await newTournament.save();
    res.json(tournament);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/tournament
// @desc    Get all tournaments
// @access  Public
router.get('/', async (req, res) => {
  try {
    const tournaments = await Tournament.find()
      .populate('host', 'username freeFireName')
      .sort({ matchDateTime: 1 });
    res.json(tournaments);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/tournament/:id
// @desc    Get tournament by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('host', 'username freeFireName email')
      .populate('playersJoined', 'username freeFireName stats');

    if (!tournament) {
      return res.status(404).json({ msg: 'Tournament not found' });
    }

    res.json(tournament);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Tournament not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   POST api/tournament/:id/join
// @desc    Join a tournament
// @access  Private
router.post('/:id/join', auth, async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ msg: 'Tournament not found' });
    }

    if (tournament.status !== 'upcoming') {
      return res.status(400).json({ msg: 'Tournament has already started or completed' });
    }

    // Check if slots available
    if (tournament.playersJoined.length >= tournament.slots) {
      return res.status(400).json({ msg: 'Tournament slots are full' });
    }

    // Check if already joined
    if (tournament.playersJoined.includes(req.user.id)) {
      return res.status(400).json({ msg: 'You have already joined this tournament' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    // Validate in-game tags
    if (!user.freeFireId || !user.freeFireName) {
      return res.status(400).json({ msg: 'Please configure your Free Fire Game ID and IGN in Profile settings before joining.' });
    }

    // Check wallet balance
    if (user.walletBalance < tournament.entryFee) {
      return res.status(400).json({ msg: 'Insufficient wallet balance. Please deposit funds.' });
    }

    // Process payment and registration
    user.walletBalance -= tournament.entryFee;
    user.stats.matchesPlayed += 1;

    // Save transaction record for player
    const transaction = new Transaction({
      user: req.user.id,
      type: 'entry_fee',
      amount: tournament.entryFee,
      status: 'completed',
      description: `Entry fee for tournament: ${tournament.title}`
    });
    await transaction.save();

    // Credit host's wallet
    const hostUser = await User.findById(tournament.host);
    if (hostUser) {
      hostUser.walletBalance += tournament.entryFee;
      await hostUser.save();

      // Save transaction record for host income
      if (tournament.entryFee > 0) {
        const hostTransaction = new Transaction({
          user: hostUser._id,
          type: 'deposit',
          amount: tournament.entryFee,
          status: 'completed',
          description: `Entry fee income from player: ${user.username} for tournament: ${tournament.title}`
        });
        await hostTransaction.save();
      }
    }

    tournament.playersJoined.push(req.user.id);
    
    await user.save();
    await tournament.save();

    const updatedTournament = await Tournament.findById(req.params.id)
      .populate('host', 'username freeFireName')
      .populate('playersJoined', 'username freeFireName stats');

    res.json({
      tournament: updatedTournament,
      walletBalance: user.walletBalance
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/tournament/:id/room
// @desc    Update Free Fire custom room details (Host only)
// @access  Private
router.put('/:id/room', auth, async (req, res) => {
  const { roomId, roomPassword } = req.body;

  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ msg: 'Tournament not found' });
    }

    // Verify host authority
    if (tournament.host.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'Unauthorized: Only the host can add room details' });
    }

    tournament.roomDetails = { roomId, roomPassword };
    tournament.status = 'ongoing'; // Mark as ongoing when room is ready
    await tournament.save();

    res.json(tournament);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/tournament/:id/complete
// @desc    Complete tournament and record results (Host only)
// @access  Private
router.put('/:id/complete', auth, async (req, res) => {
  const { results, winnerId } = req.body; 
  // results: [{ user: 'userId', rank: 1, kills: 5, prizeWon: 50 }, ...]

  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ msg: 'Tournament not found' });
    }

    // Verify host
    if (tournament.host.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'Unauthorized to close tournament' });
    }

    if (tournament.status === 'completed') {
      return res.status(400).json({ msg: 'Tournament is already completed' });
    }

    // Process rankings and rewards
    tournament.results = results;
    tournament.winner = winnerId || null;
    tournament.status = 'completed';

    // Update players
    for (const result of results) {
      const player = await User.findById(result.user);
      if (player) {
        player.stats.kills += Number(result.kills || 0);
        player.stats.earnings += Number(result.prizeWon || 0);
        player.walletBalance += Number(result.prizeWon || 0);

        if (Number(result.rank) === 1) {
          player.stats.matchesWon += 1;
        } else {
          player.stats.matchesLost += 1;
        }

        await player.save();

        // Save transaction ledger for prize winnings
        if (Number(result.prizeWon) > 0) {
          const transaction = new Transaction({
            user: player.id,
            type: 'prize',
            amount: Number(result.prizeWon),
            status: 'completed',
            description: `Prize winnings for tournament: ${tournament.title}`
          });
          await transaction.save();
        }
      }
    }

    // For any registered player who wasn't specified in results list, increment matchesLost
    const listedPlayerIds = results.map(r => r.user.toString());
    for (const registeredPlayerId of tournament.playersJoined) {
      if (!listedPlayerIds.includes(registeredPlayerId.toString())) {
        const player = await User.findById(registeredPlayerId);
        if (player) {
          player.stats.matchesLost += 1;
          await player.save();
        }
      }
    }

    await tournament.save();
    
    const completedTournament = await Tournament.findById(req.params.id)
      .populate('host', 'username freeFireName')
      .populate('playersJoined', 'username freeFireName stats')
      .populate('winner', 'username freeFireName');

    res.json(completedTournament);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/tournament/:id/resolve
// @desc    Automatically resolve tournament results and distribute payouts using the bot (no manual entry)
// @access  Private (Host/Admin only)
router.put('/:id/resolve', auth, async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('host')
      .populate('playersJoined');

    if (!tournament) {
      return res.status(404).json({ msg: 'Tournament not found' });
    }

    // Verify host
    if (tournament.host._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'Unauthorized: Only the host or admin can resolve match rooms' });
    }

    if (tournament.status === 'completed') {
      return res.status(400).json({ msg: 'Tournament is already completed' });
    }

    const host = await User.findById(tournament.host._id);
    if (!host) {
      return res.status(404).json({ msg: 'Host account not found' });
    }

    // Verify host has enough balance to payout
    if (host.walletBalance < tournament.prizePool) {
      return res.status(400).json({
        msg: `Insufficient Host Balance: Your wallet balance is ₹${host.walletBalance.toFixed(2)}, but this lobby requires ₹${tournament.prizePool.toFixed(2)} to resolve. Please deposit cash to proceed.`
      });
    }

    // Retrieve prize distribution setup
    const dist = {
      winnerCount: tournament.prizeDistribution?.winnerCount || 1,
      firstPlacePrize: (tournament.prizeDistribution?.firstPlacePrize > 0) ? tournament.prizeDistribution.firstPlacePrize : tournament.prizePool,
      secondPlacePrize: tournament.prizeDistribution?.secondPlacePrize || 0,
      thirdPlacePrize: tournament.prizeDistribution?.thirdPlacePrize || 0
    };

    if (tournament.playersJoined.length === 0) {
      return res.status(400).json({ msg: 'Cannot resolve a lobby with zero registered players.' });
    }

    // Helper to generate random integer between min and max
    const getRandomKills = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    // Map winners using the registered players list
    const player1 = tournament.playersJoined[0];
    const player2 = tournament.playersJoined.length >= 2 ? tournament.playersJoined[1] : null;
    const player3 = tournament.playersJoined.length >= 3 ? tournament.playersJoined[2] : null;

    // 1. Simulate Garena Free Fire Custom Room Results scoreboard
    const garenaLobbyResults = [];

    // Assign 1st place
    if (player1 && player1.freeFireName) {
      garenaLobbyResults.push({
        ign: player1.freeFireName,
        rank: 1,
        kills: getRandomKills(6, 15)
      });
    }

    // Assign 2nd place
    if (dist.winnerCount >= 2 && player2 && player2.freeFireName) {
      garenaLobbyResults.push({
        ign: player2.freeFireName,
        rank: 2,
        kills: getRandomKills(3, 9)
      });
    }

    // Assign 3rd place
    if (dist.winnerCount === 3 && player3 && player3.freeFireName) {
      garenaLobbyResults.push({
        ign: player3.freeFireName,
        rank: 3,
        kills: getRandomKills(1, 6)
      });
    }

    // Fill remaining registered players with default placement and random kills
    const simulatedIgns = garenaLobbyResults.map(r => r.ign.toLowerCase());
    for (const joinedPlayer of tournament.playersJoined) {
      if (joinedPlayer.freeFireName && !simulatedIgns.includes(joinedPlayer.freeFireName.toLowerCase())) {
        garenaLobbyResults.push({
          ign: joinedPlayer.freeFireName,
          rank: getRandomKills(4, 25),
          kills: getRandomKills(0, 4)
        });
      }
    }

    // Add dummy players to simulate a realistic 50-player custom room lobby
    const dummyNames = [
      'Viper_Slayer', 'Alpha_Ghost', 'Shadow_Ninja', 'Sniper_Wolf', 'Death_Bringer',
      'Fire_Lord', 'Dark_Knight', 'Silent_Assassin', 'Cyber_Punk', 'Storm_Rider',
      'Frost_Byte', 'Vortex_X', 'Phoenix_FF', 'Thunder_Bolt', 'Rage_Quit'
    ];
    let rankCounter = 4;
    while (garenaLobbyResults.length < 50 && rankCounter <= 50) {
      // Find a rank that isn't already assigned
      const isRankAssigned = garenaLobbyResults.some(r => r.rank === rankCounter);
      if (!isRankAssigned) {
        const dummyIgn = `${dummyNames[Math.floor(Math.random() * dummyNames.length)]}_${getRandomKills(100, 999)}`;
        garenaLobbyResults.push({
          ign: dummyIgn,
          rank: rankCounter,
          kills: getRandomKills(0, 3)
        });
      }
      rankCounter++;
    }

    // Sort lobby results by rank
    garenaLobbyResults.sort((a, b) => a.rank - b.rank);

    // 2. Match lobby results against the registered players list by case-insensitive IGN
    const results = [];
    let winnerId = null;

    for (const entry of garenaLobbyResults) {
      const matchedPlayer = tournament.playersJoined.find(
        p => p.freeFireName && p.freeFireName.trim().toLowerCase() === entry.ign.trim().toLowerCase()
      );

      if (matchedPlayer) {
        let prizeWon = 0;
        if (entry.rank === 1) {
          prizeWon = dist.firstPlacePrize;
          winnerId = matchedPlayer._id;
        } else if (entry.rank === 2 && dist.winnerCount >= 2) {
          prizeWon = dist.secondPlacePrize;
        } else if (entry.rank === 3 && dist.winnerCount === 3) {
          prizeWon = dist.thirdPlacePrize;
        }

        results.push({
          user: matchedPlayer._id,
          rank: entry.rank,
          kills: entry.kills,
          prizeWon: prizeWon
        });
      }
    }

    // 3. Deduct total prize pool from Host wallet
    host.walletBalance -= tournament.prizePool;
    await host.save();

    // Log host withdrawal transaction
    const hostTransaction = new Transaction({
      user: host._id,
      type: 'withdraw',
      amount: tournament.prizePool,
      status: 'completed',
      description: `Prize pool payout deduction for tournament: ${tournament.title}`
    });
    await hostTransaction.save();

    // 4. Process player wallet credit and stats updates
    for (const result of results) {
      const player = await User.findById(result.user);
      if (player) {
        player.stats.kills += Number(result.kills || 0);
        player.stats.earnings += Number(result.prizeWon || 0);
        player.walletBalance += Number(result.prizeWon || 0);

        if (Number(result.rank) === 1) {
          player.stats.matchesWon += 1;
        } else {
          player.stats.matchesLost += 1;
        }

        await player.save();

        // Create transaction history entry for winnings payout
        if (Number(result.prizeWon) > 0) {
          const transaction = new Transaction({
            user: player._id,
            type: 'prize',
            amount: Number(result.prizeWon),
            status: 'completed',
            description: `Match winnings (Rank #${result.rank}) for lobby: ${tournament.title}`
          });
          await transaction.save();
        }
      }
    }

    // 5. Update tournament document results and status
    tournament.results = results;
    tournament.winner = winnerId || player1._id;
    tournament.status = 'completed';
    await tournament.save();

    const resolvedTournament = await Tournament.findById(req.params.id)
      .populate('host', 'username freeFireName')
      .populate('playersJoined', 'username freeFireName stats')
      .populate('winner', 'username freeFireName')
      .populate('results.user', 'username freeFireName');

    res.json({
      tournament: resolvedTournament,
      garenaLobbyResults
    });
  } catch (err) {
    console.error('Automated bot resolve error:', err.message);
    res.status(500).send('Server Error resolving lobby payouts');
  }
});

// @route   DELETE api/tournament/:id
// @desc    Delete/Cancel a tournament (and refund registered players)
// @access  Private (Host or Admin only)
router.delete('/:id', auth, async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ msg: 'Tournament not found' });
    }

    // Only host or admin can delete
    const isHost = tournament.host.toString() === req.user.id;
    const userObj = await User.findById(req.user.id);
    const isAdmin = userObj && (userObj.role === 'admin' || userObj.role === 'host');
    
    if (!isHost && !isAdmin) {
      return res.status(401).json({ msg: 'User not authorized to delete this tournament' });
    }

    // Refund registered players if entry fee > 0 AND tournament is not completed
    if (tournament.status !== 'completed' && tournament.entryFee > 0 && tournament.playersJoined.length > 0) {
      for (const playerId of tournament.playersJoined) {
        const player = await User.findById(playerId);
        if (player) {
          player.walletBalance += tournament.entryFee;
          await player.save();

          // Create refund transaction log
          const refundTransaction = new Transaction({
            user: player._id,
            type: 'deposit',
            amount: tournament.entryFee,
            status: 'completed',
            description: `Refund for cancelled tournament: ${tournament.title}`
          });
          await refundTransaction.save();
        }
      }
    }

    await Tournament.findByIdAndDelete(req.params.id);
    res.json({ success: true, msg: 'Tournament cancelled and deleted successfully.' });
  } catch (err) {
    console.error('Delete tournament error:', err.message);
    res.status(500).send('Server Error deleting tournament');
  }
});

module.exports = router;
