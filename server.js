const express = require('express');
const path = require('path');
const app = express();

// Middleware to parse JSON and serve the frontend files
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory score database (replaces ScoreTracker.csv)
const scores = [];

// 1. API Endpoint: Save a new score
app.post('/api/scores', (req, res) => {
    const { game, score } = req.body;
    const newRecord = { game, score, timestamp: new Date() };
    scores.push(newRecord);
    console.log('New Score Recorded:', newRecord);
    res.status(201).json({ message: 'Score saved successfully!' });
});

// 2. API Endpoint: Get leaderboard history
app.get('/api/scores', (req, res) => {
    res.json(scores);
});

// 3. API Endpoint: Clear all scores (THIS IS THE NEW PART)
app.delete('/api/scores', (req, res) => {
    scores.length = 0; // Empties the array
    console.log('All scores deleted.');
    res.json({ message: 'Score history cleared!' });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`BrainGym Server running on port ${PORT}`);
});