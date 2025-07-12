import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['answer', 'comment', 'mention'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;