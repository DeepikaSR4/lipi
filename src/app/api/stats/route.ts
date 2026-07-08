import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

// Cache this API response for 5 minutes (300 seconds)
export const revalidate = 300;

export async function GET() {
  try {
    const adminDb = getAdminDb();
    
    // If initialization failed (e.g., missing env vars during Vercel build), return safe fallback
    if (!adminDb) {
      return NextResponse.json({ fontCount: 0 });
    }

    const docRef = adminDb.collection('stats').doc('global');
    const docSnap = await docRef.get();
    
    if (docSnap.exists) {
      const data = docSnap.data();
      return NextResponse.json({ fontCount: data?.fontCount || 0 });
    }
    
    return NextResponse.json({ fontCount: 0 });
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json({ fontCount: 0 }, { status: 500 });
  }
}
