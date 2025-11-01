import { Auth } from "../backend/FireBaseConfing.js";
import { onAuthStateChanged, signOut } from "firebase/auth";

const isDev = import.meta.env.DEV;

onAuthStateChanged(Auth, (user) => {
  if (!user) {
    window.location.replace("/login.html");
  } else {
    console.log("Usuário logado:", user?.email ?? "Nenhum");
    // Esconder tela de carregamento e mostrar conteúdo principal
    const loadingScreen = document.getElementById("loading-screen");
    const mainContent = document.querySelector(".main");
    if (loadingScreen) loadingScreen.style.display = "none";
    if (mainContent) mainContent.style.display = "block";
  }
});

function logout() {
  signOut(Auth)
    .then(() => {
      console.log("Usuário deslogado com sucesso");
      window.location.replace("/login.html");
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
