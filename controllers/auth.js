const { response, request } = require('express');
const bcrypt = require('bcryptjs');
const { dbConnection } = require('../database/config');
const { generateJWT } = require('../helpers/generate-jwt');
const { googleVerify } = require('../helpers/google-verify');

const login = async (req = request, res = response) => {

    const { email, password } = req.body;

    try {
        const db = await dbConnection();
        const usersCollection = db.collection('users');
        let userFound = await usersCollection.findOne({ email });

        const { _id, ...rest } = userFound;
        userFound = { id: _id, ...rest };

        if (!userFound) {
            return res.status(400).json({
                msg: 'User/Password are not correct'
            });
        }

        if (!userFound.status) {
            return res.status(400).json({
                msg: 'User is not active'
            });
        }

        if (!bcrypt.compareSync(password, userFound.password)) {
            return res.status(400).json({
                msg: 'Password incorrect'
            });
        }

        // generate jwt
        const token = await generateJWT(userFound.id);
        delete userFound.password;

        res.json({
            token,
            user: userFound
        });


    } catch (error) {
        console.log(error);
        return res.status(500).json({
            msg: 'Login failed'
        })
    }



    res.json({
        msg: 'Login OK'
    });
}

const googleSignIn = async (req = request, res = response) => {

    const { id_token } = req.body;

    try {
        const { name, email } = await googleVerify(id_token);

        const db = await dbConnection();
        const usersCollection = db.collection('users');

        let userFound = await usersCollection.findOne({ email });

        if (!userFound) {
            const data = {
                name,
                email,
                password: ':P',
                google: true
            };

            newGoogleUser = await usersCollection.insertOne(data);
        }

        if (!newGoogleUser.status) {
            return res.status(401).json({
                msg: 'User blocked'
            });
        }

        const token = await generateJWT(newGoogleUser.insertedId);

        res.json({
            msg: 'Google sign-in',
            token
        });
    } catch (error) {
        console.log(error);
        res.json({
            msg: 'Google sign-in',
            id_token
        });
    }

}

module.exports = {
    login,
    googleSignIn
}