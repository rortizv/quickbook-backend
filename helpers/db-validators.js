const { ObjectId } = require('mongodb');
const { dbConnection } = require('../database/config');

const isValidRole = async (role = '') => {
    const db = await dbConnection();
    const rolesCollection = db.collection('roles');
    const roleFound = await rolesCollection.findOne({ role });

    if (!roleFound) {
        throw new Error(`Role '${role}' doesn't exist`);
    }
};

const validateIfEmailExists = async (email = '') => {
    const db = await dbConnection();
    const usersCollection = db.collection('users');
    const existingEmail = await usersCollection.findOne({ email });

    if (existingEmail) {
        throw new Error(`User with email '${email}' already exists`);
    }
};

const existsUserById = async (id = '') => {
    const db = await dbConnection();
    const usersCollection = db.collection('users');

    // Check if the ID is a valid MongoDB ObjectId before querying
    if (!ObjectId.isValid(id)) {
        throw new Error(`Invalid MongoDB ID: '${id}'`);
    }

    try {
        const userFound = await usersCollection.findOne({ _id: new ObjectId(id) });
        if (!userFound) {
            throw new Error(`User with id '${id}' doesn't exist`);
        }
    } catch (error) {
        throw new Error(`Error finding user with id '${id}': ${error.message}`);
    }
};

module.exports = {
    isValidRole,
    validateIfEmailExists,
    existsUserById
};
