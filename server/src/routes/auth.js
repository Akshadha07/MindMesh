import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Note from '../models/Note.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

// Retrieve JWT secret strictly from environment variables without hardcoded fallback
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim().length === 0) {
    throw new Error('JWT_SECRET must be configured in environment variables');
  }
  return secret.trim();
};

// Sample starter knowledge nodes for newly registered architects
const STARTER_NOTES = [
  {
    title: 'Neural Synapse Mapping',
    description: 'Structuring multidimensional associative links between core concepts in semantic memory spaces.',
    category: 'Artificial Intelligence',
    tags: ['AI', 'Cognitive', 'Architecture']
  },
  {
    title: 'Sakura Cyberpunk UI System',
    description: 'Harmonizing deep midnight navy backgrounds with electric neon-pink highlights and delicate blossom motifs.',
    category: 'UI/UX Design',
    tags: ['Design', 'Cyberpunk', 'CSS']
  },
  {
    title: 'Graph Theory & Knowledge Nodes',
    description: 'Evaluating adjacency matrices versus edge lists for high-speed client-side force-directed canvas rendering.',
    category: 'Computer Science',
    tags: ['Graph', 'Algorithms', 'Visualization']
  }
];

// Helper to configure secure HTTP-only cookie options
const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

/**
 * POST /api/auth/register
 * Creates a new user account with hashed password and establishes a session.
 */
router.post('/register', async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // 1. Validation
    if (!email || typeof email !== 'string' || !email.trim()) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Valid email address is required.'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Please provide a valid email address.'
      });
    }

    if (!username || typeof username !== 'string' || username.trim().length < 2) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Username must be at least 2 characters long.'
      });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Password must be at least 6 characters long.'
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 2. Check for existing user
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'An account with this email address already exists.'
      });
    }

    // 3. Create user (password is hashed in pre-save hook)
    const newUser = await User.create({
      email: normalizedEmail,
      username: username.trim(),
      password
    });

    // 4. Seed user's initial knowledge notes so they have immediate graph nodes
    const initialNotesWithUser = STARTER_NOTES.map((note) => ({
      ...note,
      user: newUser._id
    }));
    await Note.insertMany(initialNotesWithUser).catch((err) => {
      console.warn('[Seed Warning] Failed to insert initial notes for new user:', err.message);
    });

    // 5. Generate JWT token
    const secret = getJwtSecret();
    const token = jwt.sign(
      {
        id: newUser._id.toString(),
        email: newUser.email,
        username: newUser.username
      },
      secret,
      { expiresIn: '7d' }
    );

    // 6. Set HTTP-only cookie
    res.cookie('token', token, getCookieOptions());

    res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: newUser._id.toString(),
        email: newUser.email,
        username: newUser.username
      },
      token
    });
  } catch (error) {
    console.error('[Auth Error] Registration failed:', error.message);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to create account. Please try again later.'
    });
  }
});

/**
 * POST /api/auth/login
 * Verifies credentials, sets session cookie, and returns user profile.
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Email and password are required.'
      });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Find user by normalized email
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({
        error: 'InvalidCredentials',
        message: 'Invalid email or password.'
      });
    }

    // Compare bcrypt password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        error: 'InvalidCredentials',
        message: 'Invalid email or password.'
      });
    }

    // Generate JWT token
    const secret = getJwtSecret();
    const token = jwt.sign(
      {
        id: user._id.toString(),
        email: user.email,
        username: user.username
      },
      secret,
      { expiresIn: '7d' }
    );

    // Set HTTP-only cookie
    res.cookie('token', token, getCookieOptions());

    res.status(200).json({
      message: 'Login successful',
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username
      },
      token
    });
  } catch (error) {
    console.error('[Auth Error] Login failed:', error.message);
    res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to process login. Please try again later.'
    });
  }
});

/**
 * POST /api/auth/logout
 * Clears the session cookie.
 */
router.post('/logout', (req, res) => {
  res.clearCookie('token', getCookieOptions());
  res.status(200).json({
    message: 'Logged out successfully'
  });
});

/**
 * GET /api/auth/me
 * Restores the current authenticated user session on page refresh.
 */
router.get('/me', requireAuth, (req, res) => {
  res.status(200).json({
    user: {
      id: req.user._id.toString(),
      email: req.user.email,
      username: req.user.username
    }
  });
});

export default router;
