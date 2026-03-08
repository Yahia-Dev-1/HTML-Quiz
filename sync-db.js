require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dns = require('dns');

// Force using Google DNS to bypass local ISP blocking
dns.setServers(['8.8.8.8', '8.8.4.4']);

const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
    console.error('❌ MONGO_URI not found in .env file!');
    process.exit(1);
}

// Define Schemas
const QuizSchema = new mongoose.Schema({
    sessionNumber: Number,
    question: String,
    choices: [String],
    correctAnswer: String,
    explanation: String,
    category: String
}, { strict: false });

const ChallengeSchema = new mongoose.Schema({
    challengeId: String,
    sessionNumber: Number,
    title: String,
    description: String,
    task: String,
    hints: [String],
    initialCode: String,
    expectedSelector: String,
    expectedAttr: String,
    expectedValue: String,
    expectedText: String,
    isTagOnly: Boolean
}, { strict: false });

const Quiz = mongoose.model('quizzes', QuizSchema);
const Challenge = mongoose.model('challenges', ChallengeSchema);

async function sync() {
    try {
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB Atlas');

        const dataDir = path.join(__dirname, 'data');

        // Sync Quizzes
        if (fs.existsSync(path.join(dataDir, 'quizzes.json'))) {
            const quizData = JSON.parse(fs.readFileSync(path.join(dataDir, 'quizzes.json'), 'utf8'));
            try { await mongoose.connection.db.dropCollection('quizzes'); } catch (e) { } // Clean drop
            await Quiz.insertMany(quizData);
            console.log(`✅ Uploaded ${quizData.length} Quizzes`);
        }

        // Sync Challenges
        if (fs.existsSync(path.join(dataDir, 'challenges.json'))) {
            const challengeData = JSON.parse(fs.readFileSync(path.join(dataDir, 'challenges.json'), 'utf8'));
            try { await mongoose.connection.db.dropCollection('challenges'); } catch (e) { } // Clean drop
            await Challenge.insertMany(challengeData);
            console.log(`✅ Uploaded ${challengeData.length} Challenges`);
        }

        console.log('\n🚀 ALL DATA SYNCED SUCCESSFULLY!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error during sync:', err);
        process.exit(1);
    }
}

sync();
