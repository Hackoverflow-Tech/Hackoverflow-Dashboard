'use server';

import clientPromise from '@/lib/mongodb';
import { DBSponsor } from '@/types';
import { ObjectId, WithId, Document } from 'mongodb';

const DB_NAME = 'hackoverflow';
const COLLECTION_NAME = 'sponsors';

/**
 * MongoDB document type for sponsors
 */
type SponsorDocument = Omit<DBSponsor, '_id'> & {
  _id?: ObjectId;
};

/**
 * Get database collection
 */
async function getCollection() {
  const client = await clientPromise;
  const db = client.db(DB_NAME);
  return db.collection<SponsorDocument>(COLLECTION_NAME);
}

/**
 * Get all sponsors from database
 */
export async function getSponsors(): Promise<DBSponsor[]> {
  try {
    const collection = await getCollection();
    const sponsors = await collection
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    
    return sponsors.map(s => ({
      ...s,
      _id: s._id?.toString(),
    } as DBSponsor));
  } catch (error) {
    console.error('Error fetching sponsors:', error);
    throw new Error('Failed to fetch sponsors');
  }
}

/**
 * Get a single sponsor by ID
 */
export async function getSponsorById(id: string): Promise<DBSponsor | null> {
  try {
    const collection = await getCollection();
    const sponsor = await collection.findOne({ _id: new ObjectId(id) });
    
    if (!sponsor) return null;
    
    return {
      ...sponsor,
      _id: sponsor._id?.toString(),
    } as DBSponsor;
  } catch (error) {
    console.error('Error fetching sponsor:', error);
    return null;
  }
}

/**
 * Create multiple sponsors from CSV upload
 */
export async function createSponsors(
  sponsors: Omit<DBSponsor, '_id' | 'createdAt' | 'updatedAt'>[]
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const collection = await getCollection();
    
    const sponsorsWithTimestamps = sponsors.map(s => ({
      ...s,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    
    const result = await collection.insertMany(sponsorsWithTimestamps);
    
    return {
      success: true,
      count: result.insertedCount,
    };
  } catch (error) {
    console.error('Error creating sponsors:', error);
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : 'Failed to create sponsors',
    };
  }
}

/**
 * Update a sponsor
 */
export async function updateSponsor(
  id: string,
  updates: Partial<Omit<DBSponsor, '_id' | 'createdAt'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    const collection = await getCollection();
    
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ...updates,
          updatedAt: new Date(),
        },
      }
    );
    
    if (result.matchedCount === 0) {
      return { success: false, error: 'Sponsor not found' };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating sponsor:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update sponsor',
    };
  }
}

/**
 * Delete a sponsor
 */
export async function deleteSponsor(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const collection = await getCollection();
    
    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return { success: false, error: 'Sponsor not found' };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting sponsor:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete sponsor',
    };
  }
}

/**
 * Delete all sponsors (use with caution)
 */
export async function deleteAllSponsors(): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const collection = await getCollection();
    const result = await collection.deleteMany({});
    
    return {
      success: true,
      count: result.deletedCount,
    };
  } catch (error) {
    console.error('Error deleting all sponsors:', error);
    return {
      success: false,
      count: 0,
      error: error instanceof Error ? error.message : 'Failed to delete sponsors',
    };
  }
}