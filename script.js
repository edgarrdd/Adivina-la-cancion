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

// === Tu firebaseConfig ===
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
const artistInput = document.getElementById("artistInput");

const joinRoom = document.getElementById("joinRoom");
const roomCodeJoin = document.getElementById("roomCodeJoin");
const playerNameJoin = document.getElementById("playerNameJoin");
const joinRoomConfirm = document.getElementById("joinRoomConfirm");
const backFromJoin = document.getElementById("backFromJoin");

const lobby = document.getElementById("lobby");
const roomCodeDisplay = document.getElementById("roomCodeDisplay");
const roomArtist = document.getElementById("roomArtist");
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

const resultsSection = document.getElementById("results");
const finalRankingDiv = document.getElementById("finalRanking");
const backToMenu = document.getElementById("backToMenu");

// =================== ESTADO ===================
let roomCode = null;
let playerName = null;
let isHost = false;
let myScore = 0;
let tracks = [];       // track list saved in room (same for all)
let myIndex = 0;       // my current song index (per-player)
let roomListener = null;

// =================== UTILIDADES ===================
function genCode(len = 4) {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function normalize(text = "") {
  return (text + "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/\(.*?\)/g, "").replace(/[^a-z0-9 ]/g, "").trim();
}

// =================== NAVEGACIÓN ===================
createRoomBtn.onclick = () => { menu.classList.add("hidden"); createRoom.classList.remove("hidden"); };
joinRoomBtn.onclick = () => { menu.classList.add("hidden"); joinRoom.classList.remove("hidden"); };
backFromCreate.onclick = () => { createRoom.classList.add("hidden"); menu.classList.remove("hidden"); };
backFromJoin.onclick = () => { joinRoom.classList.add("hidden"); menu.classList.remove("hidden"); };

// =================== CREAR SALA ===================
createRoomConfirm.onclick = async () => {
  const code = (roomCodeCreate.value.trim().toUpperCase() || genCode()).slice(0,6);
  const name = (playerNameCreate.value || "Host").trim();
  const artist = (artistInput.value || "").trim();

  if (!name) { alert("Pon tu nombre"); return; }
  if (!artist) { alert("Debes indicar un artista"); return; }

  roomCode = code;
  playerName = name;
  isHost = true;
  myScore = 0;
  myIndex = 0;

  const roomRef = ref(db, `rooms/${roomCode}`);

  // Create room and set artist in settings, plus initial player entry
  await set(roomRef, {
    settings: { artist },
    gameState: "waiting",
    tracks: {},
    players: {
      [playerName]: { currentSongIndex: 0, score: 0, hasFinished: false }
    },
    createdAt: Date.now()
  });

  enterLobby();
};

// =================== UNIRSE A SALA ===================
joinRoomConfirm.onclick = async () => {
  roomCode = (roomCodeJoin.value.trim().toUpperCase() || "").slice(0,6);
  playerName = (playerNameJoin.value || "Anon").trim();

  if (!roomCode || !playerName) { alert("Completa campos"); return; }

  const rootSnap = await get(child(ref(db), `rooms/${roomCode}`));
  if (!rootSnap.exists()) { alert("Sala no existe"); return; }

  const room = rootSnap.val();
  const countPlayers = room.players ? Object.keys(room.players).length : 0;
  if (countPlayers >= 6) { alert("Sala llena (6 jugadores max)"); return; }

  // register player with default fields
  await update(ref(db, `rooms/${roomCode}/players`), {
    [playerName]: { currentSongIndex: 0, score: 0, hasFinished: false }
  });

  isHost = false;
  myScore = 0;
  myIndex = 0;

  enterLobby();
};

// =================== LOBBY & LISTENERS ===================
function enterLobby() {
  createRoom.classList.add("hidden");
  joinRoom.classList.add("hidden");
  lobby.classList.remove("hidden");
  roomCodeDisplay.textContent = roomCode;

  // detach old listener if any
  // (onValue returns a function to unsubscribe, but using the returned unsubscribe requires storing it.
  // Here we'll just rely on single session per page; if you plan multiple enters, add unsubscribe)
  const roomRef = ref(db, `rooms/${roomCode}`);
  if (roomListener) roomListener();

  roomListener = onValue(roomRef, (snap) => {
    const data = snap.val();
    if (!data) return;

    // show artist
    const artist = (data.settings && data.settings.artist) ? data.settings.artist : "—";
    roomArtist.textContent = artist;

    // update listed players
    const players = data.players || {};
    updatePlayerList(players);

    // show start button if host
    if (isHost && data.gameState === "waiting") startMultiplayerGame.classList.remove("hidden");
    else startMultiplayerGame.classList.add("hidden");

    // load tracks when playing
    if (data.gameState === "playing") {
      // Build ordered tracks array from saved tracks object
      tracks = Object.values(data.tracks || {}).sort((a,b) => (a._idx ?? 0) - (b._idx ?? 0));
      // read my player entry
      const myEntry = players[playerName];
      if (myEntry) {
        myIndex = myEntry.currentSongIndex || 0;
        myScore = myEntry.score || 0;
        currentScore.textContent = myScore;
        // start UI for player
        startGameUI();
        // play my current song (if not finished)
        if (!myEntry.hasFinished) playTrack(myIndex);
        else {
          feedback.textContent = "Has terminado. Esperando resultados...";
        }
      } else {
        // If for some reason my entry missing, (re)register default
        update(ref(db, `rooms/${roomCode}/players/${playerName}`), { currentSongIndex: 0, score: 0, hasFinished: false });
      }
    }

    // results state
    if (data.gameState === "results") {
      showResults(data.players || {});
    }
  });
}

function updatePlayerList(playersObj) {
  playerList.innerHTML = "";
  const names = Object.keys(playersObj || {});
  names.forEach(name => {
    const li = document.createElement("li");
    const sc = playersObj[name].score || 0;
    const fin = playersObj[name].hasFinished ? "✅" : "⏳";
    li.textContent = `${name} — ${sc} pts ${fin}`;
    playerList.appendChild(li);
  });
}

// =================== START (HOST fetch tracks) ===================
startMultiplayerGame.onclick = async () => {
  // read artist from settings (or from input if host still on create)
  const settingsSnap = await get(child(ref(db), `rooms/${roomCode}/settings`));
  const artist = settingsSnap.exists() && settingsSnap.val().artist ? settingsSnap.val().artist : (artistInput.value || "").trim();
  if (!artist) { alert("No hay artista definido."); return; }

  // fetch tracks from iTunes
  const url = `https://itunes.apple.com/search?limit=50&media=music&term=${encodeURIComponent(artist)}`;
  const res = await fetch(url);
  const data = await res.json();
  let picked = (data.results || []).filter(t => t.previewUrl).sort(() => Math.random() - 0.5).slice(0, 10);
  if (picked.length === 0) { alert("No se encontraron previews para ese artista."); return; }

  // format tracks as object with _idx (so clients can order)
  const tracksObj = {};
  for (let i = 0; i < picked.length; i++) {
    tracksObj[i] = Object.assign({}, picked[i], { _idx: i });
  }

  // Ensure every player has the initial fields (currentSongIndex, score, hasFinished)
  const playersSnap = await get(child(ref(db), `rooms/${roomCode}/players`));
  const players = playersSnap.exists() ? playersSnap.val() : {};
  const playersUpdate = {};
  Object.keys(players).forEach(p => {
    playersUpdate[p] = { currentSongIndex: 0, score: 0, hasFinished: false };
  });

  // update room: tracks + set gameState playing + reset players
  await update(ref(db, `rooms/${roomCode}`), {
    tracks: tracksObj,
    gameState: "playing",
    players: playersUpdate
  });
};

// =================== GAME UI & PLAYBACK (per-player) ===================
function startGameUI() {
  lobby.classList.add("hidden");
  resultsSection.classList.add("hidden");
  gameSection.classList.remove("hidden");
  feedback.textContent = "";
}

// play the song at index for this player (tracks array must be loaded)
function playTrack(index) {
  if (!tracks || !tracks[index]) {
    feedback.textContent = "No hay pista disponible.";
    return;
  }
  const t = tracks[index];
  myIndex = index;
  audioPlayer.src = t.previewUrl;
  audioPlayer.play().catch(()=>{ /* el navegador puede bloquear autoplay hasta interacción */ });
  feedback.textContent = `Ronda ${index+1} / ${tracks.length}`;
  songGuess.value = "";
}

// =================== RESPONDER Y AVANZAR (solo actualiza data del jugador) ===================
submitGuessButton.onclick = () => checkAnswer();
skipButton.onclick = () => skipSong();

async function checkAnswer() {
  if (!tracks || !tracks[myIndex]) return;
  const guess = normalize(songGuess.value || "");
  if (!guess) return;

  const real = normalize(tracks[myIndex].trackName || "");
  let isCorrect = real.includes(guess);

  if (isCorrect) {
    myScore++;
    feedback.textContent = "✅ ¡Correcto!";
  } else {
    feedback.textContent = `❌ Incorrecto — Era: ${tracks[myIndex].trackName}`;
  }

  // update this player's state in RTDB
  const nextIndex = myIndex + 1;
  const updates = { score: myScore };
  if (nextIndex >= tracks.length) updates.hasFinished = true;
  updates.currentSongIndex = nextIndex;

  await update(ref(db, `rooms/${roomCode}/players/${playerName}`), updates);

  // play next if not finished locally
  if (!updates.hasFinished) {
    playTrack(nextIndex);
  } else {
    feedback.textContent = "Has terminado. Esperando que los demás terminen...";
  }

  // check if all finished -> set gameState results (reader below handles)
  await checkAllFinished();
}

async function skipSong() {
  // increment without adding score
  const nextIndex = myIndex + 1;
  const updates = { currentSongIndex: nextIndex };
  if (nextIndex >= tracks.length) updates.hasFinished = true;

  await update(ref(db, `rooms/${roomCode}/players/${playerName}`), updates);

  if (!updates.hasFinished) {
    playTrack(nextIndex);
  } else {
    feedback.textContent = "Has terminado (saltaste la última). Esperando resultados...";
  }

  await checkAllFinished();
}

// =================== CHECK ALL FINISHED ===================
async function checkAllFinished() {
  const playersSnap = await get(child(ref(db), `rooms/${roomCode}/players`));
  if (!playersSnap.exists()) return;
  const players = playersSnap.val();
  const ids = Object.keys(players || {});
  if (ids.length === 0) return;
  const allFinished = ids.every(id => players[id].hasFinished === true);
  if (allFinished) {
    // set global state to results
    await update(ref(db, `rooms/${roomCode}`), { gameState: "results" });
  }
}

// =================== SHOW RESULTS ===================
function showResults(playersObj) {
  gameSection.classList.add("hidden");
  resultsSection.classList.remove("hidden");

  // build ranking
  const arr = Object.entries(playersObj || {}).map(([name, data]) => ({ name, score: (data.score || 0) }));
  arr.sort((a,b) => b.score - a.score);

  finalRankingDiv.innerHTML = "";
  arr.forEach((p, i) => {
    const d = document.createElement("div");
    d.textContent = `${i+1}. ${p.name} — ${p.score} pts`;
    finalRankingDiv.appendChild(d);
  });
}

// back to menu: clean local state and reload page
backToMenu.onclick = () => {
  location.reload();
};

// =================== RANKING UI (live) ===================
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

// keep ranking in lobby/game updated via the main onValue listener:
// (we update it inside enterLobby when data.gameState is 'playing' or 'waiting')
// also, watch for changes to players to refresh ranking display:
onValue(ref(db, `rooms`), () => {
  // noop; enterLobby listener handles updates per current room
});

// =================== LIMPIEZA ===================
window.addEventListener("beforeunload", async () => {
  if (roomCode && playerName) {
    // remove this player's entry (non-blocking)
    update(ref(db, `rooms/${roomCode}/players/${playerName}`), null).catch(()=>{});
  }
});

    update(ref(db, `rooms/${roomCode}/players/${playerName}`), null).catch(()=>{});
  }
});


