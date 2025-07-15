// server/models/Order.js
const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  productId: String,
  productName: String,
  image: String,
  price: Number,
  userId: String,
  userEmail: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Order", orderSchema);
