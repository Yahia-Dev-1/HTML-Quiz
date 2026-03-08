const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Connect to MongoDB
// Connect to MongoDB
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/html-quiz';
mongoose.connect(mongoUri)
    .then(() => console.log('✅ Connected to MongoDB Atlas'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err.message);
        // Ensure the app doesn't crash but logs the error clearly
    });

const DATA_DIR = path.join(__dirname, '../data');

// Ensure data directory exists (Ignored on read-only systems like Vercel)
try {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
} catch (e) {
    console.warn('[Storage] Data directory is read-only or not writable. This is expected on Vercel.');
}

const getFilePath = (collection) => path.join(DATA_DIR, `${collection}.json`);

const readData = (collection) => {
    const filePath = getFilePath(collection);
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify([]));
        return [];
    }
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
};

const writeData = (collection, data) => {
    try {
        const filePath = getFilePath(collection);
        console.log(`[File Write] Writing to ${collection}.json - Records: ${data.length}`);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(`[File Write Error] Could not write ${collection}.json:`, e.message);
    }
};

// Define Mongoose schemas
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'Student' },
    currentSession: { type: Number, default: 1 },
    completedChallenges: { type: Array, default: [] },
    completedQuizzes: { type: Array, default: [] },
    quizScores: { type: Object, default: {} },
    points: { type: Number, default: 0 },
    courseCompleted: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const quizSchema = new mongoose.Schema({
    sessionNumber: Number,
    question: String,
    choices: [String],
    correctAnswer: String,
    explanation: String,
    category: String
}, { strict: false });

const challengeSchema = new mongoose.Schema({
    id: String,
    challengeId: String,
    sessionNumber: Number,
    title: String,
    description: String,
    task: String,
    hints: [String],
    expectedSolution: String,
    difficulty: String
}, { strict: false });

const User = mongoose.model('User', userSchema);
const Quiz = mongoose.model('quizzes', quizSchema);
const Challenge = mongoose.model('challenges', challengeSchema);

const storage = {
    // Generic Find
    find: async (collection, query = {}) => {
        try {
            if (collection === 'users') {
                if (query._id && !mongoose.Types.ObjectId.isValid(query._id)) return [];
                return await User.find(query).lean();
            }
            if (collection === 'quizzes') return await Quiz.find(query).lean();
            if (collection === 'challenges') return await Challenge.find(query).lean();
            return [];
        } catch (e) {
            console.error(`[Storage Find Error] Collection: ${collection}:`, e.message);
            throw e;
        }
    },

    // Generic Find One
    findOne: async (collection, query = {}) => {
        try {
            if (collection === 'users') {
                if (query._id && !mongoose.Types.ObjectId.isValid(query._id)) {
                    console.warn(`[Storage] Invalid ObjectId for users: ${query._id}`);
                    return null;
                }
                return await User.findOne(query).lean();
            }
            if (collection === 'quizzes') return await Quiz.findOne(query).lean();
            if (collection === 'challenges') return await Challenge.findOne(query).lean();
            return null;
        } catch (e) {
            console.error(`[Storage FindOne Error] Collection: ${collection}:`, e.message);
            throw e;
        }
    },

    // Generic Insert
    insert: async (collection, item) => {
        if (collection === 'users') {
            return await User.create(item);
        } else {
            const data = readData(collection);
            const newItem = { ...item, _id: Date.now().toString() + Math.random().toString(36).substr(2, 5) };
            data.push(newItem);
            writeData(collection, data);
            return newItem;
        }
    },

    // Generic Update
    update: async (collection, query, updates) => {
        if (collection === 'users') {
            const result = await User.updateMany(query, updates);
            return result.modifiedCount;
        } else {
            const data = readData(collection);
            let updatedCount = 0;
            const newData = data.map(item => {
                const matches = Object.keys(query).every(key => item[key] == query[key]);
                if (matches) {
                    updatedCount++;
                    return { ...item, ...updates };
                }
                return item;
            });
            writeData(collection, newData);
            return updatedCount;
        }
    },

    // Atomic Update with Callback
    atomicUpdate: async (collection, query, callback) => {
        let Model;
        if (collection === 'users') Model = User;
        else if (collection === 'quizzes') Model = Quiz;
        else if (collection === 'challenges') Model = Challenge;

        if (Model) {
            const item = await Model.findOne(query);
            if (item) {
                const updated = callback(item.toObject());
                return await Model.findOneAndUpdate(query, updated, { new: true }).lean();
            }
        }
        return null;
    },

    // Generic Delete Many
    deleteMany: async (collection, query = {}) => {
        if (collection === 'users') {
            const result = await User.deleteMany(query);
            return result.deletedCount;
        } else {
            const data = readData(collection);
            const newData = data.filter(item => {
                return !Object.keys(query).every(key => item[key] == query[key]);
            });
            writeData(collection, newData);
        }
    },

    // Specialized User Find/Create (with password hashing)
    findUser: async (username) => {
        return await storage.findOne('users', { username });
    },

    createUser: async (userData) => {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);

        // Check if this is the first user
        const userCount = await User.countDocuments();
        const role = userCount === 0 ? 'Admin' : (userData.role || 'Student');

        const user = {
            ...userData,
            password: hashedPassword,
            role: role,
            currentSession: 1,
            completedChallenges: [],
            completedQuizzes: [],
            quizScores: {},
            courseCompleted: false,
            points: 0
        };
        return await storage.insert('users', user);
    },

    comparePassword: async (candidatePassword, hashedPassword) => {
        return await bcrypt.compare(candidatePassword, hashedPassword);
    }
};

module.exports = storage;
