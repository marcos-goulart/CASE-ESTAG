let currentPage = 1;
const limit = 50;
let currentUser = null;
let userRole = null;
let totalPages = 1;
let sortColumn = null;
let sortOrder = "asc"; // "asc" ou "desc"
let headerColumns = []; // ordem dos cabeçalhos
let cache = {}; // cache de páginas

function getToken() {
  return localStorage.getItem("token") || "";
}

function setToken(token) {
  localStorage.setItem("token", token);
}

async function fetchMetrics(page, date) {
  const token = getToken();
  // let url = `http://127.0.0.1:5000/metrics?page=${page}&limit=${limit}`; // local
  let url = `https://case-estag-api.onrender.com/metrics?page=${page}&limit=${limit}`;

  if (date) {
    url += `&date=${encodeURIComponent(date)}`;
  }
  if (sortColumn) {
    url += `&sort_by=${encodeURIComponent(sortColumn)}&sort_order=${encodeURIComponent(sortOrder)}`;
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Erro ao carregar métricas" }));
    throw new Error(err.error || "Erro ao carregar métricas");
  }

  return res.json();
}

async function loadMetrics(page = 1) {
  const token = getToken();
  if (!token) {
    alert("Faça login primeiro!");
    return;
  }

  const loadingDiv = document.getElementById("loading");
  loadingDiv.style.display = "block";
  const tbody = document.querySelector("#metricsTable tbody");
  tbody.innerHTML = "";

  const date = document.getElementById("dateFilter").value;
  const cacheKey = `${page}-${date}-${sortColumn}-${sortOrder}`;

  try {
    let data;
    if (cache[cacheKey]) {
      data = cache[cacheKey];
    } else {
      data = await fetchMetrics(page, date);
      cache[cacheKey] = data;

      // pré-carregar próxima página
      if (data.page < data.total_pages) {
        const nextKey = `${data.page + 1}-${date}-${sortColumn}-${sortOrder}`;
        if (!cache[nextKey]) {
          fetchMetrics(data.page + 1, date).then(d => cache[nextKey] = d).catch(() => { });
        }
      }
    }

    totalPages = Math.max(1, Math.ceil(data.total / limit));
    currentPage = data.page;

    const thead = document.getElementById("tableHeader");
    thead.innerHTML = "";
    headerColumns = [];
    if (data.results.length > 0) {
      Object.keys(data.results[0]).forEach(col => {
        headerColumns.push(col);
        const th = document.createElement("th");

        // texto + indicador de ordenação
        th.textContent = col;
        if (sortColumn === col) {
          th.textContent += sortOrder === "asc" ? " ▲" : " ▼";
        }

        th.addEventListener("click", () => {
          if (sortColumn === col) {
            sortOrder = (sortOrder === "asc") ? "desc" : "asc";
          } else {
            sortColumn = col;
            sortOrder = "asc";
          }
          cache = {};
          loadMetrics(1);
        });
        thead.appendChild(th);
      });
    }

    data.results.forEach(row => {
      const tr = document.createElement("tr");
      headerColumns.forEach(col => {
        const td = document.createElement("td");
        td.textContent = row.hasOwnProperty(col) ? row[col] : "";
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    document.getElementById("pageInfo").textContent =
      `Página ${currentPage} / ${totalPages} (Total registros: ${data.total})`;

    document.getElementById("prevPage").disabled = (currentPage <= 1);
    document.getElementById("nextPage").disabled = (currentPage >= totalPages);
  } catch (e) {
    alert("Erro: " + e.message);
  } finally {
    loadingDiv.style.display = "none";
  }
}

// Exportar dados da tabela em CSV (apenas a página atual)
function exportTableToCSV(filename) {
  const rows = document.querySelectorAll("#metricsTable tr");
  let csv = [];

  rows.forEach(row => {
    let cols = row.querySelectorAll("th, td");
    let rowData = [];
    cols.forEach(col => rowData.push(col.innerText));
    csv.push(rowData.join(","));
  });

  const csvFile = new Blob([csv.join("\n")], { type: "text/csv" });
  const downloadLink = document.createElement("a");
  downloadLink.download = filename;
  downloadLink.href = window.URL.createObjectURL(csvFile);
  downloadLink.style.display = "none";
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}

// Exportar todos os registros filtrados/ordenados (sem paginação)
async function exportAllToCSV() {
  try {
    const token = getToken();
    if (!token) { alert("Faça login para exportar."); return; }
    const date = document.getElementById("dateFilter").value;
    // let url = `http://127.0.0.1:5000/metrics/export?`; // local
    let url = `https://case-estag-api.onrender.com/metrics/export?`;
    if (date) url += `date=${encodeURIComponent(date)}&`;
    if (sortColumn) url += `sort_by=${encodeURIComponent(sortColumn)}&sort_order=${encodeURIComponent(sortOrder)}`;
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Erro ao exportar CSV" }));
      throw new Error(err.error || "Erro ao exportar CSV");
    }
    const blob = await res.blob();
    const downloadLink = document.createElement('a');
    downloadLink.href = window.URL.createObjectURL(blob);
    downloadLink.download = 'metrics_all.csv';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  } catch (e) {
    alert('Erro ao exportar: ' + (e.message || e));
  }
}

// ======== LOGIN ==========
async function login() {
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    // const res = await fetch("http://127.0.0.1:5000/login", {
    const res = await fetch("https://case-estag-api.onrender.com/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Erro no login");

    setToken(data.token);
    currentUser = username;
    userRole = data.role;

    document.getElementById("loginSection").style.display = "none";
    document.getElementById("metricsSection").style.display = "block";
    document.getElementById("userInfo").textContent = `${username} (${userRole})`;

    loadMetrics(1);
  } catch (e) {
    alert("Erro: " + e.message);
  }
}

// ========= EVENTOS =========
document.getElementById("loginBtn").addEventListener("click", login);

document.getElementById("filterBtn").addEventListener("click", () => {
  currentPage = 1;
  cache = {};
  loadMetrics(currentPage);
});

document.getElementById("prevPage").addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    loadMetrics(currentPage);
  }
});

document.getElementById("nextPage").addEventListener("click", () => {
  if (currentPage < totalPages) {
    currentPage++;
    loadMetrics(currentPage);
  }
});

document.getElementById("resetFilterBtn").addEventListener("click", () => {
  document.getElementById("dateFilter").value = "";
  currentPage = 1;
  cache = {};
  loadMetrics(currentPage);
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  localStorage.removeItem("token");
  location.reload();
});

// ==== NOVOS BOTÕES DE EXPORTAÇÃO ====
document.getElementById("exportPageBtn").addEventListener("click", () => {
  exportTableToCSV("metrics_page.csv");
});

document.getElementById("exportAllBtn").addEventListener("click", () => {
  exportAllToCSV();
});

// ========= THEME TOGGLE =========
const themeToggle = document.getElementById("themeToggle");

function applyTheme(theme) {
  if (theme === "dark") {
    document.body.classList.add("dark");
    themeToggle.textContent = "☀️"; // ícone do sol
  } else {
    document.body.classList.remove("dark");
    themeToggle.textContent = "🌙"; // ícone da lua
  }
}

// carregar preferencia salva
const savedTheme = localStorage.getItem("theme") || "light";
applyTheme(savedTheme);

themeToggle.addEventListener("click", () => {
  const newTheme = document.body.classList.contains("dark") ? "light" : "dark";
  applyTheme(newTheme);
  localStorage.setItem("theme", newTheme);
});

// ========= VERIFICAR TOKEN NO CARREGAMENTO =========
document.addEventListener("DOMContentLoaded", async () => {
  const token = getToken();
  if (!token) {
    document.getElementById("loginSection").style.display = "block";
    document.getElementById("metricsSection").style.display = "none";
    return;
  }

  try {
    // const res = await fetch("http://127.0.0.1:5000/metrics?page=1&limit=1", { local
    const res = await fetch("https://case-estag-api.onrender.com/metrics?page=1&limit=1", {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      currentUser = data.user;
      userRole = data.role;
      document.getElementById("userInfo").textContent = `${currentUser} (${userRole})`;

      document.getElementById("loginSection").style.display = "none";
      document.getElementById("metricsSection").style.display = "block";
      loadMetrics(1);
    } else {
      throw new Error("Token inválido ou expirado");
    }
  } catch (e) {
    console.warn("Sessão expirada:", e.message);
    localStorage.removeItem("token");
    document.getElementById("loginSection").style.display = "block";
    document.getElementById("metricsSection").style.display = "none";
  }
});