import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import User from '@/models/userModel';
import { getUserFromRequest } from '@/lib/jwt';

export async function GET(request: NextRequest) {
  try {
    const userData = await getUserFromRequest(request);

    if (!userData) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    // Get userId safely, assuming decoded token has userId property
    const userId = userData.userId;

    if (!userId) {
      console.error('No userId in token payload:', userData);
      return NextResponse.json(
        { message: 'Invalid token data' },
        { status: 401 }
      );
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { message: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: user._id,
      name: user.name,
      email: user.email,
      plan: user.plan,
    });
  } catch (error: any) {
    console.error('Validation error:', error);
    return NextResponse.json(
      { message: 'Validation failed', error: error.message },
      { status: 500 }
    );
  }
}
