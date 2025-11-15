const BACKEND_URL = 'https://spotify-backend-8i9z.onrender.com/api/get-tracks';
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
        const res = await fetch(`${BACKEND_URL}/${artistName}`);
        const data = await res.json();

        if (!res.ok) {
            messageElement.textContent = data.error;
            startGameButton.disabled = false;
            return;
        }

        availableTracks = data.tracks;

        if (availableTracks.length < 5) {
            messageElement.textContent = "Pocas canciones con preview.";
            startGameButton.disabled = false;
            return;
        }

        availableTracks.sort(() => Math.random() - 0.5);

        setupSection.classList.add('hidden');
        gameSection.classList.remove('hidden');

        currentScore = 0;
        trackIndex = 0;

        nextTrack();

    } catch (err) {
        messageElement.textContent = "Error conectando con el backend.";
    }
}

function nextTrack() {
    if (trackIndex >= availableTracks.length) {
        audioPlayer.pause();
        feedbackElement.innerHTML = `<h2>🎉 ¡Fin del juego! Puntuación: ${currentScore}</h2>`;
        return;
    }

    currentTrack = availableTracks[trackIndex];
    trackIndex++;

    audioPlayer.src = currentTrack.preview;
    audioPlayer.currentTime = 0;
    audioPlayer.play();

    setTimeout(() => audioPlayer.pause(), PREVIEW_DURATION * 1000);

    feedbackElement.textContent = `Adivina la canción ${trackIndex} / ${availableTracks.length}`;
}

function checkGuess() {
    const normalize = t => t.toLowerCase().replace(/[^\w\s]/g, '').trim();
    const guess = normalize(songGuessInput.value);
    const correct = normalize(currentTrack.name);

    if (guess === correct || correct.includes(guess)) {
        currentScore += 10;
        feedbackElement.textContent = `✔ Correcto: ${currentTrack.name}`;
        scoreElement.textContent = currentScore;

        setTimeout(nextTrack, 1500);
    } else {
        feedbackElement.textContent = `❌ Incorrecto. Sigue intentando.`;
    }
}

startGameButton.addEventListener("click", () => {
    if (artistInput.value.trim() === "") return;
    fetchArtistTracks(artistInput.value.trim());
});

submitGuessButton.addEventListener("click", checkGuess);
skipButton.addEventListener("click", nextTrack);

};
submitGuessButton.onclick = checkGuess;
skipButton.onclick = nextTrack;

