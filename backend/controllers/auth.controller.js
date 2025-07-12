import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../models/auth.model.js';

const signup = async (req, res) => {
  try {
    const { firstName, lastName, username, email, password, confirmPassword } = req.body;

    // Validate passwords match
    if (password !== confirmPassword) {
      console.log('Password validation failed: passwords do not match');
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      console.log('User already exists:', email, username);
      return res.status(400).json({ message: 'Email or username already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    console.log('Password hashed successfully');

    // Create new user
    const user = new User({
      firstName,
      lastName,
      username,
      email,
      password: hashedPassword,
      confirmPassword: hashedPassword,
    });

    await user.save();
    console.log('User saved:', user._id);

    // Verify JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in environment variables');
      return res.status(500).json({ message: 'Server configuration error: JWT_SECRET not set' });
    }

    // Generate JWT
    try {
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: '1d',
      });
      console.log('Token generated:', token);

      // Set token in HTTP-only cookie
      res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Secure only in production (HTTPS)
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
      });

      res.status(201).json({
        message: 'User created successfully',
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          email: user.email,
        },
      });
    } catch (jwtError) {
      console.error('JWT generation error:', jwtError.message);
      return res.status(500).json({ message: 'Error generating token', error: jwtError.message });
    }
  } catch (error) {
    console.error('Signup error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('Password mismatch for user:', email);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();
    console.log('User last login updated:', user._id);

    // Verify JWT_SECRET
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not defined in environment variables');
      return res.status(500).json({ message: 'Server configuration error: JWT_SECRET not set' });
    }

    // Generate JWT
    try {
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: '1d',
      });
      console.log('Token generated:', token);

      // Set token in HTTP-only cookie
      res.cookie('jwt', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Secure only in production (HTTPS)
        sameSite: 'strict',
        maxAge: 24 * 60 * 60 * 1000, // 1 day in milliseconds
      });

      res.status(200).json({
        message: 'Login successful',
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          username: user.username,
          email: user.email,
        },
      });
    } catch (jwtError) {
      console.error('JWT generation error:', jwtError.message);
      return res.status(500).json({ message: 'Error generating token', error: jwtError.message });
    }
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const logout = (req, res) => {
  try {
    console.log('Logout requested');
    // Clear the JWT cookie
    res.clearCookie('jwt', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    console.log('Fetching profile for user:', req.user?._id);
    const user = await User.findById(req.user._id).select('-password -confirmPassword');
    if (!user) {
      console.log('User not found for profile:', req.user?._id);
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error('Get profile error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export { signup, login, logout, getProfile };