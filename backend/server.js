const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Initialize Middleware
app.use(cors());
app.use(express.json());

// Basic Root Route
app.get('/', (req, res) => {
  res.send('Free Fire Tournament API Server Running.');
});

// Define Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/user', require('./routes/user'));
app.use('/api/tournament', require('./routes/tournament'));
app.use('/api/wallet', require('./routes/wallet'));

// Configure Database Connection
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/freefire_tournament';

console.log('Attempting to connect to MongoDB...');

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected Successfully.');
    app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB Connection Failure:', err.message);
    console.log('Running Server in database-offline mode. Please configure MONGO_URI in .env or run local MongoDB server.');
    
    // Fallback listening so the server starts even without a running database
    app.listen(PORT, () => {
      console.log(`Server listening on port ${PORT} (Database Offline mode)`);
    });
  });
