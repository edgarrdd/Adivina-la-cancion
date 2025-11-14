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
  if (!token) return;

  const artista = "Bad Bunny"; // Puedes cambiarlo o hacerlo dinámico
  const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(artista)}&type=track&limit=5`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  const tracks = data.tracks.items.filter(t => t.preview_url);

  if (tracks.length < 3) {
    alert("No hay suficientes canciones con preview.");
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
}

window.onload = iniciarJuego;
