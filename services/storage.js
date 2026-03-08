const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '../data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR);
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
    const filePath = getFilePath(collection);
    console.log(`[File Write] Writing to ${collection}.json - Records: ${data.length}`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
};

const storage = {
    // Generic Find
    find: (collection, query = {}) => {
        const data = readData(collection);
        return data.filter(item => {
            return Object.keys(query).every(key => item[key] == query[key]);
        });
    },

    // Generic Find One
    findOne: (collection, query = {}) => {
        const data = readData(collection);
        return data.find(item => {
            return Object.keys(query).every(key => item[key] == query[key]);
        });
    },

    // Generic Insert
    insert: (collection, item) => {
        const data = readData(collection);
        const newItem = { ...item, _id: Date.now().toString() + Math.random().toString(36).substr(2, 5) };
        data.push(newItem);
        writeData(collection, data);
        return newItem;
    },

    // Generic Update
    update: (collection, query, updates) => {
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

    // Atomic Update with Callback (Prevents Race Conditions)
    atomicUpdate: (collection, query, callback) => {
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
    },

    // Generic Delete Many
    deleteMany: (collection, query = {}) => {
        const data = readData(collection);
        const newData = data.filter(item => {
            return !Object.keys(query).every(key => item[key] == query[key]);
        });
        writeData(collection, newData);
    },

    // Specialized User Find/Create (with password hashing)
    findUser: (username) => {
        return storage.findOne('users', { username });
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
        return storage.insert('users', user);
    },

    comparePassword: async (candidatePassword, hashedPassword) => {
        return await bcrypt.compare(candidatePassword, hashedPassword);
    }
};

module.exports = storage;
