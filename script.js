let cancionActual = null;
let intentos = 3;

async function buscarCanciones(artista) {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(artista)}&entity=song&limit=20`;

    const response = await fetch(url);
    const data = await response.json();

    const tracks = data.results
        .filter(t => t.previewUrl)
        .map(t => ({
            name: t.trackName,
            preview: t.previewUrl,
            artist: t.artistName
        }));

    return tracks;
}

document.getElementById("btn-juego").addEventListener("click", async () => {
    const artista = document.getElementById("input-artista").value.trim();
    const mensaje = document.getElementById("mensaje");

    if (!artista) {
        mensaje.innerText = "Escribe un artista.";
        return;
    }

    mensaje.innerText = "Buscando canciones...";

    const canciones = await buscarCanciones(artista);

    if (canciones.length === 0) {
        mensaje.innerText = "No se encontraron canciones.";
        return;
    }

    intentos = 3;

    // escoger canción aleatoria
    cancionActual = canciones[Math.floor(Math.random() * canciones.length)];

    mensaje.innerText = `Reproduciendo canción de: ${cancionActual.artist}`;

    const audio = document.getElementById("reproductor");
    audio.src = cancionActual.preview;
    audio.play();
});

document.getElementById("btn-enviar").addEventListener("click", () => {
    const respuesta = document.getElementById("input-respuesta").value.trim().toLowerCase();
    const resultado = document.getElementById("resultado");

    if (!cancionActual) {
        resultado.innerText = "Primero inicia el juego.";
        return;
    }

    if (respuesta === cancionActual.name.toLowerCase()) {
        resultado.innerText = "🎉 ¡Correcto! Era: " + cancionActual.name;
        return;
    }

    intentos--;

    if (intentos > 0) {
        resultado.innerText = `❌ Incorrecto. Te quedan ${intentos} intento(s).`;
    } else {
        resultado.innerText = `😢 Perdiste. La canción era: ${cancionActual.name}`;
        cancionActual = null;
    }
});

