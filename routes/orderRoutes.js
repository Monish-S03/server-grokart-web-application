const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const Order = require("../models/Order");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;

// ✅ Middleware: Token check
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized: No token" });
  }

  try {
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized: Invalid token" });
  }
};

// ✅ Email Sender: Confirmation
const sendOrderConfirmationEmail = async (order) => {
  try {
    console.log("📧 Sending confirmation email to:", order.userEmail);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.verify();
    console.log("✅ Gmail transporter verified for confirmation");

    const mailOptions = {
      from: `"Store Orders" <${process.env.EMAIL_USER}>`,
      to: order.userEmail,
      subject: "✅ Your Order is Confirmed",
      html: `
        <h3>Thank you for your order!</h3>
        <p><b>Product:</b> ${order.productName}</p>
        <p><b>Price:</b> ₹${order.price}</p>
        <p><b>Quantity:</b> ${order.quantity || 1}</p>
        <p><b>Order ID:</b> ${order._id}</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Confirmation email sent");
  } catch (err) {
    console.error("❌ Confirmation email failed:", err.message);
  }
};

// ✅ Email Sender: Cancellation
const sendOrderCancellationEmail = async (order) => {
  try {
    console.log("📧 Sending cancellation email to:", order.userEmail);

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.verify();
    console.log("✅ Gmail transporter verified for cancellation");

    const mailOptions = {
      from: `"Store Orders" <${process.env.EMAIL_USER}>`,
      to: order.userEmail,
      subject: "❌ Your Order Has Been Cancelled",
      html: `
        <h3>Your order has been cancelled</h3>
        <p><b>Product:</b> ${order.productName}</p>
        <p><b>Price:</b> ₹${order.price}</p>
        <p><b>Quantity:</b> ${order.quantity || 1}</p>
        <p><b>Order ID:</b> ${order._id}</p>
        <p><b>Cancelled At:</b> ${new Date().toLocaleString()}</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Cancellation email sent");
  } catch (err) {
    console.error("❌ Cancellation email failed:", err.message);
  }
};

// ✅ POST /api/orders
router.post("/", authMiddleware, async (req, res) => {
  console.log("✅ Received order:", req.body);

  const { productId, productName, price, userEmail, image, quantity } = req.body;

  if (!productId || !productName || !price || !userEmail) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    const newOrder = new Order({
      productId,
      productName,
      image,
      price,
      userEmail,
      quantity,
      createdAt: new Date(),
    });

    await newOrder.save();
    await sendOrderConfirmationEmail(newOrder);

    res.status(201).json({ message: "✅ Order saved & email sent", order: newOrder });
  } catch (err) {
    console.error("❌ Error saving order:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ GET /api/orders/:email
router.get("/:email", async (req, res) => {
  const { email } = req.params;
  if (!email || email === "undefined") {
    return res.status(400).json({ message: "❌ Invalid email" });
  }

  try {
    const orders = await Order.find({ userEmail: email }).sort({ createdAt: -1 });
    res.status(200).json(orders);
  } catch (err) {
    console.error("❌ Fetch orders error:", err.message);
    res.status(500).json({ message: "Error fetching orders", error: err.message });
  }
});

// ✅ DELETE /api/orders/:id
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  console.log("🗑️ DELETE request for Order ID:", id);

  try {
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "❌ Order not found" });
    }

    console.log("📧 Preparing to send cancellation email to:", order.userEmail);
    await sendOrderCancellationEmail(order);
    await Order.findByIdAndDelete(id);

    res.status(200).json({ message: "✅ Order cancelled & email sent" });
  } catch (err) {
    console.error("❌ Delete order error:", err.message);
    res.status(500).json({ message: "❌ Failed to cancel order", error: err.message });
  }
});

module.exports = router;


