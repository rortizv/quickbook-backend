const { response, request } = require('express');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

const { dbConnection } = require('../database/config');

const getUsers = async (req, res = response) => {
    try {
        const db = await dbConnection();
        const usersCollection = db.collection('users');

        const { limit = 0, from = 0 } = req.query;

        // Convert query params to numbers
        const skipValue = Number(from);
        const limitValue = Number(limit);

        // Fetch users with pagination, excluding password
        const users = await usersCollection.find(
            { status: true },
            { projection: { password: 0 } }
        )
            .skip(skipValue)
            .limit(limitValue)
            .toArray();

        // Convert _id to id
        const formattedUsers = users.map(({ _id, ...rest }) => ({
            id: _id.toString(),
            ...rest
        }));

        // The correct total should be the number of retrieved users
        const total = formattedUsers.length;

        res.json({
            total,
            users: formattedUsers
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            ok: false,
            msg: 'Internal server error'
        });
    }
};

const createUser = async (req = request, res = response) => {
    try {
        const { name, email, password, role } = req.body;

        // Basic validations
        if (!name || !email || !password || !role) {
            return res.status(400).json({
                msg: 'Name, email, password, and role are required'
            });
        }

        const db = await dbConnection();
        const usersCollection = db.collection('users');

        // Encrypt password
        let hashedPassword;
        try {
            const saltRounds = bcrypt.genSaltSync(10);
            hashedPassword = await bcrypt.hash(password, saltRounds);
        } catch (error) {
            return res.status(500).json({
                msg: 'Error encrypting password'
            });
        }

        // Create new user
        const newUser = { name, email, password: hashedPassword, role, google: false, status: true };
        const result = await usersCollection.insertOne(newUser);

        if (!result.insertedId) {
            return res.status(500).json({
                msg: 'Error creating user'
            });
        }

        // Build user object without the password
        const createdUser = {
            id: result.insertedId.toString(),
            name,
            email,
            role
        };

        res.status(201).json({
            msg: 'User created successfully',
            user: createdUser
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            msg: 'Internal server error'
        });
    }
};

const updateUser = async (req = request, res = response) => {

    const { id } = req.params;
    const { password, google, email, ...rest } = req.body;

    try {
        const db = await dbConnection();
        const usersCollection = db.collection('users');

        if (password) {
            const saltRounds = bcrypt.genSaltSync(10);
            rest.password = bcrypt.hash(password, saltRounds);
        }

        const updatedUser = { ...rest, ...req.body };
        const result = await usersCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: updatedUser }
        );

        if (result.modifiedCount === 0) {
            return res.status(400).json({
                msg: 'User not updated'
            });
        }

        res.json({
            msg: 'User updated successfully',
            user: updatedUser
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({
            msg: 'Internal server error'
        });
    }
};

const deleteUser = async (req = request, res = response) => {

    const { id } = req.params;
    const db = await dbConnection();
    const usersCollection = db.collection('users');

    const userFound = await usersCollection.findOne({ _id: new ObjectId(id) });
    if (!userFound.status) {
        return res.status(401).json({
            msg: 'User is not active'
        });
    }

    const result = await usersCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: false } }
    );

    if (result.modifiedCount === 0) {
        return res.status(400).json({
            msg: 'User has not been deleted'
        });
    }

    res.json({
        msg: `User has been deleted successfully`
    });
};

module.exports = {
    getUsers,
    createUser,
    updateUser,
    deleteUser
}