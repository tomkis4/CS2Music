import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Song from '@/models/Song';

export async function POST(req) {
  await connectDB();
  const { source, mapName, title, artist, url, preview_url } = await req.json();

  let song = await Song.findOne({ source, mapName, url });
  if (!song) {
    song = new Song({ source, mapName, title, artist, url, preview_url, likes: 1 });
    await song.save();
  } else {
    song.likes += 1;
    await song.save();
  }

  return NextResponse.json({ success: true, song });
}
