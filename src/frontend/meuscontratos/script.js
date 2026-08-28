let clientesData = [];
let filtroAtual = "todos";

const idVendedorLoovi = "27140";
const url = `https://pag45vto72.execute-api.us-east-1.amazonaws.com/producao/v1/saphana/executivo/api/v1/${idVendedorLoovi}`;
const key = "";
async function carregarDados() {
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${key}`,
      },
    });
    clientesData = await response.json();
    console.log(clientesData);
    atualizarEstatisticas();
    renderizarClientes();
  } catch (error) {}
}

carregarDados();

function atualizarEstatisticas() {
  const total = clientesData.length;
  const adimplentes = clientesData.filter(
    (c) => c.statusFinanceiro === "Adimplente",
  ).length;
  const inadimplentes = clientesData.filter(
    (c) => c.statusFinanceiro === "Inadimplente",
  ).length;
  const ativos = clientesData.filter((c) => !c.cancelado).length;

  document.getElementById("totalClientes").textContent = total;
  document.getElementById("totalAdimplentes").textContent = adimplentes;
  document.getElementById("totalInadimplentes").textContent = inadimplentes;
  document.getElementById("totalAtivos").textContent = ativos;
}

function formatarData(dataISO) {
  if (!dataISO) return "N/A";
  const data = new Date(dataISO);
  return data.toLocaleDateString("pt-BR");
}

function formatarValor(valor) {
  if (valor === undefined || valor === null || valor === 0) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);
}

function formatarCPF(cpf) {
  if (!cpf || cpf.length !== 11) return cpf;
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatarTelefone(telefone) {
  if (!telefone) return "N/A";
  if (telefone.length === 11) {
    return telefone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  return telefone;
}

function criarCardCliente(cliente) {
  const statusClass =
    cliente.statusFinanceiro === "Adimplente"
      ? "status-adimplente"
      : cliente.statusFinanceiro === "Inadimplente"
        ? "status-inadimplente"
        : "status-cancelado";

  return `
                <div class="client-card" data-status="${cliente.statusFinanceiro.toLowerCase()}" data-cancelado="${cliente.cancelado}">
                    <div class="client-header">
                        <div class="client-name">${cliente.nomeCliente || "Nome não informado"}</div>
                        <div class="client-code">Código: ${cliente.codCliente}</div>
                        <span class="status-badge ${statusClass}">
                            ${cliente.cancelado ? "❌ Cancelado" : cliente.statusFinanceiro}
                        </span>
                    </div>
                    <div class="client-info">
                      <div class="info-row">
                            <span class="info-label">IdIndicação</span>
                            <span class="info-value"> ${cliente.idIndicacao || "Não informado"}
                            </span>
                        </div>
                       <div class="info-row">
                            <span class="info-label">idAfiliado</span>
                            <span class="info-value">${formatarCPF(
                              cliente.idIndicacaoAfiliado || "Não informado",
                            )}</span>
                        </div>
                     
                        <div class="info-row">
                            <span class="info-label">CPF:</span>
                            <span class="info-value">${formatarCPF(cliente.cpf)}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">E-mail:</span>
                            <span class="info-value">${cliente.email || "N/A"}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Telefone:</span>
                            <span class="info-value">${formatarTelefone(cliente.telefone)}</span>
                        </div>
                        ${
                          cliente.placa
                            ? `
                        <div class="info-row">
                            <span class="info-label">Placa:</span>
                            <span class="info-value">${cliente.placa.toUpperCase()}</span>
                        </div>
                        `
                            : ""
                        }
                        <div class="info-row">
                            <span class="info-label">Contrato SAP:</span>
                            <span class="info-value">${cliente.contratoSap}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Plano:</span>
                            <span class="info-value">${cliente.idPlano}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Tipo:</span>
                            <span class="info-value">${cliente.tipoPlano}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Vencimento:</span>
                            <span class="info-value">Dia ${cliente.diaVencimento}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Início Contrato:</span>
                            <span class="info-value">${formatarData(cliente.dataInicioContrato)}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Vigência:</span>
                            <span class="info-value">${formatarData(cliente.dataInicioVigencia)} - ${formatarData(cliente.dataFimVigencia)}</span>
                        </div>
                        ${
                          cliente.cancelado && cliente.dataCancelamento
                            ? `
                        <div class="info-row">
                            <span class="info-label">Cancelado em:</span>
                            <span class="info-value">${formatarData(cliente.dataCancelamento)}</span>
                        </div>
                        `
                            : ""
                        }
                    </div>
                    <div class="valor-destaque">
                        ${formatarValor(cliente.valorRecorrencia)}
                    </div>
                    ${
                      cliente.linkContrato || cliente.linkApolice
                        ? `
                    <div class="client-links">
                        ${cliente.linkContrato ? `<a href="${cliente.linkContrato}" target="_blank" class="link-btn">📄 Contrato</a>` : ""}
                        ${cliente.linkApolice ? `<a href="${cliente.linkApolice}" target="_blank" class="link-btn">📋 Apólice</a>` : ""}
                    </div>
                    `
                        : ""
                    }
                </div>
            `;
}

function renderizarClientes() {
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();

  let clientesFiltrados = clientesData.filter((cliente) => {
    // Filtro de busca
    const matchSearch =
      !searchTerm ||
      cliente.nomeCliente?.toLowerCase().includes(searchTerm) ||
      cliente.cpf?.includes(searchTerm) ||
      cliente.email?.toLowerCase().includes(searchTerm) ||
      cliente.placa?.toLowerCase().includes(searchTerm) ||
      cliente.codCliente?.toLowerCase().includes(searchTerm);

    if (!matchSearch) return false;

    // Filtro por categoria
    switch (filtroAtual) {
      case "adimplente":
        return cliente.statusFinanceiro === "Adimplente";
      case "inadimplente":
        return cliente.statusFinanceiro === "Inadimplente";
      case "ativos":
        return !cliente.cancelado;
      case "cancelados":
        return cliente.cancelado;
      default:
        return true;
    }
  });

  const grid = document.getElementById("clientsGrid");

  if (clientesFiltrados.length === 0) {
    grid.innerHTML = `
                    <div class="no-results">
                        <h2>Nenhum cliente encontrado</h2>
                        <p>Tente ajustar os filtros ou a busca.</p>
                    </div>
                `;
  } else {
    grid.innerHTML = clientesFiltrados.map(criarCardCliente).join("");
  }
}

// Event listeners
document
  .getElementById("searchInput")
  .addEventListener("input", renderizarClientes);

document.querySelectorAll(".filter-btn").forEach((btn) => {
  btn.addEventListener("click", function () {
    document
      .querySelectorAll(".filter-btn")
      .forEach((b) => b.classList.remove("active"));
    this.classList.add("active");
    filtroAtual = this.getAttribute("data-filter");
    renderizarClientes();
  });
});
