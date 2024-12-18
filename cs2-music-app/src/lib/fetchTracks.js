let cachedYouTubeTokens = {};

async function fetchYouTubePage(query, pageToken) {
  // Wyszukiwanie w kategorii muzyka (videoCategoryId=10)
  let url = `https://youtube.googleapis.com/youtube/v3/search?part=snippet&q=${query}&type=video&maxResults=50&videoCategoryId=10&key=${process.env.YOUTUBE_API_KEY}`;
  if (pageToken) {
    url += `&pageToken=${pageToken}`;
  }

  const ytResp = await fetch(url);
  if (!ytResp.ok) {
    console.error("YouTube API error (search):", ytResp.status, await ytResp.text());
    return { items: [], nextPageToken: null };
  }
  const ytData = await ytResp.json();
  return {
    items: ytData.items || [],
    nextPageToken: ytData.nextPageToken || null
  };
}

async function fetchYouTubeVideoDetails(videoIds) {
  // Drugie zapytanie, aby sprawdzić categoryId = 10 (muzyka)
  const ids = videoIds.join(',');
  const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${ids}&key=${process.env.YOUTUBE_API_KEY}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    console.error("YouTube API error (videos.list):", resp.status, await resp.text());
    return [];
  }
  const data = await resp.json();
  return data.items || [];
}

export async function getSpotifyTracks(mapName) {
  try {
    const tokenResp = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    if (!tokenResp.ok) {
      console.error("Spotify token request failed:", tokenResp.status, await tokenResp.text());
      return [];
    }

    const tokenData = await tokenResp.json();
    const token = tokenData.access_token;
    if (!token) {
      console.error("No Spotify token received");
      return [];
    }

    const q = encodeURIComponent(`${mapName} music`);
    const spotifyResp = await fetch(`https://api.spotify.com/v1/search?q=${q}&type=track&limit=50`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!spotifyResp.ok) {
      const errText = await spotifyResp.text();
      console.error("Spotify search failed:", spotifyResp.status, errText);
      return [];
    }

    const spotifyData = await spotifyResp.json();
    if (!spotifyData.tracks || !spotifyData.tracks.items) {
      console.error("Spotify data incomplete:", spotifyData);
      return [];
    }

    const tracks = spotifyData.tracks.items.map((item) => {
      const trackId = item.id;
      const url = `https://open.spotify.com/track/${trackId}`;
      return {
        title: item.name,
        artist: item.artists[0]?.name || '',
        url: url,
        preview_url: null
      };
    });

    return tracks;
  } catch (err) {
    console.error("Error in getSpotifyTracks:", err);
    return [];
  }
}

export async function getYouTubeVideos(mapName, page=1) {
  try {
    const q = encodeURIComponent(`${mapName} music`);
    let pageToken = null;
    if (page > 1 && cachedYouTubeTokens[mapName]) {
      pageToken = cachedYouTubeTokens[mapName].nextPageToken || null;
    }

    const { items, nextPageToken } = await fetchYouTubePage(q, pageToken);

    if (!items.length) {
      console.error("YouTube data no items for page:", page);
      return [];
    }

    if (nextPageToken) {
      cachedYouTubeTokens[mapName] = { nextPageToken };
    }

    // Wyciągamy ID wideo, aby szczegółowo sprawdzić kategorie
    const videoIds = items.map(item => item.id.videoId).filter(Boolean);
    if (!videoIds.length) return [];

    const videoDetails = await fetchYouTubeVideoDetails(videoIds);

    // Filtrowanie tylko categoryId=10 (Music)
    const musicVideos = videoDetails.filter(v => v.snippet?.categoryId === "10");

    const videos = musicVideos.map(video => ({
      title: video.snippet.title,
      artist: video.snippet.channelTitle,
      url: `https://www.youtube.com/watch?v=${video.id}`,
      preview_url: null
    }));

    return videos;
  } catch (err) {
    console.error("Error in getYouTubeVideos:", err);
    return [];
  }
}

export async function getJamendoTracks(mapName, page=1) {
  try {
    const offset = (page - 1) * 50;
    const q = encodeURIComponent(`${mapName} music`);
    const jamendoResp = await fetch(`https://api.jamendo.com/v3.0/tracks/?client_id=${process.env.JAMENDO_CLIENT_ID}&format=json&limit=50&offset=${offset}&search=${q}`);
    if (!jamendoResp.ok) {
      console.error("Jamendo API error:", jamendoResp.status, await jamendoResp.text());
      return [];
    }
    const jamendoData = await jamendoResp.json();
    if (!jamendoData.results) {
      console.error("Jamendo data no results:", jamendoData);
      return [];
    }

    const tracks = jamendoData.results.map((track) => ({
      title: track.name,
      artist: track.artist_name,
      url: track.audio,
      preview_url: track.audio
    }));

    return tracks;
  } catch (err) {
    console.error("Error in getJamendoTracks:", err);
    return [];
  }
}
