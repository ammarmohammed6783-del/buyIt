import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const seedUser = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const email = 'ammar.mohammed.6783@gmail.com';
    let user = await User.findOne({ email });

    if (user) {
      console.log(`User ${email} already exists. Updating...`);
      user.name = 'Ammar Mohammed';
      user.role = 'user';
    } else {
      user = new User({
        name: 'Ammar Mohammed',
        email,
        role: 'user',
      });
    }

    await user.setPassword('12345678');
    await user.save();

    console.log('User seeded successfully!');
  } catch (error) {
    console.error('Failed to seed user:', error);
  } finally {
    await mongoose.disconnect();
  }
};

seedUser();