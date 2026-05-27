import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import User from "../models/User.js";

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });

// @desc Register user
// POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;

    if (!name || !password || (!email && !mobile)) {
      return res
        .status(400)
        .json({ message: "Name, password, and email or mobile are required" });
    }

    // --- FIX STALE EMPTY STRINGS (SPARSE INDEX COMPATIBILITY) ---
    // If optional fields are empty strings, convert them to undefined so MongoDB completely ignores indexing them!
    const userData = {
      name,
      password,
      email: email && email.trim() !== "" ? email : undefined,
      mobile: mobile && mobile.trim() !== "" ? mobile : undefined,
    };

    const query = [];
    if (userData.email) query.push({ email: userData.email });
    if (userData.mobile) query.push({ mobile: userData.mobile });
    
    const userExists = await User.findOne({ $or: query });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create the user passing the cleaned userData object instead of raw req.body
    const user = await User.create(userData);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      avatar: user.avatar,
      bio: user.bio,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc Login user
// POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: "All fields required" });
    }

    const isEmail = identifier.includes("@");
    const user = await User.findOne(
      isEmail ? { email: identifier } : { mobile: identifier }
    );

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      mobile: user.mobile,
      avatar: user.avatar,
      bio: user.bio,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// @desc Get profile
// GET /api/auth/me
export const getMe = async (req, res) => {
  res.json(req.user);
};

// ==========================================
// NEW FUNCTIONALITY: FORGOT PASSWORD
// ==========================================

// Configure your mailing transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your email address in .env
    pass: process.env.EMAIL_PASS, // Your App Password in .env
  }
});

// @desc Forgot Password Request
// POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "No user found with this email" });
    }

    // Generate secure reset token valid for 1 hour
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; 
    await user.save();

    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;

    const mailOptions = {
      to: user.email,
      from: process.env.EMAIL_USER,
      subject: '✨ Lumina — Reset Your Password ✨',
      html: `
        <div style="font-family: sans-serif; padding: 30px; background: #0b0813; color: #fff; border-radius: 20px; max-width: 450px; text-align: center;">
          <span style="font-size: 40px;">🔮</span>
          <h2 style="color: #a78bfa; margin-top: 10px;">Password Reset Request</h2>
          <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6;">Hello ${user.name}, click the magic button below to securely update your password profile:</p>
          <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #a78bfa, #ec4899); color: white; padding: 12px 28px; border-radius: 12px; text-decoration: none; font-weight: bold; margin: 18px 0; box-shadow: 0 4px 15px rgba(236,72,153,0.3);">Reset My Password</a>
          <p style="color: #64748b; font-size: 11px;">If you didn't request this, ignore this email. Link expires in 1 hour.</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    res.json({ message: "Reset email sent successfully! Check your inbox 💌" });
  } catch (error) {
    console.error("Forgot password email error:", error);
    res.status(500).json({ message: "Failed to send reset email" });
  }
};