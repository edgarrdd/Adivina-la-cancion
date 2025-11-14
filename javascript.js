const clientId = '1a1298904e0a4ca5a6ed6c58e222d083'; 
const redirectUri = 'http://localhost:3000/callback'; 
const scopes = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-modify-playback-state',
  'user-read-playback-state'
];

const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes.join('%20')}`;

document.getElementById('login-button').addEventListener('click', () => {
  window.location.href = authUrl;
});
