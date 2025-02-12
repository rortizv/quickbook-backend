const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_CNN; // Ensure this is correctly set in .env
const client = new MongoClient(uri);

let db;

const dbConnection = async () => {
    if (!db) {
        try {
            await client.connect();
            db = client.db('quickbook'); // Change to your actual database name
            console.log('✅ Database connected successfully');
        } catch (error) {
            console.error('❌ Database connection error:', error);
            throw new Error('Database connection failed');
        }
    }
    return db;
};

module.exports = { dbConnection };
