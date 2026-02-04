import { NextResponse } from 'next/server';
export const dynamic = "force-dynamic";
import { connectDB } from '../../../../../db';
import Video from '../../../../model/video';

export async function GET() {
  await connectDB();

  try {
    const videos = await Video.find().sort({ videoId: 1 }); // sort by ID ascending
    return NextResponse.json({ videos });
  } catch (error) {
    console.error('Failed to fetch videos:', error);
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
  }
}
