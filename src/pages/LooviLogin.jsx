import { useState } from 'react'

import carImg from '../assets/loovi/car.webp'
import lineImg from '../assets/loovi/line.svg'
import logoImg from '../assets/loovi/logo.svg'

import { getCodigoVendedorFromToken, fetchContratos } from '../lib/contratosApi'
import { parseJwt } from '../lib/jwt'

const SSO_BASE_URL = 'http://localhost:8787/api/proxy/api/auth/otp'

const SSO_TIPO = 'executivos'
const SSO_CLIENT_ID = 'portal-executivos'

function normalizePhone(digitsOnly) {
  const digits = String(digitsOnly ?? '').replace(/\D/g, '')

  if (!digits) {
    return {
      tel: '',
      telFormatado: '',
    }
  }

  if (digits.length < 10) {
    return {
      tel: '',
      telFormatado: '',
    }
  }

  if (digits.length === 11) {
    return {
      tel: digits,
      telFormatado: `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`,
    }
  }

  if (digits.length === 10) {
    return {
      tel: digits,
      telFormatado: `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`,
    }
  }

  return {
    tel: digits,
    telFormatado: digits,
  }
}

function safeDecode(value) {
  const text = String(value ?? '').trim()

  if (!text) return ''

  try {
    return decodeURIComponent(text)
  } catch {
    return text
  }
}

function isReadableName(value) {
  const text = safeDecode(value)

  if (!text) return false
  if (/\*/.test(text)) return false
  if (text.toLowerCase() === 'executivo loovi') return false

  return text.length >= 3
}

function isReadableEmail(value) {
  const text = safeDecode(value)

  if (!text) return false
  if (/\*/.test(text)) return false

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)
}

function firstNonEmpty(...values) {
  for (const value of values) {
    if (
      value !== null &&
      value !== undefined &&
      String(value).trim() !== ''
    ) {
      return value
    }
  }

  return ''
}

function extractContacts(contatos) {
  if (!contatos) {
    return {
      email: '',
      telefone: '',
    }
  }

  if (
    typeof contatos === 'object' &&
    !Array.isArray(contatos)
  ) {
    const email = firstNonEmpty(
      contatos.Email,
      contatos.email,
      contatos.Mail,
      contatos.mail,
      contatos.E_mail,
      contatos.e_mail
    )

    const telefone = firstNonEmpty(
      contatos.Telefone,
      contatos.telefone,
      contatos.Celular,
      contatos.celular,
      contatos.Whatsapp,
      contatos.whatsapp,
      contatos.Phone,
      contatos.phone
    )

    return {
      email,
      telefone,
    }
  }

  if (Array.isArray(contatos)) {
    let email = ''
    let telefone = ''

    for (const item of contatos) {
      const tipo = String(
        firstNonEmpty(
          item?.Tipo,
          item?.tipo,
          item?.Canal,
          item?.canal
        )
      ).toLowerCase()

      const valor = firstNonEmpty(
        item?.Valor,
        item?.valor,
        item?.Contato,
        item?.contato
      )

      if (!valor) continue

      if (
        !email &&
        (
          tipo.includes('email') ||
          String(valor).includes('@')
        )
      ) {
        email = valor
      }

      if (
        !telefone &&
        (
          tipo.includes('sms') ||
          tipo.includes('telefone') ||
          tipo.includes('celular') ||
          tipo.includes('whatsapp') ||
          /\d{8,}/.test(
            String(valor).replace(/\D/g, '')
          )
        )
      ) {
        telefone = valor
      }
    }

    return {
      email,
      telefone,
    }
  }

  return {
    email: '',
    telefone: '',
  }
}

function findFirstStringByKeyPattern(
  obj,
  pattern,
  seen = new Set()
) {
  if (
    !obj ||
    typeof obj !== 'object' ||
    seen.has(obj)
  ) {
    return ''
  }

  seen.add(obj)

  for (const [key, value] of Object.entries(obj)) {
    if (
      pattern.test(key) &&
      typeof value === 'string' &&
      value.trim()
    ) {
      return value.trim()
    }
  }

  for (const value of Object.values(obj)) {
    if (
      value &&
      typeof value === 'object'
    ) {
      const found = findFirstStringByKeyPattern(
        value,
        pattern,
        seen
      )

      if (found) return found
    }
  }

  return ''
}

function buildExecutivoProfile(data, rawCpf) {
  const executivo =
    data?.Executivo ??
    data?.executivo ??
    data?.Usuario ??
    data?.usuario ??
    {}

  const contatos =
    data?.Contatos ??
    data?.contatos ??
    data?.Canais ??
    data?.canais ??
    executivo?.Contatos ??
    executivo?.contatos ??
    data ??
    {}

  const extracted = extractContacts(contatos)

  const nome = firstNonEmpty(
    data?.Nome,
    data?.nome,
    data?.NomeCompleto,
    data?.nomeCompleto,
    data?.Name,
    data?.name,
    data?.FullName,
    data?.fullName,
    executivo?.Nome,
    executivo?.nome,
    executivo?.NomeCompleto,
    executivo?.nomeCompleto,
    executivo?.Name,
    executivo?.name,
    executivo?.FullName,
    executivo?.fullName,
    findFirstStringByKeyPattern(
      data,
      /nome|name/i
    )
  )

  const email = firstNonEmpty(
    extracted.email,
    contatos?.Email,
    contatos?.email,
    data?.Email,
    data?.email,
    executivo?.Email,
    executivo?.email
  )

  const link = firstNonEmpty(
    data?.Link,
    data?.link,
    data?.LinkContratacao,
    data?.linkContratacao,
    data?.MeuSite,
    data?.meuSite,
    data?.LinkMeuSite,
    data?.linkMeuSite,
    data?.SiteExecutivo,
    data?.siteExecutivo,
    executivo?.Link,
    executivo?.link,
    executivo?.LinkContratacao,
    executivo?.linkContratacao,
    executivo?.MeuSite,
    executivo?.meuSite,
    findFirstStringByKeyPattern(
      data,
      /link|site/i
    )
  )

  const rawPhone = firstNonEmpty(
    extracted.telefone,
    contatos?.Telefone,
    contatos?.telefone,
    data?.Telefone,
    data?.telefone,
    executivo?.Telefone,
    executivo?.telefone
  )

  const phone = normalizePhone(rawPhone)

  return {
    nome,
    email,
    tel: phone.tel,
    telFormatado: phone.telFormatado,
    link: link || '#',
    cpf: String(rawCpf ?? '').replace(/\D/g, ''),
  }
}

function mergeExecutivoProfileWithToken(
  existingProfile,
  token,
  rawCpf
) {
  const payload = parseJwt(token) ?? {}
  const base = existingProfile ?? {}

  const tokenNomeRaw = firstNonEmpty(
    payload?.name,
    payload?.given_name,
    payload?.['custom:nome'],
    payload?.nome
  )

  const tokenEmailRaw = firstNonEmpty(
    payload?.email,
    payload?.['custom:email']
  )

  const tokenPhoneRaw = firstNonEmpty(
    payload?.telefone,
    payload?.phone_number,
    payload?.phone,
    payload?.['custom:phone_number']
  )

  const codigoVendedor =
    payload?.slp ??
    payload?.['custom:slp']

  const tokenLinkRaw = firstNonEmpty(
    payload?.['custom:link'],
    payload?.link,
    payload?.['custom:meusite'],
    payload?.['custom:meuSite'],
    payload?.['custom:site'],
    payload?.['custom:linkContratacao'],
    payload?.website,
    findFirstStringByKeyPattern(
      payload,
      /link|site/i
    )
  )

  const tokenNome = safeDecode(tokenNomeRaw)
  const baseNome = safeDecode(base?.nome)

  const nome = isReadableName(tokenNome)
    ? tokenNome
    : baseNome

  const tokenEmail = safeDecode(tokenEmailRaw)
  const baseEmail = safeDecode(base?.email)

  const email = isReadableEmail(tokenEmail)
    ? tokenEmail
    : (
        isReadableEmail(baseEmail)
          ? baseEmail
          : firstNonEmpty(
              baseEmail,
              tokenEmail
            )
      )

  const tokenPhone = normalizePhone(
    safeDecode(tokenPhoneRaw)
  )

  const basePhone = normalizePhone(
    safeDecode(base?.tel)
  )

  const tel = firstNonEmpty(
    tokenPhone.tel,
    basePhone.tel,
    safeDecode(base?.tel)
  )

  const telFormatado = firstNonEmpty(
    tokenPhone.telFormatado,
    basePhone.telFormatado,
    safeDecode(base?.telFormatado)
  )

  const link = codigoVendedor
    ? `https://loovi.com.br/${codigoVendedor}`
    : firstNonEmpty(
        safeDecode(tokenLinkRaw),
        safeDecode(base?.link),
        '#'
      )

  return {
    nome,
    email,
    tel,
    telFormatado,
    link,
    cpf: String(
      rawCpf ??
      base?.cpf ??
      ''
    ).replace(/\D/g, ''),
  }
}

function getExecutivoProfileFromStorage() {
  try {
    const raw = localStorage.getItem(
      'executivoProfile'
    )

    return raw
      ? JSON.parse(raw)
      : null
  } catch {
    return null
  }
}

function isValidCPF(cpf) {
  const d = cpf.replace(/\D/g, '')

  if (
    d.length !== 11 ||
    /^(\d)\1+$/.test(d)
  ) {
    return false
  }

  let sum = 0

  for (let i = 1; i <= 9; i++) {
    sum +=
      parseInt(
        d.substring(i - 1, i)
      ) *
      (11 - i)
  }

  let rest = (10 * sum) % 11

  if (
    rest === 10 ||
    rest === 11
  ) {
    rest = 0
  }

  if (
    rest !==
    parseInt(
      d.substring(9, 10)
    )
  ) {
    return false
  }

  sum = 0

  for (let i = 1; i <= 10; i++) {
    sum +=
      parseInt(
        d.substring(i - 1, i)
      ) *
      (12 - i)
  }

  rest = (10 * sum) % 11

  if (
    rest === 10 ||
    rest === 11
  ) {
    rest = 0
  }

  return (
    rest ===
    parseInt(
      d.substring(10, 11)
    )
  )
}

function isNetworkError(err) {
  return (
    err instanceof TypeError ||
    /failed to fetch|networkerror|load failed/i.test(
      String(err?.message)
    )
  )
}

const CONNECTION_ERROR_MESSAGE =
  'Não foi possível conectar ao servidor de autenticação. Tente novamente em instantes.'

async function fetchCanais(cpf) {
  const digits = cpf.replace(/\D/g, '')

  const url = `${SSO_BASE_URL}/canais`

  console.log('[otp/canais] POST:', url)

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cpf: digits,
      tipo: SSO_TIPO,
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')

    console.error(
      '[otp/canais] erro:',
      res.status,
      body
    )

    throw new Error(
      'CPF não encontrado'
    )
  }

  return res.json()
}

async function requestCode(cpf, canal) {
  const digits = cpf.replace(/\D/g, '')

  const url = `${SSO_BASE_URL}/request`

  console.log('[otp/request] POST:', url)

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cpf: digits,
      tipo: SSO_TIPO,
      canal,
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')

    console.error(
      '[otp/request] erro:',
      res.status,
      body
    )

    throw new Error(
      'Erro ao enviar código'
    )
  }

  return res.json()
}

async function verifyCode(cpf, codigo) {
  const digits = cpf.replace(/\D/g, '')

  const url = `${SSO_BASE_URL}/verify`

  console.log('[otp/verify] POST:', url)

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      cpf: digits,
      tipo: SSO_TIPO,
      codigo,
      clientId: SSO_CLIENT_ID,
    }),
  })

  if (!res.ok) {
    const body = await res.text().catch(() => '')

    console.error(
      '[otp/verify] resposta:',
      res.status,
      body
    )

    throw new Error(
      'Código inválido'
    )
  }

  return res.json()
}

async function logVendedorEContratos(idToken, accessToken) {
  try {
    const codigoVendedor =
      getCodigoVendedorFromToken(idToken)

    if (!codigoVendedor) {
      console.warn(
        '[login] custom:slp não encontrado no token'
      )

      return
    }

    await fetchContratos(
      codigoVendedor,
      // O access token contém os escopos/audience das APIs de contratos.
      // Mantém o id token apenas para respostas legadas que não o retornem.
      accessToken || idToken
    )
  } catch (err) {
    console.error(
      '[login] erro ao buscar contratos:',
      err?.message
    )
  }
}

function LoginLayout({ children }) {
  return (
    <section
      className="font-[Poppins,sans-serif] overflow-hidden"
      style={{
        backgroundColor: 'rgb(60,50,70)',
      }}
    >
      <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 min-h-screen">

        <div className="flex flex-col items-center justify-center py-10 px-6 lg:py-[88px] lg:px-24 min-h-screen">

          <div className="hidden lg:flex items-center gap-6 flex-shrink-0 mb-6">

            <img
              src={logoImg}
              alt="Loovi Logo"
              className="h-[21px] w-auto"
            />

            <p className="text-white text-base font-medium leading-[22px]">
              Escritório Virtual
            </p>

          </div>

          <div className="flex flex-col flex-1 w-full max-w-[540px]">
            {children}
          </div>

        </div>

        <div className="hidden lg:flex flex-col items-center justify-end pb-[88px] gap-16 overflow-hidden relative">

          <div className="relative flex items-center justify-center w-full max-w-[360px]">

            <img
              src={lineImg}
              alt=""
              className="absolute w-[100px] h-[900px] top-[18%] left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
            />

            <img
              src={carImg}
              alt="Car"
              className="relative w-full max-w-[360px] -top-[20%] z-20"
            />

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
      style={{
        backgroundColor: 'rgb(231,239,252)',
      }}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-4 h-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="rgb(60,50,70)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="15 18 9 12 15 6" />
      </svg>
    </button>
  )
}

function PrimaryButton({
  disabled,
  loading,
  onClick,
  children,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className="flex items-center justify-center w-full h-14 rounded-lg text-base font-medium transition-all duration-200 border-2 border-transparent disabled:cursor-not-allowed"
      style={{
        backgroundColor:
          !disabled && !loading
            ? 'rgb(76,107,248)'
            : 'rgb(235,235,235)',
        color:
          !disabled && !loading
            ? '#fff'
            : '#a7acc7',
      }}
    >
      {loading
        ? 'Aguarde...'
        : children}
    </button>
  )
}

function StepCPF({ onContinue }) {
  const [cpf, setCpf] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function formatCPF(value) {
    const digits = value
      .replace(/\D/g, '')
      .slice(0, 11)

    return digits
      .replace(
        /(\d{3})(\d)/,
        '$1.$2'
      )
      .replace(
        /(\d{3})(\d)/,
        '$1.$2'
      )
      .replace(
        /(\d{3})(\d{1,2})$/,
        '$1-$2'
      )
  }

  const isValid = isValidCPF(cpf)

  const showInvalid =
    cpf.replace(/\D/g, '').length === 11 &&
    !isValid

  async function handleContinue() {
    setError('')
    setLoading(true)

    try {
      const data = await fetchCanais(cpf)

      onContinue(
        cpf,
        data
      )
    } catch (err) {
      console.error(
        '[otp/canais] erro:',
        err?.message
      )

      setError(
        isNetworkError(err)
          ? CONNECTION_ERROR_MESSAGE
          : 'CPF não encontrado. Verifique e tente novamente.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col justify-around flex-1">

      <div className="flex flex-col gap-6">

        <h1 className="text-white text-2xl font-semibold leading-[34px] mt-[55px]">
          Bem-vindo, Executivo Loovi!
        </h1>

        <h2 className="text-white text-base leading-5 font-medium">
          Seu escritório virtual foi atualizado! A partir de agora,
          faça login usando o seu{' '}
          <span className="font-bold">
            CPF
          </span>.
        </h2>

        <p className="text-white text-sm leading-5 opacity-70">
          Informe seu CPF para continuar.
        </p>

        <div className="flex flex-col gap-1">

          <div
            className="flex flex-col px-4 py-3 min-h-[56px] border rounded-lg transition-colors focus-within:border-[rgb(76,107,248)]"
            style={{
              borderColor:
                error || showInvalid
                  ? 'rgb(239,68,68)'
                  : 'rgb(235,235,235)',
            }}
          >

            <label className="text-white text-xs font-medium leading-[18px]">
              CPF
            </label>

            <input
              type="text"
              inputMode="numeric"
              placeholder="Digite seu CPF"
              value={cpf}
              onChange={(e) => {
                setCpf(
                  formatCPF(
                    e.target.value
                  )
                )

                setError('')
              }}
              onKeyDown={(e) =>
                e.key === 'Enter' &&
                isValid &&
                handleContinue()
              }
              className="w-full text-sm text-white border-none outline-none ring-0 h-6 bg-transparent placeholder:opacity-40 p-0 m-0"
            />

          </div>

          {error ? (
            <p className="text-red-400 text-xs mt-1">
              {error}
            </p>
          ) : (
            showInvalid && (
              <p className="text-red-400 text-xs mt-1">
                CPF inválido. Verifique os dígitos digitados.
              </p>
            )
          )}

        </div>

      </div>

      <div className="flex flex-col gap-4 mt-10">

        <PrimaryButton
          disabled={!isValid}
          loading={loading}
          onClick={handleContinue}
        >
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

function StepChannel({
  cpf,
  contatos,
  onBack,
  onContinue,
}) {
  const [channel, setChannel] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleContinue() {
    setError('')
    setLoading(true)

    try {
      await requestCode(
        cpf,
        channel
      )

      onContinue(channel)
    } catch (err) {
      console.error(
        '[otp/request] erro:',
        err?.message
      )

      setError(
        isNetworkError(err)
          ? CONNECTION_ERROR_MESSAGE
          : 'Erro ao enviar código. Tente novamente.'
      )
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
                onChange={() => {
                  setChannel('sms')
                  setError('')
                }}
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
                onChange={() => {
                  setChannel('email')
                  setError('')
                }}
                className="w-5 h-5 cursor-pointer accent-[rgb(76,107,248)]"
              />

              <span className="text-white text-sm font-medium leading-[22px]">
                E-mail — {contatos.Email}
              </span>

            </label>
          )}

        </div>

        {error && (
          <p className="text-red-400 text-xs">
            {error}
          </p>
        )}

      </div>

      <PrimaryButton
        disabled={!channel}
        loading={loading}
        onClick={handleContinue}
      >
        Continuar
      </PrimaryButton>

    </div>
  )
}

function StepCode({
  cpf,
  channel,
  onBack,
  onSuccess,
}) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isValid = code.length === 6

  async function handleVerify() {
    setError('')
    setLoading(true)

    let success = false

    try {
      const data = await verifyCode(
        cpf,
        code
      )

      const body =
        typeof data?.body === 'string'
          ? JSON.parse(data.body)
          : (
              data?.body ??
              data
            )

      const auth =
        body?.AuthenticationResult ??
        body?.authenticationResult ??
        body

      const idToken = firstNonEmpty(
        auth?.idToken,
        auth?.IdToken,
        auth?.id_token,
        auth?.accessToken,
        auth?.AccessToken,
        auth?.access_token,
        auth?.token,
        auth?.Token,
        findFirstStringByKeyPattern(
          body,
          /token/i
        )
      )

      const accessToken = firstNonEmpty(
        auth?.accessToken,
        auth?.AccessToken,
        auth?.access_token,
        idToken
      )

      const refreshToken = firstNonEmpty(
        auth?.refreshToken,
        auth?.RefreshToken,
        auth?.refresh_token
      )

      console.log(
        '[otp/verify] resposta bruta:',
        body
      )

      console.log(
        '[otp/verify] idToken capturado:',
        idToken ? parseJwt(idToken) : null
      )

      console.log(
        '[otp/verify] accessToken capturado:',
        accessToken ? parseJwt(accessToken) : null
      )

      if (idToken) {
        localStorage.setItem(
          'idToken',
          idToken
        )
      }

      if (accessToken) {
        localStorage.setItem(
          'accessToken',
          accessToken
        )
      }

      if (refreshToken) {
        localStorage.setItem(
          'refreshToken',
          refreshToken
        )
      }

      const storedProfile =
        getExecutivoProfileFromStorage()

      let refreshedProfile =
        storedProfile

      try {
        const refreshedData =
          await fetchCanais(cpf)

        const fresh =
          buildExecutivoProfile(
            refreshedData,
            cpf
          )

        refreshedProfile = {
          nome: firstNonEmpty(
            storedProfile?.nome,
            fresh?.nome
          ),
          email: firstNonEmpty(
            storedProfile?.email,
            fresh?.email
          ),
          tel: firstNonEmpty(
            storedProfile?.tel,
            fresh?.tel
          ),
          telFormatado: firstNonEmpty(
            storedProfile?.telFormatado,
            fresh?.telFormatado
          ),
          link: firstNonEmpty(
            storedProfile?.link,
            fresh?.link,
            '#'
          ),
          cpf: firstNonEmpty(
            storedProfile?.cpf,
            fresh?.cpf,
            cpf
          ),
        }
      } catch {
        // Mantém o fluxo de login mesmo se o refresh falhar.
      }

      const mergedProfile =
        mergeExecutivoProfileWithToken(
          refreshedProfile,
          idToken,
          cpf
        )

      localStorage.setItem(
        'executivoProfile',
        JSON.stringify(
          mergedProfile
        )
      )

      if (
        !localStorage.getItem('idToken')
      ) {
        console.error(
          '[otp/verify] token não encontrado na resposta'
        )

        throw new Error(
          'Token não recebido'
        )
      }

      success = true

      logVendedorEContratos(
        idToken,
        accessToken
      )

    } catch (err) {
      console.error(
        '[otp/verify] erro:',
        err?.message
      )

      setError(
        isNetworkError(err)
          ? CONNECTION_ERROR_MESSAGE
          : 'Código inválido ou expirado. Tente novamente.'
      )
    } finally {
      setLoading(false)
    }

    if (success) {
      onSuccess()
    }
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
            Enviamos um código para o seu{' '}
            {channel === 'email'
              ? 'e-mail'
              : 'telefone'}.
          </p>

        </div>

        <div className="flex flex-col gap-1">

          <div
            className="flex flex-col px-4 py-3 min-h-[56px] border rounded-lg transition-colors focus-within:border-[rgb(76,107,248)]"
            style={{
              borderColor: error
                ? 'rgb(239,68,68)'
                : 'rgb(235,235,235)',
            }}
          >

            <label className="text-white text-xs font-medium leading-[17px]">
              Código
            </label>

            <input
              type="text"
              inputMode="numeric"
              placeholder="Digite o código"
              value={code}
              onChange={(e) => {
                setCode(
                  e.target.value
                    .replace(/\D/g, '')
                    .slice(0, 6)
                )

                setError('')
              }}
              onKeyDown={(e) =>
                e.key === 'Enter' &&
                isValid &&
                handleVerify()
              }
              className="w-full text-sm text-white border-none outline-none ring-0 h-6 bg-transparent placeholder:opacity-40 p-0 m-0 tracking-widest"
            />

          </div>

          {error && (
            <p className="text-red-400 text-xs mt-1">
              {error}
            </p>
          )}

        </div>

      </div>

      <PrimaryButton
        disabled={!isValid}
        loading={loading}
        onClick={handleVerify}
      >
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

  function handleCpfSuccess(
    rawCpf,
    data
  ) {
    const executivoProfile =
      buildExecutivoProfile(
        data,
        rawCpf
      )

    localStorage.setItem(
      'executivoProfile',
      JSON.stringify(
        executivoProfile
      )
    )

    setCpf(rawCpf)

    const contatosRaw =
      data?.Contatos ??
      data?.contatos ??
      data?.Canais ??
      data?.canais ??
      data

    const contatosExtracted =
      extractContacts(contatosRaw)

    setContatos({
      Telefone:
        contatosExtracted.telefone,
      Email:
        contatosExtracted.email,
    })

    setStep(1)
  }

  function handleChannelSuccess(
    selectedChannel
  ) {
    setChannel(
      selectedChannel
    )

    setStep(2)
  }

  return (
    <LoginLayout>

      {step === 0 && (
        <StepCPF
          onContinue={
            handleCpfSuccess
          }
        />
      )}

      {step === 1 && (
        <StepChannel
          cpf={cpf}
          contatos={contatos}
          onBack={() =>
            setStep(0)
          }
          onContinue={
            handleChannelSuccess
          }
        />
      )}

      {step === 2 && (
        <StepCode
          cpf={cpf}
          channel={channel}
          onBack={() =>
            setStep(1)
          }
          onSuccess={() => {
            window.location.href =
              '/consulta'
          }}
        />
      )}

    </LoginLayout>
  )
}
