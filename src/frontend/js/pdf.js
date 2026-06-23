export async function gerarPDF(nomeArquivo) {
  try {
    const placaOrValue = document.getElementById('placaOrValue')?.value || document.getElementById('placa')?.value || '';
    if (window.ui && typeof window.ui.verificarVendedor === 'function') window.ui.verificarVendedor();

    const fraseUnificada  = document.getElementById('fraseUnificada')?.value || '';
    const totalEssencial  = document.getElementById('totalEssencial')?.textContent || '';
    const totalCompleto   = document.getElementById('totalCompleto')?.textContent || '';
    const primeiraEssencial = document.getElementById('primeiraMensalidadeEssencial')?.textContent || '';
    const primeiraCompleto  = document.getElementById('primeiraMensalidadeCompleto')?.textContent || '';

    const vendedor = (window.ui && window.ui.vendedor) ? window.ui.vendedor : null;

    const html = `<!doctype html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><title>${nomeArquivo}</title><style>body{font-family:Arial,Helvetica,sans-serif;color:#222}header{background:#0a3d91;color:#fff;padding:12px;text-align:center}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ddd;padding:8px;text-align:left}</style></head><body><header><h2>Loovi Seguros</h2></header><main style="padding:16px"><h3>${nomeArquivo}</h3><p><strong>Placa / Valor FIPE:</strong> ${placaOrValue}</p><h4>Frase</h4><p>${fraseUnificada}</p><h4>Valores</h4><table><tr><th>Item</th><th>Valor</th></tr><tr><td>Primeira Mensalidade</td><td>${nomeArquivo.includes('Essencial')?primeiraEssencial:primeiraCompleto}</td></tr><tr><td>Total Mensal</td><td>${nomeArquivo.includes('Completo')?totalCompleto:totalEssencial}</td></tr></table>${vendedor?`<h4>Vendedor</h4><p>${vendedor.nome} — ${vendedor.telFormatado ?? vendedor.tel}</p>`:''}</main></body></html>`;

    const postData = {
      fileName: nomeArquivo + '.pdf',
      html,
      options: {
        landscape: false,
        displayHeaderFooter: false,
        marginBottom: 0, marginLeft: 0, marginRight: 0, marginTop: 0,
        pageRanges: 1,
        preferCSSPageSize: true
      }
    };

    const resp = await fetch('https://v2.api2pdf.com/chrome/pdf/html', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': '930cabb8-33e2-4ecc-80bf-f45d4f3173bd'
      },
      body: JSON.stringify(postData)
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error('Api2Pdf error: ' + resp.status + ' ' + text);
    }

    const data = await resp.json();
    if (data && data.FileUrl) {
      window.open(data.FileUrl, '_blank');
    } else if (data && data.file && data.file.url) {
      window.open(data.file.url, '_blank');
    } else {
      throw new Error('Resposta inesperada da Api2Pdf: ' + JSON.stringify(data));
    }
  } catch (e) {
    alert('Erro ao gerar PDF: ' + (e.message || e));
  }
}

export function verificarPlaca() {
  if (window.ui && typeof window.ui.checkPlate === 'function') {
    window.ui.checkPlate();
    return;
  }
  const placaField = document.getElementById('placa') || document.getElementById('placaOrValue');
  if (!placaField) return;
  const placa = placaField.value || '';
  const valor = parseInt(placa.replace(/\D/g, ''));
  if (Number.isInteger(valor) && valor > 0) {
    if (typeof buscaValor === 'function') buscaValor();
  } else {
    if (placa.length == 7 && typeof buscaPlaca === 'function') buscaPlaca(placa);
  }
}
