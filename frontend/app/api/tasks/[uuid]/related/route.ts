import { NextRequest, NextResponse } from 'next/server';
import { getTasksCollection } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sha256 = searchParams.get('sha256');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    if (!sha256) {
      return NextResponse.json(
        { error: 'SHA256 parameter is required' },
        { status: 400 }
      );
    }
    
    console.log(`[API] Fetching related tasks for SHA256: ${sha256}`);
    const collection = await getTasksCollection();
    
    // Find tasks with the same file hash (excluding the current one)
    const relatedTasks = await collection
      .find({ 
        file_sha256: sha256,
        task_status: 'COMPLETED'
      })
      .sort({ time_updated: -1 })
      .limit(limit)
      .toArray();
    
    console.log(`[API] Found ${relatedTasks.length} related tasks`);
    return NextResponse.json(relatedTasks);
  } catch (error) {
    console.error(`[API] Error fetching related tasks:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch related tasks' },
      { status: 500 }
    );
  }
} 