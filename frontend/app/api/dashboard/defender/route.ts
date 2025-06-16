import { NextResponse } from 'next/server';
import { getTasksCollection } from '@/lib/mongodb';
import { DefenderData } from '@/lib/types';

export async function GET() {
  try {
    const collection = await getTasksCollection();
    
    // Get defender analysis data
    const defenderData = await collection.aggregate([
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
    
    const chartData: DefenderData[] = defenderData.map(item => ({
      status: item._id || 'Unknown',
      count: item.count
    }));
    
    return NextResponse.json(chartData);
  } catch (error) {
    console.error('Error fetching defender data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch defender data' },
      { status: 500 }
    );
  }
}