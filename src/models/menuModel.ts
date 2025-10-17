import mongoose, { Document, Schema } from 'mongoose';

export interface IMenuItem extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  category: string;
  price: number;
  currency: string;
  available: boolean;
  imageUrl?: string;
  ingredients?: string[];
  allergens?: string[];
  nutritionInfo?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
  preparationTime: number; // in minutes
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const MenuItemSchema = new Schema<IMenuItem>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: true,
      enum: ['appetizer', 'main_course', 'dessert', 'beverage', 'side_dish', 'salad', 'soup', 'other'],
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    available: {
      type: Boolean,
      default: true,
    },
    imageUrl: String,
    ingredients: [String],
    allergens: [String],
    nutritionInfo: {
      calories: Number,
      protein: Number,
      carbs: Number,
      fat: Number,
    },
    preparationTime: {
      type: Number,
      default: 15,
    },
    tags: [String],
  },
  { timestamps: true }
);

export default mongoose.models.MenuItem || mongoose.model<IMenuItem>('MenuItem', MenuItemSchema);