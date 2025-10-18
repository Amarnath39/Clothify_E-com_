import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../../db';
import Video from '../../../../model/video';
import { deleteFile } from '../../../../helper/deleteFile';

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

    // 2. Delete the video file from the filesystem
    const status = await deleteFile(video.url);

    // Check if file deletion was successful
    if (!status) {
      throw new Error('Failed to delete video file from filesystem');
    }

    // 3. Delete the document from DB
    await Video.deleteOne({ videoId });

    return NextResponse.json({ message: 'Video deleted successfully' });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: 'Error deleting video' }, { status: 500 });
  }
}