import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Song from '@/models/Song';
import { getSpotifyTracks, getYouTubeVideos, getJamendoTracks } from '@/lib/fetchTracks';

export async function POST(req) {
  try {
    const { source, mapName, page } = await req.json();
    const currentPage = page || 1;

    await connectDB();

    const likedSongs = await Song.find({ source, mapName }).sort({ likes: -1 }).limit(10);

    let songsNeeded = 50 - likedSongs.length;
    if (songsNeeded < 0) songsNeeded = 0;

    let fetched = [];
    if (songsNeeded > 0) {
      if (source === 'spotify') {
        fetched = await getSpotifyTracks(mapName);
      } else if (source === 'youtube') {
        fetched = await getYouTubeVideos(mapName, currentPage);
      } else if (source === 'jamendo') {
        fetched = await getJamendoTracks(mapName, currentPage);
      }
    }

    const newSongs = fetched.slice(0, songsNeeded).map(song => ({
      ...song,
      source,
      mapName
    }));

    const combinedList = [
      ...likedSongs.map(s => ({
        title: s.title,
        artist: s.artist,
        url: s.url,
        preview_url: s.preview_url || null,
        source: s.source,
        mapName: s.mapName,
        likes: s.likes
      })),
      ...newSongs
    ];

    const seen = new Set();
    const uniqueFinalList = [];
    for (const track of combinedList) {
      if (!seen.has(track.url)) {
        seen.add(track.url);
        uniqueFinalList.push(track);
      }
    }

    return NextResponse.json(uniqueFinalList);
  } catch (error) {
    console.error("Error in POST /api/songs:", error);
    return NextResponse.json([], { status: 500 });
  }
}
