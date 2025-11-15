// server.js (MODIFICADO para usar la API de YouTube)

// Importación de librerías
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 3000;

// ⚠️ PEGA TU CLAVE DE API DE YOUTUBE AQUÍ
const YOUTUBE_API_KEY = 'AIzaSyBdEA3R2kxBWnLD0B0F6819vEkAUfFwExY'; 

// URL de la API de YouTube Search
const YOUTUBE_SEARCH_URL = 'http://googleusercontent.com/youtube/v3/search'; 

// Configuración de CORS
app.use(cors({
    origin: 'http://127.0.0.1:5500' 
}));

// --- Ruta para buscar y obtener las canciones del artista ---
app.get('/api/get-tracks/:artistName', async (req, res) => {
    const artistName = req.params.artistName;
    
    // ⚠️ Verifica la clave de API
    if (YOUTUBE_API_KEY === 'TU_CLAVE_DE_API_DE_YOUTUBE_AQUI' || !YOUTUBE_API_KEY) {
        return res.status(500).json({ error: '❌ ERROR: La clave de API de YouTube no está configurada en server.js.' });
    }

    try {
        // 1. Buscar videos musicales populares del artista en YouTube
        const searchQuery = `${artistName} Official Music Video`;
        
        const searchRes = await axios.get(YOUTUBE_SEARCH_URL, {
            params: {
                part: 'snippet',
                q: searchQuery,
                type: 'video',
                maxResults: 20, // Queremos 20 videos para el juego
                key: YOUTUBE_API_KEY 
            }
        });
        
        const youtubeItems = searchRes.data.items;
        
        if (!youtubeItems || youtubeItems.length === 0) {
            return res.status(404).json({ error: `No se encontraron videos musicales para "${artistName}" en YouTube.` });
        }
        
        // 2. Filtrar y enviar solo la información necesaria (Título y Video ID)
        const tracks = youtubeItems
            .map(item => ({
                id: item.id.videoId, // El ID del video de YouTube es nuestro 'preview'
                name: item.snippet.title.replace(/\s*\(official music video\s*\)|\s*\[.*\]|\s*\(lyrics\)/gi, '').trim(), // Limpiamos el título
                videoId: item.id.videoId // Usamos el ID como nuestra URL de preview
            }));

        res.json({ 
            artistName: artistName,
            tracks: tracks 
        });

    } catch (error) {
        console.error('❌ ERROR CRÍTICO al consultar la API de YouTube:', error.message);
        if (error.response && error.response.status === 403) {
            console.error('POSIBLE CAUSA: La clave de API es inválida o la API de YouTube Data v3 no está habilitada.');
        }
        res.status(500).json({ error: 'Error interno del servidor al consultar la API de YouTube.' });
    }
});


// server.js (Cambio al final)

const HOST = '127.0.0.1'; // Usamos la IP local en lugar de localhost
// ...

// Iniciar el servidor
app.listen(PORT, HOST, () => {
    console.log(`🚀 Servidor backend (YouTube) corriendo en http://${HOST}:${PORT}`);
    console.log(`✅ ¡Listo para jugar!`);
});
