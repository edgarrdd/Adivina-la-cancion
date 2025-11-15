// URL del backend en Render
const BACKEND_URL = "https://spotify-backend-8i9z.onrender.com/api/get-tracks";

// Elementos del DOM
const artistInput = document.getElementById("artist");
const startGameButton = document.getElementById("startGame");
const messageElement = document.getElementById("message");
const audioPlayer = document.getElementById("audioPlayer");

let tracks = [];
let selectedTrack = null;

// Evento del botón
startGameButton.addEventListener("click", () => {
    const artist = artistInput.value.trim();
    console.log("Botón clicado, artista:", artist);

    if (artist === "") {
        messageElement.textContent = "Introduce un artista.";
        return;
    }

    fetchArtistTracks(artist);
});

// Función que obtiene canciones desde el backend
async function fetchArtistTracks(artistName) {
    console.log("fetchArtistTracks llamado con:", artistName);

    messageElement.textContent = "Buscando canciones...";
    startGameButton.disabled = true;

    try {
        const url = `${BACKEND_URL}/${encodeURIComponent(artistName)}`;
        console.log("Haciendo fetch a:", url);

        const res = await fetch(url);
        console.log("Respuesta recibida:", res);

        if (!res.ok) {
            messageElement.textContent = "No se encontraron canciones.";
            startGameButton.disabled = false;
            return;
        }

        const data = await res.json();
        console.log("Datos JSON recibidos:", data);

        tracks = data.tracks;

        if (tracks.length === 0) {
            messageElement.textContent = "No hay previews disponibles.";
            startGameButton.disabled = false;
            return;
        }

        startGame();
    } catch (error) {
        console.error("Error en fetch:", error);
        messageElement.textContent = "Error conectando al servidor.";
    }

    startGameButton.disabled = false;
}

// Iniciar el juego con una canción aleatoria
function startGame() {
    selectedTrack = tracks[Math.floor(Math.random() * tracks.length)];

    console.log("Canción escogida:", selectedTrack);

    audioPlayer.src = selectedTrack.preview;
    audioPlayer.play();

    messageElement.textContent = "Escucha y adivina la canción!";
}
