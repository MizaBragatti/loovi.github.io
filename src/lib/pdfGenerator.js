const API2PDF_URL = 'https://v2.api2pdf.com/chrome/pdf/html';
const API2PDF_KEY = '930cabb8-33e2-4ecc-80bf-f45d4f3173bd';

export const VENDEDORES = {
  miza: { nome: 'Mizael Bragatti', email: 'mizabgt@gmail.com', telFormatado: '(11) 980.449.766', tel: '11980449766', link: 'https://loovi.com.br/45811' },
  sofia: { nome: 'Sofia Almeida', email: 'sofia.ar37@gmail.com', telFormatado: '(11) 990.229.186', tel: '11990229186', link: 'https://loovi.com.br/25075' },
  nicolas: { nome: 'Nicolas', email: 'nicolas@loovi.com.br', telFormatado: '(11) 999.999.999', tel: '11999999999', link: 'https://loovi.com.br/xxxxx' },
};

function buildHTML(nomeArquivo, placaOrValue, frase, valores, vendedor) {
  const { primeiraEntry, mensalEntry, anualEntry } = valores;
  const vnd = vendedor ? `<h4>Vendedor</h4><p>${vendedor.nome} — ${vendedor.telFormatado}</p>` : '';
  return `<!doctype html><html><head><meta charset="utf-8"/><title>${nomeArquivo}</title>
<style>body{font-family:Arial,Helvetica,sans-serif;color:#222;margin:0;padding:16px}
header{background:#0a3d91;color:#fff;padding:12px;text-align:center;margin:-16px -16px 16px}
table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}
th{background:#f0f4ff}</style></head>
<body><header><h2>Loovi Seguros</h2></header>
<h3>${nomeArquivo}</h3>
<p><strong>Placa / Valor FIPE:</strong> ${placaOrValue}</p>
<h4>Proposta</h4><p>${frase}</p>
<h4>Valores</h4>
<table><tr><th>Item</th><th>Valor</th></tr>
<tr><td>1ª Mensalidade (com ativação)</td><td>${primeiraEntry}</td></tr>
<tr><td>Mensalidade</td><td>${mensalEntry}</td></tr>
<tr><td>Total Anual</td><td>${anualEntry}</td></tr>
</table>${vnd}</body></html>`;
}

export async function gerarPDF(nomeArquivo, { placaOrValue, frase, valores, vendedor }) {
  const html = buildHTML(nomeArquivo, placaOrValue, frase, valores, vendedor);
  const body = JSON.stringify({
    fileName: nomeArquivo + '.pdf',
    html,
    options: { landscape: false, displayHeaderFooter: false, marginBottom: 0, marginLeft: 0, marginRight: 0, marginTop: 0, pageRanges: 1, preferCSSPageSize: true },
  });
  const resp = await fetch(API2PDF_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: API2PDF_KEY },
    body,
  });
  if (!resp.ok) throw new Error(`Api2Pdf error: ${resp.status}`);
  const data = await resp.json();
  const url = data?.FileUrl ?? data?.file?.url;
  if (!url) throw new Error('Resposta inesperada da Api2Pdf');
  window.open(url, '_blank');
}
