const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
    name: String,
    cost: Number,
    price: Number,
    quantity: Number,
    category: String,
    img: String
});

module.exports = mongoose.model("Product", productSchema);