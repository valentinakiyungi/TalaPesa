import { NextResponse } from 'next/server';

export async function GET() {
  // Temporarily disabled - no Admin SDK key available
  // When you get the key, uncomment the code below
  return NextResponse.json({
    users: [],
    message: 'User listing disabled (service account key restricted). Contact admin.'
  }, { status: 200 });
}

// Original code (commented out for now)
/*
import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
  });
}

export async function GET() {
  try {
    const listUsersResult = await admin.auth().listUsers(1000);
    const users = listUsersResult.users.map(userRecord => ({
      uid: userRecord.uid,
      email: userRecord.email,
      createdAt: userRecord.metadata.creationTime,
    }));
    return NextResponse.json({ users });
  } catch (error) {
    console.error('Error listing users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
*/