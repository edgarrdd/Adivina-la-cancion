// URL de la API de iTunes
const API_URL = "https://itunes.apple.com/search?limit=25&media=music&term=";

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

// EVENTO INICIAR JUEGO
startGameButton.addEventListener("click", () => {
    const artist = artistInput.value.trim();

    if (artist === "") {
        message.textContent = "Introduce un artista.";
        return;
    }

    fetchTracks(artist);
});

// OBTENER CANCIONES
async function fetchTracks(artist) {
    message.textContent = "Buscando canciones...";

    try {
        const url = API_URL + encodeURIComponent(artist);
        const res = await fetch(url);
        const data = await res.json();

        // Filtrar preview
        tracks = data.results.filter(t => t.previewUrl);

        if (tracks.length === 0) {
            message.textContent = "No se encontraron canciones con preview.";
            return;
        }

        // Mezclar las canciones
        tracks.sort(() => Math.random() - 0.5);

        // Elegir 10 sin repetir
        tracks = tracks.slice(0, 10);

        // Cambiar pantalla
        setupSection.classList.add("hidden");
        gameSection.classList.remove("hidden");

        score = 0;
        currentScore.textContent = score;

        startRound();

    } catch (error) {
        console.error(error);
        message.textContent = "Error al conectar.";
    }
}

// ----------- NORMALIZAR TEXTO -----------
// Quita tildes, paréntesis, signos y pasa todo a minúsculas
function normalize(text) {
    return text
        .toLowerCase()
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // tildes
        .replace(/\(.*?\)/g, "") // contenido entre paréntesis
        .replace(/[^a-z0-9 ]/g, "") // caracteres especiales
        .trim();
}

// INICIAR UNA CANCIÓN
function startRound() {
    feedback.textContent = "";
    songGuess.value = "";

    if (tracks.length === 0) {
        endGame();
        return;
    }

    // Tomar la primera canción
    currentTrack = tracks.shift();

    audioPlayer.src = currentTrack.previewUrl;
    audioPlayer.play();
}

// BOTÓN ENVIAR RESPUESTA
submitGuessButton.addEventListener("click", checkAnswer);

// BOTÓN SALTAR
skipButton.addEventListener("click", () => {
    feedback.textContent = "❌ Saltaste la canción.";
    nextSong();
});

// REVISAR RESPUESTA
function checkAnswer() {
    const guess = normalize(songGuess.value.trim());
    const real = normalize(currentTrack.trackName);

    if (guess === "") return;

    // Acierto si el guess está contenido en el nombre real
    if (real.includes(guess)) {
        feedback.textContent = "✅ ¡Correcto!";
        score++;
    } else {
        feedback.textContent = `❌ Incorrecto. Era: ${currentTrack.trackName}`;
    }

    currentScore.textContent = score;
    nextSong();
}

// SIGUIENTE CANCIÓN
function nextSong() {
    setTimeout(() => {
        startRound();
    }, 1500);
}

// FIN DEL JUEGO
function endGame() {
    feedback.innerHTML = `🎉 Fin del juego<br>Puntuación final: <strong>${score}/10</strong>`;
    audioPlayer.src = "";
}



