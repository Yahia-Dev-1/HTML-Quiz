const express = require('express');
const router = express.Router();
const storage = require('../services/storage');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_key_change_in_production';

// Auth Middleware
const auth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

// Get Progression
router.get('/', auth, async (req, res) => {
    try {
        const user = await storage.findOne('users', { _id: req.user.id });
        if (!user) return res.status(401).json({ message: 'User not valid or session expired' });
        const { password, ...userData } = user;
        res.json(userData);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update Quiz Progress
router.post('/quiz', auth, async (req, res) => {
    try {
        const { sessionId, score, totalQuestions } = req.body;
        console.log(`[Quiz Route] Incoming: ${JSON.stringify(req.body)}`);

        const updatedUser = await storage.atomicUpdate('users', { _id: req.user.id }, (user) => {
            const quizId = `q_s${sessionId}`;
            if (!user.quizScores) user.quizScores = {};

            const oldScore = user.quizScores[quizId] || 0;
            const newScore = Math.round((score / (totalQuestions || 10)) * 100);

            if (newScore >= oldScore) {
                user.quizScores[quizId] = newScore;
            }

            if (!user.completedQuizzes) user.completedQuizzes = [];
            if (!user.completedQuizzes.includes(quizId)) {
                user.completedQuizzes.push(quizId);
                user.points = (user.points || 0) + (score || 0) * 5;
            }
            return user;
        });

        if (!updatedUser) return res.status(404).json({ message: 'User not found' });
        res.json(updatedUser);
    } catch (err) {
        console.error(`[Quiz Error] ${err.message}`);
        res.status(500).json({ error: err.message });
    }
});

// Update Challenge Progress
router.post('/challenge', auth, async (req, res) => {
    try {
        const { challengeId } = req.body;
        const updatedUser = await storage.atomicUpdate('users', { _id: req.user.id }, (user) => {
            if (!user.completedChallenges) user.completedChallenges = [];
            if (!user.completedChallenges.includes(challengeId)) {
                user.completedChallenges.push(challengeId);
                user.points = (user.points || 0) + 20;
            }
            return user;
        });

        if (!updatedUser) return res.status(404).json({ message: 'User not found' });
        res.json(updatedUser);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Unlock Next Session - Requirements: Quiz >= 50% AND ALL 4 Challenges Done
router.post('/unlock-session', auth, async (req, res) => {
    try {
        const { quizScore: inputQuizScore } = req.body;

        const result = await storage.atomicUpdate('users', { _id: req.user.id }, (user) => {
            const currentSess = user.currentSession;
            if (currentSess >= 4) {
                user.courseCompleted = true;
                return user;
            }

            const quizId = `q_s${currentSess}`;

            // تحديات الجلسة الأربعة: s1c1, s1c2, s1c3, s1c4 أو s2c1, s2c2, s2c3, s2c4 إلخ
            const allChallengeIds = [
                `s${currentSess}c1`,
                `s${currentSess}c2`,
                `s${currentSess}c3`,
                `s${currentSess}c4`
            ];

            // Re-calculate or fetch stored quiz score
            const storedQuizScore = (user.quizScores && user.quizScores[quizId] !== undefined) ? user.quizScores[quizId] : 0;

            // Allow inputQuizScore if provided, but prioritize stored one if it's enough
            const currentAttemptScore = inputQuizScore !== undefined ? inputQuizScore : 0;
            const quizPassed = (currentAttemptScore >= 50) || (storedQuizScore >= 50);

            // تحقق من أن جميع التحديات الأربعة مكتملة
            const completedChallenges = user.completedChallenges || [];
            const allChallengesDone = allChallengeIds.every(id => completedChallenges.includes(id));

            console.log(`[Unlock Check] User: ${user.username}, Session: ${currentSess}`);
            console.log(`[Unlock Check] QuizStored: ${storedQuizScore}%, QuizPassed: ${quizPassed}`);
            console.log(`[Unlock Check] AllChallenges: ${JSON.stringify(allChallengeIds)}`);
            console.log(`[Unlock Check] CompletedChallenges: ${JSON.stringify(completedChallenges)}`);
            console.log(`[Unlock Check] AllChallengesDone: ${allChallengesDone}`);

            if (quizPassed && allChallengesDone) {
                // IMPORTANT: Only increment if we haven't already
                if (user.currentSession === currentSess) {
                    user.currentSession = currentSess + 1;
                    console.log(`[Unlock Success] Advanced ${user.username} to Session ${user.currentSession}`);
                }
            }
            return user;
        });

        if (!result) return res.status(404).json({ message: 'User not found' });
        res.json(result);
    } catch (err) {
        console.error(`[Unlock Error] ${err.message}`);
        res.status(500).json({ error: err.message });
    }
});

// Get Quiz Questions for a session
router.get('/quiz-data/:sessionId', auth, async (req, res) => {
    try {
        const questions = await storage.find('quizzes', { sessionNumber: parseInt(req.params.sessionId) });
        res.json(questions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Challenge Data for a session
router.get('/challenge-data/:sessionId', auth, async (req, res) => {
    try {
        const sessId = req.params.sessionId;
        const challenges = await storage.find('challenges', {
            $or: [
                { sessionNumber: parseInt(sessId) },
                { sessionNumber: sessId }
            ]
        });
        res.json(challenges);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Sync Points (for hints or other deductions)
router.post('/points', auth, async (req, res) => {
    try {
        const { points } = req.body;
        const result = await storage.atomicUpdate('users', { _id: req.user.id }, (user) => {
            user.points = points;
            return user;
        });
        res.json({ message: 'Points updated', points: result.points });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
