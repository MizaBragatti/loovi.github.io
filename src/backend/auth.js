import { Auth } from "./FireBaseConfing.js";
import { signInWithEmailAndPassword } from "firebase/auth";

document.getElementById("loginForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value;
  const senha = document.getElementById("password").value;

  const createUser = async () => {
    try {
      const userCrendential = await signInWithEmailAndPassword(
        Auth,
        email,
        senha
      );
  // Redireciona para a página construída: /
  // usar caminho absoluto garante que funcione tanto em dev quanto em build
  window.location.replace("/index.html");
  console.log('Login efetuado, redirecionando para /');

   
    } catch (error) {
      console.error("Error",error.code);
      const errorDiv = document.getElementById("errorMessage");
      errorDiv.textContent = "Email ou senha incorretos. Tente novamente.";
      errorDiv.style.display = "block";
    }

    
  };

  createUser()

});
 