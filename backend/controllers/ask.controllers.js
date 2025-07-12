import { redis } from '../lib/redis.js';
import cloudinary from '../lib/cloudinary.js';
import Question from '../models/question.model.js';

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
      status: 'pending'
    });

    await redis.del('questions');
    res.status(201).json({ message: 'Question submitted successfully', question });
  } catch (error) {
    console.log('Error creating question: ', error);
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

    // Extract Cloudinary public IDs from old and new descriptions
    const oldPublicIds = extractCloudinaryPublicIds(question.description);
    const newPublicIds = description ? extractCloudinaryPublicIds(description) : oldPublicIds;

    // Delete images that are no longer referenced
    const publicIdsToDelete = oldPublicIds.filter(id => !newPublicIds.includes(id));
    for (const publicId of publicIdsToDelete) {
      try {
        await cloudinary.uploader.destroy(publicId);
        console.log(`Deleted image from Cloudinary: ${publicId}`);
      } catch (error) {
        console.log(`Error deleting image from Cloudinary (${publicId}): `, error);
      }
    }

    question.title = title || question.title;
    question.description = description || question.description;
    question.tags = tags ? JSON.parse(tags) : question.tags;
    question.updatedAt = Date.now();

    await question.save();
    await redis.del('questions');
    res.json({ message: 'Question updated', question });
  } catch (error) {
    console.log('Error updating question: ', error);
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

    // Delete all Cloudinary images referenced in the description
    const publicIds = extractCloudinaryPublicIds(question.description);
    for (const publicId of publicIds) {
      try {
        await cloudinary.uploader.destroy(publicId);
        console.log(`Deleted image from Cloudinary: ${publicId}`);
      } catch (error) {
        console.log(`Error deleting image from Cloudinary (${publicId}): `, error);
      }
    }

    await Question.findByIdAndDelete(req.params.id);
    await redis.del('questions');
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.log('Error deleting question: ', error);
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

    const cloudinaryResponse = await cloudinary.uploader.upload(image, {
      folder: 'questions',
      allowed_formats: ['jpg', 'png', 'jpeg']
    });

    res.status(200).json({ secure_url: cloudinaryResponse.secure_url });
  } catch (error) {
    console.log('Error uploading image: ', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};