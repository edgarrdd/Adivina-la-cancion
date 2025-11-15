// server.js — Backend para buscar canciones en Spotify (listo para Render)
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Variables obligatorias en Render
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'https://edgarrdd.github.io';

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('ERROR: CLIENT_ID o CLIENT_SECRET no están definidos en las variables de entorno.');
  process.exit(1);
}

// Permitir peticiones desde tu GitHub Pages (y localhost para pruebas)
app.use(cors({
  origin: [FRONTEND_ORIGIN, 'http://127.0.0.1:5500', 'http://localhost:5500']
}));

// Simple logging para depuración
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - from: ${req.headers.origin}`);
  next();
});

// Cache simple para el token de Spotify
let spotifyToken = null;
let tokenExpiresAt = 0;

async function getSpotifyToken() {
  const now = Date.now();
  if (spotifyToken && now < tokenExpiresAt - 5000) { // 5s margen
    return spotifyToken;
  }

  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');

  const resp = await axios.post(
    'https://accounts.spotify.com/api/token',
    params.toString(),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
      },
      timeout: 10000
    }
  );

  spotifyToken = resp.data.access_token;
  const expiresIn = resp.data.expires_in || 3600;
  tokenExpiresAt = Date.now() + expiresIn * 1000;
  return spotifyToken;
}

app.get('/api/get-tracks/:artist', async (req, res) => {
  try {
    const artistName = req.params.artist;
    if (!artistName || artistName.trim().length === 0) {
      return res.status(400).json({ error: 'Nombre de artista requerido.' });
    }

    const token = await getSpotifyToken();

    const search = await axios.get(
      'https://api.spotify.com/v1/search',
      {
        headers: { 'Authorization': 'Bearer ' + token },
        params: {
          q: `artist:${artistName}`,
          type: 'track',
          limit: 20
        },
        timeout: 10000
      }
    );

    const items = search.data.tracks.items || [];

    const tracks = items
      .filter(t => t.preview_url)
      .map(t => ({
        name: t.name,
        preview: t.preview_url,
        artist: t.artists && t.artists[0] ? t.artists[0].name : 'Unknown'
      }));

    if (tracks.length === 0) {
      return res.status(404).json({ error: 'No se encontraron canciones con preview.' });
    }

    res.json({ artistName, tracks });
  } catch (err) {
    console.error('Error en /api/get-tracks:', err.message || err);
    // Si Spotify responde con detalle, propágalo ligeramente para debugging
    const status = err.response && err.response.status ? err.response.status : 500;
    const message = err.response && err.response.data ? err.response.data : 'Error consultando Spotify.';
    res.status(status).json({ error: message });
  }
});

app.get('/', (req, res) => {
  res.send('Servidor Spotify API — funcionando');
});

app.listen(PORT, () => {
  console.log(`Servidor backend ON en http://0.0.0.0:${PORT}`);
});

