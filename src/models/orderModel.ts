import mongoose, { Document, Schema } from 'mongoose';

export interface IOrderItem {
  menuItemId: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  specialInstructions?: string;
}

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId;
  callId?: mongoose.Types.ObjectId;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  items: IOrderItem[];
  subtotal: number;
  tax: number;
  deliveryFee: number;
  total: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  orderType: 'dine_in' | 'takeaway' | 'delivery';
  tableNumber?: number;
  deliveryAddress?: string;
  notes?: string;
  estimatedTime: number; // minutes
  placedAt: Date;
  confirmedAt?: Date;
  readyAt?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderItemSchema = new Schema({
  menuItemId: { type: Schema.Types.ObjectId, ref: 'MenuItem', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  specialInstructions: String,
});

const OrderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    callId: { type: Schema.Types.ObjectId, ref: 'Call' },
    orderNumber: { type: String, required: true, unique: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerEmail: String,
    items: [OrderItemSchema],
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'],
      default: 'pending',
    },
    orderType: {
      type: String,
      enum: ['dine_in', 'takeaway', 'delivery'],
      required: true,
    },
    tableNumber: Number,
    deliveryAddress: String,
    notes: String,
    estimatedTime: { type: Number, default: 30 },
    placedAt: { type: Date, default: Date.now },
    confirmedAt: Date,
    readyAt: Date,
    completedAt: Date,
  },
  { timestamps: true }
);

export default mongoose.models.Order || mongoose.model<IOrder>('Order', OrderSchema);