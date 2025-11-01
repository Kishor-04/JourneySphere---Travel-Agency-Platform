const mongoose = require("mongoose");
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://patilkishory04:876775@webdev.0tmazro.mongodb.net/journeysphere?retryWrites=true&w=majority&appName=webdev";

const MongoConn = mongoose.connect(MONGODB_URI)
.then(() => console.log("MongoDB Connected Successfully"))
.catch((error) => console.log("Error in the Connection:", error));

module.exports = MongoConn;