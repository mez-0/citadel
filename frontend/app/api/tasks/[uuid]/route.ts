import { NextRequest, NextResponse } from 'next/server';
import { getTasksCollection, getPayloadsCollection } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid } = await params;
    console.log(`[API] Fetching task data for UUID: ${uuid}`);
    
    const tasksCollection = await getTasksCollection();
    
    // Try to find by UUID field first, then by _id if UUID field doesn't exist
    let task = await tasksCollection.findOne({ uuid: uuid });
    if (!task) {
      // Try searching by _id as ObjectId for MongoDB
      try {
        task = await tasksCollection.findOne({ _id: new ObjectId(uuid) });
      } catch {
        // If ObjectId conversion fails, search by task_uuid or other identifier fields
        task = await tasksCollection.findOne({ 
          $or: [
            { task_uuid: uuid },
            { task_id: uuid }
          ]
        });
      }
    }
    
    if (!task) {
      console.log(`[API] No task found for UUID: ${uuid}`);
      return NextResponse.json(
        { error: 'Task not found' },
        { status: 404 }
      );
    }

    console.log(`[API] Successfully retrieved task data for UUID: ${uuid}`);
    
    // Now fetch the detailed payload metadata using the SHA256 hash
    const sha256 = task.file_sha256 || task.sha256;
    let payloadData = null;
    
    if (sha256) {
      console.log(`[API] Fetching payload metadata for SHA256: ${sha256}`);
      const payloadsCollection = await getPayloadsCollection();
      
      // Query payloads collection by SHA256
      payloadData = await payloadsCollection.findOne({ sha256: sha256 });
      
      if (payloadData) {
        console.log(`[API] Successfully retrieved payload metadata for SHA256: ${sha256}`);
      } else {
        console.log(`[API] No payload metadata found for SHA256: ${sha256}`);
      }
    } else {
      console.log(`[API] No SHA256 hash found in task data for UUID: ${uuid}`);
    }
    
    // Merge task data with payload metadata
    const combinedData = {
      ...task,
      ...(payloadData || {}),
      // Ensure task-specific fields take precedence
      uuid: task.uuid,
      task_status: task.task_status,
      time_sent: task.time_sent,
      time_sent_str: task.time_sent_str,
      time_updated: task.time_updated,
      time_updated_str: task.time_updated_str,
      file_sha256: task.file_sha256,
      amsi_result: task.amsi_result,
      defender_result: task.defender_result
    };
    
    console.log(`[API] Returning combined data for UUID: ${uuid}`);
    return NextResponse.json(combinedData);
  } catch (error) {
    console.error(`[API] Error fetching task data for UUID:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch task data' },
      { status: 500 }
    );
  }
} 