import { NextRequest, NextResponse } from 'next/server';
import { getTasksCollection } from '@/lib/mongodb';
import { Task } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    
    const collection = await getTasksCollection();
    
    // Build filter
    const filter: Record<string, unknown> = {};
    if (status && status !== 'all') {
      filter.task_status = status.toUpperCase();
    }
    
    // Get total count
    const total = await collection.countDocuments(filter);
    
    // Get paginated results
    const tasks = await collection
      .find(filter)
      .sort({ time_updated: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();
    
    return NextResponse.json({
      tasks: tasks as unknown as Task[],
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
} 