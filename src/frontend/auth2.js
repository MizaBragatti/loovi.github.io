import { auth } from "../firebase/config.js";
import { onAuthStateChanged, signOut } from "firebase/auth";

onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.replace("/login");
  } else {
    const loadingScreen = document.getElementById("loading-screen");
    const mainContent = document.querySelector(".main");
    if (loadingScreen) loadingScreen.style.display = "none";
    if (mainContent) mainContent.style.display = "block";
  }
});

function logout() {
  signOut(auth)
    .then(() => {
      window.location.replace("/login");
    })
    .catch((error) => {
      console.error("Erro ao fazer logout:", error);
    });
}

document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", (event) => {
      event.preventDefault();
      logout();
    });
  }
});

window.logout = logout;
