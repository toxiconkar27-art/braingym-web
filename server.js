const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

// REMOVE OR COMMENT OUT THIS LINE: 
// app.use(express.static(path.join(__dirname, 'public')));

const scores = [];

app.post('/api/scores', (req, res) => {
    const { game, score } = req.body;
    scores.push({ game, score, timestamp: new Date() });
    res.status(201).json({ message: 'Score saved!' });
});

app.get('/api/scores', (req, res) => {
    res.json(scores);
});

app.delete('/api/scores', (req, res) => {
    scores.length = 0;
    res.json({ message: 'Cleared!' });
});

// Explicitly serve landing.html at the root URL (/)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'landing.html'));
});

// Explicitly serve index.html at /game
app.get('/game', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
