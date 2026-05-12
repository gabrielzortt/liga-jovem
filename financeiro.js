// =========================================
// STOCKMIND - SISTEMA FINANCEIRO
// ARQUIVO: financeiro.js
// =========================================

const ADMIN_USER = "admin";
const ADMIN_PASS = "senha";
const STORAGE_KEY = "stockmind-finance";

let entries = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

// =========================================
// AUTENTICAÇÃO
// =========================================
function login() {
    const user = document.getElementById("loginUser").value.trim();
    const pass = document.getElementById("loginPass").value;
    const error = document.getElementById("loginError");

    error.textContent = "";

    if (user === ADMIN_USER && pass === ADMIN_PASS) {
        sessionStorage.setItem("finance-auth", "1");
        showApp();
    } else {
        error.textContent = "Usuário ou senha inválidos.";
    }
}

function logout() {
    sessionStorage.removeItem("finance-auth");
    location.reload();
}

function showApp() {
    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");

    // Preenche data atual no formulário
    if (!document.getElementById("date").value) {
        document.getElementById("date").value =
            new Date().toISOString().split("T")[0];
    }

    render();
}

// =========================================
// UTILITÁRIOS
// =========================================
function saveEntries() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function getValue(id) {
    return document.getElementById(id).value;
}

function resetForm() {
    document.getElementById("entryId").value = "";
    document.getElementById("type").value = "income";
    document.getElementById("description").value = "";
    document.getElementById("category").value = "";
    document.getElementById("amount").value = "";
    document.getElementById("date").value =
        new Date().toISOString().split("T")[0];
}

function formatCurrency(value) {
    return Number(value).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function formatDate(dateStr) {
    if (!dateStr) return "-";

    const [year, month, day] = dateStr.split("-");
    return `${day}/${month}/${year}`;
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// =========================================
// CRUD
// =========================================
function saveEntry() {
    const id = getValue("entryId");

    const entry = {
        id: id || crypto.randomUUID(),
        type: getValue("type"),
        description: getValue("description").trim(),
        category: getValue("category").trim(),
        amount: Number(getValue("amount") || 0),
        date: getValue("date")
    };

    if (!entry.description) {
        alert("Informe a descrição.");
        return;
    }

    if (entry.amount <= 0) {
        alert("Informe um valor válido.");
        return;
    }

    if (!entry.date) {
        alert("Informe a data.");
        return;
    }

    const index = entries.findIndex(item => item.id === entry.id);

    if (index >= 0) {
        entries[index] = entry;
    } else {
        entries.push(entry);
    }

    // Ordena por data (mais recente primeiro)
    entries.sort((a, b) => new Date(b.date) - new Date(a.date));

    saveEntries();
    resetForm();
    render();
}

function editEntry(id) {
    const entry = entries.find(item => item.id === id);
    if (!entry) return;

    document.getElementById("entryId").value = entry.id;
    document.getElementById("type").value = entry.type;
    document.getElementById("description").value = entry.description;
    document.getElementById("category").value = entry.category;
    document.getElementById("amount").value = entry.amount;
    document.getElementById("date").value = entry.date;

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function deleteEntry(id) {
    if (!confirm("Deseja excluir este lançamento?")) return;

    entries = entries.filter(item => item.id !== id);

    saveEntries();
    render();
}

// =========================================
// KPIs
// =========================================
function updateStats() {
    const revenue = entries
        .filter(entry => entry.type === "income")
        .reduce((sum, entry) => sum + entry.amount, 0);

    const expenses = entries
        .filter(entry => entry.type === "expense")
        .reduce((sum, entry) => sum + entry.amount, 0);

    const profit = revenue - expenses;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    document.getElementById("statRevenue").textContent =
        formatCurrency(revenue);

    document.getElementById("statExpenses").textContent =
        formatCurrency(expenses);

    const profitElement = document.getElementById("statProfit");
    profitElement.textContent = formatCurrency(profit);

    profitElement.classList.remove("positive", "negative");

    if (profit > 0) {
        profitElement.classList.add("positive");
    } else if (profit < 0) {
        profitElement.classList.add("negative");
    }

    document.getElementById("statMargin").textContent =
        `${margin.toFixed(1)}%`;
}

// =========================================
// ALERTAS
// =========================================
function updateAlerts() {
    const revenue = entries
        .filter(entry => entry.type === "income")
        .reduce((sum, entry) => sum + entry.amount, 0);

    const expenses = entries
        .filter(entry => entry.type === "expense")
        .reduce((sum, entry) => sum + entry.amount, 0);

    const profit = revenue - expenses;

    const alerts = [];

    if (entries.length === 0) {
        alerts.push(`
            <div class="alert warning">
                Nenhum lançamento financeiro cadastrado.
            </div>
        `);
    } else if (profit > 0) {
        alerts.push(`
            <div class="alert success">
                Empresa operando com lucro de ${formatCurrency(profit)}.
            </div>
        `);
    } else if (profit < 0) {
        alerts.push(`
            <div class="alert danger">
                Empresa operando com prejuízo de ${formatCurrency(Math.abs(profit))}.
            </div>
        `);
    } else {
        alerts.push(`
            <div class="alert warning">
                Resultado financeiro zerado.
            </div>
        `);
    }

    document.getElementById("alerts").innerHTML = alerts.join("");
}

// =========================================
// RENDERIZAÇÃO
// =========================================
function render() {
    const tbody = document.getElementById("entryTable");
    const search = document.getElementById("search").value.toLowerCase();
    const filterType = document.getElementById("filterType").value;

    let filtered = entries.filter(entry => {
        const text =
            `${entry.description} ${entry.category}`.toLowerCase();

        return text.includes(search);
    });

    if (filterType !== "all") {
        filtered = filtered.filter(entry => entry.type === filterType);
    }

    tbody.innerHTML = filtered.map(entry => {
        const typeLabel =
            entry.type === "income" ? "Receita" : "Despesa";

        const typeClass =
            entry.type === "income" ? "income" : "expense";

        return `
            <tr>
                <td>${formatDate(entry.date)}</td>

                <td>
                    <strong>${escapeHtml(entry.description)}</strong>
                </td>

                <td>${escapeHtml(entry.category || "-")}</td>

                <td>
                    <span class="badge ${typeClass}">
                        ${typeLabel}
                    </span>
                </td>

                <td>${formatCurrency(entry.amount)}</td>

                <td>
                    <button
                        class="icon-btn"
                        onclick="editEntry('${entry.id}')"
                        title="Editar"
                    >
                        <i class="fas fa-pen"></i>
                    </button>

                    <button
                        class="icon-btn"
                        onclick="deleteEntry('${entry.id}')"
                        title="Excluir"
                    >
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join("");

    updateStats();
    updateAlerts();
}

// =========================================
// EXPORTAÇÃO
// =========================================
function exportData() {
    const blob = new Blob(
        [JSON.stringify(entries, null, 2)],
        { type: "application/json" }
    );

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "financeiro.json";
    link.click();

    URL.revokeObjectURL(link.href);
}

// =========================================
// EVENTOS
// =========================================
document.addEventListener("DOMContentLoaded", () => {
    // Campo de data padrão
    document.getElementById("date").value =
        new Date().toISOString().split("T")[0];

    // Pesquisa
    document.getElementById("search")
        .addEventListener("input", render);

    // Filtro
    document.getElementById("filterType")
        .addEventListener("change", render);

    // Enter no login
    document.getElementById("loginPass")
        .addEventListener("keydown", event => {
            if (event.key === "Enter") {
                login();
            }
        });

    // Sessão já autenticada
    if (sessionStorage.getItem("finance-auth") === "1") {
        showApp();
    }
});
