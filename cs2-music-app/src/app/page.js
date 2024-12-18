"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './home.module.css';

export default function HomePage() {
  const [source, setSource] = useState('youtube');
  const [mapName, setMapName] = useState('Dust2');
  const router = useRouter();

  const handleStart = () => {
    router.push(`/player?source=${source}&mapName=${mapName}`);
  }

  return (
    <div className={styles.container}>
      <div className={styles.contentWrapper}>
        <h1 className={styles.title}>CS2 Music App</h1>
        <div className={styles.selectors}>
          <label>Choose a music source:</label>
          <select className="border p-2 mb-4" value={source} onChange={e => setSource(e.target.value)}>
            <option value="youtube">YouTube</option>
            <option value="spotify">Spotify</option>
            <option value="jamendo">Jamendo</option>
          </select>

          <label>Choose a map:</label>
          <select className="border p-2 mb-4" value={mapName} onChange={e => setMapName(e.target.value)}>
            <option value="Dust2">Dust2</option>
            <option value="Inferno">Inferno</option>
            <option value="Mirage">Mirage</option>
            <option value="Nuke">Nuke</option>
            <option value="Overpass">Overpass</option>
            <option value="Vertigo">Vertigo</option>
            <option value="Ancient">Ancient</option>
            <option value="Office">Office</option>
            <option value="Italy">Italy</option>
            <option value="Palais">Palais</option>
            <option value="Whistle">Whistle</option>
            <option value="Anubis">Anubis</option>
          </select>

          <button className={styles.button} onClick={handleStart}>
            Start
          </button>
        </div>
      </div>
    </div>
  );
}
