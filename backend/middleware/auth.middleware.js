import jwt from 'jsonwebtoken';
import { User } from '../models/auth.model.js';

export const protectRoute = async (req, res, next) => {
  try {
    // Get token from cookies
    const token = req.cookies.jwt;
    
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    // Verify JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in environment variables');
      return res.status(500).json({ message: 'Server configuration error: JWT_SECRET not set' });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('Token verified for user:', decoded.userId);
      
      // Find user by ID from token
      const user = await User.findById(decoded.userId).select('-password -confirmPassword');
      
      if (!user) {
        console.log('User not found for token:', decoded.userId);
        return res.status(401).json({ message: 'Invalid token. User not found.' });
      }

      // Attach user to request object
      req.user = user;
      console.log('User attached to request:', user._id);
      
      // Continue to next middleware/route handler
      next();
      
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError.message);
      
      // Handle specific JWT errors
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token has expired. Please login again.' });
      } else if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token format.' });
      } else {
        return res.status(401).json({ message: 'Invalid token.' });
      }
    }
    
  } catch (error) {
    console.error('Protection middleware error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

