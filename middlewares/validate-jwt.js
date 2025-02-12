const { response, request } = require('express');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const { dbConnection } = require('../database/config');

const validateJWT = async (req = request, res = response, next) => {

    const token = req.header('x-token');

    if (!token) {
        return res.status(401).json({
            msg: 'Token is required'
        });
    }

    try {
        const { uid } = jwt.verify(token, process.env.JWT_KEY);

        const db = await dbConnection();
        const userCollection = db.collection('users');
        const userFound = await userCollection.findOne({ _id: new ObjectId(uid) });

        if (!userFound) {
            return res.status(401).json({
                msg: 'Invalid token'
            });
        }

        req.user = userFound;

        next();
    } catch (error) {
        return res.status(401).json({
            msg: 'Invalid token'
        });
    }
}

module.exports = {
    validateJWT
}