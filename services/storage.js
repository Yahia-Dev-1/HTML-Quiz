const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

// Connect to MongoDB
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/html-quiz';
mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

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
    progress: { type: Object, default: {} },
    createdAt: { type: Date, default: Date.now }
});

const quizSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: String,
    questions: Array,
    timeLimit: Number,
    passingScore: Number
});

const challengeSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    title: String,
    description: String,
    expectedSolution: String,
    hints: Array,
    difficulty: String
});

const User = mongoose.model('User', userSchema);
const Quiz = mongoose.model('Quiz', quizSchema);
const Challenge = mongoose.model('Challenge', challengeSchema);

const storage = {
    // Generic Find
    find: async (collection, query = {}) => {
        if (collection === 'users') {
            return await User.find(query).lean();
        } else {
            const data = readData(collection);
            return data.filter(item => {
                return Object.keys(query).every(key => item[key] == query[key]);
            });
        }
    },

    // Generic Find One
    findOne: async (collection, query = {}) => {
        if (collection === 'users') {
            return await User.findOne(query).lean();
        } else {
            const data = readData(collection);
            return data.find(item => {
                return Object.keys(query).every(key => item[key] == query[key]);
            });
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

    // Atomic Update with Callback (Prevents Race Conditions)
    atomicUpdate: async (collection, query, callback) => {
        if (collection === 'users') {
            const user = await User.findOne(query);
            if (user) {
                const updated = callback(user.toObject());
                return await User.findOneAndUpdate(query, updated, { new: true }).lean();
            }
            return null;
        } else {
            const data = readData(collection);
            let updatedItem = null;
            const newData = data.map(item => {
                const matches = Object.keys(query).every(key => item[key] == query[key]);
                if (matches) {
                    const result = callback(item);
                    updatedItem = result;
                    return result;
                }
                return item;
            });
            if (updatedItem) {
                writeData(collection, newData);
            }
            return updatedItem;
        }
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
        const user = {
            ...userData,
            password: hashedPassword,
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
