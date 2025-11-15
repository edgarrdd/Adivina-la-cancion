// PKCE helpers
function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(length)))
    .map(x => chars[x % chars.length]).join('');
}

function base64urlencode(str) {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(str)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function generateCodeChallenge(codeVerifier) {
  const data = new TextEncoder().encode(codeVerifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64urlencode(digest);
}

// Spotify config
const clientId = '1a1298904e0a4ca5a6ed6c58e222d083';
const redirectUri = 'https://edgarrdd.github.io/Adivina-la-cancion/callback';
const scopes = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-modify-playback-state',
  'user-read-playback-state'
];

// Botón de login
document.getElementById("login-button").addEventListener("click", async () => {
  const codeVerifier = generateRandomString(128);
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  localStorage.setItem("code_verifier", codeVerifier);

  const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=${scopes.join('%20')}&redirect_uri=${encodeURIComponent(redirectUri)}&code_challenge_method=S256&code_challenge=${codeChallenge}`;
  window.location.href = authUrl;
});

// Juego: buscar canciones y mostrar opciones
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
    const data = await res.json();

    // 👀 Depuración: ver todo lo que devuelve Spotify
    console.log("Respuesta completa de Spotify:", data);

    if (!data.tracks || data.tracks.items.length === 0) {
      alert("No se encontraron canciones para ese artista.");
      return;
    }

    const tracks = data.tracks.items.filter(t => t.preview_url);

    // 👀 Depuración: ver cuántos previews hay
    console.log("Tracks con preview:", tracks);

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
      btn.className = "opcion";
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

// Al cargar index.html, si ya hay token, muestra el campo de búsqueda
window.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("spotify_token");
  if (token) {
    document.getElementById("login-button").style.display = "none";
    document.getElementById("busqueda").style.display = "block";
  }
});

