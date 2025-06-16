import { NextResponse } from 'next/server';
import { getTasksCollection } from '@/lib/mongodb';
import { ThreatData } from '@/lib/types';

export async function GET() {
  try {
    const collection = await getTasksCollection();
    
    // Get threat distribution
    const threatDistribution = await collection.aggregate([
      {
        $group: {
          _id: '$defender_result',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]).toArray();
    
    // Map to chart data with colors
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];
    
    const threatData: ThreatData[] = threatDistribution.map((item, index) => ({
      name: item._id || 'Unknown',
      value: item.count,
      color: colors[index % colors.length]
    }));
    
    return NextResponse.json(threatData);
  } catch (error) {
    console.error('Error fetching threat data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch threat data' },
      { status: 500 }
    );
  }
}