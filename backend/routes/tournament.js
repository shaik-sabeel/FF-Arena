const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Tournament = require('../models/Tournament');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const sendEmail = require('../utils/mailer');
const { checkConsensusAndPayout } = require('../services/automationService');


// @route   POST api/tournament/create
// @desc    Create a tournament (Host/Admin only)
// @access  Private
router.post('/create', auth, async (req, res) => {
  const { title, description, gameMode, map, entryFee, prizePool, slots, matchDateTime, prizeDistribution, maxObservers, observerReward, perKillReward, paymentQrOption } = req.body;

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
      maxObservers: maxObservers ? Number(maxObservers) : 5,
      observerReward: observerReward ? Number(observerReward) : 0,
      perKillReward: gameMode === 'BR Ranked' ? Number(perKillReward || 0) : 0,
      paymentQrOption: paymentQrOption || 'qr_durga',
      prizeDistribution: prizeDistribution || {
        winnerCount: 1,
        prizes: [{ rank: 1, amount: Number(prizePool) }]
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
      .populate('playersJoined', 'username freeFireName stats')
      .populate('observersJoined', 'username freeFireName stats')
      .populate('pendingRegistrations.user', 'username freeFireName email');

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

    const { role = 'player', paymentMethod = 'wallet', utr } = req.body;
    if (role !== 'player' && role !== 'observer') {
      return res.status(400).json({ msg: 'Invalid registration role' });
    }

    // Check if already registered
    const isRegisteredPlayer = tournament.playersJoined.some(pId => pId.toString() === req.user.id);
    const isRegisteredObserver = tournament.observersJoined && tournament.observersJoined.some(pId => pId.toString() === req.user.id);
    
    if (isRegisteredPlayer || isRegisteredObserver) {
      return res.status(400).json({ msg: 'You have already registered for this tournament' });
    }

    // Check if already in pending queue
    const isPending = tournament.pendingRegistrations && tournament.pendingRegistrations.some(p => p.user.toString() === req.user.id);
    if (isPending) {
      return res.status(400).json({ msg: 'Your registration request is already pending verification.' });
    }

    // Check slots left
    const pendingPlayersCount = tournament.pendingRegistrations ? tournament.pendingRegistrations.filter(r => r.role === 'player').length : 0;
    if (role === 'player') {
      if ((tournament.playersJoined.length + pendingPlayersCount) >= tournament.slots) {
        return res.status(400).json({ msg: 'Tournament player slots are full (including pending reviews)' });
      }
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    if (role === 'observer') {
      if (!user.isObserver) {
        return res.status(403).json({ msg: 'Access denied: Only users assigned as observers by Host/Admin can join as observers.' });
      }
      // Check if observer slots available
      const maxObs = tournament.maxObservers || 5;
      const currentObs = tournament.observersJoined ? tournament.observersJoined.length : 0;
      if (currentObs >= maxObs) {
        return res.status(400).json({ msg: 'Tournament observer slots are full' });
      }
    }

    // Validate in-game tags
    if (!user.freeFireId || !user.freeFireName) {
      return res.status(400).json({ msg: 'Please configure your Free Fire Game ID and IGN in Profile settings before joining.' });
    }

    // 1. Direct wallet payment or free match registration path
    if (role === 'player') {
      if (tournament.entryFee > 0) {
        // Wallet payment
        if (user.walletBalance < tournament.entryFee) {
          return res.status(400).json({ msg: 'Insufficient wallet balance. Please add cash in the Wallet tab.' });
        }

        user.walletBalance -= tournament.entryFee;

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

      user.stats.matchesPlayed += 1;
      tournament.playersJoined.push(req.user.id);
    } else {
      // Register as observer (free registration)
      tournament.observersJoined.push(req.user.id);
    }

    await user.save();
    await tournament.save();

    const updatedTournament = await Tournament.findById(req.params.id)
      .populate('host', 'username freeFireName email')
      .populate('playersJoined', 'username freeFireName stats')
      .populate('observersJoined', 'username freeFireName stats')
      .populate('pendingRegistrations.user', 'username freeFireName email');

    res.json({
      status: 'registered',
      tournament: updatedTournament,
      walletBalance: user.walletBalance
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/tournament/:id/approve-registration
// @desc    Approve a pending player registration (Host only)
// @access  Private
router.put('/:id/approve-registration', auth, async (req, res) => {
  const { userId } = req.body;

  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ msg: 'Tournament not found' });
    }

    if (tournament.host.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied: Only the Host of this tournament can resolve registrations.' });
    }

    const pendingIndex = tournament.pendingRegistrations.findIndex(p => p.user.toString() === userId);
    if (pendingIndex === -1) {
      return res.status(404).json({ msg: 'Pending registration not found for this user.' });
    }

    const pendingItem = tournament.pendingRegistrations[pendingIndex];
    
    // Add to playersJoined or observersJoined
    if (pendingItem.role === 'player') {
      // Double check slots left
      if (tournament.playersJoined.length >= tournament.slots) {
        return res.status(400).json({ msg: 'Tournament player slots are full. Cannot approve player.' });
      }
      tournament.playersJoined.push(userId);
      
      // Update player's match count
      const registeredUser = await User.findById(userId);
      if (registeredUser) {
        registeredUser.stats.matchesPlayed += 1;
        await registeredUser.save();
        
        // Add transaction records for history
        const transaction = new Transaction({
          user: userId,
          type: 'entry_fee',
          amount: tournament.entryFee,
          status: 'completed',
          description: `Entry fee for tournament (Direct QR): ${tournament.title}`
        });
        await transaction.save();

        // Credit host's wallet
        const hostUser = await User.findById(tournament.host);
        if (hostUser) {
          hostUser.walletBalance += tournament.entryFee;
          await hostUser.save();

          const hostTransaction = new Transaction({
            user: hostUser._id,
            type: 'deposit',
            amount: tournament.entryFee,
            status: 'completed',
            description: `Entry QR fee from player: ${registeredUser.username} for tournament: ${tournament.title}`
          });
          await hostTransaction.save();
        }
      }
    } else {
      tournament.observersJoined.push(userId);
    }

    // Remove from pending list
    tournament.pendingRegistrations.splice(pendingIndex, 1);
    await tournament.save();

    const updatedTournament = await Tournament.findById(req.params.id)
      .populate('host', 'username freeFireName email')
      .populate('playersJoined', 'username freeFireName stats')
      .populate('observersJoined', 'username freeFireName stats')
      .populate('pendingRegistrations.user', 'username freeFireName email');

    res.json(updatedTournament);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/tournament/:id/reject-registration
// @desc    Reject a pending player registration (Host only)
// @access  Private
router.put('/:id/reject-registration', auth, async (req, res) => {
  const { userId } = req.body;

  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ msg: 'Tournament not found' });
    }

    if (tournament.host.toString() !== req.user.id) {
      return res.status(403).json({ msg: 'Access denied: Only the Host of this tournament can resolve registrations.' });
    }

    const pendingIndex = tournament.pendingRegistrations.findIndex(p => p.user.toString() === userId);
    if (pendingIndex === -1) {
      return res.status(404).json({ msg: 'Pending registration not found for this user.' });
    }

    // Remove from pending list
    tournament.pendingRegistrations.splice(pendingIndex, 1);
    await tournament.save();

    const updatedTournament = await Tournament.findById(req.params.id)
      .populate('host', 'username freeFireName email')
      .populate('playersJoined', 'username freeFireName stats')
      .populate('observersJoined', 'username freeFireName stats')
      .populate('pendingRegistrations.user', 'username freeFireName email');

    res.json(updatedTournament);
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

    // Verify host or registered observer authority
    const isHost = tournament.host.toString() === req.user.id;
    const isObserver = tournament.observersJoined && tournament.observersJoined.some(oId => oId.toString() === req.user.id);
    if (!isHost && !isObserver && req.user.role !== 'admin') {
      return res.status(401).json({ msg: 'Unauthorized: Only the host or registered spectator/observer can add room details' });
    }

    tournament.roomDetails = { roomId, roomPassword };
    tournament.status = 'ongoing'; // Mark as ongoing when room is ready
    await tournament.save();

    // Fetch tournament with populated player and observer emails to send notifications
    const tWithUsers = await Tournament.findById(req.params.id)
      .populate('playersJoined', 'email username')
      .populate('observersJoined', 'email username');

    if (tWithUsers) {
      const emailSubject = `Match Room Credentials: ${tWithUsers.title}`;
      const emailText = `Hello,\n\nThe custom room details for the tournament "${tWithUsers.title}" are now available:\n\nRoom ID: ${roomId}\nPassword: ${roomPassword}\n\nPlease enter these credentials in your Garena Free Fire client under Custom Mode.\n\nBest regards,\nThe BL Battle Team`;
      
      const emailHtml = `<div style="font-family: sans-serif; background-color: #0b0e11; color: #ffffff; padding: 20px; border-radius: 10px; max-width: 600px; border: 1px solid #1f2731;">
        <h2 style="color: #35d5fa; margin-top: 0;">Lobby Custom Room Credentials</h2>
        <p style="color: #a0aab5;">Match room details for <strong>${tWithUsers.title}</strong> are now active:</p>
        <div style="background-color: #1a222d; border: 1px solid #35d5fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0; color: #ffffff; font-size: 14px;"><strong>Room ID:</strong> <span style="font-family: monospace; color: #35d5fa; font-size: 16px; font-weight: bold;">${roomId}</span></p>
          <p style="margin: 0; color: #ffffff; font-size: 14px;"><strong>Password:</strong> <span style="font-family: monospace; color: #35d5fa; font-size: 16px; font-weight: bold;">${roomPassword}</span></p>
        </div>
        <p style="color: #a0aab5; font-size: 12px;">Open the Garena Free Fire client, search for the Room ID in Custom Mode, enter the password, and join the lobby. Get ready for battle!</p>
        <hr style="border: 0; border-top: 1px solid #1f2731; margin: 20px 0;">
        <p style="color: #35d5fa; font-size: 11px;">Best regards,<br><strong style="color: #ffffff;">The BL Battle Team</strong></p>
      </div>`;

      // Dispatch to players
      if (tWithUsers.playersJoined) {
        for (const player of tWithUsers.playersJoined) {
          if (player.email) {
            sendEmail(player.email, emailSubject, emailText, emailHtml)
              .catch(e => console.error(`Failed to send credentials to player ${player.username}:`, e.message));
          }
        }
      }

      // Dispatch to observers
      if (tWithUsers.observersJoined) {
        for (const observer of tWithUsers.observersJoined) {
          if (observer.email) {
            sendEmail(observer.email, emailSubject, emailText, emailHtml)
              .catch(e => console.error(`Failed to send credentials to observer ${observer.username}:`, e.message));
          }
        }
      }
    }

    res.json(tWithUsers || tournament);
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

    // Determine prize values
    const prizesMap = {};
    if (tournament.prizeDistribution?.prizes && tournament.prizeDistribution.prizes.length > 0) {
      tournament.prizeDistribution.prizes.forEach(p => {
        prizesMap[p.rank] = p.amount;
      });
    } else {
      prizesMap[1] = tournament.prizePool;
      prizesMap[2] = 0;
      prizesMap[3] = 0;
    }
    const winnerCount = tournament.prizeDistribution?.winnerCount || 1;

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
    if (winnerCount >= 2 && player2 && player2.freeFireName) {
      garenaLobbyResults.push({
        ign: player2.freeFireName,
        rank: 2,
        kills: getRandomKills(3, 9)
      });
    }

    // Assign 3rd place
    if (winnerCount === 3 && player3 && player3.freeFireName) {
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
        const rankPrize = prizesMap[entry.rank] || 0;
        let prizeWon = rankPrize;
        if (entry.rank === 1) {
          winnerId = matchedPlayer._id;
        }

        // Add per kill reward if BR Ranked and perKillReward is set
        if (tournament.gameMode === 'BR Ranked' && tournament.perKillReward > 0) {
          prizeWon += Number(entry.kills || 0) * tournament.perKillReward;
        }

        results.push({
          user: matchedPlayer._id,
          rank: entry.rank,
          kills: entry.kills,
          prizeWon: prizeWon
        });
      }
    }

    // 3. Deduct total payout (prize pool + kill rewards) from Host wallet
    const totalPayout = results.reduce((sum, r) => sum + r.prizeWon, 0);

    if (host.walletBalance < totalPayout) {
      return res.status(400).json({
        msg: `Insufficient Host Balance: Host wallet has ₹${host.walletBalance.toFixed(2)}, but ₹${totalPayout.toFixed(2)} is required to resolve payouts.`
      });
    }

    host.walletBalance -= totalPayout;
    await host.save();

    // Log host withdrawal transaction
    const hostTransaction = new Transaction({
      user: host._id,
      type: 'withdraw',
      amount: totalPayout,
      status: 'completed',
      description: `Prize pool + kill rewards payout deduction for tournament: ${tournament.title}`
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

// @route   POST api/tournament/:id/vote
// @desc    Submit observer results and trigger automatic payout distribution
// @access  Private (Observers only)
router.post('/:id/vote', auth, async (req, res) => {
  const { results } = req.body;

  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) {
      return res.status(404).json({ msg: 'Tournament not found' });
    }

    if (tournament.status !== 'ongoing') {
      return res.status(400).json({ msg: 'Tournament is not in ongoing state' });
    }

    // Check if the user is registered as an observer
    const isObserver = tournament.observersJoined && tournament.observersJoined.some(oId => oId.toString() === req.user.id);
    if (!isObserver) {
      return res.status(403).json({ msg: 'Access denied: Only registered observers/spectators can submit votes' });
    }

    // Fetch the observer user to ensure they are assigned (isObserver === true)
    const user = await User.findById(req.user.id);
    if (!user || !user.isObserver) {
      return res.status(403).json({ msg: 'Access denied: Only assigned observers can access observer features' });
    }

    // Check if observer has already voted
    const hasVoted = tournament.observerVotes && tournament.observerVotes.some(v => v.observer.toString() === req.user.id);
    if (hasVoted) {
      return res.status(400).json({ msg: 'You have already submitted results for this tournament' });
    }

    // Find 1st and 2nd place winners from submitted results
    const firstPlace = results.find(r => Number(r.rank) === 1);
    const secondPlace = results.find(r => Number(r.rank) === 2);

    if (!firstPlace || !secondPlace) {
      return res.status(400).json({ msg: 'Please specify both 1st and 2nd place winners' });
    }

    // Fetch Host to verify balance
    const host = await User.findById(tournament.host);
    if (!host) {
      return res.status(404).json({ msg: 'Host account not found' });
    }

    // Determine prize values
    const prizesMap = {};
    if (tournament.prizeDistribution?.prizes && tournament.prizeDistribution.prizes.length > 0) {
      tournament.prizeDistribution.prizes.forEach(p => {
        prizesMap[p.rank] = p.amount;
      });
    } else {
      prizesMap[1] = tournament.prizePool;
      prizesMap[2] = 0;
    }

    // Process all player payouts dynamically (to support per-kill rewards)
    let playersTotalPayout = 0;
    const processedResults = results.map(r => {
      const rankPrize = prizesMap[r.rank] || 0;
      const killReward = (tournament.gameMode === 'BR Ranked' && tournament.perKillReward > 0) ? (Number(r.kills || 0) * tournament.perKillReward) : 0;
      const prizeWon = rankPrize + killReward;
      playersTotalPayout += prizeWon;
      return {
        user: r.user,
        rank: Number(r.rank),
        kills: Number(r.kills || 0),
        prizeWon: prizeWon
      };
    });

    const obsReward = tournament.observerReward || 0;
    const totalDeduction = playersTotalPayout + obsReward;

    if (host.walletBalance < totalDeduction) {
      return res.status(400).json({
        msg: `Insufficient Host Balance: Host wallet has ₹${host.walletBalance.toFixed(2)}, but ₹${totalDeduction.toFixed(2)} is required to resolve payouts.`
      });
    }

    // Deduct Host Wallet
    host.walletBalance -= totalDeduction;
    await host.save();

    // Log Host Payout deduction
    const hostTransaction = new Transaction({
      user: host._id,
      type: 'withdraw',
      amount: totalDeduction,
      status: 'completed',
      description: `Prize pool & kill rewards (₹${playersTotalPayout.toFixed(2)}) + Spectator reward (₹${obsReward}) deduction for match: ${tournament.title}`
    });
    await hostTransaction.save();

    // Process player wallet credit and stats updates
    for (const r of processedResults) {
      const player = await User.findById(r.user);
      if (player) {
        player.stats.kills += Number(r.kills || 0);
        player.stats.earnings += r.prizeWon;
        player.walletBalance += r.prizeWon;

        if (Number(r.rank) === 1) {
          player.stats.matchesWon += 1;
        } else {
          player.stats.matchesLost += 1;
        }

        await player.save();

        // Create transaction history entry for winnings payout
        if (r.prizeWon > 0) {
          const transaction = new Transaction({
            user: player._id,
            type: 'prize',
            amount: r.prizeWon,
            status: 'completed',
            description: `Match winnings (Rank #${r.rank}) for lobby: ${tournament.title}`
          });
          await transaction.save();
        }
      }
    }

    // Process Observer
    user.walletBalance += obsReward;
    await user.save();

    if (obsReward > 0) {
      const transaction = new Transaction({
        user: user._id,
        type: 'prize',
        amount: obsReward,
        status: 'completed',
        description: `Observer reward for match: ${tournament.title}`
      });
      await transaction.save();
    }

    // Process stats for other players who were registered but not in results list (increment matchesLost)
    const listedPlayerIds = processedResults.map(r => r.user.toString());
    for (const registeredPlayerId of tournament.playersJoined) {
      if (!listedPlayerIds.includes(registeredPlayerId.toString())) {
        const p = await User.findById(registeredPlayerId);
        if (p) {
          p.stats.matchesLost += 1;
          await p.save();
        }
      }
    }

    // Record the observer's vote
    if (!tournament.observerVotes) {
      tournament.observerVotes = [];
    }
    tournament.observerVotes.push({
      observer: req.user.id,
      results: processedResults.map(r => ({
        user: r.user,
        rank: r.rank,
        kills: r.kills
      }))
    });

    // Mark complete
    tournament.results = processedResults;
    tournament.winner = firstPlace.user;
    tournament.status = 'completed';
    if (tournament.roomDetails) {
      tournament.roomDetails.disputed = false;
    }
    await tournament.save();

    const updatedTournament = await Tournament.findById(req.params.id)
      .populate('host', 'username freeFireName')
      .populate('playersJoined', 'username freeFireName stats')
      .populate('observersJoined', 'username freeFireName stats')
      .populate('winner', 'username freeFireName')
      .populate('results.user', 'username freeFireName');

    res.json({
      success: true,
      msg: 'Results submitted and rewards distributed successfully!',
      tournament: updatedTournament
    });
  } catch (err) {
    console.error('Vote/results submission error:', err.message);
    res.status(500).send('Server Error submitting results');
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
    const isAdmin = userObj && userObj.role === 'admin';
    
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
