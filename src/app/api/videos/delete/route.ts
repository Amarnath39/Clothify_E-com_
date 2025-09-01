import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { connectDB } from '../../../../../db';
import Video from '../../../../../model/video';

export async function DELETE(req: NextRequest) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get('videoId');

  if (!videoId) {
    return NextResponse.json({ error: 'videoId is required' }, { status: 400 });
  }

  try {
    // 1. Find the video by videoId
    const video = await Video.findOne({ videoId });

    if (!video) {
      return NextResponse.json({ error: 'Video not found in database' }, { status: 404 });
    }

    // 2. Delete the video file
    const filePath = path.join(process.cwd(), 'public/uploads', video.filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // 3. Delete the document from DB
    await Video.deleteOne({ videoId });

    return NextResponse.json({ message: 'Video deleted successfully' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error deleting video' }, { status: 500 });
  }
}
