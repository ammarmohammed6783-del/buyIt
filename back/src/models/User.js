import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },

    email: {
      type: String,
      required: true,
      unique: true,      // creates a unique index: no duplicate accounts
      lowercase: true,   // "Ammar@X.com" and "ammar@x.com" are the same person
      trim: true,
    },

    // select: false → queries NEVER return these unless you ask with .select('+passwordHash')
    passwordHash: { type: String, required: true, select: false },
    refreshTokenHash: { type: String, select: false },

    // Never read from a request body. Only set in code (seed script, or a manual DB edit).
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
  },
  { timestamps: true } // adds createdAt + updatedAt automatically
);

// Hash a plain password and store it. Call before save().
userSchema.methods.setPassword = async function (plain) {
  this.passwordHash = await bcrypt.hash(plain, 12); // 12 = cost factor (slow on purpose)
};

// Compare a login attempt. The user must be loaded with .select('+passwordHash').
userSchema.methods.comparePassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

export default mongoose.model('User', userSchema);