import express from 'express';
import { askQuestion, updateQuestion, deleteQuestion, uploadImage } from '../controllers/ask.controllers.js';
import {protectRoute} from '../middleware/auth.middleware.js'

const router = express.Router();

router.post('/ask',protectRoute, askQuestion);
router.put('/update/:id',protectRoute, updateQuestion);
router.delete('/delete/:id',protectRoute, deleteQuestion);
router.post('/upload-image',protectRoute, uploadImage);

export default router;