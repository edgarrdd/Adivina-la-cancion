// URL de la API de iTunes
const API_URL = "https://itunes.apple.com/search?limit=25&media=music&term=";

// Elementos del DOM
const artistInput = document.getElementById("artistInput");
const startGameButton = document.getElementById("startGameButton");
const messageElement = document.getElementById("message");
const audioPlayer = document.getElementById("audioPlayer");

let tracks = [];
let selectedTrack = null;

// Evento del botón
startGameButton.addEventListener("click", () => {
    const artist = artistInput.value.trim();

    if (artist === "") {
        messageElement.textContent = "Introduce un artista.";
        return;
    }

    fetchArtistTracks(artist);
});

// Función para obtener canciones desde iTunes
async function fetchArtistTracks(artistName) {
    messageElement.textContent = "Buscando canciones...";
    startGameButton.disabled = true;

    try {
        const url = API_URL + encodeURIComponent(artistName);
        const res = await fetch(url);
        const data = await res.json();

        // Filtrar solo canciones con preview
        tracks = data.results.filter(t => t.previewUrl);

        if (tracks.length === 0) {
            messageElement.textContent = "No hay previews disponibles.";
            startGameButton.disabled = false;
            return;
        }

        startGame();
    } catch (error) {
        console.error("Error:", error);
        messageElement.textContent = "Error conectando al servidor.";
    }

    startGameButton.disabled = false;
}

// Iniciar el juego con una canción aleatoria
function startGame() {
    selectedTrack = tracks[Math.floor(Math.random() * tracks.length)];

    audioPlayer.src = selectedTrack.previewUrl;
    audioPlayer.play();

    messageElement.textContent = "Escucha y adivina la canción!";
}

    setTimeout(() => {
        startRound();
    }, 1500);
}

