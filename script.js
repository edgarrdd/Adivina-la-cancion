// script.js
// REEMPLAZA la URL por la de tu backend desplegado en Render
const BACKEND_URL = 'https://TU_BACKEND.onrender.com/api/get-tracks';

const PREVIEW_DURATION = 15;

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

let availableTracks = [];
let currentTrack = null;
let currentScore = 0;
let trackIndex = 0;

const audioPlayer = document.getElementById("audioPlayer");

async function fetchArtistTracks(artistName) {
    messageElement.textContent = "Buscando canciones en Spotify...";
    startGameButton.disabled = true;

    try {
        const res = await fetch(`${BACKEND_URL}/${encodeURIComponent(artistName)}`);
        const data = await res.json();

        if (!res.ok) {
            messageElement.textContent = data.error || 'Error del servidor.';
            startGameButton.disabled = false;
            return;
        }

        availableTracks = data.tracks;

        if (!availableTracks || availableTracks.length < 1) {
            messageElement.textContent = "No hay canciones con preview para este artista.";
            startGameButton.disabled = false;
            return;
        }

        availableTracks.sort(() => Math.random() - 0.5);

        setupSection.classList.add('hidden');
        gameSection.classList.remove('hidden');

        currentScore = 0;
        trackIndex = 0;
        scoreElement.textContent = currentScore;
        nextTrack();

    } catch (err) {
        console.error(err);
        messageElement.textContent = "Error conectando al servidor.";
        startGameButton.disabled = false;
    }
}

function nextTrack() {
    if (trackIndex >= availableTracks.length) {
        audioPlayer.pause();
        feedbackElement.innerHTML = `<h2>🎉 Fin del juego — Puntos: ${currentScore}</h2>`;
        return;
    }

    currentTrack = availableTracks[trackIndex];
    trackIndex++;

    audioPlayer.src = currentTrack.preview;
    audioPlayer.currentTime = 0;
    audioPlayer.play();

    setTimeout(() => audioPlayer.pause(), PREVIEW_DURATION * 1000);

    feedbackElement.textContent = `🎧 Canción ${trackIndex}/${availableTracks.length}`;
}

function checkGuess() {
    if (!currentTrack) return;
    const normalize = t => t.toLowerCase().replace(/[^\w\s]/g, '').trim();
    const guess = normalize(songGuessInput.value || '');
    const correct = normalize(currentTrack.name || '');

    if (!guess) {
        feedbackElement.textContent = 'Introduce una respuesta.';
        return;
    }

    if (guess === correct || correct.includes(guess)) {
        currentScore += 10;
        scoreElement.textContent = currentScore;
        feedbackElement.textContent = `✔ Correcto: ${currentTrack.name}`;
        songGuessInput.value = '';
        setTimeout(nextTrack, 1500);
    } else {
        feedbackElement.textContent = `❌ Incorrecto. Sigue intentando.`;
    }
}

startGameButton.onclick = () => {
    const artist = artistInput.value.trim();
    if (!artist) {
        messageElement.textContent = 'Introduce el nombre del artista.';
        return;
    }
    fetchArtistTracks(artist);
};
submitGuessButton.onclick = checkGuess;
skipButton.onclick = nextTrack;
