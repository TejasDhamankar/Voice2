import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Call from '@/models/callModel';
import { getUserFromRequest } from '@/lib/jwt';

export async function GET(request: NextRequest) {
    try {
        const userData = await getUserFromRequest(request);
        if (!userData || typeof userData === 'string') {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const status = searchParams.get('status');
        const searchTerm = searchParams.get('search');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Build the database query object
        const query: any = { userId: userData.userId };

        if (status) {
            query.status = status;
        }

        if (searchTerm) {
            query.$or = [
                { contactName: { $regex: searchTerm, $options: 'i' } },
                { phoneNumber: { $regex: searchTerm, $options: 'i' } }
            ];
        }

        if (startDate) {
            query.createdAt = { ...query.createdAt, $gte: new Date(startDate) };
        }
        if (endDate) {
            query.createdAt = { ...query.createdAt, $lte: new Date(endDate) };
        }

        const totalCalls = await Call.countDocuments(query);
        const calls = await Call.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        return NextResponse.json({
            calls,
            pagination: {
                total: totalCalls,
                page,
                pages: Math.ceil(totalCalls / limit)
            }
        });
    } catch (error: any) {
        console.error('Error fetching call history:', error);
        return NextResponse.json({ message: 'Failed to fetch call history', error: error.message }, { status: 500 });
    }
}