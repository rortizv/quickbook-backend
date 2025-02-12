const { response, request } = require('express');
const { dbConnection } = require('../database/config');

const userIsAdmin = async (req = request, res = response, next) => {

    if (!req.user) {
        return res.status(500).json({
            msg: 'User not found'
        });
    }

    const { role, name } = req.user;

    const db = await dbConnection();
    const rolesCollection = db.collection('roles');
    const roles = await rolesCollection.findOne({ role: 'ADMIN_ROLE' });

    if (!roles.role === role) {
        return res.status(401).json({
            msg: `${name} is not an admin`
        });
    }

    next();
};

module.exports = {
    userIsAdmin
}