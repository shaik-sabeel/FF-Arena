const Tournament = require('../models/Tournament');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// Core logic to resolve a tournament and distribute payouts using Observer Consensus
const checkConsensusAndPayout = async (tournamentId) => {
  try {
    const tournament = await Tournament.findById(tournamentId)
      .populate('host')
      .populate('playersJoined')
      .populate('observersJoined');

    if (!tournament) {
      return { success: false, msg: 'Tournament not found' };
    }

    if (tournament.status === 'completed') {
      return { success: false, msg: 'Tournament is already completed' };
    }

    const totalObservers = tournament.observersJoined ? tournament.observersJoined.length : 0;
    const totalVotes = tournament.observerVotes ? tournament.observerVotes.length : 0;

    // 1. If observers are configured, verify consensus first
    if (totalObservers > 0) {
      if (totalVotes < totalObservers) {
        console.log(`[Automation Bot] Tournament "${tournament.title}" waiting for all observers to vote (${totalVotes}/${totalObservers} voted).`);
        return { success: false, msg: `Waiting for all observers to vote (${totalVotes}/${totalObservers} voted)` };
      }

      // Check if all votes are identical
      let hasConsensus = true;
      const firstVote = tournament.observerVotes[0].results;
      
      const firstMap = {};
      firstVote.forEach(r => {
        firstMap[r.user.toString()] = { rank: r.rank, kills: r.kills };
      });

      for (let i = 1; i < tournament.observerVotes.length; i++) {
        const voteResults = tournament.observerVotes[i].results;
        
        if (voteResults.length !== firstVote.length) {
          hasConsensus = false;
          break;
        }

        for (const r of voteResults) {
          const uId = r.user.toString();
          if (!firstMap[uId] || firstMap[uId].rank !== r.rank || firstMap[uId].kills !== r.kills) {
            hasConsensus = false;
            break;
          }
        }

        if (!hasConsensus) break;
      }

      if (!hasConsensus) {
        console.warn(`[Automation Bot] Mismatch detected in observer votes for "${tournament.title}". Flagging as disputed.`);
        
        // Mark as disputed in roomDetails so UI can display it
        tournament.roomDetails = {
          ...tournament.roomDetails,
          disputed: true
        };
        await tournament.save();
        return { success: false, msg: 'Consensus failed: Observers submitted conflicting results' };
      }

      // We have consensus! Resolve match using the observers' voted results.
      console.log(`[Automation Bot] Consensus reached for "${tournament.title}". Executing payments...`);

      const host = await User.findById(tournament.host._id);
      if (!host) {
        return { success: false, msg: 'Host account not found' };
      }

      // Calculate total payouts: prize pool + observer rewards
      const totalObserverReward = (tournament.observerReward || 0) * totalObservers;
      const totalDeduction = tournament.prizePool + totalObserverReward;

      if (host.walletBalance < totalDeduction) {
        console.warn(`[Automation Bot] Host ${host.username} has insufficient balance (₹${host.walletBalance}) for prize pool + observer rewards (₹${totalDeduction}). Refunding players...`);
        await refundTournamentPlayers(tournament, 'Cancelled: Host had insufficient balance to cover prize pool + observer rewards');
        return { success: false, msg: 'Host has insufficient balance' };
      }

      // Map prizes by rank
      const prizesMap = {};
      if (tournament.prizeDistribution?.prizes && tournament.prizeDistribution.prizes.length > 0) {
        tournament.prizeDistribution.prizes.forEach(p => {
          prizesMap[p.rank] = p.amount;
        });
      } else {
        prizesMap[1] = tournament.prizePool;
      }

      // Deduct from Host
      host.walletBalance -= totalDeduction;
      await host.save();

      // Log Host Payout deduction
      const hostTransaction = new Transaction({
        user: host._id,
        type: 'withdraw',
        amount: totalDeduction,
        status: 'completed',
        description: `Prize pool (₹${tournament.prizePool}) + Spectator rewards (₹${totalObserverReward}) deduction for match: ${tournament.title}`
      });
      await hostTransaction.save();

      // Process Player Winnings
      const results = [];
      let winnerId = null;

      for (const r of firstVote) {
        const player = await User.findById(r.user);
        if (player) {
          const prizeWon = prizesMap[r.rank] || 0;
          player.stats.kills += Number(r.kills || 0);
          player.stats.earnings += Number(prizeWon || 0);
          player.walletBalance += Number(prizeWon || 0);

          if (Number(r.rank) === 1) {
            player.stats.matchesWon += 1;
            winnerId = player._id;
          } else {
            player.stats.matchesLost += 1;
          }

          await player.save();

          if (prizeWon > 0) {
            const transaction = new Transaction({
              user: player._id,
              type: 'prize',
              amount: prizeWon,
              status: 'completed',
              description: `Match winnings (Rank #${r.rank}) for lobby: ${tournament.title}`
            });
            await transaction.save();
          }

          results.push({
            user: player._id,
            rank: r.rank,
            kills: r.kills,
            prizeWon: prizeWon
          });
        }
      }

      // Process Observer Winnings
      if (tournament.observerReward > 0) {
        for (const observerObj of tournament.observersJoined) {
          const observer = await User.findById(observerObj._id);
          if (observer) {
            observer.walletBalance += tournament.observerReward;
            await observer.save();

            const transaction = new Transaction({
              user: observer._id,
              type: 'prize',
              amount: tournament.observerReward,
              status: 'completed',
              description: `Spectator reward for match: ${tournament.title}`
            });
            await transaction.save();
          }
        }
      }

      // Mark complete
      tournament.results = results;
      tournament.winner = winnerId;
      tournament.status = 'completed';
      if (tournament.roomDetails) {
        tournament.roomDetails.disputed = false;
      }
      await tournament.save();

      return { success: true, msg: 'Consensus payout processed successfully' };
    } else {
      // 2. If NO observers are configured, fallback to standard host manual resolution (or auto-resolve simulation)
      console.log(`[Automation Bot] Resolving tournament "${tournament.title}" without observers (simulation bypass).`);
      return await resolveTournamentSimulation(tournament);
    }
  } catch (err) {
    console.error('[Automation Bot] Error in consensus check:', err.message);
    return { success: false, error: err.message };
  }
};

// Simulation fallback for match resolving when NO observers are registered
const resolveTournamentSimulation = async (tournament) => {
  try {
    const host = await User.findById(tournament.host._id);
    if (!host) return { success: false, msg: 'Host not found' };

    if (host.walletBalance < tournament.prizePool) {
      await refundTournamentPlayers(tournament, 'Cancelled: Host had insufficient balance to payout prize pool');
      return { success: false, msg: 'Host has insufficient balance' };
    }

    // Retrieve prize distribution setup
    const prizesMap = {};
    if (tournament.prizeDistribution?.prizes && tournament.prizeDistribution.prizes.length > 0) {
      tournament.prizeDistribution.prizes.forEach(p => {
        prizesMap[p.rank] = p.amount;
      });
    } else {
      prizesMap[1] = tournament.prizePool;
    }

    if (tournament.playersJoined.length === 0) {
      tournament.status = 'completed';
      await tournament.save();
      return { success: true, msg: 'Completed with 0 players' };
    }

    // Map winners using the registered players list
    const player1 = tournament.playersJoined[0];
    const player2 = tournament.playersJoined.length >= 2 ? tournament.playersJoined[1] : null;
    const player3 = tournament.playersJoined.length >= 3 ? tournament.playersJoined[2] : null;

    // Simulate scoreboard ranks (Viper_Slayer gets 1st, TitanGamer gets 2nd/3rd etc.)
    const simulatedResults = [];
    const getRandomKills = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

    if (player1) simulatedResults.push({ user: player1._id, rank: 1, kills: getRandomKills(5, 12) });
    if (player2) simulatedResults.push({ user: player2._id, rank: 2, kills: getRandomKills(2, 8) });
    if (player3) simulatedResults.push({ user: player3._id, rank: 3, kills: getRandomKills(1, 5) });

    // Deduct Host Wallet
    host.walletBalance -= tournament.prizePool;
    await host.save();

    const hostTransaction = new Transaction({
      user: host._id,
      type: 'withdraw',
      amount: tournament.prizePool,
      status: 'completed',
      description: `Prize pool payout deduction for tournament: ${tournament.title}`
    });
    await hostTransaction.save();

    // Process winnings
    const results = [];
    let winnerId = null;

    for (const r of simulatedResults) {
      const player = await User.findById(r.user);
      if (player) {
        const prizeWon = prizesMap[r.rank] || 0;
        player.stats.kills += Number(r.kills || 0);
        player.stats.earnings += Number(prizeWon || 0);
        player.walletBalance += Number(prizeWon || 0);

        if (Number(r.rank) === 1) {
          player.stats.matchesWon += 1;
          winnerId = player._id;
        } else {
          player.stats.matchesLost += 1;
        }

        await player.save();

        if (prizeWon > 0) {
          const transaction = new Transaction({
            user: player._id,
            type: 'prize',
            amount: prizeWon,
            status: 'completed',
            description: `Winnings (Rank #${r.rank}) for: ${tournament.title}`
          });
          await transaction.save();
        }

        results.push({
          user: player._id,
          rank: r.rank,
          kills: r.kills,
          prizeWon: prizeWon
        });
      }
    }

    tournament.results = results;
    tournament.winner = winnerId;
    tournament.status = 'completed';
    await tournament.save();

    return { success: true, msg: 'Simulation payout completed' };
  } catch (err) {
    console.error('Simulation resolve failed:', err.message);
    return { success: false, error: err.message };
  }
};

// Helper to refund players
const refundTournamentPlayers = async (tournament, reason) => {
  try {
    if (tournament.entryFee > 0 && tournament.playersJoined.length > 0) {
      for (const playerObj of tournament.playersJoined) {
        const playerId = playerObj._id || playerObj;
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
            description: `${reason} - ${tournament.title}`
          });
          await refundTransaction.save();
        }
      }
    }

    tournament.status = 'completed';
    tournament.results = [];
    tournament.description = `[CANCELLED BY SYSTEM] ${reason}. ${tournament.description}`;
    await tournament.save();
    console.log(`[Automation Bot] Successfully cancelled & refunded players for tournament: "${tournament.title}".`);
  } catch (err) {
    console.error(`[Automation Bot] Error refunding players for tournament ${tournament._id}:`, err.message);
  }
};

// Background task runner function
const startAutomationBot = () => {
  console.log('🤖 Starting BL Battle background payment and match automation bot...');
  
  // Run every 30 seconds
  setInterval(async () => {
    try {
      const now = new Date();
      
      // 1. Find matches in 'ongoing' status whose scheduled start times have passed (and need payout resolution)
      const ongoingElapsed = await Tournament.find({
        status: 'ongoing',
        matchDateTime: { $lte: now }
      });

      for (const tournament of ongoingElapsed) {
        console.log(`[Automation Bot] Elapsed ongoing tournament detected: "${tournament.title}". Processing checks...`);
        await checkConsensusAndPayout(tournament._id);
      }

      // 2. Find matches in 'upcoming' status whose start time has passed by more than 15 minutes without room credentials
      const gracePeriodTime = new Date(now.getTime() - 15 * 60 * 1000);
      const upcomingElapsed = await Tournament.find({
        status: 'upcoming',
        matchDateTime: { $lte: gracePeriodTime }
      });

      for (const tournament of upcomingElapsed) {
        console.log(`[Automation Bot] Auto-cancelling inactive upcoming tournament: "${tournament.title}". Refunding entries...`);
        await refundTournamentPlayers(tournament, 'Cancelled: Host failed to set room details in time');
      }

    } catch (err) {
      console.error('[Automation Bot] Error running background check:', err.message);
    }
  }, 30000); // 30 seconds interval
};

module.exports = {
  startAutomationBot,
  checkConsensusAndPayout,
  refundTournamentPlayers
};
