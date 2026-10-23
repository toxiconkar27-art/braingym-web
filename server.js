require('dotenv').config();
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json());

// Serve static files but disable automatic serving of index.html at root
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// ==========================================
// 1. DATABASE CONNECTION
// ==========================================
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => console.error('❌ MongoDB Connection Error:', err));

// ==========================================
// 2. DATABASE SCHEMAS
// ==========================================
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    streak: { type: Number, default: 0 },
    lastLoginDate: { type: Date, default: null }
});
const User = mongoose.model('User', userSchema);

const scoreSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    game: String,
    score: Number,
    timestamp: { type: Date, default: Date.now }
});
const Score = mongoose.model('Score', scoreSchema);

// ==========================================
// 3. AUTHENTICATION API ENDPOINTS
// ==========================================

// SIGN UP ROUTE
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'Email already in use' });

        // Encrypt (hash) the password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Save new user to MongoDB
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();

        res.status(201).json({ message: 'Profile created successfully! Please log in.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during signup' });
    }
});

// LOG IN ROUTE
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid email or password' });

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });

        // Streak Calculation Logic
        const now = new Date();
        if (user.lastLoginDate) {
            const timeDiff = now - user.lastLoginDate;
            const daysDiff = timeDiff / (1000 * 3600 * 24);
            
            if (daysDiff > 1 && daysDiff <= 2.5) {
                user.streak += 1; // Logged in consecutive day
            } else if (daysDiff > 2.5) {
                user.streak = 1; // Streak broken, reset to 1
            }
        } else {
            user.streak = 1; // First time logging in
        }
        
        user.lastLoginDate = now;
        await user.save();

        // Create JWT Token for secure session
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({ 
            token, 
            message: 'Login successful!', 
            streak: user.streak, 
            name: user.name 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// ==========================================
// SECURITY MIDDLEWARE
// ==========================================
// This checks if the user has a valid login token before letting them save/view scores
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Extracts token after "Bearer"
    
    if (!token) return res.status(401).json({ message: 'Access Denied' });

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid Token' });
        req.user = user; // Attaches the userId to the request
        next();
    });
};

// ==========================================
// SCORE API ENDPOINTS
// ==========================================
// 1. SAVE A NEW SCORE
app.post('/api/scores', authenticateToken, async (req, res) => {
    try {
        const { game, score } = req.body;
        const newScore = new Score({ userId: req.user.userId, game, score });
        await newScore.save();
        res.status(201).json({ message: 'Score saved to database!' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to save score' });
    }
});

// 2. GET USER'S SCORE HISTORY (For the Chart)
app.get('/api/scores', authenticateToken, async (req, res) => {
    try {
        // Find scores belonging ONLY to this user, sorted by oldest to newest
        const scores = await Score.find({ userId: req.user.userId }).sort({ timestamp: 1 });
        res.json(scores);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch scores' });
    }
});

// 3. DELETE USER'S SCORE HISTORY
app.delete('/api/scores', authenticateToken, async (req, res) => {
    try {
        // Deletes all scores that belong to the logged-in user
        await Score.deleteMany({ userId: req.user.userId });
        res.json({ message: 'All scores deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete scores' });
    }
});


// ==========================================
// 4. PAGE ROUTING
// ==========================================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'landing.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// ADD THIS NEW ROUTE:
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

app.get('/game', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/mole', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'mole.html'));
});

app.get('/slicer', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'slicer.html'));
});

// ==========================================
// 5. SERVER INITIALIZATION
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 BrainGym Server running on port ${PORT}`);
});
