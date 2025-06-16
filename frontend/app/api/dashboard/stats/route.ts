import { NextResponse } from 'next/server';
import { getTasksCollection } from '@/lib/mongodb';
import { DashboardStats } from '@/lib/types';

export async function GET() {
  try {
    const collection = await getTasksCollection();
    
    // Get task status counts
    const statusCounts = await collection.aggregate([
      {
        $group: {
          _id: '$task_status',
          count: { $sum: 1 }
        }
      }
    ]).toArray();
    
    // Get threat detection counts
    const threatCounts = await collection.aggregate([
      {
        $group: {
          _id: '$defender_result',
          count: { $sum: 1 }
        }
      }
    ]).toArray();
    
    // Calculate stats
    const totalTasks = statusCounts.reduce((sum, item) => sum + item.count, 0);
    const completedTasks = statusCounts.find(item => item._id === 'COMPLETED')?.count || 0;
    const pendingTasks = statusCounts.find(item => item._id === 'PENDING')?.count || 0;
    const failedTasks = statusCounts.find(item => item._id === 'FAILED')?.count || 0;
    
    const threatsDetected = threatCounts.find(item => 
      item._id?.includes('THREAT_DETECTED') || item._id?.includes('DETECTED')
    )?.count || 0;
    
    const cleanFiles = threatCounts.find(item => 
      item._id?.includes('NOT_DETECTED') || item._id?.includes('CLEAN')
    )?.count || 0;
    
    const stats: DashboardStats = {
      totalTasks,
      completedTasks,
      pendingTasks,
      failedTasks,
      threatsDetected,
      cleanFiles
    };
    
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    );
  }
} 