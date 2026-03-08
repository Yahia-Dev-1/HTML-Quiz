const express = require('express');
const router = express.Router();
const storage = require('../services/storage');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key_change_in_production';

// Admin Auth Middleware
const adminAuth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (decoded.role !== 'Admin') return res.status(403).json({ message: 'Access denied' });
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// Get All Students
router.get('/students', adminAuth, async (req, res) => {
    try {
        const users = await storage.find('users', {}); // Fetch all users
        // Filter out 'yahia' and return others
        const students = users
            .filter(u => u.username !== 'yahia')
            .map(({ password, ...rest }) => rest);
        res.json(students);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete Student
router.delete('/students/:id', adminAuth, async (req, res) => {
    try {
        const { id } = req.params;
        await storage.deleteOne('users', { _id: id });
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
