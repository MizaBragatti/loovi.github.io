const token = localStorage.getItem('idToken');
console.log('[auth2] idToken no localStorage:', token ? 'presente' : 'AUSENTE');

if (!token) {
  window.location.replace('/loovi-login');
} else {
  const loadingScreen = document.getElementById('loading-screen');
  const mainContent = document.querySelector('.main');
  if (loadingScreen) loadingScreen.style.display = 'none';
  if (mainContent) mainContent.style.display = 'block';
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('idToken');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.replace('/loovi-login');
  });
});
