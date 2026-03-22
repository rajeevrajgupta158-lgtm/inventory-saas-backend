const express = require("express");
const Product = require("../models/product");

const router = express.Router();

router.post("/", async (req, res) => {
    const product = await Product.create(req.body);
    res.json(product);
});

router.get("/", async (req, res) => {
    const products = await Product.find();
    res.json(products);
});

router.delete("/:id", async (req, res) => {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
});

router.put("/:id", async (req, res) => {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(product);
});

router.patch("/stock/in/:id", async (req, res) => {
    const p = await Product.findById(req.params.id);
    p.quantity++;
    await p.save();
    res.json(p);
});

router.patch("/stock/out/:id", async (req, res) => {
    const p = await Product.findById(req.params.id);
    if (p.quantity > 0) p.quantity--;
    await p.save();
    res.json(p);
});

module.exports = router;