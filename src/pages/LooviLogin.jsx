import { useState } from 'react'
import carImg from '../assets/loovi/car.webp'
import lineImg from '../assets/loovi/line.svg'
import logoImg from '../assets/loovi/logo.svg'

const BASE_URL = 'https://e2ib2uw05e.execute-api.us-east-1.amazonaws.com/producao/autenticacao/v1'

function isValidCPF(cpf) {
  const d = cpf.replace(/\D/g, '')
  if (d.length !== 11 || /^(\d)\1{10}$/.test(d)) return false
  const calc = (len) => {
    let sum = 0
    for (let i = 0; i < len; i++) sum += parseInt(d[i]) * (len + 1 - i)
    const rest = (sum * 10) % 11
    return rest === 10 ? 0 : rest
  }
  return calc(9) === parseInt(d[9]) && calc(10) === parseInt(d[10])
}

async function fetchUserByCpf(cpf) {
  const digits = cpf.replace(/\D/g, '')
  const res = await fetch(`${BASE_URL}/executivo/${digits}`)
  if (!res.ok) throw new Error('CPF não encontrado')
  return res.json()
}

async function requestCode(cpf, channel) {
  const digits = cpf.replace(/\D/g, '')
  const endpoint = channel === 'email'
    ? `${BASE_URL}/executivo/${digits}/codigo-por-email`
    : `${BASE_URL}/executivo/${digits}/codigo-por-sms`
  const res = await fetch(endpoint, { method: 'POST' })
  if (!res.ok) throw new Error('Erro ao enviar código')
  return res.json()
}

async function verifyCode(cpf, code, sessao) {
  const digits = cpf.replace(/\D/g, '')
  const res = await fetch(`${BASE_URL}/executivo/${digits}/verifica-codigo`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ Sessao: sessao, CodigoAutenticacao: code }),
  })
  if (!res.ok) throw new Error('Código inválido')
  return res.json()
}

function LoginLayout({ children }) {
  return (
    <section className="min-h-screen font-[Poppins,sans-serif] overflow-hidden" style={{ backgroundColor: 'rgb(60,50,70)' }}>
      <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        <div className="flex flex-col py-10 px-6 lg:py-[88px] lg:px-24 min-h-screen">
          <div className="hidden lg:flex items-center gap-6 flex-shrink-0 mb-6">
            <img src={logoImg} alt="Loovi Logo" className="h-[21px] w-auto" />
            <p className="text-white text-base font-medium leading-[22px]">Escritório Virtual</p>
          </div>
          <div className="flex flex-col flex-1 w-full">{children}</div>
        </div>

        <div className="hidden lg:flex flex-col items-center justify-end pb-[88px] gap-16 overflow-hidden relative">
          <div className="relative flex items-center justify-center w-full max-w-[360px]">
            <img src={lineImg} alt="" className="absolute w-[100px] h-[900px] top-[18%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-10" />
            <img src={carImg} alt="Car" className="relative w-full max-w-[360px] -top-[20%] z-20" />
          </div>
          <h2 className="text-white text-[32px] font-semibold leading-[45px] text-center whitespace-nowrap">
            Tá na loovi, tá seguro!
          </h2>
        </div>
      </div>
    </section>
  )
}

function BackButton({ onClick }) {
  return (
    <button
      type="button"
      aria-label="Voltar"
      onClick={onClick}
      className="flex items-center justify-center w-12 h-12 rounded-full transition-colors self-start"
      style={{ backgroundColor: 'rgb(231,239,252)' }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="rgb(60,50,70)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </button>
  )
}

function PrimaryButton({ disabled, loading, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="flex items-center justify-center w-full h-14 rounded-lg text-base font-medium transition-all duration-200 border-2 border-transparent disabled:cursor-not-allowed"
      style={{
        backgroundColor: (!disabled && !loading) ? 'rgb(76,107,248)' : 'rgb(235,235,235)',
        color: (!disabled && !loading) ? '#fff' : '#a7acc7',
      }}
    >
      {loading ? 'Aguarde...' : children}
    </button>
  )
}

function StepCPF({ onContinue }) {
  const [cpf, setCpf] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function formatCPF(value) {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
  }

  const isValid = isValidCPF(cpf)

  async function handleContinue() {
    setError('')
    setLoading(true)
    try {
      const data = await fetchUserByCpf(cpf)
      onContinue(cpf, data)
    } catch {
      setError('CPF não encontrado. Verifique e tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col justify-between flex-1">
      <div className="flex flex-col gap-6">
        <h1 className="text-white text-2xl font-semibold leading-[34px]">
          Bem-vindo, Executivo Loovi!
        </h1>
        <h2 className="text-white text-base leading-5 font-medium">
          Seu escritório virtual foi atualizado! A partir de agora, faça login usando o seu{' '}
          <span className="font-bold">CPF</span>.
        </h2>
        <p className="text-white text-sm leading-5 opacity-70">
          Informe seu CPF para continuar.
        </p>

        <div className="flex flex-col gap-1">
          <div
            className="flex flex-col px-4 py-3 min-h-[56px] border rounded-lg transition-colors focus-within:border-[rgb(76,107,248)]"
            style={{ borderColor: error ? 'rgb(239,68,68)' : 'rgb(235,235,235)' }}
          >
            <label className="text-white text-xs font-medium leading-[17px]">CPF</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Digite seu CPF"
              value={cpf}
              onChange={(e) => { setCpf(formatCPF(e.target.value)); setError('') }}
              onKeyDown={(e) => e.key === 'Enter' && isValid && handleContinue()}
              className="w-full text-sm text-white border-none outline-none ring-0 h-6 bg-transparent placeholder:opacity-40 p-0 m-0"
            />
          </div>
          {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-4 mt-10">
        <PrimaryButton disabled={!isValid} loading={loading} onClick={handleContinue}>
          Continuar
        </PrimaryButton>
        <p className="text-[#d5d5d5] text-xs leading-[17px] text-center">
          <a
            href="https://contratos-clientes.s3.amazonaws.com/Condicoes_Gerais_de_Uso_Sales_Platform.pdf"
            target="_blank"
            rel="noreferrer"
            className="underline hover:opacity-80 transition-opacity"
          >
            Termos e condições
          </a>
        </p>
      </div>
    </div>
  )
}

function StepChannel({ cpf, contatos, onBack, onContinue }) {
  const [channel, setChannel] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleContinue() {
    setError('')
    setLoading(true)
    try {
      const data = await requestCode(cpf, channel)
      onContinue(channel, data?.Sessao ?? '')
    } catch {
      setError('Erro ao enviar código. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col justify-between flex-1">
      <div className="flex flex-col gap-10">
        <BackButton onClick={onBack} />

        <div className="flex flex-col gap-3">
          <h1 className="text-white text-2xl font-semibold leading-[34px]">
            Escolha onde quer receber seu código:
          </h1>
          <p className="text-white text-sm leading-5">
            Enviaremos um código de verificação para confirmar sua identidade.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {contatos?.Telefone && (
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="channel"
                value="sms"
                checked={channel === 'sms'}
                onChange={() => { setChannel('sms'); setError('') }}
                className="w-5 h-5 cursor-pointer accent-[rgb(76,107,248)]"
              />
              <span className="text-white text-sm font-medium leading-[22px]">
                SMS — {contatos.Telefone}
              </span>
            </label>
          )}
          {contatos?.Email && (
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="channel"
                value="email"
                checked={channel === 'email'}
                onChange={() => { setChannel('email'); setError('') }}
                className="w-5 h-5 cursor-pointer accent-[rgb(76,107,248)]"
              />
              <span className="text-white text-sm font-medium leading-[22px]">
                E-mail — {contatos.Email}
              </span>
            </label>
          )}
        </div>

        {error && <p className="text-red-400 text-xs">{error}</p>}
      </div>

      <PrimaryButton disabled={!channel} loading={loading} onClick={handleContinue}>
        Continuar
      </PrimaryButton>
    </div>
  )
}

function StepCode({ cpf, channel, sessao, onBack, onSuccess }) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isValid = code.length === 6

  async function handleVerify() {
    setError('')
    setLoading(true)
    let success = false
    try {
      const data = await verifyCode(cpf, code, sessao)
      console.log('[verifica-codigo] resposta:', JSON.stringify(data))

      // Tenta extrair tokens de vários formatos de resposta possíveis
      const body = typeof data?.body === 'string' ? JSON.parse(data.body) : (data?.body ?? data)
      const auth = body?.AuthenticationResult ?? body?.authenticationResult

      const idToken = auth?.IdToken ?? auth?.idToken ?? body?.idToken ?? body?.IdToken ?? body?.id_token
      const accessToken = auth?.AccessToken ?? auth?.accessToken ?? body?.accessToken ?? body?.AccessToken
      const refreshToken = auth?.RefreshToken ?? auth?.refreshToken ?? body?.refreshToken ?? body?.RefreshToken

      if (idToken) localStorage.setItem('idToken', idToken)
      if (accessToken) localStorage.setItem('accessToken', accessToken)
      if (refreshToken) localStorage.setItem('refreshToken', refreshToken)

      if (!localStorage.getItem('idToken')) {
        console.error('[verifica-codigo] token não encontrado na resposta:', JSON.stringify(data))
        throw new Error('Token não recebido')
      }

      success = true
    } catch (err) {
      console.error('[verifica-codigo] erro:', err?.message)
      setError('Código inválido ou expirado. Tente novamente.')
    } finally {
      setLoading(false)
    }
    if (success) onSuccess()
  }

  return (
    <div className="flex flex-col justify-between flex-1">
      <div className="flex flex-col gap-10">
        <BackButton onClick={onBack} />

        <div className="flex flex-col gap-3">
          <h1 className="text-white text-2xl font-semibold leading-[34px]">
            Digite o código recebido
          </h1>
          <p className="text-white text-sm leading-5 opacity-70">
            Enviamos um código para o seu {channel === 'email' ? 'e-mail' : 'telefone'}.
          </p>
        </div>

        <div className="flex flex-col gap-1">
          <div
            className="flex flex-col px-4 py-3 min-h-[56px] border rounded-lg transition-colors focus-within:border-[rgb(76,107,248)]"
            style={{ borderColor: error ? 'rgb(239,68,68)' : 'rgb(235,235,235)' }}
          >
            <label className="text-white text-xs font-medium leading-[17px]">Código</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="Digite o código"
              value={code}
              onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }}
              onKeyDown={(e) => e.key === 'Enter' && isValid && handleVerify()}
              className="w-full text-sm text-white border-none outline-none ring-0 h-6 bg-transparent placeholder:opacity-40 p-0 m-0 tracking-widest"
            />
          </div>
          {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
        </div>
      </div>

      <PrimaryButton disabled={!isValid} loading={loading} onClick={handleVerify}>
        Entrar
      </PrimaryButton>
    </div>
  )
}

export default function LooviLogin() {
  const [step, setStep] = useState(0)
  const [cpf, setCpf] = useState('')
  const [contatos, setContatos] = useState(null)
  const [channel, setChannel] = useState('')
  const [sessao, setSessao] = useState('')

  function handleCpfSuccess(rawCpf, data) {
    setCpf(rawCpf)
    setContatos(data?.Contatos ?? null)
    setStep(1)
  }

  function handleChannelSuccess(selectedChannel, sessionToken) {
    setChannel(selectedChannel)
    setSessao(sessionToken)
    setStep(2)
  }

  return (
    <LoginLayout>
      {step === 0 && (
        <StepCPF onContinue={handleCpfSuccess} />
      )}
      {step === 1 && (
        <StepChannel
          cpf={cpf}
          contatos={contatos}
          onBack={() => setStep(0)}
          onContinue={handleChannelSuccess}
        />
      )}
      {step === 2 && (
        <StepCode
          cpf={cpf}
          channel={channel}
          sessao={sessao}
          onBack={() => setStep(1)}
          onSuccess={() => { window.location.href = '/consulta' }}
        />
      )}
    </LoginLayout>
  )
}
