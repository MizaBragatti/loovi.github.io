import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../frontend/meuscontratos/style.css";
import { fetchContratos, getCodigoVendedorFromToken, extractListaContratos } from "../lib/contratosApi";
import { endExpiredSession, getActiveAuthToken, getActiveContractsToken, hasActiveSession } from "../lib/authSession";
import { getServerNowSeconds } from "../lib/jwt";

const STORAGE_LIST = (codigo) => `meuscontratos_data_${codigo}`;
const STORAGE_RANGE = (codigo) => `meuscontratos_range_${codigo}`;

function getAuthTokenAtual() {
  return getActiveContractsToken() || "";
}

// Sem token não há como identificar o vendedor de forma confiável - nunca cair num código fixo.
function getCodigoVendedorAtual() {
  const token = getActiveAuthToken();
  return token ? getCodigoVendedorFromToken(token) : null;
}

// nbf/iat do token (hora do servidor) em vez de Date.now(), que pode estar
// dessincronizado no relógio do SO do usuário e gerar buscas em período futuro.
function getNowSeconds() {
  const token = getAuthTokenAtual();
  return getServerNowSeconds(token) ?? Math.floor(Date.now() / 1000);
}

function timestampToDateInput(ts) {
  return new Date(ts * 1000).toISOString().slice(0, 10);
}

function dateInputToTimestampStart(value) {
  return Math.floor(new Date(`${value}T00:00:00`).getTime() / 1000);
}

function dateInputToTimestampEnd(value) {
  return Math.floor(new Date(`${value}T23:59:59`).getTime() / 1000);
}

// Input type="date" nativo ignora lang="pt-BR" no Chrome/Edge e exibe no
// formato do SO; por isso usamos texto mascarado dd/mm/aaaa convertendo
// para o ISO (yyyy-mm-dd) usado internamente pelo restante da tela.
function formatBrDateInput(raw) {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  const dd = digits.slice(0, 2);
  const mm = digits.slice(2, 4);
  const yyyy = digits.slice(4, 8);
  return [dd, mm, yyyy].filter(Boolean).join("/");
}

function brDateToIso(br) {
  const digits = br.replace(/\D/g, "");
  if (digits.length !== 8) return "";
  const dd = digits.slice(0, 2);
  const mm = digits.slice(2, 4);
  const yyyy = digits.slice(4, 8);
  return `${yyyy}-${mm}-${dd}`;
}

function isoToBrDate(iso) {
  const [yyyy, mm, dd] = String(iso || "").split("-");
  if (!yyyy || !mm || !dd) return "";
  return `${dd}/${mm}/${yyyy}`;
}

function getContractKey(cliente) {
  return (
    cliente.agreementNo ||
    cliente.contratoNatural ||
    cliente.contratoSap ||
    cliente.bpCode ||
    cliente.codCliente ||
    cliente.idCliente ||
    cliente.id ||
    cliente.codigoCliente ||
    cliente.codigo ||
    cliente.nomeCliente ||
    cliente.bpName ||
    ""
  ).toString();
}

// A API nova (sap-contrato/ativos) não devolve statusFinanceiro/cancelado prontos;
// derivamos de inDebito (inadimplência) e da presença de dataCancelamento.
function getStatusFinanceiro(cliente) {
  return cliente.inDebito ? "Inadimplente" : "Adimplente";
}

function getCancelado(cliente) {
  return Boolean(cliente.dataCancelamento);
}

// bpCode vem como "C" + CPF com zero-padding à esquerda até 14 dígitos
// (ex: C00034879141828 para o CPF 34879141828); os últimos 11 dígitos são o CPF.
function getCpf(cliente) {
  if (cliente.cpf) return cliente.cpf;
  const digits = String(cliente.bpCode || "").replace(/\D/g, "");
  return digits.slice(-11) || null;
}

function mergeContracts(existing, incoming) {
  const map = new Map();
  existing.forEach((item) => map.set(getContractKey(item), item));
  incoming.forEach((item) => map.set(getContractKey(item), item));
  return Array.from(map.values());
}

function loadStoredContracts(codigoVendedor) {
  try {
    const rawList = localStorage.getItem(STORAGE_LIST(codigoVendedor));
    const rawRange = localStorage.getItem(STORAGE_RANGE(codigoVendedor));
    const list = rawList ? JSON.parse(rawList) : null;
    const range = rawRange ? JSON.parse(rawRange) : null;
    return {
      list: Array.isArray(list) ? list : null,
      range: range && typeof range.start === "number" && typeof range.end === "number" ? range : null,
    };
  } catch {
    return { list: null, range: null };
  }
}

function saveStoredContracts(codigoVendedor, list, range) {
  try {
    localStorage.setItem(STORAGE_LIST(codigoVendedor), JSON.stringify(list));
    localStorage.setItem(STORAGE_RANGE(codigoVendedor), JSON.stringify(range));
  } catch (error) {
    console.warn("Não foi possível salvar contratos no localStorage", error);
  }
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
  if (!cpf) return "";
  const valor = String(cpf).replace(/\D/g, "");
  if (valor.length !== 11) return cpf;
  return valor.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function formatarTelefone(telefone) {
  if (!telefone) return "N/A";
  const valor = String(telefone).replace(/\D/g, "");
  if (valor.length === 11) {
    return valor.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  return telefone;
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function onlyDigits(value) {
  return String(value || "").replace(/\D/g, "");
}

function normalizePlate(value) {
  return String(value || "").replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
}

function getSearchFields(cliente, seen = new Set()) {
  // Em vez de depender de uma lista fixa de chaves (nomeCliente, cpf, etc.),
  // varre todos os valores do objeto recursivamente. Isso garante que a busca
  // funcione mesmo que a API retorne o contrato com nomes de campo diferentes
  // dos esperados (ex: "Nome" em vez de "nomeCliente", "Id" em vez de "codCliente").
  if (!cliente || typeof cliente !== "object" || seen.has(cliente)) return [];
  seen.add(cliente);

  const valores = [];
  for (const valor of Object.values(cliente)) {
    if (valor && typeof valor === "object") {
      valores.push(...getSearchFields(valor, seen));
    } else if (valor !== null && valor !== undefined) {
      valores.push(valor);
    }
  }
  return valores;
}

function matchClienteSearch(cliente, termoBruto) {
  if (!termoBruto) return true;

  const termoTrim = String(termoBruto).trim();
  const termo = normalizeText(termoBruto);
  const termoDigitos = onlyDigits(termoBruto);
  const termoPlaca = normalizePlate(termoBruto);
  const campos = getSearchFields(cliente);

  // Só considera busca "numérica" (CPF/telefone) quando o termo digitado
  // for composto exclusivamente por dígitos. Isso evita que uma busca por
  // placa (ex: "AVT4732") vire um match parcial de 4 dígitos contra
  // telefone/CPF de clientes sem nenhuma relação com a placa pesquisada.
  const isSomenteDigitos = /^\d+$/.test(termoTrim);

  const matchTexto = campos.some((campo) => normalizeText(campo).includes(termo));
  const matchDigitos = isSomenteDigitos && termoDigitos.length >= 4
    ? campos.some((campo) => onlyDigits(campo).includes(termoDigitos))
    : false;
  const matchPlaca = termoPlaca ? campos.some((campo) => normalizePlate(campo).includes(termoPlaca)) : false;

  return matchTexto || matchDigitos || matchPlaca;
}

// Perfil do vendedor logado (nome/email/telefone), já resolvido e cacheado
// pelo Consulta.jsx ao entrar no portal - aqui só lemos o cache.
function getExecutivoProfileAtual() {
  try {
    const raw = localStorage.getItem("executivoProfile");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      nome: parsed.nome || "",
      email: parsed.email || "",
      telFormatado: parsed.telFormatado || "",
    };
  } catch {
    return null;
  }
}

export default function MeusContratos() {
  const navigate = useNavigate();
  const [executivoProfile] = useState(getExecutivoProfileAtual);
  const [clientesData, setClientesData] = useState([]);
  const [filtroAtual, setFiltroAtual] = useState("todos");
  const [searchInput, setSearchInput] = useState("");
  const [periodoInicio, setPeriodoInicio] = useState("");
  const [periodoFim, setPeriodoFim] = useState("");
  // Prefeenchido com o código do vendedor logado, mas editável - permite
  // buscar contratos de qualquer código de vendedor, não só o do usuário atual.
  const [codigoVendedorInput, setCodigoVendedorInput] = useState(() => getCodigoVendedorAtual() || "");
  const [periodoInicioText, setPeriodoInicioText] = useState("");
  const [periodoFimText, setPeriodoFimText] = useState("");
  const [storedRange, setStoredRange] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [loading, setLoading] = useState(false);
  // Ref (síncrono) em vez de depender só do estado `loading`: um duplo clique
  // rápido dispara o handler duas vezes antes do React re-renderizar o botão
  // com disabled=true, iniciando duas buscas paralelas do zero (cursor null).
  const fetchLockRef = useRef(false);

  useEffect(() => {
    if (!hasActiveSession()) {
      endExpiredSession();
      return;
    }

    const codigoVendedor = getCodigoVendedorAtual();
    if (!codigoVendedor) return;

    const stored = loadStoredContracts(codigoVendedor);
    if (stored.list && stored.list.length > 0) {
      setClientesData(stored.list);
      setStoredRange(stored.range);
    } else {
      // Sem cache local (primeiro acesso ou dados limpos), busca automaticamente
      // os últimos 3 anos para trazer o histórico de contratos do vendedor
      // sem exigir ação do usuário (contratos costumam ser bem mais antigos que 30 dias).
      const token = getAuthTokenAtual();
      const now = getNowSeconds();
      fetchAndSave({
        codigoVendedor,
        token,
        dataInicio: now - 1095 * 24 * 60 * 60,
        dataFim: now,
        replace: true,
      });
    }
  }, []);

  useEffect(() => {
    if (storedRange?.start && storedRange?.end) {
      setPeriodoInicio(timestampToDateInput(storedRange.start));
      setPeriodoFim(timestampToDateInput(storedRange.end));
    } else {
      const now = getNowSeconds();
      setPeriodoInicio(timestampToDateInput(now - 1095 * 24 * 60 * 60));
      setPeriodoFim(timestampToDateInput(now));
    }
  }, [storedRange]);

  useEffect(() => {
    setPeriodoInicioText(isoToBrDate(periodoInicio));
  }, [periodoInicio]);

  useEffect(() => {
    setPeriodoFimText(isoToBrDate(periodoFim));
  }, [periodoFim]);

  function handlePeriodoInicioTextChange(event) {
    const formatted = formatBrDateInput(event.target.value);
    setPeriodoInicioText(formatted);
    const iso = brDateToIso(formatted);
    if (iso) setPeriodoInicio(iso);
  }

  function handlePeriodoFimTextChange(event) {
    const formatted = formatBrDateInput(event.target.value);
    setPeriodoFimText(formatted);
    const iso = brDateToIso(formatted);
    if (iso) setPeriodoFim(iso);
  }

  async function fetchAndSave({ codigoVendedor, token, dataInicio, dataFim, replace }) {
    if (dataInicio > dataFim) {
      setStatusMessage("Período inválido. A data inicial não pode ser posterior à final.");
      return false;
    }

    if (fetchLockRef.current) return false;
    fetchLockRef.current = true;

    setLoading(true);
    setStatusMessage("");
    try {
      const response = await fetchContratos(codigoVendedor, token, { dataInicio, dataFim });
      const lista = extractListaContratos(response) || [];
      const stored = loadStoredContracts(codigoVendedor);
      const existing = replace ? [] : stored.list || [];
      const finalList = replace ? lista : mergeContracts(existing, lista);
      const finalRange = replace
        ? { start: dataInicio, end: dataFim }
        : {
            start: stored.range?.start ?? dataInicio,
            end: Math.max(stored.range?.end ?? dataFim, dataFim),
          };
      saveStoredContracts(codigoVendedor, finalList, finalRange);
      setClientesData(finalList);
      setStoredRange(finalRange);
      if (replace) {
        setStatusMessage("Dados substituídos para o período selecionado.");
      } else {
        setStatusMessage("Atualização incremental concluída.");
      }
      return true;
    } catch (error) {
      setStatusMessage(`Erro ao buscar contratos: ${error.message}`);
      return false;
    } finally {
      setLoading(false);
      fetchLockRef.current = false;
    }
  }

  async function handleAtualizar() {
    const token = getAuthTokenAtual();
    const codigoVendedor = codigoVendedorInput.trim();

    if (!codigoVendedor) {
      setStatusMessage("Informe o código do vendedor.");
      return;
    }

    const stored = loadStoredContracts(codigoVendedor);
    const now = getNowSeconds();
    const lastEnd = typeof stored.range?.end === "number" ? stored.range.end : null;

    if (!lastEnd) {
      setStatusMessage("Ainda não há período salvo. Use 'Buscar período' para carregar os contratos iniciais.");
      return;
    }

    const start = lastEnd < now ? lastEnd + 1 : now;
    const end = now;

    if (start > end) {
      setStatusMessage("A atualização incremental não pode ser feita porque o período armazenado já está atualizado.");
      return;
    }

    await fetchAndSave({ codigoVendedor, token, dataInicio: start, dataFim: end, replace: false });
  }

  async function handleBuscarPeriodo() {
    if (!periodoInicio || !periodoFim) {
      setStatusMessage("Defina data de início e fim.");
      return;
    }

    const token = getAuthTokenAtual();
    const codigoVendedor = codigoVendedorInput.trim();
    if (!codigoVendedor) {
      setStatusMessage("Informe o código do vendedor.");
      return;
    }

    const start = dateInputToTimestampStart(periodoInicio);
    const end = dateInputToTimestampEnd(periodoFim);
    if (end < start) {
      setStatusMessage("A data final deve ser igual ou maior que a inicial.");
      return;
    }

    await fetchAndSave({ codigoVendedor, token, dataInicio: start, dataFim: end, replace: true });
  }

  const estatisticas = useMemo(() => {
    const total = clientesData.length;
    const adimplentes = clientesData.filter((cliente) => getStatusFinanceiro(cliente) === "Adimplente").length;
    const inadimplentes = clientesData.filter((cliente) => getStatusFinanceiro(cliente) === "Inadimplente").length;
    const ativos = clientesData.filter((cliente) => !getCancelado(cliente)).length;

    return { total, adimplentes, inadimplentes, ativos };
  }, [clientesData]);

  const termoBusca = searchInput.trim();

  const clientesFiltrados = useMemo(() => {
    return clientesData.filter((cliente) => {
      const matchSearch = matchClienteSearch(cliente, termoBusca);

      if (!matchSearch) return false;

      switch (filtroAtual) {
        case "adimplente":
          return getStatusFinanceiro(cliente) === "Adimplente";
        case "inadimplente":
          return getStatusFinanceiro(cliente) === "Inadimplente";
        case "ativos":
          return !getCancelado(cliente);
        case "cancelados":
          return getCancelado(cliente);
        default:
          return true;
      }
    });
  }, [clientesData, filtroAtual, termoBusca]);

  return (
    <div className="meus-contratos-page container">
      <header>
        <button type="button" className="filter-btn" style={{ marginBottom: "16px" }} onClick={() => navigate("/consulta")}>
          ← Voltar
        </button>
        <h1>📊 Gestão de Clientes Loovi</h1>

        {executivoProfile && (executivoProfile.nome || executivoProfile.email || executivoProfile.telFormatado) && (
          <p className="executivo-logado">
            {executivoProfile.nome || "Executivo Loovi"}
            {executivoProfile.email ? ` • ${executivoProfile.email}` : ""}
            {executivoProfile.telFormatado ? ` • ${executivoProfile.telFormatado}` : ""}
          </p>
        )}

        <div className="stats">
          <div className="stat-card">
            <div className="stat-number">{estatisticas.total}</div>
            <div className="stat-label">Total de Clientes</div>
          </div>

          <div className="stat-card">
            <div className="stat-number">{estatisticas.adimplentes}</div>
            <div className="stat-label">Adimplentes</div>
          </div>

          <div className="stat-card">
            <div className="stat-number">{estatisticas.inadimplentes}</div>
            <div className="stat-label">Inadimplentes</div>
          </div>

          <div className="stat-card">
            <div className="stat-number">{estatisticas.ativos}</div>
            <div className="stat-label">Ativos</div>
          </div>
        </div>
      </header>

      <div className="controls">
        <div className="search-box">
          <input
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="🔍 Buscar por nome, placa, e-mail, telefone ou CPF..."
            aria-label="Buscar por nome, placa, e-mail, telefone ou CPF"
          />
        </div>

        <div className="filter-group">
          {["todos", "adimplente", "inadimplente", "ativos", "cancelados"].map((value) => {
            const labels = {
              todos: "Todos",
              adimplente: "Adimplentes",
              inadimplente: "Inadimplentes",
              ativos: "Ativos",
              cancelados: "Cancelados",
            };
            return (
              <button
                key={value}
                type="button"
                className={`filter-btn ${filtroAtual === value ? "active" : ""}`}
                onClick={() => setFiltroAtual(value)}
              >
                {labels[value]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="controls">
        <div className="filter-group" style={{ flexWrap: "wrap", alignItems: "center" }}>
          <label style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: "180px" }}>
            Código do vendedor
            <input
              type="text"
              placeholder="Código do vendedor"
              value={codigoVendedorInput}
              onChange={(event) => setCodigoVendedorInput(event.target.value)}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: "180px" }}>
            Data início
            <input
              type="text"
              inputMode="numeric"
              placeholder="dd/mm/aaaa"
              maxLength={10}
              value={periodoInicioText}
              onChange={handlePeriodoInicioTextChange}
            />
          </label>
          <label style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: "180px" }}>
            Data fim
            <input
              type="text"
              inputMode="numeric"
              placeholder="dd/mm/aaaa"
              maxLength={10}
              value={periodoFimText}
              onChange={handlePeriodoFimTextChange}
            />
          </label>
          <button className="filter-btn" type="button" onClick={handleBuscarPeriodo} disabled={loading}>
            Buscar período
          </button>
          <button className="filter-btn" type="button" onClick={handleAtualizar} disabled={loading}>
            Atualizar
          </button>
        </div>
      </div>

      {statusMessage ? (
        <div className="no-results" style={{ marginBottom: "20px", padding: "15px 20px" }}>
          <p>{statusMessage}</p>
        </div>
      ) : null}

      <div className="clients-grid">
        {clientesFiltrados.length === 0 ? (
          <div className="no-results">
            <h2>Nenhum cliente encontrado</h2>
            <p>Tente ajustar os filtros ou a busca.</p>
          </div>
        ) : (
          clientesFiltrados.map((cliente, index) => {
            const statusFinanceiro = getStatusFinanceiro(cliente);
            const cancelado = getCancelado(cliente);
            const statusClass = cancelado
              ? "status-cancelado"
              : statusFinanceiro === "Adimplente"
              ? "status-adimplente"
              : "status-inadimplente";
            const nomeCliente = cliente.bpName || cliente.nomeCliente;
            const cpf = getCpf(cliente);

            return (
              <div className="client-card" key={getContractKey(cliente) || `${nomeCliente}-${index}`} data-status={statusFinanceiro.toLowerCase()} data-cancelado={cancelado}>
                <div className="client-header">
                  <div className="client-name">{nomeCliente || "Nome não informado"}</div>
                  <div className="client-code">Código: {cliente.bpCode || cliente.codCliente || "N/A"}</div>
                  <span className={`status-badge ${statusClass}`}>{cancelado ? "❌ Cancelado" : statusFinanceiro}</span>
                </div>

                <div className="client-info">
                  <div className="info-row">
                    <span className="info-label">IdIndicação</span>
                    <span className="info-value">{cliente.idIndicacao || "Não informado"}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">idAfiliado</span>
                    <span className="info-value">{formatarCPF(cliente.idIndicacaoAfiliado || "Não informado")}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">CPF:</span>
                    <span className="info-value">{formatarCPF(cpf)}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">E-mail:</span>
                    <span className="info-value">{cliente.email || "N/A"}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Telefone:</span>
                    <span className="info-value">{formatarTelefone(cliente.telefone)}</span>
                  </div>
                  {cliente.placa ? (
                    <div className="info-row">
                      <span className="info-label">Placa:</span>
                      <span className="info-value">{cliente.placa.toUpperCase()}</span>
                    </div>
                  ) : null}
                  <div className="info-row">
                    <span className="info-label">Contrato SAP:</span>
                    <span className="info-value">{cliente.agreementNo || cliente.contratoNatural || cliente.contratoSap || "N/A"}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Vigência:</span>
                    <span className="info-value">
                      {formatarData(cliente.dataInicioVigencia || cliente.startDate)} - {formatarData(cliente.dataFimVigencia || cliente.endDate)}
                    </span>
                  </div>
                  {cancelado ? (
                    <div className="info-row">
                      <span className="info-label">Cancelado em:</span>
                      <span className="info-value">{formatarData(cliente.dataCancelamento)}</span>
                    </div>
                  ) : null}
                </div>

                <div className="valor-destaque">{formatarValor(cliente.valorRecorrencia)}</div>

                {(cliente.linkContrato || cliente.linkApolice) && (
                  <div className="client-links">
                    {cliente.linkContrato ? (
                      <a href={cliente.linkContrato} target="_blank" rel="noreferrer" className="link-btn">
                        📄 Contrato
                      </a>
                    ) : null}
                    {cliente.linkApolice ? (
                      <a href={cliente.linkApolice} target="_blank" rel="noreferrer" className="link-btn">
                        📋 Apólice
                      </a>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
