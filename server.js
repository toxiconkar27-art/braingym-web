const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const scores = [];

// API Endpoints
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

// ROUTE 1: Load landing.html as the main homepage (/)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'landing.html'));
});

// ROUTE 2: Load index.html when users go to /game
app.get('/game', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
