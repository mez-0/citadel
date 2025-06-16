import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
const dbName = 'citadel';

let client: MongoClient;
let db: Db;

export async function connectToDatabase() {
  try {
    if (!client) {
      console.log('[MongoDB] Establishing new connection to:', uri);
      client = new MongoClient(uri);
      await client.connect();
      console.log('[MongoDB] Successfully connected to MongoDB');
    } else {
      console.log('[MongoDB] Reusing existing connection');
    }
    
    if (!db) {
      console.log(`[MongoDB] Connecting to database: ${dbName}`);
      db = client.db(dbName);
      console.log(`[MongoDB] Successfully connected to database: ${dbName}`);
    } else {
      console.log(`[MongoDB] Reusing existing database connection: ${dbName}`);
    }
    
    return { client, db };
  } catch (error) {
    console.error('[MongoDB] Connection failed:', error);
    throw error;
  }
}

export async function getTasksCollection() {
  try {
    console.log('[MongoDB] Getting tasks collection');
    const { db } = await connectToDatabase();
    const collection = db.collection('tasks');
    console.log('[MongoDB] Successfully retrieved tasks collection');
    return collection;
  } catch (error) {
    console.error('[MongoDB] Failed to get tasks collection:', error);
    throw error;
  }
}

export async function getPayloadsCollection() {
  try {
    console.log('[MongoDB] Getting payloads collection');
    const { db } = await connectToDatabase();
    const collection = db.collection('payloads');
    console.log('[MongoDB] Successfully retrieved payloads collection');
    return collection;
  } catch (error) {
    console.error('[MongoDB] Failed to get payloads collection:', error);
    throw error;
  }
} 