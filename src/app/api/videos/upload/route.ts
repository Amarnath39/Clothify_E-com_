import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../../../db';
import Video from '../../../../../model/video';
import { uploadFile } from '../../../../../helper/uploadFile';

function formatId(num: number): string {
  return num.toString().padStart(3, '0');
}

export async function POST(req: NextRequest) {
  await connectDB();

  const formData = await req.formData();
  const file = formData.get('video') as File;

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File exceeds 5MB limit' }, { status: 400 });
  }

  const ext = file.name.split('.').pop()?.toLowerCase();
  const allowed = ['mp4', 'webm', 'mov'];
  if (!ext || !allowed.includes(ext)) {
    return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
  }

  // ✅ Find the next available videoId (skip duplicates)
  let nextIdNum = 1;
  let exists = true;

  while (exists) {
    const existing = await Video.findOne({ videoId: formatId(nextIdNum) });
    if (!existing) {
      exists = false;
    } else {
      nextIdNum++;
    }
  }

  const nextId = formatId(nextIdNum);

  const newFilename = `${nextId}.${ext}`;
  const videoUrl = await uploadFile("server/video", file);
  
  // Save to DB
  await Video.create({
    videoId: nextId,
    filename: newFilename,
    url: videoUrl,
  });

  return NextResponse.json({
    message: 'Upload successful',
    videoId: nextId,
    url: videoUrl,
  });
}