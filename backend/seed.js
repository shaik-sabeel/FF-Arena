const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Tournament = require('./models/Tournament');
const Transaction = require('./models/Transaction');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/freefire_tournament';

const seedDatabase = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await mongoose.connect(MONGO_URI);
    console.log('Connected. Cleaning collections...');
    
    await User.deleteMany({});
    await Tournament.deleteMany({});
    await Transaction.deleteMany({});

    console.log('Creating seed users...');
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('password123', salt);

    // Host/Admin
    const hostUser = new User({
      username: 'ArenaHost',
      email: 'host@gmail.com',
      password: passwordHash,
      freeFireId: '987654321',
      freeFireName: '꧁FF_H0ST꧂',
      walletBalance: 1000,
      role: 'host',
      stats: { matchesPlayed: 5, matchesWon: 2, matchesLost: 3, kills: 22, earnings: 450 }
    });

    // Player 1
    const player1 = new User({
      username: 'Slayer_FF',
      email: 'player1@gmail.com',
      password: passwordHash,
      freeFireId: '102938475',
      freeFireName: 'Viper_Slayer',
      walletBalance: 500,
      role: 'user',
      stats: { matchesPlayed: 12, matchesWon: 4, matchesLost: 8, kills: 64, earnings: 800 }
    });

    // Player 2
    const player2 = new User({
      username: 'TitanGamer',
      email: 'player2@gmail.com',
      password: passwordHash,
      freeFireId: '574839201',
      freeFireName: 'Titan_Gaming',
      walletBalance: 250,
      role: 'user',
      stats: { matchesPlayed: 8, matchesWon: 1, matchesLost: 7, kills: 28, earnings: 150 }
    });

    await hostUser.save();
    await player1.save();
    await player2.save();

    console.log('Creating sample tournaments...');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(18, 0, 0, 0); // 6:00 PM tomorrow

    const dayAfter = new Date();
    dayAfter.setDate(dayAfter.getDate() + 2);
    dayAfter.setHours(20, 0, 0, 0); // 8:00 PM day after

    const tournament1 = new Tournament({
      title: 'Clash Squad Bermuda Showdown',
      description: 'Lethal Clash Squad (4v4) custom room match. Win cash rewards for victory.',
      gameMode: 'Clash Squad',
      map: 'Bermuda',
      entryFee: 50,
      prizePool: 400,
      slots: 8,
      playersJoined: [player1._id],
      matchDateTime: tomorrow,
      host: hostUser._id
    });

    const tournament2 = new Tournament({
      title: 'Battle Royale Grand League',
      description: 'Standard 48-slot Battle Royale. Payouts for top 3 survivors and high kills.',
      gameMode: 'BR Ranked',
      map: 'Purgatory',
      entryFee: 100,
      prizePool: 1500,
      slots: 48,
      playersJoined: [player1._id, player2._id],
      matchDateTime: dayAfter,
      host: hostUser._id
    });

    const tournament3 = new Tournament({
      title: 'Solo Sniper Custom Lobbies (Free)',
      description: 'Solo matchmaking Sniper shootout in Kalahari. High precision required.',
      gameMode: 'Solo Showdown',
      map: 'Kalahari',
      entryFee: 0,
      prizePool: 150,
      slots: 20,
      playersJoined: [player2._id],
      matchDateTime: tomorrow,
      host: hostUser._id
    });

    await tournament1.save();
    await tournament2.save();
    await tournament3.save();

    console.log('Seeding ledger transactions...');
    const tx1 = new Transaction({
      user: player1._id,
      type: 'deposit',
      amount: 500,
      status: 'completed',
      description: 'Deposited via UPI App'
    });
    await tx1.save();

    const tx2 = new Transaction({
      user: player2._id,
      type: 'deposit',
      amount: 250,
      status: 'completed',
      description: 'Deposited via Debit Card'
    });
    await tx2.save();

    console.log('Seeding completed successfully!');
    console.log('\n======================================================');
    console.log('SAMPLE LOGIN CREDENTIALS FOR TESTING:');
    console.log('------------------------------------------------------');
    console.log('Host Account:');
    console.log('  Email:    host@gmail.com');
    console.log('  Password: password123');
    console.log('  Role:     Host (Can create rooms/record results)');
    console.log('------------------------------------------------------');
    console.log('Player 1 Account:');
    console.log('  Email:    player1@gmail.com');
    console.log('  Password: password123');
    console.log('  Role:     Player (Balance: ₹500, joined matches)');
    console.log('------------------------------------------------------');
    console.log('Player 2 Account:');
    console.log('  Email:    player2@gmail.com');
    console.log('  Password: password123');
    console.log('  Role:     Player (Balance: ₹250, joined matches)');
    console.log('======================================================\n');

    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err.message);
    process.exit(1);
  }
};

seedDatabase();
