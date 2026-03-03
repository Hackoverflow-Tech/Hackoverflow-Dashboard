import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Configuration
const CONFIG = {
  ADMIN_EMAIL: 'admin@hackoverflow.com',
  ADMIN_PASSWORD: 'vEtdod-rudxus',
  ADMIN_NAME: 'Admin User',
  DB_NAME: 'hackoverflow',
  USERS_COLLECTION: 'users',
  SALT_ROUNDS: 12,
} as const;

interface AdminUser {
  email: string;
  password: string;
  name: string;
  role: 'admin';
  createdAt: Date;
}

/**
 * Validates environment variables and returns MongoDB URI
 */
function getMongoDBURI(): string {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ MONGODB_URI not found in environment variables');
    console.log('');
    console.log('🔧 Setup Instructions:');
    console.log('   1. Create a .env.local file in the project root');
    console.log('   2. Add: MONGODB_URI=your_mongodb_connection_string');
    console.log('');
    console.log('💡 Example:');
    console.log('   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database');
    process.exit(1);
  }

  return uri;
}

/**
 * Masks sensitive information in MongoDB URI for logging
 */
function maskMongoURI(uri: string): string {
  return uri.replace(/:[^:]*@/, ':****@');
}

/**
 * Creates a new admin user with hashed password
 */
async function createAdminUser(client: MongoClient): Promise<void> {
  const db = client.db(CONFIG.DB_NAME);
  const usersCollection = db.collection<AdminUser>(CONFIG.USERS_COLLECTION);

  // Check if admin already exists
  console.log('🔍 Checking for existing admin user...');
  const existingAdmin = await usersCollection.findOne({
    email: CONFIG.ADMIN_EMAIL
  });

  if (existingAdmin) {
    console.log('ℹ️  Admin user already exists');
    console.log('');
    console.log('🔑 Login Credentials:');
    console.log(`   📧 Email: ${CONFIG.ADMIN_EMAIL}`);
    console.log(`   🔒 Password: ${CONFIG.ADMIN_PASSWORD}`);
    console.log('');
    console.log('⚠️  Password is shown for development purposes only!');
    return;
  }

  // Hash password with higher salt rounds for security
  console.log('🔐 Generating secure password hash...');
  const hashedPassword = await bcrypt.hash(CONFIG.ADMIN_PASSWORD, CONFIG.SALT_ROUNDS);

  // Create admin user
  console.log('👤 Creating admin user...');
  const adminUser: AdminUser = {
    email: CONFIG.ADMIN_EMAIL,
    password: hashedPassword,
    name: CONFIG.ADMIN_NAME,
    role: 'admin',
    createdAt: new Date()
  };

  const result = await usersCollection.insertOne(adminUser);

  console.log('✅ Admin user created successfully!');
  console.log(`   🆔 User ID: ${result.insertedId}`);
  console.log(`   📅 Created: ${adminUser.createdAt.toLocaleString()}`);
  console.log('');
  console.log('🔑 Login Credentials:');
  console.log(`   📧 Email: ${CONFIG.ADMIN_EMAIL}`);
  console.log(`   🔒 Password: ${CONFIG.ADMIN_PASSWORD}`);
  console.log('');
  console.log('🔒 Security Recommendations:');
  console.log('   • Change this password immediately in production');
  console.log('   • Use environment variables for sensitive data');
  console.log('   • Enable MFA if available');
}

/**
 * Main function to create admin user
 */
async function main(): Promise<void> {
  let client: MongoClient | undefined;

  try {
    const mongoURI = getMongoDBURI();

    console.log('🚀 HackOverflow Admin User Setup');
    console.log('=====================================');
    console.log('');
    console.log('🔗 Connecting to MongoDB...');
    console.log(`   📍 URI: ${maskMongoURI(mongoURI)}`);
    console.log(`   🗄️  Database: ${CONFIG.DB_NAME}`);

    client = new MongoClient(mongoURI);
    await client.connect();

    // Test connection
    await client.db(CONFIG.DB_NAME).command({ ping: 1 });
    console.log('✅ Successfully connected to MongoDB');
    console.log('');

    await createAdminUser(client);

  } catch (error) {
    console.error('');
    console.error('❌ Error during admin user creation:');

    if (error instanceof Error) {
      console.error(`   💥 ${error.message}`);

      // Provide helpful error messages for common issues
      if (error.message.includes('ENOTFOUND') || error.message.includes('ETIMEDOUT')) {
        console.error('');
        console.error('🌐 Network Error - Check your internet connection and MongoDB URI');
      } else if (error.message.includes('authentication failed')) {
        console.error('');
        console.error('🔑 Authentication Error - Check your MongoDB credentials');
      } else if (error.message.includes('E11000')) {
        console.error('');
        console.error('🔄 Duplicate Error - Admin user may already exist');
      }
    } else {
      console.error(`   💥 Unknown error: ${error}`);
    }

    process.exit(1);
  } finally {
    if (client) {
      console.log('');
      console.log('🔌 Closing database connection...');
      await client.close();
      console.log('✅ Connection closed');
    }
  }
}

// Execute the script
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
}