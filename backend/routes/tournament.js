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
  const { title, description, gameMode, map, entryFee, prizePool, slots, matchDateTime } = req.body;

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
      host: req.user.id
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

    // Save transaction record
    const transaction = new Transaction({
      user: req.user.id,
      type: 'entry_fee',
      amount: tournament.entryFee,
      status: 'completed',
      description: `Entry fee for tournament: ${tournament.title}`
    });
    await transaction.save();

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

module.exports = router;
