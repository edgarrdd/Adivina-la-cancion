// server.js — Backend para buscar canciones en Spotify
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 3000;

// ⚠️ Usa variables de entorno (.env)
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

// Permitir peticiones desde el frontend en 5500
app.use(cors({
    origin: ['http://127.0.0.1:5500', 'http://localhost:5500']
}));

// Obtener token de Spotify
async function getSpotifyToken() {
    const result = await axios.post(
        'https://accounts.spotify.com/api/token',
        'grant_type=client_credentials',
        {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
            }
        }
    );
    return result.data.access_token;
}

// Buscar canciones
app.get('/api/get-tracks/:artist', async (req, res) => {
    try {
        const artistName = req.params.artist;
        const token = await getSpotifyToken();

        const search = await axios.get(
            'https://api.spotify.com/v1/search',
            {
                headers: { 'Authorization': 'Bearer ' + token },
                params: {
                    q: `artist:${artistName}`,
                    type: 'track',
                    limit: 20
                }
            }
        );

        const items = search.data.tracks.items;

        const tracks = items
            .filter(t => t.preview_url)
            .map(t => ({
                name: t.name,
                preview: t.preview_url,
                artist: t.artists[0].name
            }));

        if (tracks.length === 0) {
            return res.status(404).json({ error: "No se encontraron canciones con preview." });
        }

        res.json({
            artistName,
            tracks
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Error consultando Spotify." });
    }
});

app.listen(PORT, () =>
    console.log(`Servidor backend ON en http://127.0.0.1:${PORT}`)
);
