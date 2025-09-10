import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { connectDB } from '../../../../../db';
import Video from '../../../../../model/video';

const uploadDir = path.join(process.cwd(), 'public/uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

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
  const filePath = path.join(uploadDir, newFilename);
  const buffer = Buffer.from(await file.arrayBuffer());

  fs.writeFileSync(filePath, buffer);

  const videoUrl = `/uploads/${newFilename}`;

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
