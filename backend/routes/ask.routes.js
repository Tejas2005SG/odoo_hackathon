import express from 'express';
import { askQuestion, updateQuestion, deleteQuestion, uploadImage, getAllQuestions, submitAnswer, updateVote, getQuestion, getAnswers, getNotifications, markNotificationsRead, acceptAnswer } from '../controllers/ask.controllers.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/all', getAllQuestions); // Public route to fetch all questions
router.get('/:id', getQuestion); // Public route to fetch a specific question
router.get('/:id/answers', getAnswers); // Public route to fetch answers for a question
router.post('/ask', protectRoute, askQuestion);
router.put('/update/:id', protectRoute, updateQuestion);
router.delete('/delete/:id', protectRoute, deleteQuestion);
router.post('/upload-image', protectRoute, uploadImage);
router.post('/answer', protectRoute, submitAnswer); // Endpoint for submitting answers
router.post('/vote', protectRoute, updateVote); // Endpoint for updating votes
router.post('/answers/accept', protectRoute, acceptAnswer); // New endpoint for accepting answers
router.get('/notifications', protectRoute, getNotifications); // New endpoint for fetching notifications
router.post('/notifications/read', protectRoute, markNotificationsRead); // New endpoint for marking notifications read
router.get('/getallquestions', protectRoute, adminRoute, getAllQuestions);
export default router;