import express from 'express';
import { login, logout, signup, getProfile,getUsers} from '../controllers/auth.controller.js';
import { adminRoute, protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.get('/profile', protectRoute, getProfile);
router.get('/getuser',protectRoute,adminRoute, getUsers);

export default router;