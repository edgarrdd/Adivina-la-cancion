// URL de la API de iTunes
const API_URL = "https://itunes.apple.com/search?limit=50&media=music&term=";

// DOM
const artistInput = document.getElementById("artistInput");
const startGameButton = document.getElementById("startGameButton");
const message = document.getElementById("message");

const setupSection = document.getElementById("setup");
const gameSection = document.getElementById("game");

const audioPlayer = document.getElementById("audioPlayer");
const songGuess = document.getElementById("songGuess");
const submitGuessButton = document.getElementById("submitGuessButton");
const skipButton = document.getElementById("skipButton");

const feedback = document.getElementById("feedback");
const currentScore = document.getElementById("currentScore");

// Variables del juego
let tracks = [];
let currentTrack = null;
let score = 0;
let trackIndex = 0; // Para avanzar por las 10 canciones

// --- EVENTO PARA INICIAR JUEGO ---
startGameButton.addEventListener("click", () => {
    const artist = artistInput.value.trim();

    if (artist === "") {
        message.textContent = "Introduce un artista.";
        return;
    }

    fetchTracks(artist);
});

// --- OBTENER CANCIONES ---
async function fetchTracks(artist) {
    message.textContent = "Buscando canciones...";

    try {
        const url = API_URL + encodeURIComponent(artist);
        const res = await fetch(url);
        const data = await res.json();

        // Filtrar canciones con preview
        tracks = data.results.filter(t => t.previewUrl);

        if (tracks.length === 0) {
            message.textContent = "No se encontraron canciones con preview.";
            return;
        }

        // Mezclar canciones (shuffle)
        tracks = tracks.sort(() => Math.random() - 0.5);

        // Limitar a 10 canciones
        tracks = tracks.slice(0, 10);

        // Pasamos de la pantalla de inicio al juego
        setupSection.classList.add("hidden");
        gameSection.classList.remove("hidden");

        score = 0;
        trackIndex = 0;
        currentScore.textContent = score;

        startRound();

    } catch (err) {
        console.log(err);
        message.textContent = "Error al conectar.";
    }
}

// --- INICIAR UNA RONDA ---
function startRound() {

    if (trackIndex >= tracks.length) {
        endGame();
        return;
    }

    feedback.textContent = "";
    songGuess.value = "";

    // Obtener la canción actual
    currentTrack = tracks[trackIndex];

    // Reproducir
    audioPlayer.src = currentTrack.previewUrl;
    audioPlayer.play();
}

// --- REVISAR RESPUESTA ---
submitGuessButton.addEventListener("click", () => {
    checkAnswer();
});

// --- SALTAR ---
skipButton.addEventListener("click", () => {
    feedback.textContent = "⏭ Canción saltada.";
    nextSong();
});

// --- VALIDAR RESPUESTA ---
function checkAnswer() {
    const guess = songGuess.value.trim().toLowerCase();
    const real = currentTrack.trackName.toLowerCase();

    if (guess === "") return;

    if (real.includes(guess)) {
        feedback.textContent = "✔ ¡Correcto!";
        score++;
    } else {
        feedback.textContent = `❌ Incorrecto. Era: ${currentTrack.trackName}`;
    }

    currentScore.textContent = score;

    nextSong();
}

// --- SIGUIENTE CANCIÓN ---
function nextSong() {
    trackIndex++;

    setTimeout(() => {
        startRound();
    }, 1200);
}

// --- FINAL DEL JUEGO ---
function endGame() {
    feedback.innerHTML = `🎉 <strong>Fin del juego</strong><br>
                          Tu puntuación final es: <strong>${score}/10</strong>`;
    audioPlayer.pause();
}

    }, 1500);
}


