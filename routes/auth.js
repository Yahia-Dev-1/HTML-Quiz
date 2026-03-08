const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const storage = require('../services/storage');

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key_change_in_production';

// Register
router.post('/register', async (req, res) => {
    try {
        const { username, password, role } = req.body;
        const existingUser = await storage.findUser(username);
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        const newUser = await storage.createUser({ username, password, role: role || 'Student' });
        const token = jwt.sign({ id: newUser._id, role: newUser.role }, JWT_SECRET, { expiresIn: '1d' });

        // Return sanitized user object
        const userResponse = {
            username: newUser.username,
            role: newUser.role,
            currentSession: newUser.currentSession,
            points: newUser.points,
            completedQuizzes: newUser.completedQuizzes,
            completedChallenges: newUser.completedChallenges,
            quizScores: newUser.quizScores,
            courseCompleted: newUser.courseCompleted
        };
        res.status(201).json({ token, user: userResponse });
    } catch (err) {
        console.error('Registration error:', err);
        res.status(500).json({ error: 'Registration failed', details: err.message });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await storage.findUser(username);
        if (!user || !(await storage.comparePassword(password, user.password))) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Explicitly make 'yahia' an Admin if he logs in
        let role = user.role;
        if (user.username === 'yahia') {
            role = 'Admin';
            if (user.role !== 'Admin') {
                await storage.update('users', { _id: user._id }, { role: 'Admin' });
            }
        }

        const token = jwt.sign({ id: user._id, role: role }, JWT_SECRET, { expiresIn: '7d' });

        const userResponse = {
            username: user.username,
            role: role,
            currentSession: user.currentSession || 1,
            points: user.points || 0,
            completedQuizzes: user.completedQuizzes || [],
            completedChallenges: user.completedChallenges || [],
            quizScores: user.quizScores || {},
            courseCompleted: user.courseCompleted || false
        };
        res.json({ token, user: userResponse });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed', details: err.message });
    }
});

module.exports = router;
