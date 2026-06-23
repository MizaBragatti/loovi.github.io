import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../firebase/config'
import AuthLayout from '../components/AuthLayout'
import InputField from '../components/InputField'

const FIREBASE_ERRORS = {
  'auth/invalid-credential': 'Email ou senha incorretos.',
  'auth/user-not-found': 'Nenhuma conta encontrada com este email.',
  'auth/wrong-password': 'Senha incorreta.',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
}

function validate(email, senha) {
  const errors = {}
  if (!email) errors.email = 'Email obrigatório.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Email inválido.'
  if (!senha) errors.senha = 'Senha obrigatória.'
  return errors
}

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [errors, setErrors] = useState({})
  const [firebaseError, setFirebaseError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleEntrar() {
    setFirebaseError('')
    const errs = validate(email, senha)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, senha)
      window.location.replace('/sistemaSeguros.html')
    } catch (err) {
      setFirebaseError(FIREBASE_ERRORS[err.code] ?? 'Erro ao entrar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Entrar</h2>

      <div className="flex flex-col gap-4">
        <InputField
          id="email"
          label="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          error={errors.email}
          placeholder="seu@email.com"
          autoComplete="email"
        />
        <InputField
          id="senha"
          label="Senha"
          type="password"
          value={senha}
          onChange={e => setSenha(e.target.value)}
          error={errors.senha}
          placeholder="••••••••"
          autoComplete="current-password"
        />

        {firebaseError && (
          <p role="alert" className="text-sm text-red-500 text-center">{firebaseError}</p>
        )}

        <button
          onClick={handleEntrar}
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-[#0A3D91] text-white font-semibold
            hover:bg-[#3E7CB1] transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </div>

      <div className="flex flex-col items-center gap-2 mt-6 text-sm text-gray-500">
        <Link to="/cadastro" className="text-[#0A3D91] hover:underline">
          Ainda não tem uma conta? Cadastre-se aqui
        </Link>
        <Link to="/login-clientes" className="text-[#3E7CB1] hover:underline">
          Acessar Login de Clientes
        </Link>
      </div>
    </AuthLayout>
  )
}
