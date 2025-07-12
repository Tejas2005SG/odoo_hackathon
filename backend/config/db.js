import mongoose from 'mongoose';


const connectionDb = async () => {
  try {
    const connect = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB connected: ${connect.connection.host}`);
  } catch (error) {
    console.error(`Connection error: ${error.message}`);
  }
};

export default connectionDb;