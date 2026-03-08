const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const mongoUri = process.env.MONGO_URI;

// Connection Caching for Vercel
let cachedConnection = null;

async function connectToDatabase() {
    if (cachedConnection) {
        console.log('[DB] Using cached connection');
        return cachedConnection;
    }

    if (!mongoUri) {
        console.error('❌ MONGO_URI missing!');
        throw new Error('Database URI is missing');
    }

    console.log('[DB] New connection attempt...');
    cachedConnection = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 5000 // Timeout after 5s
    });
    console.log('✅ Connected to MongoDB Atlas');
    return cachedConnection;
}

// Schemas
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'Student' },
    currentSession: { type: Number, default: 1 },
    completedChallenges: { type: Array, default: [] },
    completedQuizzes: { type: Array, default: [] },
    quizScores: { type: Object, default: {} },
    points: { type: Number, default: 0 }
}, { strict: false });

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Quiz = mongoose.models.Quiz || mongoose.model('Quiz', new mongoose.Schema({}, { strict: false }), 'quizzes');
const Challenge = mongoose.models.Challenge || mongoose.model('Challenge', new mongoose.Schema({}, { strict: false }), 'challenges');

const storage = {
    find: async (coll, query) => {
        await connectToDatabase();
        if (coll === 'users') return await User.find(query).lean();
        if (coll === 'quizzes') return await Quiz.find(query).lean();
        if (coll === 'challenges') return await Challenge.find(query).lean();
        return [];
    },

    findOne: async (coll, query) => {
        await connectToDatabase();
        if (coll === 'users') {
            if (query._id && !mongoose.Types.ObjectId.isValid(query._id)) return null;
            return await User.findOne(query).lean();
        }
        if (coll === 'quizzes') return await Quiz.findOne(query).lean();
        if (coll === 'challenges') return await Challenge.findOne(query).lean();
        return null;
    },

    insert: async (coll, item) => {
        await connectToDatabase();
        if (coll === 'users') return await User.create(item);
        return null;
    },

    atomicUpdate: async (coll, query, callback) => {
        await connectToDatabase();
        if (coll === 'users') {
            const user = await User.findOne(query);
            if (user) {
                const updated = callback(user.toObject());
                delete updated._id;
                return await User.findOneAndUpdate(query, updated, { new: true }).lean();
            }
        }
        return null;
    },

    findUser: async (username) => await storage.findOne('users', { username }),

    createUser: async (userData) => {
        await connectToDatabase();
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);
        const count = await User.countDocuments();

        const user = {
            ...userData,
            password: hashedPassword,
            role: count === 0 ? 'Admin' : 'Student',
            currentSession: 1
        };
        return await User.create(user);
    },

    comparePassword: async (p, h) => await bcrypt.compare(p, h)
};

module.exports = storage;
