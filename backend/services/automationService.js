const Tournament = require('../models/Tournament');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

// Core logic to resolve a tournament and distribute payouts
const resolveTournamentPayout = async (tournamentId) => {
  try {
    const tournament = await Tournament.findById(tournamentId)
      .populate('host')
      .populate('playersJoined');

    if (!tournament) {
      console.error(`[Automation Bot] Tournament ${tournamentId} not found`);
      return;
    }

    if (tournament.status === 'completed') {
      return;
    }

    const host = await User.findById(tournament.host._id);
    if (!host) {
      console.error(`[Automation Bot] Host account not found for tournament ${tournament.title}`);
      return;
    }

    // If host has insufficient balance, refund players and cancel
    if (host.walletBalance < tournament.prizePool) {
      console.warn(`[Automation Bot] Host ${host.username} has insufficient balance (₹${host.walletBalance}) for prize pool (₹${tournament.prizePool}). Refunding players...`);
      await refundTournamentPlayers(tournament, 'Cancelled: Host had insufficient balance to payout prize pool');
      return;
    }

    // Retrieve prize distribution setup
    const dist = {
      winnerCount: tournament.prizeDistribution?.winnerCount || 1,
      firstPlacePrize: (tournament.prizeDistribution?.firstPlacePrize > 0) ? tournament.prizeDistribution.firstPlacePrize : tournament.prizePool,
      secondPlacePrize: tournament.prizeDistribution?.secondPlacePrize || 0,
      thirdPlacePrize: tournament.prizeDistribution?.thirdPlacePrize || 0
    };

    if (tournament.playersJoined.length === 0) {
      console.log(`[Automation Bot] Resolving tournament "${tournament.title}" with 0 players. Marking as completed.`);
      tournament.status = 'completed';
      await tournament.save();
      return;
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
    tournament.winner = winnerId || (player1 ? player1._id : null);
    tournament.status = 'completed';
    await tournament.save();

    console.log(`[Automation Bot] Successfully resolved tournament "${tournament.title}" via automatic background trigger. Winner ID: ${winnerId}`);
  } catch (err) {
    console.error(`[Automation Bot] Error resolving tournament ${tournamentId}:`, err.message);
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
        console.log(`[Automation Bot] Auto-resolving elapsed ongoing tournament: "${tournament.title}" (Scheduled: ${tournament.matchDateTime})`);
        await resolveTournamentPayout(tournament._id);
      }

      // 2. Find matches in 'upcoming' status whose start time has passed by more than 15 minutes without room credentials
      const gracePeriodTime = new Date(now.getTime() - 15 * 60 * 1000);
      const upcomingElapsed = await Tournament.find({
        status: 'upcoming',
        matchDateTime: { $lte: gracePeriodTime }
      });

      for (const tournament of upcomingElapsed) {
        console.log(`[Automation Bot] Auto-cancelling inactive upcoming tournament: "${tournament.title}" (Scheduled: ${tournament.matchDateTime}). Refunding entries...`);
        await refundTournamentPlayers(tournament, 'Cancelled: Host failed to set room details in time');
      }

    } catch (err) {
      console.error('[Automation Bot] Error running background check:', err.message);
    }
  }, 30000); // 30 seconds interval
};

module.exports = {
  startAutomationBot,
  resolveTournamentPayout,
  refundTournamentPlayers
};
