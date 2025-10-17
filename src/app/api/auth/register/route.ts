import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/userModel';
import { createToken } from '@/lib/jwt';
import { plans } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const { name, email, password, phoneNumber, company } = await request.json();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Get starter plan defaults
    const starterPlan = plans.starter;

    // Create new user with the updated model
    const user = await User.create({
      name,
      email,
      password,
      phoneNumber,
      company,
      plan: 'free',            // Changed from 'free' to 'starter'
      walletBalance: 0,           // Initialize wallet with zero balance
      minutesUsed: 0,             // No minutes used yet
      totalMinutes: 0, // Minutes allocation for starter plan
      agentsAllowed: 0, // Number of agents allowed for starter plan
      extraMinuteRate: null       // Starter plan doesn't support extra minutes
    });

    // Create JWT token with additional user data
    const token = createToken({
      userId: user._id,
      name: user.name,
      email: user.email,
      plan: user.plan,
      walletBalance: user.walletBalance,
      minutesUsed: user.minutesUsed,
      totalMinutes: user.totalMinutes,
      agentsAllowed: user.agentsAllowed,
      extraMinuteRate: user.extraMinuteRate
    });

    return NextResponse.json(
      { message: 'User registered successfully', token },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Registration failed', error: error.message },
      { status: 500 }
    );
  }
}
