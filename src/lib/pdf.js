import {
  htmlStyle,
  htmlHeader,
  htmlBeneficiosInicio,
  htmlContainerInicio,
  htmlDadosPlanoInicio,
  htmlEssencial,
  htmlDireitoInicio,
  htmlColisao,
  htmlVidros,
  htmlDireitoFim,
  htmlDadosPlanoFim,
  montarHtmlBaixo,
  htmlContainerFim,
  htmlBeneficiosFim,
  htmlFooter,
} from './pdfTemplate'

const API2PDF_URL = 'https://v2.api2pdf.com/chrome/pdf/html'
const API2PDF_KEY = '930cabb8-33e2-4ecc-80bf-f45d4f3173bd'

function buildHTML(nomeArquivo, vendedor) {
  const htmlBaixo = montarHtmlBaixo(vendedor)
  let corpo

  if (nomeArquivo === 'PDF-Essencial') {
    corpo = htmlBeneficiosInicio + htmlContainerInicio +
      htmlDadosPlanoInicio + htmlEssencial('Essencial') + htmlDadosPlanoFim +
      htmlBaixo + htmlContainerFim + htmlBeneficiosFim
  } else if (nomeArquivo === 'PDF-Completo') {
    corpo = htmlBeneficiosInicio + htmlContainerInicio + htmlDadosPlanoInicio + htmlEssencial('Completo') +
      htmlDireitoInicio + htmlColisao + htmlVidros + htmlDireitoFim + htmlDadosPlanoFim +
      htmlBaixo + htmlContainerFim + htmlBeneficiosFim
  } else {
    corpo = htmlBeneficiosInicio + htmlContainerInicio + htmlDadosPlanoInicio + htmlEssencial('Completo - Sem vidros') +
      htmlDireitoInicio + htmlColisao + htmlDireitoFim + htmlDadosPlanoFim +
      htmlBaixo + htmlContainerFim + htmlBeneficiosFim
  }

  return htmlStyle + htmlHeader + corpo + htmlFooter
}

export async function gerarPDF(nomeArquivo, { vendedor } = {}) {
  // Aberta de forma síncrona (dentro do clique) para não ser bloqueada pelo
  // bloqueador de pop-ups: abrir depois de um await perde o "gesto do usuário".
  // Só navega para o PDF de fato quando a geração terminar; até lá mostra um aviso.
  const pdfWindow = window.open('', '_blank')
  if (pdfWindow) {
    pdfWindow.document.write('<!doctype html><html><head><meta charset="utf-8"/><title>Gerando PDF...</title></head><body style="font-family:Arial,Helvetica,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;color:#0A3D91"><p>Gerando PDF, aguarde...</p></body></html>')
    pdfWindow.document.close()
  }

  const html = buildHTML(nomeArquivo, vendedor)
  const body = JSON.stringify({
    fileName: nomeArquivo + '.pdf',
    html,
    options: { landscape: false, displayHeaderFooter: false, marginBottom: 0, marginLeft: 0, marginRight: 0, marginTop: 0, pageRanges: 1, preferCSSPageSize: true },
  })

  try {
    const resp = await fetch(API2PDF_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: API2PDF_KEY },
      body,
    })
    if (!resp.ok) throw new Error(`Api2Pdf error: ${resp.status}`)
    const data = await resp.json()
    const url = data?.FileUrl ?? data?.file?.url
    if (!url) throw new Error('Resposta inesperada da Api2Pdf')
    if (pdfWindow) pdfWindow.location.href = url
    else window.open(url, '_blank')
  } catch (e) {
    if (pdfWindow) pdfWindow.close()
    throw e
  }
}
