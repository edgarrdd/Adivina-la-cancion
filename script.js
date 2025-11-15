const clientId = '1a1298904e0a4ca5a6ed6c58e222d083'; // tu Client ID
const redirectUri = 'https://edgarrdd.github.io/Adivina-la-cancion/index.html';
const scopes = ['user-read-email','user-read-private'];

document.getElementById("login-button").addEventListener("click", () => {
  const authUrl = `https://accounts.spotify.com/authorize?response_type=token&client_id=${clientId}&scope=${scopes.join('%20')}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  window.location.href = authUrl;
});

// Extraer token del URL si viene de Spotify
window.addEventListener("DOMContentLoaded", () => {
  const hash = window.location.hash;
  if (hash.includes("access_token")) {
    const params = new URLSearchParams(hash.substring(1));
    const token = params.get("access_token");
    localStorage.setItem("spotify_token", token);
    window.location.hash = ""; // limpiar URL
  }

  const token = localStorage.getItem("spotify_token");
  if (token) {
    document.getElementById("login-button").style.display = "none";
    document.getElementById("busqueda").style.display = "block";
  }
});

async function iniciarJuego() {
  const token = localStorage.getItem("spotify_token");
  if (!token) {
    alert("No hay token. Inicia sesión primero.");
    return;
  }

  const artista = document.getElementById("artista").value.trim();
  if (!artista) {
    alert("Escribe un nombre de artista.");
    return;
  }

  try {
    const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(artista)}&type=track&limit=10`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!res.ok) {
      console.error("Error HTTP:", res.status, res.statusText);
      alert("Error de autenticación con Spotify. Intenta iniciar sesión nuevamente.");
      return;
    }

    const data = await res.json();
    console.log("Respuesta completa de Spotify:", data);

    if (!data.tracks || !Array.isArray(data.tracks.items) || data.tracks.items.length === 0) {
      alert("No se encontraron canciones para ese artista.");
      return;
    }

    const tracks = data.tracks.items.filter(t => t.preview_url);
    if (tracks.length === 0) {
      alert("Este artista no tiene previews disponibles en Spotify.");
      return;
    }

    const correct = tracks[Math.floor(Math.random() * tracks.length)];
    const opciones = [...tracks].sort(() => Math.random() - 0.5);

    document.getElementById("preview").src = correct.preview_url;
    document.getElementById("juego").style.display = "block";

    const contenedor = document.getElementById("opciones");
    contenedor.innerHTML = "";
    opciones.forEach(track => {
      const btn = document.createElement("button");
      btn.textContent = track.name;
      btn.onclick = () => {
        document.getElementById("resultado").textContent =
          track.name === correct.name ? "✅ ¡Correcto!" : `❌ Incorrecto. Era: ${correct.name}`;
      };
      contenedor.appendChild(btn);
    });
  } catch (error) {
    console.error("Error al conectar con Spotify:", error);
    alert("Error al conectar con Spotify. Revisa la consola para más detalles.");
  }
}
