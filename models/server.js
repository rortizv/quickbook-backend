const express = require('express');
const cors = require('cors');

const { dbConnection } = require('../database/config');

class Server {

    constructor() {
        this.app = express();
        this.port = process.env.PORT;

        this.paths = {
            users: '/api/users',
            auth: '/api/auth'
        }

        // Connect to DB
        this.connectDB();

        // Middlewares
        this.middlewares();

        // Routes
        this.routes();
    }

    async connectDB() {
        await dbConnection();
    }


    middlewares() {

        // CORS
        this.app.use(cors());

        // Read and parse body
        this.app.use(express.json());

        // Public Directory
        this.app.use(express.static('public'));

    }

    routes() {
        this.app.use(this.paths.users, require('../routes/users'));
        this.app.use(this.paths.auth, require('../routes/auth'));
    }

    listen() {
        this.app.listen(this.port, () => {
            console.log(`Server running on port: ${this.port}`);
        });
    }

}

module.exports = Server;