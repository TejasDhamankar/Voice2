import mongoose, { Document, Schema } from 'mongoose';

export interface IReservation extends Document {
  userId: mongoose.Types.ObjectId;
  callId?: mongoose.Types.ObjectId;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  partySize: number;
  dateTime: Date;
  duration: number; // minutes
  tableNumber?: number;
  status: 'confirmed' | 'pending' | 'cancelled' | 'completed' | 'no_show';
  specialRequests?: string;
  notes?: string;
  reminderSent?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ReservationSchema = new Schema<IReservation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    callId: { type: Schema.Types.ObjectId, ref: 'Call' },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    customerEmail: String,
    partySize: { type: Number, required: true, min: 1 },
    dateTime: { type: Date, required: true },
    duration: { type: Number, default: 90 }, // Default 90 minutes
    tableNumber: Number,
    status: {
      type: String,
      enum: ['confirmed', 'pending', 'cancelled', 'completed', 'no_show'],
      default: 'confirmed',
    },
    specialRequests: String,
    notes: String,
    reminderSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Reservation || mongoose.model<IReservation>('Reservation', ReservationSchema);