const dotenv = require('dotenv');
const connectDatabase = require('../config/database')

dotenv.config({path:'backend/config/config.env'});
connectDatabase();

