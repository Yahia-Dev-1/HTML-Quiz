const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

const uri = process.env.MONGO_URI;
let client;
let db;

async function connectToDatabase() {
    if (db) return db;

    if (!client) {
        client = new MongoClient(uri, {
            connectTimeoutMS: 10000,
            socketTimeoutMS: 45000,
        });
        await client.connect();
        console.log('✅ Connected to MongoDB Atlas (Native Driver)');
    }

    db = client.db('html-quiz');
    return db;
}

const storage = {
    find: async (collectionName, query = {}) => {
        const database = await connectToDatabase();
        if (query._id && typeof query._id === 'string' && query._id.length === 24) {
            query._id = new ObjectId(query._id);
        }
        return await database.collection(collectionName).find(query).toArray();
    },

    findOne: async (collectionName, query = {}) => {
        const database = await connectToDatabase();
        if (query._id && typeof query._id === 'string' && query._id.length === 24) {
            query._id = new ObjectId(query._id);
        }
        return await database.collection(collectionName).findOne(query);
    },

    insert: async (collectionName, item) => {
        const database = await connectToDatabase();
        const result = await database.collection(collectionName).insertOne(item);
        return { ...item, _id: result.insertedId };
    },

    update: async (collectionName, query, updates) => {
        const database = await connectToDatabase();
        if (query._id && typeof query._id === 'string' && query._id.length === 24) {
            query._id = new ObjectId(query._id);
        }
        const result = await database.collection(collectionName).updateMany(query, { $set: updates });
        return result.modifiedCount;
    },

    atomicUpdate: async (collectionName, query, callback) => {
        const database = await connectToDatabase();
        if (query._id && typeof query._id === 'string' && query._id.length === 24) {
            query._id = new ObjectId(query._id);
        }

        const item = await database.collection(collectionName).findOne(query);
        if (item) {
            const updated = callback({ ...item });
            delete updated._id; // Prevent immutable field error
            const result = await database.collection(collectionName).findOneAndUpdate(
                { _id: item._id },
                { $set: updated },
                { returnDocument: 'after' }
            );
            return result;
        }
        return null;
    },

    findUser: async (username) => {
        return await storage.findOne('users', { username });
    },

    createUser: async (userData) => {
        const database = await connectToDatabase();
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);

        // Count users to decide role
        const userCount = await database.collection('users').countDocuments();

        const user = {
            ...userData,
            password: hashedPassword,
            role: userCount === 0 ? 'Admin' : 'Student',
            currentSession: 1,
            completedChallenges: [],
            completedQuizzes: [],
            quizScores: {},
            courseCompleted: false,
            points: 0,
            createdAt: new Date()
        };

        return await storage.insert('users', user);
    },

    comparePassword: async (candidatePassword, hashedPassword) => {
        return await bcrypt.compare(candidatePassword, hashedPassword);
    }
};

module.exports = storage;
