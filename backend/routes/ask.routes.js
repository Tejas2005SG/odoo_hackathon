import express from 'express';
import { askQuestion, updateQuestion, deleteQuestion, uploadImage } from '../controllers/ask.controllers.js';
// import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.post('/ask', askQuestion);
router.put('/update/:id', updateQuestion);
router.delete('/delete/:id', deleteQuestion);
router.post('/upload-image', uploadImage);

export default router;