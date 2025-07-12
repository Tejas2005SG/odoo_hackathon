import cloudinary from '../lib/cloudinary.js';
import Question from '../models/question.model.js';
import Answer from '../models/answer.model.js';
import Notification from '../models/notification.model.js';
import { User } from '../models/auth.model.js';

// Helper function to extract Cloudinary public IDs from HTML description
const extractCloudinaryPublicIds = (description) => {
  const publicIds = [];
  const regex = /https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/v\d+\/questions\/([^.]+)\.(?:jpg|png|jpeg)/g;
  let match;
  while ((match = regex.exec(description)) !== null) {
    publicIds.push(`questions/${match[1]}`);
  }
  return publicIds;
};

export const getAllQuestions = async (req, res) => {
  try {
    console.log('Fetching all questions');
    console.log('Request user:', req.user);
    
    // Ensure JSON response for all cases
    res.setHeader('Content-Type', 'application/json');
    
    // Check if admin is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false,
        message: 'Unauthorized: Admin not authenticated',
        questions: []
      });
    }

    // Fetch all questions with user details
    const questions = await Question.find()
      .populate('user', 'firstName lastName username email')
      .select('title description tags status createdAt')
      .sort({ createdAt: -1 })
      .lean();

    if (!questions || questions.length === 0) {
      console.log('No questions found');
      return res.status(404).json({ 
        success: false,
        message: 'No questions found',
        questions: []
      });
    }

    res.status(200).json({
      success: true,
      message: 'All questions retrieved successfully',
      questions: questions.map(question => ({
        id: question._id,
        title: question.title,
        description: question.description,
        tags: question.tags,
        status: question.status,
        createdAt: question.createdAt,
        user: question.user ? {
          id: question.user._id,
          name: `${question.user.firstName} ${question.user.lastName}`,
          username: question.user.username,
          email: question.user.email
        } : null
      }))
    });
  } catch (error) {
    console.error('Error fetching all questions:', error.message);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message,
      questions: []
    });
  }
};


// Helper function to extract mentioned usernames
const extractMentions = (content) => {
  const regex = /@(\w+)/g;
  const mentions = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    mentions.push(match[1]);
  }
  return mentions;
};

export const getAllQuestions = async (req, res) => {
  try {
    const { sort, unanswered } = req.query;
    let query = Question.find().populate('user', 'username firstName lastName').lean();
    if (unanswered === 'true') {
      query = query.where('status').equals('pending');
    }
    if (sort === 'createdAt') {
      query = query.sort({ createdAt: -1 });
    } else if (sort === 'views') {
      query = query.sort({ views: -1 });
    } else {
      query = query.sort({ createdAt: -1 });
    }
    const questions = await query;
    res.status(200).json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getQuestion = async (req, res) => {
  try {
    console.log('Fetching question with id:', req.params.id);
    const question = await Question.findById(req.params.id).populate('user', 'username firstName lastName').lean();
    if (!question) {
      console.log('Question not found for id:', req.params.id);
      return res.status(404).json({ message: 'Question not found' });
    }
    console.log('Found question:', question);
    // Increment views (assuming views field exists in Question model)
    await Question.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    res.json(question);
  } catch (error) {
    console.error('Error fetching question:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getAnswers = async (req, res) => {
  try {
    const answers = await Answer.find({ questionId: req.params.id }).populate('user', 'username firstName lastName').lean();
    res.json(answers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const uploadImage = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized: User not authenticated' });
    }
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ message: 'No image provided' });
    }
    if (!image.startsWith('data:image/')) {
      return res.status(400).json({ message: 'Invalid image format. Expected base64-encoded image' });
    }
    const cloudinaryResponse = await cloudinary.uploader.upload(image, {
      folder: 'questions',
      allowed_formats: ['jpg', 'png', 'jpeg'],
    });
    res.status(200).json({ secure_url: cloudinaryResponse.secure_url });
  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const askQuestion = async (req, res) => {
  try {
    const { title, description, tags } = req.body;
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized: User not authenticated' });
    }
    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }
    const question = await Question.create({
      title,
      description,
      tags: tags ? JSON.parse(tags) : [],
      user: req.user.id,
      status: 'pending',
      views: 0,
    });
    res.status(201).json({ message: 'Question submitted successfully', question });
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateQuestion = async (req, res) => {
  try {
    const { title, description, tags } = req.body;
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized: User not authenticated' });
    }
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    if (question.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: You can only update your own questions' });
    }
    const oldPublicIds = extractCloudinaryPublicIds(question.description);
    const newPublicIds = description ? extractCloudinaryPublicIds(description) : oldPublicIds;
    const publicIdsToDelete = oldPublicIds.filter((id) => !newPublicIds.includes(id));
    for (const publicId of publicIdsToDelete) {
      try {
        await cloudinary.uploader.destroy(publicId);
        console.log(`Deleted image from Cloudinary: ${publicId}`);
      } catch (error) {
        console.error(`Error deleting image from Cloudinary (${publicId}):`, error);
      }
    }
    question.title = title || question.title;
    question.description = description || question.description;
    question.tags = tags ? JSON.parse(tags) : question.tags;
    question.updatedAt = Date.now();
    await question.save();
    res.json({ message: 'Question updated', question });
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const deleteQuestion = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized: User not authenticated' });
    }
    const question = await Question.findById(req.params.id);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    if (question.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: You can only delete your own questions' });
    }
    const publicIds = extractCloudinaryPublicIds(question.description);
    for (const publicId of publicIds) {
      try {
        await cloudinary.uploader.destroy(publicId);
        console.log(`Deleted image from Cloudinary: ${publicId}`);
      } catch (error) {
        console.error(`Error deleting image from Cloudinary (${publicId}):`, error);
      }
    }
    await Question.findByIdAndDelete(req.params.id);
    await Notification.deleteMany({ relatedId: req.params.id });
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const submitAnswer = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized: User not authenticated' });
    }
    const { questionId, content } = req.body;
    if (!questionId || !content) {
      return res.status(400).json({ message: 'Question ID and answer content are required' });
    }
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: 'Question not found' });
    }
    const answer = await Answer.create({
      questionId,
      user: req.user.id,
      content,
    });

    // Notify question owner
    if (question.user.toString() !== req.user.id) {
      await Notification.create({
        user: question.user,
        type: 'answer',
        content: `Your question "${question.title}" has a new answer`,
        relatedId: questionId,
      });
    }

    // Notify mentioned users
    const mentions = extractMentions(content);
    const mentionedUsers = await User.find({ username: { $in: mentions } });
    for (const mentionedUser of mentionedUsers) {
      if (mentionedUser._id.toString() !== req.user.id) {
        await Notification.create({
          user: mentionedUser._id,
          type: 'mention',
          content: `You were mentioned in an answer to "${question.title}"`,
          relatedId: answer._id,
        });
      }
    }

    res.status(201).json({ message: 'Answer submitted successfully', answer });
  } catch (error) {
    console.error('Error submitting answer:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateVote = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized: User not authenticated' });
    }
    const { answerId, voteType } = req.body;
    if (!answerId || !['upvote', 'downvote'].includes(voteType)) {
      return res.status(400).json({ message: 'Valid answer ID and vote type are required' });
    }
    const answer = await Answer.findById(answerId).populate('user', 'username');
    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }

    // Check if user has already voted
    const userVote = answer.votes?.find(vote => vote.user.toString() === req.user.id);
    if (userVote) {
      if (userVote.type === 'upvote' && voteType === 'upvote') {
        return res.status(400).json({ message: 'You have already upvoted this answer' });
      }
      if (userVote.type === 'downvote' && voteType === 'downvote') {
        return res.status(400).json({ message: 'You have already downvoted this answer' });
      }
      // Remove existing vote if switching
      answer.votes = answer.votes.filter(vote => vote.user.toString() !== req.user.id);
      if (userVote.type === 'upvote') answer.upvotes--;
      if (userVote.type === 'downvote') answer.downvotes--;
    }

    // Apply new vote
    if (voteType === 'upvote') {
      answer.upvotes++;
      answer.votes = answer.votes || [];
      answer.votes.push({ user: req.user.id, type: 'upvote' });
    } else if (voteType === 'downvote') {
      answer.downvotes++;
      answer.votes = answer.votes || [];
      answer.votes.push({ user: req.user.id, type: 'downvote' });
    }

    await answer.save();
    res.json({ message: 'Vote updated', answer });
  } catch (error) {
    console.error('Error updating vote:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const acceptAnswer = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized: User not authenticated' });
    }
    const { answerId } = req.body;
    if (!answerId) {
      return res.status(400).json({ message: 'Answer ID is required' });
    }
    const answer = await Answer.findById(answerId).populate('questionId');
    if (!answer) {
      return res.status(404).json({ message: 'Answer not found' });
    }
    if (answer.questionId.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Forbidden: Only the question owner can accept an answer' });
    }

    // Unaccept any previously accepted answer for this question
    await Answer.updateMany(
      { questionId: answer.questionId._id, accepted: true },
      { accepted: false }
    );

    // Accept the new answer
    answer.accepted = true;
    await answer.save();

    // Update question status
    await Question.findByIdAndUpdate(answer.questionId._id, { status: 'answered' });

    // Notify the answerer
    if (answer.user.toString() !== req.user.id) {
      await Notification.create({
        user: answer.user,
        type: 'answer',
        content: `Your answer to "${answer.questionId.title}" was accepted`,
        relatedId: answer.questionId._id,
      });
    }

    res.json({ message: 'Answer accepted', answer });
  } catch (error) {
    console.error('Error accepting answer:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const getNotifications = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized: User not authenticated' });
    }
    const notifications = await Notification.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
    const unreadCount = await Notification.countDocuments({ user: req.user.id, read: false });
    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const markNotificationsRead = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized: User not authenticated' });
    }
    await Notification.updateMany(
      { user: req.user.id, read: false },
      { read: true }
    );
    res.json({ message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Error marking notifications read:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};