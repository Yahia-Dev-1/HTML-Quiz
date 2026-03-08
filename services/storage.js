const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

const uri = process.env.MONGO_URI;
const DATA_DIR = path.join(__dirname, '../data');

let client;
let db;

// Connect to MongoDB (For Users only)
async function connectToDatabase() {
    if (db) return db;
    if (!client) {
        client = new MongoClient(uri);
        await client.connect();
    }
    db = client.db(); // Use DB from URI
    return db;
}

// Read Local JSON (For Quizzes/Challenges)
const readLocalData = (collection) => {
    try {
        const filePath = path.join(DATA_DIR, `${collection}.json`);
        if (fs.existsSync(filePath)) {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        }
    } catch (e) {
        console.error(`Error reading local ${collection}:`, e.message);
    }
    return [];
};

const storage = {
    find: async (coll, query = {}) => {
        // Users from Cloud
        if (coll === 'users') {
            const database = await connectToDatabase();
            if (query._id && typeof query._id === 'string' && query._id.length === 24) {
                query._id = new ObjectId(query._id);
            }
            return await database.collection('users').find(query).toArray();
        }

        // Quizzes/Challenges from Local Files (ALWAYS WORKS)
        const data = readLocalData(coll);
        return data.filter(item => {
            return Object.keys(query).every(key => {
                if (key === '$or') { // Basic support for the or query
                    return query[key].some(subQuery =>
                        Object.keys(subQuery).every(subKey => item[subKey] == subQuery[subKey])
                    );
                }
                return item[key] == query[key];
            });
        });
    },

    findOne: async (coll, query = {}) => {
        if (coll === 'users') {
            const database = await connectToDatabase();
            if (query._id && typeof query._id === 'string' && query._id.length === 24) {
                query._id = new ObjectId(query._id);
            }
            const user = await database.collection('users').findOne(query);
            if (user && user.username === 'yahia') {
                user.role = 'Admin';
            }
            return user;
        }
        const data = readLocalData(coll);
        return data.find(item => Object.keys(query).every(key => item[key] == query[key]));
    },

    insert: async (coll, item) => {
        if (coll === 'users') {
            const database = await connectToDatabase();
            const result = await database.collection('users').insertOne(item);
            return { ...item, _id: result.insertedId };
        }
        return item;
    },

    update: async (coll, query, updates) => {
        if (coll === 'users') {
            const database = await connectToDatabase();
            if (query._id && typeof query._id === 'string' && query._id.length === 24) {
                query._id = new ObjectId(query._id);
            }
            return await database.collection('users').updateOne(query, { $set: updates });
        }
        return null;
    },

    atomicUpdate: async (coll, query, callback) => {
        if (coll === 'users') {
            const database = await connectToDatabase();
            if (query._id && typeof query._id === 'string' && query._id.length === 24) {
                query._id = new ObjectId(query._id);
            }
            const user = await database.collection('users').findOne(query);
            if (user) {
                const updated = callback({ ...user });
                const userId = user._id;
                delete updated._id;
                const result = await database.collection('users').findOneAndUpdate(
                    { _id: userId },
                    { $set: updated },
                    { returnDocument: 'after' }
                );
                return result;
            }
        }
        return null;
    },

    findUser: async (username) => await storage.findOne('users', { username }),

    createUser: async (userData) => {
        const database = await connectToDatabase();
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);
        const userCount = await database.collection('users').countDocuments();

        // Explicitly make 'yahia' an Admin, or the first user in the DB
        let role = 'Student';
        if (userData.username === 'yahia' || userCount === 0) {
            role = 'Admin';
        }

        const user = {
            ...userData,
            password: hashedPassword,
            role: role,
            currentSession: 1,
            completedChallenges: [],
            completedQuizzes: [],
            quizScores: {},
            points: 0,
            createdAt: new Date()
        };
        return await storage.insert('users', user);
    },

    comparePassword: async (p, h) => await bcrypt.compare(p, h)
};

module.exports = storage;
