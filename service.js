// server.js
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require("nodemailer");
const app = express();

// ====== Middleware ======
// ✅ Allow multiple origins
const allowedOrigins = [
  "http://localhost:3000",
  "https://monish-s03.github.io",
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

app.use(express.json());

// ====== Environment Variables ======
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 5000;
const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

// ====== MongoDB Connection ======
if (!MONGO_URI) {
  console.error("❌ MONGO_URI is not defined in .env");
  process.exit(1);
}

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  });

// ====== Nodemailer Setup ======
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

const sendEmail = async (to, subject, html) => {
  const mailOptions = {
    from: `"Order Notification" <${EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Email sent successfully");
  } catch (error) {
    console.error("❌ Failed to send email:", error.message);
  }
};

// Make sendEmail function globally accessible in routes
app.set("sendEmail", sendEmail);

// ====== Test Email Route (Optional) ======
app.post("/api/test-email", async (req, res) => {
  const { to, subject, message } = req.body;

  try {
    await sendEmail(to, subject, `<p>${message}</p>`);
    res.status(200).json({ message: "✅ Email sent successfully" });
  } catch (error) {
    console.error("❌ Error sending test email:", error.message);
    res.status(500).json({ error: "❌ Failed to send email" });
  }
});

// ====== Import Routes ======
const orderRoutes = require("./routes/orderRoutes");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/admin");
const sellerRoutes = require("./routes/sellerRoutes");

// ====== Use Routes ======
app.use("/api/orders", orderRoutes);  // Orders route (use sendEmail internally)
app.use("/api/auth", authRoutes);     // Auth route (login/signup)
app.use("/api/admin", adminRoutes);   // Admin panel routes
app.use("/api/seller", sellerRoutes); // Seller panel routes

// ====== Start Server ======
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
