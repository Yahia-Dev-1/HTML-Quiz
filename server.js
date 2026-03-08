require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/progress', require('./routes/progress'));
app.use('/api/admin', require('./routes/admin'));

// Debug Health Check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// API 404 Handler - Ensure API errors always return JSON
app.use('/api', (req, res) => {
    res.status(404).json({ error: 'API route not found' });
});

// Serve HTML - Fallback for SPA (Non-API routes only)
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
