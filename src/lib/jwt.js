export function parseJwt(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

// Usa nbf/iat do token (hora do servidor) em vez do relógio local, que pode
// estar dessincronizado no SO do usuário e gerar buscas em período futuro.
export function getServerNowSeconds(token) {
  const payload = parseJwt(token);
  if (typeof payload?.nbf === 'number') return payload.nbf;
  if (typeof payload?.iat === 'number') return payload.iat;
  return null;
}

export function isJwtExpired(token) {
  const payload = parseJwt(token);
  if (!payload || typeof payload.exp !== 'number') return true;
  return Date.now() >= payload.exp * 1000;
}
