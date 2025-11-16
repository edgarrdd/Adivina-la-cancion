// ================= FIREBASE + RTDB (Realtime Database) =================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getDatabase,
  ref,
  set,
  update,
  onValue,
  get,
  child,
  remove
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

// === Pega tu firebaseConfig aquí ===
const firebaseConfig = {
  apiKey: "AIzaSyAYTLMhV_gdLFSTf9yOlohUbC783iDCl9s",
  authDomain: "adivina-canciones.firebaseapp.com",
  projectId: "adivina-canciones",
  storageBucket: "adivina-canciones.firebasestorage.app",
  messagingSenderId: "624104543290",
  appId: "1:624104543290:web:ac92fd382b8e0dd3f9d103",
  measurementId: "G-52LGMNSHBF"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// =================== DOM ===================
const menu = document.getElementById("menu");
const createRoomBtn = document.getElementById("createRoomBtn");
const joinRoomBtn = document.getElementById("joinRoomBtn");

const createRoom = document.getElementById("createRoom");
const roomCodeCreate = document.getElementById("roomCodeCreate");
const playerNameCreate = document.getElementById("playerNameCreate");
const createRoomConfirm = document.getElementById("createRoomConfirm");
const backFromCreate = document.getElementById("backFromCreate");

const joinRoom = document.getElementById("joinRoom");
const roomCodeJoin = document.getElementById("roomCodeJoin");
const playerNameJoin = document.getElementById("playerNameJoin");
const joinRoomConfirm = document.getElementById("joinRoomConfirm");
const backFromJoin = document.getElementById("backFromJoin");

const lobby = document.getElementById("lobby");
const roomCodeDisplay = document.getElementById("roomCodeDisplay");
const playerList = document.getElementById("playerList");
const startMultiplayerGame = document.getElementById("startMultiplayerGame");
const leaveLobby = document.getElementById("leaveLobby");

const gameSection = document.getElementById("game");
const audioPlayer = document.getElementById("audioPlayer");
const songGuess = document.getElementById("songGuess");
const submitGuessButton = document.getElementById("submitGuessButton");
const skipButton = document.getElementById("skipButton");
const feedback = document.getElementById("feedback");
const currentScore = document.getElementById("currentScore");
const rankingOl = document.getElementById("ranking");

// =================== ESTADO ===================
let roomCode = null;
let playerName = null;
let isHost = false;
let myScore = 0;
let tracks = [];       // array de objetos track (desde iTunes)
let currentIndex = 0;  // índice sincronizado por RTDB

// =================== UTILS ===================
function genCode(len = 4) {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function normalize(text = "") {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\(.*?\)/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
}

// =================== NAVEGACIÓN SIMPLE ===================
createRoomBtn.onclick = () => { menu.classList.add("hidden"); createRoom.classList.remove("hidden"); };
joinRoomBtn.onclick = () => { menu.classList.add("hidden"); joinRoom.classList.remove("hidden"); };
backFromCreate.onclick = () => { createRoom.classList.add("hidden"); menu.classList.remove("hidden"); };
backFromJoin.onclick = () => { joinRoom.classList.add("hidden"); menu.classList.remove("hidden"); };

// =================== CREAR SALA ===================
createRoomConfirm.onclick = async () => {
  roomCode = roomCodeCreate.value.trim().toUpperCase() || genCode();
  playerName = (playerNameCreate.value || "Anon").trim();

  if (!playerName) { alert("Pon tu nombre"); return; }

  isHost = true;
  myScore = 0;

  const roomRef = ref(db, `rooms/${roomCode}`);
  // Crear estructura básica
  await set(roomRef, {
    gameState: "waiting",      // waiting | playing | finished
    currentIndex: 0,
    tracks: {},                // se guardarán objetos indexados 0..9
    players: {
      [playerName]: { score: 0 }
    },
    startedAt: Date.now()
  });

  enterLobby();
};

// =================== UNIRSE A SALA ===================
joinRoomConfirm.onclick = async () => {
  roomCode = roomCodeJoin.value.trim().toUpperCase();
  playerName = (playerNameJoin.value || "Anon").trim();

  if (!roomCode || !playerName) { alert("Completa campos"); return; }

  const roomSnap = await get(child(ref(db), `rooms/${roomCode}`));
  if (!roomSnap.exists()) { alert("Sala no existe"); return; }

  const room = roomSnap.val();
  const countPlayers = room.players ? Object.keys(room.players).length : 0;
  if (countPlayers >= 6) { alert("Sala llena (6 jugadores max)"); return; }

  isHost = false;
  myScore = 0;

  // Añadir jugador
  await update(ref(db, `rooms/${roomCode}/players`), {
    [playerName]: { score: 0 }
  });

  enterLobby();
};

// =================== ENTRAR AL LOBBY + ESCUCHAR RTDB ===================
let roomListener = null;
function enterLobby() {
  createRoom.classList.add("hidden");
  joinRoom.classList.add("hidden");
  lobby.classList.remove("hidden");
  roomCodeDisplay.textContent = roomCode;

  // Escuchar la sala en Realtime Database
  const roomRef = ref(db, `rooms/${roomCode}`);
  if (roomListener) roomListener(); // no duplicate (si existiera)

  roomListener = onValue(roomRef, (snap) => {
    const data = snap.val();
    if (!data) return;

    // Actualiza lista de jugadores
    const players = data.players || {};
    updatePlayerList(players);

    // Mostrar botón de inicio si soy host y está esperando
    if (isHost && data.gameState === "waiting") {
      startMultiplayerGame.classList.remove("hidden");
    } else {
      startMultiplayerGame.classList.add("hidden");
    }

    // Si el juego está en playing -> sincronizar inicio/estado
    if (data.gameState === "playing") {
      tracks = Object.values(data.tracks || {}).sort((a,b) => a._idx - b._idx);
      currentIndex = data.currentIndex || 0;
      startGameUI();
      playTrack(currentIndex);
      updateRanking(players);
    }

    if (data.gameState === "finished") {
      // Puedes mostrar ranking final
      tracks = Object.values(data.tracks || {}).sort((a,b) => a._idx - b._idx);
      currentIndex = data.currentIndex || 10;
      startGameUI(true);
      updateRanking(players);
    }
  });
}

// Actualiza lista visual de players (lobby)
function updatePlayerList(playersObj) {
  playerList.innerHTML = "";
  const names = Object.keys(playersObj || {});
  names.forEach(name => {
    const li = document.createElement("li");
    li.textContent = `${name} — ${playersObj[name].score} pts`;
    playerList.appendChild(li);
  });
}

// Salir / dejar sala
leaveLobby.onclick = async () => {
  if (!roomCode || !playerName) return;
  // remover jugador
  await update(ref(db, `rooms/${roomCode}/players/${playerName}`), null).catch(()=>{});
  // Si soy host y no quedan players, eliminar sala
  const snap = await get(ref(db, `rooms/${roomCode}/players`));
  const remaining = snap.exists() ? Object.keys(snap.val()).length : 0;
  if (isHost && remaining === 0) {
    await remove(ref(db, `rooms/${roomCode}`));
  }
  // reload a menu simple
  location.reload();
};

// =================== INICIAR PARTIDA (HOST) ===================
startMultiplayerGame.onclick = async () => {
  // El host obtiene canciones desde iTunes (puedes cambiar 'term' a lo que quieras)
  // Este ejemplo busca 'pop' y toma 10 previews
  const term = "pop";
  const url = `https://itunes.apple.com/search?limit=50&media=music&term=${encodeURIComponent(term)}`;
  const res = await fetch(url);
  const data = await res.json();
  let picked = data.results.filter(t => t.previewUrl).sort(() => Math.random() - 0.5).slice(0, 10);

  // Guardar tracks en RTDB como objeto indexado (0..9)
  const tracksObj = {};
  for (let i = 0; i < picked.length; i++) {
    tracksObj[i] = Object.assign({}, picked[i], { _idx: i }); // agrego _idx para orden
  }

  // update gameState
  await update(ref(db, `rooms/${roomCode}`), {
    gameState: "playing",
    tracks: tracksObj,
    currentIndex: 0
  });
};

// =================== UI: iniciar juego y reproducir ===================
function startGameUI(finished = false) {
  lobby.classList.add("hidden");
  gameSection.classList.remove("hidden");
  if (finished) {
    feedback.textContent = "Juego terminado";
  } else {
    feedback.textContent = "";
  }
}

// reproduce la pista indexada (se llama cuando currentIndex cambie)
function playTrack(index) {
  if (!tracks || !tracks[index]) return;
  const t = tracks[index];
  currentIndex = index;
  audioPlayer.src = t.previewUrl;
  // Intentar reproducir (si el navegador permite autoplay tras interacción)
  audioPlayer.play().catch(()=>{/* puede requerir interacción del usuario */});
  // reset UI
  feedback.textContent = `Ronda ${index+1} / ${tracks.length}`;
  songGuess.value = "";
}

// Escuchar cambios en currentIndex desde RTDB (host lo actualiza)
const roomCurrentIndexRef = (code) => ref(db, `rooms/${code}/currentIndex`);
onValueListenerForIndex = async (code) => {
  // (No-op: onValue ya lo maneja en enterLobby por la snapshot completa)
};

// =================== RESPONDER / SALTAR ===================
submitGuessButton.onclick = () => checkAnswer();
skipButton.onclick = () => skipSong();

async function checkAnswer() {
  if (!tracks || !tracks[currentIndex]) return;
  const guess = normalize(songGuess.value || "");
  if (!guess) return;
  const real = normalize(tracks[currentIndex].trackName || "");

  if (real.includes(guess)) {
    myScore++;
    feedback.textContent = "✅ ¡Correcto!";
  } else {
    feedback.textContent = `❌ Incorrecto — Era: ${tracks[currentIndex].trackName}`;
  }

  currentScore.textContent = myScore;
  // Guardar mi puntaje en RTDB
  await update(ref(db, `rooms/${roomCode}/players/${playerName}`), { score: myScore });

  // Si soy host, avanzo la ronda global
  if (isHost) {
    const next = (currentIndex || 0) + 1;
    // si llegó al final, marcar finished
    if (next >= tracks.length) {
      await update(ref(db, `rooms/${roomCode}`), { currentIndex: next, gameState: "finished" });
    } else {
      await update(ref(db, `rooms/${roomCode}`), { currentIndex: next });
    }
  }
}

// Saltar sin puntuar
async function skipSong() {
  feedback.textContent = "⏭ Saltaste.";
  // Si soy host avanzo; si no, solo actualizo que yo skippeé (opcional)
  if (isHost) {
    const next = (currentIndex || 0) + 1;
    if (next >= tracks.length) {
      await update(ref(db, `rooms/${roomCode}`), { currentIndex: next, gameState: "finished" });
    } else {
      await update(ref(db, `rooms/${roomCode}`), { currentIndex: next });
    }
  }
}

// =================== RANKING ===================
function updateRanking(playersObj) {
  const arr = Object.entries(playersObj || {}).map(([name, data]) => ({ name, score: data.score || 0 }));
  arr.sort((a,b) => b.score - a.score);
  rankingOl.innerHTML = "";
  arr.forEach(p => {
    const li = document.createElement("li");
    li.textContent = `${p.name} — ${p.score} pts`;
    rankingOl.appendChild(li);
  });
}

// =================== LIMPIEZA: cuando se cierra pestaña, borrar jugador ===================
window.addEventListener("beforeunload", async () => {
  if (roomCode && playerName) {
    // Intenta remover tu entrada (opcional, no bloquear)
    update(ref(db, `rooms/${roomCode}/players/${playerName}`), null).catch(()=>{});
  }
});
