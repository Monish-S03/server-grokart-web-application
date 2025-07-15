const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
require("dotenv").config();

// 🔧 Email transporter using Gmail and App Password
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // your_email@gmail.com
    pass: process.env.EMAIL_PASS, // app password from Google
  },
});

// POST: Apply as a seller
router.post("/apply", async (req, res) => {
  const { name, shopName, email, phone, description } = req.body;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER, // You can also send it to admin or self
    subject: "New Seller Application",
    html: `
      <h2>New Seller Application</h2>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Shop Name:</strong> ${shopName}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Phone:</strong> ${phone}</p>
      <p><strong>Description:</strong> ${description}</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully");
    res.status(200).json({ message: "Application submitted successfully" });
  } catch (error) {
    console.error("❌ Failed to send email:", error);
    res.status(500).json({ message: "Failed to send application email" });
  }
});

module.exports = router;


















