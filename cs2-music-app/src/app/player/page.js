"use client";
import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import styles from './player.module.css';

function formatMapName(mapName) {
  return mapName;
}

function getMapBackground(mapName) {
  const lowerName = mapName.toLowerCase();
  return `/maps/${lowerName}.jpg`;
}

function getHeaderColorClass(source) {
  if (source === 'youtube') return styles.headerYoutube;
  if (source === 'spotify') return styles.headerSpotify;
  if (source === 'jamendo') return styles.headerJamendo;
  return '';
}

function getSongBoxColorClass(source) {
  if (source === 'youtube') return styles.songBoxYoutube;
  if (source === 'spotify') return styles.songBoxSpotify;
  if (source === 'jamendo') return styles.songBoxJamendo;
  return '';
}

function getButtonColorClasses(source, buttonType) {
  let baseClass = '';
  if (buttonType === 'like') {
    baseClass = styles.likeButton;
  } else {
    baseClass = styles.nextButton;
  }
  
  if (source === 'youtube') {
    return `${baseClass} ${buttonType === 'like' ? styles.likeButtonYoutube : styles.nextButtonYoutube}`;
  } else if (source === 'spotify') {
    return `${baseClass} ${buttonType === 'like' ? styles.likeButtonSpotify : styles.nextButtonSpotify}`;
  } else if (source === 'jamendo') {
    return `${baseClass} ${buttonType === 'like' ? styles.likeButtonJamendo : styles.nextButtonJamendo}`;
  }
  return baseClass;
}

export default function PlayerPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const source = searchParams.get('source') || 'youtube';
  const mapName = searchParams.get('mapName') || 'Dust2';
  const page = Number(searchParams.get('page')) || 1;

  const [songs, setSongs] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const playerRef = useRef(null);
  const [ytPlayer, setYtPlayer] = useState(null);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  const currentSong = songs[currentIndex];

  const nextSong = () => {
    if (songs.length > 0) {
      const nextIndex = currentIndex + 1;
      if (nextIndex < songs.length) {
        setCurrentIndex(nextIndex);
      } else {
        const nextPage = page + 1;
        router.replace(`/player?source=${source}&mapName=${mapName}&page=${nextPage}`);
      }
    }
  }

  const likeSong = async () => {
    if (!currentSong) return;
    await fetch('/api/like', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(currentSong)
    });
    alert('Song liked!');
  }

  useEffect(() => {
    const fetchSongs = async () => {
      const res = await fetch('/api/songs', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ source, mapName, page })
      });

      if (!res.ok) {
        console.error("Error from /api/songs:", res.status, await res.text());
        setSongs([]);
        setCurrentIndex(0);
        return;
      }

      let data = [];
      try {
        data = await res.json();
      } catch (e) {
        console.error("Error parsing JSON from /api/songs:", e);
        data = [];
      }

      setSongs(data);
      setCurrentIndex(0);
    };
    fetchSongs();
  }, [source, mapName, page]);

  useEffect(() => {
    const scriptId = 'youtube-iframe-api';
    if (!document.getElementById(scriptId)) {
      const tag = document.createElement('script');
      tag.id = scriptId;
      tag.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(tag);
    }

    window.onYouTubeIframeAPIReady = () => {
      // API ready
    };
  }, []);

  useEffect(() => {
    if (source !== 'youtube' || !currentSong) return;
    if (typeof window.YT === 'undefined' || typeof YT.Player === 'undefined') {
      return; 
    }

    const videoId = currentSong.url?.split('v=')[1];

    if (!ytPlayer && playerRef.current) {
      const newPlayer = new YT.Player(playerRef.current, {
        height: '315',
        width: '560',
        videoId: videoId,
        events: {
          'onReady': (event) => {
            setIsPlayerReady(true);
            event.target.playVideo();
          },
          'onStateChange': (event) => {
            if (event.data === YT.PlayerState.ENDED) {
              nextSong();
            }
          }
        }
      });
      setYtPlayer(newPlayer);
    } else if (ytPlayer && isPlayerReady && videoId) {
      ytPlayer.loadVideoById(videoId);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSong, source, isPlayerReady]);

  let content = null;
  if (currentSong) {
    if (source === 'youtube') {
      content = <div ref={playerRef}></div>;
    } else if (source === 'spotify') {
      const trackId = currentSong.url?.split('track/')[1]?.split('?')[0];
      if (trackId) {
        content = (
          <iframe 
            src={`https://open.spotify.com/embed/track/${trackId}`} 
            width="300" 
            height="380" 
            frameBorder="0" 
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy">
          </iframe>
        );
      } else {
        content = (
          <p className="text-white">No valid track link. <a href={currentSong.url} target="_blank" rel="noreferrer" className="text-blue-300 underline">Open in Spotify</a></p>
        );
      }
    } else if (source === 'jamendo') {
      content = (
        <audio 
          controls 
          src={currentSong.preview_url} 
          onEnded={nextSong} 
          autoPlay
        ></audio>
      );
    }
  }

  const bgUrl = getMapBackground(mapName);
  const headerColorClass = getHeaderColorClass(source);
  const songBoxColorClass = getSongBoxColorClass(source);

  const likeButtonClass = getButtonColorClasses(source, 'like');
  const nextButtonClass = getButtonColorClasses(source, 'next');

  return (
    <div 
      className="min-h-screen bg-cover bg-center bg-no-repeat flex flex-col" 
      style={{ backgroundImage: `url(${bgUrl})` }}
    >
      {/* Header */}
      <div className={`${styles.header} ${headerColorClass}`}>
        <div className="flex items-center space-x-4">
          <div className={styles.mapName}>{formatMapName(mapName)}</div>
          <div className={styles.source}>Source: {source}</div>
        </div>
        <button 
          className={styles.homeButton}
          onClick={() => router.push('/')}
        >
          Home
        </button>
      </div>

      {/* Player center */}
      <div className="flex-grow flex items-center justify-center p-4">
        {currentSong ? (
          <div className={styles.playerBox}>
            <div className={`${styles.songBox} ${songBoxColorClass}`}>
              <h2 className="text-2xl mb-2 font-semibold">{currentSong.title || "Unknown title"}</h2>
              <p>{currentSong.artist || "Unknown artist"}</p>
            </div>
            {content && <div className="my-4">{content}</div>}
            <div className={styles.buttonsContainer}>
              <button className={likeButtonClass} onClick={likeSong}>Like</button>
              <button className={nextButtonClass} onClick={nextSong}>Next Song</button>
            </div>
          </div>
        ) : (
          <p className={styles.loadingMessage}>Loading tracks...</p>
        )}
      </div>
    </div>
  );
}
