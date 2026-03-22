const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config();

const User = require("./models/user");

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const hash = await bcrypt.hash("admin123", 10);

    await User.create({
        username: "admin",
        password: hash
    });

    console.log("Admin created");
    process.exit();
});