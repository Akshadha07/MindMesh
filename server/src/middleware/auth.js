import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Retrieve JWT secret strictly from environment variables without hardcoded fallback
const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.trim().length === 0) {
    throw new Error('JWT_SECRET must be configured in environment variables');
  }
  return secret.trim();
};

/**
 * Authentication Middleware
 * 
 * Verifies JWT token from HTTP-only cookie or Authorization header.
 * Attaches authenticated user object to `req.user`.
 * Rejects unauthenticated requests with HTTP 401.
 */
export const requireAuth = async (req, res, next) => {
  try {
    let token = null;

    // 1. Check HTTP-only cookie first (preferred browser security strategy)
    if (req.cookies && (req.cookies.token || req.cookies.jwt)) {
      token = req.cookies.token || req.cookies.jwt;
    }
    // 2. Check Authorization Bearer header (supports API/cURL/mobile calls)
    else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication token missing. Please log in to access this resource.',
      });
    }

    // Verify token using strictly environment-configured secret
    const secret = getJwtSecret();
    const decoded = jwt.verify(token, secret);

    // Verify user still exists in database
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'The account associated with this session no longer exists.',
      });
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'TokenExpired',
        message: 'Your session has expired. Please log in again.',
      });
    }

    if (error.message && error.message.includes('JWT_SECRET')) {
      console.error('[Security Error]:', error.message);
      return res.status(500).json({
        error: 'ConfigurationError',
        message: 'Authentication configuration error on server.',
      });
    }

    return res.status(401).json({
      error: 'InvalidToken',
      message: 'Invalid authentication token.',
    });
  }
};
