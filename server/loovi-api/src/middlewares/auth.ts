import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import jwksClient from 'jwks-rsa'
import { AppError } from '../lib/httpError.js'
import { env } from '../config/env.js'

// Reaproveita o mesmo token de sessão do SSO da Loovi (RS256) usado pelo
// portal/proxy - assim nossa API aceita exatamente o token que o usuário já
// tem, sem precisar de um login próprio. Chaves públicas vêm do JWKS oficial
// e ficam em cache (evita bater no SSO a cada requisição).
const jwks = jwksClient({
  jwksUri: `${env.LOOVI_SSO_ISSUER}/.well-known/jwks.json`,
  cache: true,
  cacheMaxAge: 10 * 60 * 1000,
  rateLimit: true,
})

function getSigningKey(kid: string): Promise<string> {
  return new Promise((resolve, reject) => {
    jwks.getSigningKey(kid, (err, key) => {
      if (err || !key) return reject(err ?? new Error('Chave de assinatura não encontrada.'))
      resolve(key.getPublicKey())
    })
  })
}

declare module 'express-serve-static-core' {
  interface Request {
    auth?: { slp?: string; sub?: string; email?: string }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? ''
  const [scheme, token] = header.split(' ')

  if (scheme !== 'Bearer' || !token) {
    return next(new AppError(401, 'NAO_AUTENTICADO', 'Token de autenticação ausente.'))
  }

  const decoded = jwt.decode(token, { complete: true })
  const kid = decoded?.header.kid
  if (!decoded || !kid) {
    return next(new AppError(401, 'TOKEN_INVALIDO', 'Token de autenticação inválido.'))
  }

  try {
    const publicKey = await getSigningKey(kid)
    const payload = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
      issuer: env.LOOVI_SSO_ISSUER,
    }) as jwt.JwtPayload

    req.auth = {
      slp: (payload.slp ?? payload['custom:slp']) as string | undefined,
      sub: payload.sub,
      email: payload.email as string | undefined,
    }
    next()
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      return next(new AppError(401, 'TOKEN_EXPIRADO', 'Sessão expirada. Faça login novamente.'))
    }
    return next(new AppError(401, 'TOKEN_INVALIDO', 'Token de autenticação inválido.'))
  }
}
