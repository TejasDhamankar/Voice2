import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/userModel';
import { createToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { email, password } = await request.json();

    // Find user by email
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return NextResponse.json(
        { message: 'Invalid credentials' },
        { status: 401 }
      );
    }


    
 // Create JWT token
const payload = {  userId: user._id,
  name: user.name,
  email: user.email,
  plan: user.plan,
  walletBalance: user.walletBalance,
  minutesUsed: user.minutesUsed,
  totalMinutes: user.totalMinutes,
  agentsAllowed: user.agentsAllowed,
  extraMinuteRate: user.extraMinuteRate};
   
    const token = createToken(payload);

    return NextResponse.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        walletBalance: user.walletBalance,
        minutesUsed: user.minutesUsed,
        totalMinutes: user.totalMinutes,
        agentsAllowed: user.agentsAllowed,
        extraMinuteRate: user.extraMinuteRate
      },
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { message: 'Login failed', error: error.message },
      { status: 500 }
    );
  }
}
