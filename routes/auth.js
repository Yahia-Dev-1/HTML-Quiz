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
        res.status(201).json({ token, user: { username: newUser.username, role: newUser.role } });
    } catch (err) {
        res.status(500).json({ error: err.message });
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

        const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ token, user: { username: user.username, role: user.role, currentSession: user.currentSession } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
