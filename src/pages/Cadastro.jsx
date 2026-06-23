import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { auth } from '../firebase/config'
import AuthLayout from '../components/AuthLayout'
import InputField from '../components/InputField'

const FIREBASE_ERRORS = {
  'auth/email-already-in1-use': 'Este email já está cadastrado.',
  'auth/weak-password': 'Senha muito fraca. Use pelo menos 8 caracteres.',
  'auth/invalid-email': 'Email inválido.',
}

function validate(fields) {
  const { nome, telefone, email, idLoovi, senha, confirmarSenha } = fields
  const errors = {}

  if (!nome.trim()) errors.nome = 'Nome obrigatório.'

  if (!telefone.trim()) {
    errors.telefone = 'Telefone obrigatório.'
  } else if (!/^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/.test(telefone.replace(/\s/g, ''))) {
    errors.telefone = 'Formato inválido. Ex: (11) 99999-9999'
  }

  if (!email) errors.email = 'Email obrigatório.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Email inválido.'

  if (!idLoovi.trim()) errors.idLoovi = 'ID Loovi obrigatório.'

  if (!senha) errors.senha = 'Senha obrigatória.'
  else if (senha.length < 8) errors.senha = 'Mínimo de 8 caracteres.'

  if (!confirmarSenha) errors.confirmarSenha = 'Confirmação obrigatória.'
  else if (senha !== confirmarSenha) errors.confirmarSenha = 'As senhas não coincidem.'

  return errors
}

export default function Cadastro() {
  const navigate = useNavigate()
  const [fields, setFields] = useState({
    nome: '', telefone: '', email: '', idLoovi: '', senha: '', confirmarSenha: '',
  })
  const [errors, setErrors] = useState({})
  const [firebaseError, setFirebaseError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(field) {
    return e => setFields(prev => ({ ...prev, [field]: e.target.value }))
  }

  async function handleCadastrar() {
    setFirebaseError('')
    const errs = validate(fields)
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setLoading(true)
    try {
      const { user } = await createUserWithEmailAndPassword(auth, fields.email, fields.senha)
      await updateProfile(user, { displayName: fields.nome })
      navigate('/login')
    } catch (err) {
      setFirebaseError(FIREBASE_ERRORS[err.code] ?? 'Erro ao cadastrar. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout>
      <h2 className="text-xl font-semibold text-gray-800 mb-6">Criar conta</h2>

      <div className="flex flex-col gap-4">
        <InputField id="nome" label="Nome" value={fields.nome} onChange={set('nome')} error={errors.nome} placeholder="Seu nome completo" autoComplete="name" />
        <InputField id="telefone" label="Telefone" value={fields.telefone} onChange={set('telefone')} error={errors.telefone} placeholder="(11) 99999-9999" autoComplete="tel" />
        <InputField id="email" label="Email" type="email" value={fields.email} onChange={set('email')} error={errors.email} placeholder="seu@email.com" autoComplete="email" />
        <InputField id="idLoovi" label="ID Loovi" value={fields.idLoovi} onChange={set('idLoovi')} error={errors.idLoovi} placeholder="Ex: 45811" />
        <InputField id="senha" label="Senha" type="password" value={fields.senha} onChange={set('senha')} error={errors.senha} placeholder="Mínimo 8 caracteres" autoComplete="new-password" />
        <InputField id="confirmarSenha" label="Confirmar Senha" type="password" value={fields.confirmarSenha} onChange={set('confirmarSenha')} error={errors.confirmarSenha} placeholder="Repita a senha" autoComplete="new-password" />

        {firebaseError && (
          <p role="alert" className="text-sm text-red-500 text-center">{firebaseError}</p>
        )}

        <button
          onClick={handleCadastrar}
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-[#0A3D91] text-white font-semibold
            hover:bg-[#3E7CB1] transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
        >
          {loading ? 'Cadastrando...' : 'Cadastrar'}
        </button>
      </div>

      <div className="flex justify-center mt-6 text-sm text-gray-500">
        <Link to="/login" className="text-[#0A3D91] hover:underline">
          Já tem uma conta? Fazer login aqui
        </Link>
      </div>
    </AuthLayout>
  )
}
