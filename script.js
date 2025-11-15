// script.js (MODIFICADO para usar YouTube)

// ** CONFIGURACIÓN DEL BACKEND **
// script.js (Cambio al inicio)
const BACKEND_URL = 'http://127.0.0.1:3000/api/get-tracks'; 
const PREVIEW_DURATION = 15; // Reproduciremos solo 15 segundos del video

// Referencias a elementos del DOM
const artistInput = document.getElementById('artistInput');
const startGameButton = document.getElementById('startGameButton');
const gameSection = document.getElementById('game');
const setupSection = document.getElementById('setup');
const messageElement = document.getElementById('message');
const songGuessInput = document.getElementById('songGuess');
const submitGuessButton = document.getElementById('submitGuessButton');
const skipButton = document.getElementById('skipButton');
const feedbackElement = document.getElementById('feedback');
const scoreElement = document.getElementById('currentScore');

// Variables de estado del juego y del reproductor de YouTube
let availableTracks = [];
let currentTrack = null;
let currentScore = 0;
let trackIndex = 0;
let player; // Objeto del reproductor de YouTube
let timerInterval;

// --- Inicialización del Reproductor de YouTube ---
// Esta función es llamada automáticamente por el script de la API de YouTube
function onYouTubeIframeAPIReady() {
    // Inicializa un reproductor vacío que llenaremos después
    player = new YT.Player('youtubePlayer', {
        height: '300',
        width: '100%',
        playerVars: {
            'controls': 0, // Ocultar controles (para que el usuario no pueda saltar)
            'disablekb': 1, // Deshabilitar controles de teclado
            'rel': 0, // No mostrar videos relacionados
            'modestbranding': 1, // Branding mínimo
            'autoplay': 0
        },
        events: {
            // El evento onStateChange es crucial para controlar la reproducción
            'onStateChange': onPlayerStateChange
        }
    });
    // Habilitar el botón de inicio cuando el reproductor esté listo
    startGameButton.disabled = false;
    messageElement.textContent = '¡Servidor y reproductor listos! Escribe un artista.';
}

function onPlayerStateChange(event) {
    // Si el video empieza a reproducirse (Estado 1)
    if (event.data === YT.PlayerState.PLAYING) {
        // Establecer el temporizador para detener el video después de PREVIEW_DURATION segundos
        clearInterval(timerInterval);
        timerInterval = setTimeout(nextTrack, PREVIEW_DURATION * 1000);
    }
}

// --- Listeners de Eventos (sin cambios) ---
artistInput.addEventListener('input', () => {
    startGameButton.disabled = artistInput.value.trim() === '';
});

startGameButton.addEventListener('click', () => {
    const artistName = artistInput.value.trim();
    if (artistName) {
        fetchArtistTracks(artistName);
    }
});

submitGuessButton.addEventListener('click', checkGuess);
skipButton.addEventListener('click', nextTrack);

// --- Funciones del Juego ---

/**
 * Llama al servidor backend para obtener los IDs de video de YouTube.
 */
async function fetchArtistTracks(artistName) {
    messageElement.textContent = 'Buscando videos musicales en YouTube...';
    startGameButton.disabled = true;

    try {
        const apiResponse = await fetch(`${BACKEND_URL}/${encodeURIComponent(artistName)}`);
        
        const responseData = await apiResponse.json();

        if (!apiResponse.ok) {
            throw new Error(responseData.error || `Error: ${apiResponse.status}`);
        }
        
        const artist = responseData.artistName;
        availableTracks = responseData.tracks; // Ahora contiene IDs de video
        
        if (availableTracks.length < 5) { 
            messageElement.textContent = `Se encontraron solo ${availableTracks.length} videos para ${artist}. Intenta con un artista más popular o una búsqueda diferente.`;
            startGameButton.disabled = false;
            return;
        }

        availableTracks.sort(() => Math.random() - 0.5);

        messageElement.textContent = `¡Listo! Juego con ${availableTracks.length} videos de ${artist}.`;
        
        // Iniciar el juego
        setupSection.classList.add('hidden');
        gameSection.classList.remove('hidden');
        trackIndex = 0;
        currentScore = 0;
        scoreElement.textContent = currentScore;
        nextTrack();

    } catch (error) {
        console.error('Error:', error);
        messageElement.textContent = `Hubo un error al cargar las canciones. Asegúrate de que tu servidor backend esté corriendo y la clave de YouTube esté bien. (${error.message})`;
        startGameButton.disabled = false;
    }
}

/**
 * Carga y reproduce el siguiente fragmento de canción de YouTube.
 */
function nextTrack() {
    clearInterval(timerInterval); // Limpiar el temporizador anterior
    
    if (trackIndex >= availableTracks.length) {
        player.stopVideo();
        feedbackElement.innerHTML = `<h2>🎉 ¡Fin del Juego! Tu puntuación final es ${currentScore}.</h2>`;
        submitGuessButton.disabled = true;
        skipButton.disabled = true;
        songGuessInput.disabled = true;
        return;
    }
    
    currentTrack = availableTracks[trackIndex];
    trackIndex++;
    
    // Cargar y reproducir el nuevo video. 
    // Usaremos un tiempo de inicio aleatorio para evitar siempre el inicio de la canción.
    const randomStart = Math.floor(Math.random() * 60) + 10; // Inicio entre 10 y 70 segundos
    
    player.loadVideoById({
        videoId: currentTrack.videoId,
        startSeconds: randomStart,
        endSeconds: randomStart + PREVIEW_DURATION,
    });
    player.playVideo();
    
    songGuessInput.value = '';
    songGuessInput.focus();
    feedbackElement.textContent = `Adivina la Canción ${trackIndex} de ${availableTracks.length}...`;
    submitGuessButton.disabled = false;
    skipButton.disabled = false;
    songGuessInput.disabled = false;
}

/**
 * Compara la adivinanza del usuario con el nombre correcto.
 */
function checkGuess() {
    if (!currentTrack) return;
    
    // Normalizar la adivinanza y el título (eliminando paréntesis, guiones, etc.)
    const normalize = (text) => text.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
    
    const userGuess = normalize(songGuessInput.value);
    const correctName = normalize(currentTrack.name); 

    if (userGuess === correctName || correctName.includes(userGuess)) { // Hacemos la verificación más flexible
        currentScore += 10;
        scoreElement.textContent = currentScore;
        feedbackElement.textContent = `✅ ¡Correcto! La canción era "${currentTrack.name.toUpperCase()}". ¡+10 puntos!`;
        submitGuessButton.disabled = true;
        skipButton.disabled = true;
        songGuessInput.disabled = true;
        
        player.stopVideo();
        clearInterval(timerInterval);
        setTimeout(nextTrack, 3000); 
    } else {
        feedbackElement.textContent = '❌ Incorrecto. ¡Sigue intentándolo!';
        songGuessInput.value = '';
        songGuessInput.focus();
    }
}
