#!/usr/bin/env node

import http from 'node:http'
import https from 'node:https'

const PORT = process.env.PORT || 8787
const MAX_BODY_BYTES = 1024 * 1024

const ALLOWED_ORIGINS = new Set([
  'https://sistema-de-seguros-loovi.web.app',
  'https://sistema-de-seguros-loovi.firebaseapp.com',
  'https://loovi.github.io',
  'http://localhost:5173',
  'http://localhost:4173',
])

function applyCorsHeaders(req, res) {
  const origin = req.headers.origin

  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin)
    res.setHeader('Vary', 'Origin')
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, requester')
  res.setHeader('Access-Control-Max-Age', '600')
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    let size = 0

    req.on('data', (chunk) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
        req.destroy()
        reject(new Error('payload_too_large'))
        return
      }
      chunks.push(chunk)
    })

    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

function forwardToApi(targetHost, targetPath, body, method, originalHeaders) {
  return new Promise((resolve, reject) => {
    const headers = { ...originalHeaders }
    delete headers.host
    delete headers['accept-encoding']
    headers['referer'] = 'https://escritoriovirtual.loovi.com.br/'
    headers['origin'] = 'https://escritoriovirtual.loovi.com.br'

    if (body && body.length > 0) {
      headers['content-length'] = body.length
    } else {
      delete headers['content-length']
    }

    const upstreamReq = https.request(
      { hostname: targetHost, path: targetPath, method, headers },
      (upstreamRes) => {
        const chunks = []
        upstreamRes.on('data', (chunk) => chunks.push(chunk))
        upstreamRes.on('end', () => {
          resolve({
            statusCode: upstreamRes.statusCode || 502,
            contentType: upstreamRes.headers['content-type'] || 'application/json',
            body: Buffer.concat(chunks),
          })
        })
      }
    )

    upstreamReq.on('error', reject)
    if (body && body.length > 0) upstreamReq.write(body)
    upstreamReq.end()
  })
}

const server = http.createServer(async (req, res) => {
  applyCorsHeaders(req, res)
  console.log(`[proxy] ${req.method} ${req.url}`)

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  let body = null
  if (req.method === 'POST') {
    try {
      body = await readBody(req)
    } catch (err) {
      console.error('[proxy] erro ao ler body:', err.message)
      res.writeHead(413, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: 'payload_too_large' }))
      return
    }
  }

  let targetHost, targetPath

  // SSO / OTP
  if (req.url.startsWith('/api/proxy/api/auth/')) {
    targetHost = 'sso.loovi.app.br'
    targetPath = '/api/auth' + req.url.slice('/api/proxy/api/auth'.length)
    console.log(`[proxy] SSO -> https://${targetHost}${targetPath}`)
  }

  // Compatibilidade com /api/sso/
  else if (req.url.startsWith('/api/sso/')) {
    targetHost = 'sso.loovi.app.br'
    targetPath = '/api/auth' + req.url.slice('/api/sso'.length)
    console.log(`[proxy] SSO -> https://${targetHost}${targetPath}`)
  }

  // API de veículos via /api/proxy/api/veiculos/
  else if (req.url.startsWith('/api/proxy/api/veiculos/')) {
    targetHost = 'api-gateway.loovi.app.br'
    targetPath = '/api/veiculos' + req.url.slice('/api/proxy/api/veiculos'.length)
    console.log(`[proxy] VEICULOS -> https://${targetHost}${targetPath}`)
  }

  // API de veículos via /api/veiculos/
  else if (req.url.startsWith('/api/veiculos/')) {
    targetHost = 'api-gateway.loovi.app.br'
    targetPath = req.url
    console.log(`[proxy] VEICULOS -> https://${targetHost}${targetPath}`)
  }

  // Catálogo de planos SAP via proxy local (evita CORS no navegador).
  else if (req.url.startsWith('/api/proxy/api/sap-cotacao/planos/catalogo/')) {
    targetHost = 'api-gateway.loovi.app.br'
    targetPath = req.url.slice('/api/proxy'.length)
    console.log(`[proxy] SAP COTACAO -> https://${targetHost}${targetPath}`)
  }

  // Contratos ativos do vendedor (SAP) via proxy local (evita CORS no navegador).
  else if (req.url.startsWith('/api/proxy/api/sap-contrato/ativos')) {
    targetHost = 'api-gateway.loovi.app.br'
    targetPath = req.url.slice('/api/proxy'.length)
    console.log(`[proxy] SAP CONTRATO -> https://${targetHost}${targetPath}`)
  }

  // Rota não existente
  else {
    console.warn(`[proxy] rota não encontrada: ${req.method} ${req.url}`)
    res.writeHead(404, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'not_found', path: req.url }))
    return
  }

  // Encaminha para a API
  try {
    const upstream = await forwardToApi(targetHost, targetPath, body, req.method, req.headers)
    console.log(`[proxy] resposta ${upstream.statusCode} <- https://${targetHost}${targetPath}`)
    res.writeHead(upstream.statusCode, { 'Content-Type': upstream.contentType })
    res.end(upstream.body)
  } catch (err) {
    console.error('[proxy] erro ao chamar API:', err.message)
    res.writeHead(502, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ error: 'bad_gateway', message: err.message }))
  }
})

server.on('error', (err) => console.error('[proxy] erro no servidor:', err))
server.listen(PORT, () => console.log(`[proxy] rodando em http://localhost:${PORT}`))
