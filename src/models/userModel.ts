import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phoneNumber?: string;
  company?: string;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  walletBalance: number;
  minutesUsed: number;
  totalMinutes: number;
  agentsAllowed: number;
  extraMinuteRate?: number;
  resetPasswordToken?: string
  resetPasswordExpire?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please provide a valid email',
      ],
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false,
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    company: {
      type: String,
      trim: true,
    },
     walletBalance: {
      type: Number,
      default: 0, // Amount in paise (₹0)
    },
    minutesUsed: {
      type: Number,
      default: 0,
    },
    totalMinutes: {
      type: Number,
      default: 300, // Default for starter plan
    },
    agentsAllowed: {
      type: Number,
      default: 1, // Default for starter plan
    },
    extraMinuteRate: {
      type: Number,
      default: 600, // ₹6.00 in paise, null for starter plan
    },
    plan: {
      type: String,
      enum: ['free', 'starter', 'growth', 'pro', 'enterprise'],
      default: 'free',
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  { timestamps: true }
);

// Hash the password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
