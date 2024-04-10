// require('dotenv').config({ path: './.env' }); this is not work because type is module here


import { app } from './app.js';
import ConnectDB from './utils/db.js';

import dotenv from "dotenv"
dotenv.config({
    path:'./.env'
})

const port = process.env.PORT || 5000;


ConnectDB()
    .then(() => {
        app.listen(port ,() => {
            console.log(`Server is running on port http://localhost:${port}`);
        });
    })
    .catch((error) => {
        console.log("Error in Database connection or app listen");
    })
