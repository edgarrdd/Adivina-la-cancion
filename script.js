// URL iTunes
const API_URL = "https://itunes.apple.com/search?limit=50&media=music&term=";

// DOM
const artistInput = document.getElementById("artistInput");
const startGameButton = document.getElementById("startGameButton");
const messageElement = document.getElementById("message");

const gameSection = document.getElementById("game");
const feedback = document.getElementById("feedback");
const currentScore = document.getElementById("currentScore");

const audioPlayer = document.getElementById("audioPlayer");
const songGuess = document.getElementById("songGuess");
const submitGuessButton = document.getElementById("submitGuessButton");
const skipButton = document.getElementById("skipButton");

let tracks = [];
let remainingTracks = [];
let currentTrack = null;
let score = 0;
let songsPlayed = 0;
const MAX_SONGS = 10;

// Normalizar texto (sin tildes, mayúsculas, signos)
function normalize(text) {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^\w\s]/g, "")
        .trim();
}

// ------------------------
// INICIAR JUEGO
// ------------------------
startGameButton.addEventListener("click", () => {
    const artist = artistInput.value.trim();

    if (artist === "") {
        messageElement.textContent = "Introduce un artista.";
        return;
    }

    fetchArtistTracks(artist);
});

// Obtener canciones del artista
async function fetchArtistTracks(artistName) {
    messageElement.textContent = "Buscando canciones...";
    startGameButton.disabled = true;

    try {
        const url = API_URL + encodeURIComponent(artistName);
        const res = await fetch(url);
        const data = await res.json();

        tracks = data.results.filter(t => t.previewUrl);

        if (tracks.length === 0) {
            messageElement.textContent = "No hay previews disponibles.";
            startGameButton.disabled = false;
            return;
        }

        remainingTracks = shuffleArray(tracks).slice(0, MAX_SONGS);
        score = 0;
        songsPlayed = 0;

        currentScore.textContent = score;
        gameSection.classList.remove("hidden");

        startRound();

    } catch (error) {
        console.error(error);
        messageElement.textContent = "Error conectando al servidor.";
    }

    startGameButton.disabled = false;
}

// Mezclar canciones (Fisher–Yates)
function shuffleArray(array) {
    let arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

// ------------------------
// NUEVA RONDA
// ------------------------
function startRound() {
    if (songsPlayed >= MAX_SONGS || remainingTracks.length === 0) {
        endGame();
        return;
    }

    currentTrack = remainingTracks.shift();
    songsPlayed++;

    audioPlayer.src = currentTrack.previewUrl;
    audioPlayer.play();

    feedback.textContent = "🎧 Escucha y adivina la canción";
    songGuess.value = "";
}

// ------------------------
// RESPUESTA DEL USUARIO
// ------------------------
submitGuessButton.addEventListener("click", checkAnswer);
songGuess.addEventListener("keydown", e => {
    if (e.key === "Enter") checkAnswer();
});

function checkAnswer() {
    const guess = normalize(songGuess.value);
    const real = normalize(currentTrack.trackName);

    if (guess === "") return;

    if (real.includes(guess)) {
        feedback.textContent = "✔ ¡Correcto!";
        score++;
    } else {
        feedback.textContent = `❌ Incorrecto. Era: ${currentTrack.trackName}`;
    }

    currentScore.textContent = score;

    setTimeout(startRound, 1000);
}

// ------------------------
// SALTAR CANCIÓN
// ------------------------
skipButton.addEventListener("click", () => {
    feedback.textContent = `⏭ Saltado. Era: ${currentTrack.trackName}`;
    setTimeout(startRound, 1200);
});

// ------------------------
// FIN DEL JUEGO
// ------------------------
function endGame() {
    feedback.textContent = `🎉 Juego terminado. Puntuación final: ${score}/${MAX_SONGS}`;
    audioPlayer.pause();
}

    setTimeout(() => {
        startRound();
    }, 1500);
}

