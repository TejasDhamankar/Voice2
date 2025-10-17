import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Call from '@/models/callModel';
import { getUserFromRequest } from '@/lib/jwt';

function convertToCSV(data: any[]) {
    const headers = ['Contact Name', 'Phone Number', 'Status', 'Outcome', 'Agent Name', 'Start Time', 'Duration (s)'];
    const rows = data.map(call => [
        `"${call.contactName || ''}"`, `"${call.phoneNumber || ''}"`, `"${call.status || ''}"`,
        `"${call.outcome || ''}"`, `"${call.agentName || ''}"`,
        `"${call.startTime ? new Date(call.startTime).toISOString() : ''}"`, call.duration || 0
    ].join(','));
    return [headers.join(','), ...rows].join('\n');
}

export async function GET(request: NextRequest) {
    try {
        const userData = await getUserFromRequest(request);
        if (!userData) return new NextResponse('Unauthorized', { status: 401 });

        await connectDB();
        const { searchParams } = new URL(request.url);
        const query: any = { userId: userData.userId };
        
        if (searchParams.get('status')) query.status = searchParams.get('status');
        if (searchParams.get('search')) {
            const searchTerm = searchParams.get('search')!;
             query.$or = [
                { contactName: { $regex: searchTerm, $options: 'i' } },
                { phoneNumber: { $regex: searchTerm, $options: 'i' } }
            ];
        }
        if (searchParams.get('startDate')) {
             query.createdAt = { ...query.createdAt, $gte: new Date(searchParams.get('startDate')!) };
        }
         if (searchParams.get('endDate')) {
            query.createdAt = { ...query.createdAt, $lte: new Date(searchParams.get('endDate')!) };
        }


        const calls = await Call.find(query).sort({ createdAt: -1 }).lean();
        const csv = convertToCSV(calls);

        return new NextResponse(csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="call_history_${new Date().toISOString().split('T')[0]}.csv"`,
            },
        });
    } catch (error) {
        return new NextResponse('Failed to export calls', { status: 500 });
    }
}