window.onload = () => {
  const clientId = '1a1298904e0a4ca5a6ed6c658e222d083';
  const redirectUri = 'https://edgarrdd.github.io/Adivina-la-cancion/callback';
  const scopes = [
    'streaming',
    'user-read-email',
    'user-read-private',
    'user-modify-playback-state',
    'user-read-playback-state'
  ];

  const authUrl = `https://accounts.spotify.com/authorize?client_id=${clientId}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scopes.join('%20')}`;

  const loginButton = document.getElementById('login-button');
  if (loginButton) {
    loginButton.addEventListener('click', () => {
      console.log("Redirigiendo a:", authUrl);
      window.location.href = authUrl;
    });
  } else {
    console.error("No se encontró el botón con id 'login-button'");
  }
};

