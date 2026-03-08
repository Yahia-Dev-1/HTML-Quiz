const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '../data');

// Ensure data directory exists
try {
    if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
    }
} catch (e) {
    console.warn('[Storage] Data directory error:', e.message);
}

const getFilePath = (collection) => path.join(DATA_DIR, `${collection}.json`);

const readData = (collection) => {
    const filePath = getFilePath(collection);
    try {
        if (!fs.existsSync(filePath)) {
            return [];
        }
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (e) {
        console.error(`Error reading collection ${collection}:`, e.message);
        return [];
    }
};

const writeData = (collection, data) => {
    try {
        const filePath = getFilePath(collection);
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
        return true;
    } catch (e) {
        console.error(`Error writing collection ${collection}:`, e.message);
        return false;
    }
};

const storage = {
    find: async (collection, query = {}) => {
        const data = readData(collection);
        return data.filter(item => {
            return Object.keys(query).every(key => item[key] == query[key]);
        });
    },

    findOne: async (collection, query = {}) => {
        const data = readData(collection);
        return data.find(item => {
            return Object.keys(query).every(key => item[key] == query[key]);
        });
    },

    insert: async (collection, item) => {
        const data = readData(collection);
        const newItem = {
            _id: Date.now().toString() + Math.random().toString(36).substr(2, 5),
            ...item
        };
        data.push(newItem);
        writeData(collection, data);
        return newItem;
    },

    update: async (collection, query, updates) => {
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
    },

    atomicUpdate: async (collection, query, callback) => {
        const data = readData(collection);
        let updatedItem = null;
        const newData = data.map(item => {
            const matches = Object.keys(query).every(key => item[key] == query[key]);
            if (matches) {
                const result = callback({ ...item });
                updatedItem = result;
                return result;
            }
            return item;
        });
        if (updatedItem) {
            writeData(collection, newData);
        }
        return updatedItem;
    },

    deleteMany: async (collection, query = {}) => {
        const data = readData(collection);
        const newData = data.filter(item => {
            return !Object.keys(query).every(key => item[key] == query[key]);
        });
        writeData(collection, newData);
    },

    findUser: async (username) => {
        return await storage.findOne('users', { username });
    },

    createUser: async (userData) => {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);

        // Let's make the very first user an Admin so Yahia can access it
        const users = readData('users');
        const role = users.length === 0 ? 'Admin' : (userData.role || 'Student');

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
