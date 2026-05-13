// =========================================
// STOCKMIND - COMPRAS INTELIGENTES
// ARQUIVO: compras.js
// =========================================

const ADMIN_USER = "admin";
const ADMIN_PASS = "senha";

const STOCK_STORAGE_KEY = "stockmind-products";
const SETTINGS_STORAGE_KEY = "stockmind-purchase-settings";

let recommendations = [];
let settings = {
    safetyFactor: 2,
    urgentDays: 7
};

// =========================================
// AUTENTICAÇÃO
// =========================================
function login() {
    const user = document.getElementById("loginUser").value.trim();
    const pass = document.getElementById("loginPass").value;
    const error = document.getElementById("loginError");

    error.textContent = "";

    if (user === ADMIN_USER && pass === ADMIN_PASS) {
        sessionStorage.setItem("purchases-auth", "1");
        showApp();
    } else {
        error.textContent = "Usuário ou senha inválidos.";
    }
}

function logout() {
    sessionStorage.removeItem("purchases-auth");
    location.reload();
}

function showApp() {
    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");

    loadSettings();
    loadStockData();
}

// =========================================
// CONFIGURAÇÕES
// =========================================
function loadSettings() {
    const saved = localStorage.getItem(SETTINGS_STORAGE_KEY);

    if (saved) {
        settings = {
            ...settings,
            ...JSON.parse(saved)
        };
    }

    document.getElementById("safetyFactor").value =
        settings.safetyFactor;

    document.getElementById("urgentDays").value =
        settings.urgentDays;
}

function applySettings() {
    settings.safetyFactor = Number(
        document.getElementById("safetyFactor").value || 2
    );

    settings.urgentDays = Number(
        document.getElementById("urgentDays").value || 7
    );

    localStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify(settings)
    );

    loadStockData();
}

function openSettings() {
    // Página futura de configurações
    window.location.href = "configuracoes.html";
}

// =========================================
// UTILITÁRIOS
// =========================================
function formatCurrency(value) {
    return Number(value).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function escapeHtml(str) {
    return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// =========================================
// ANÁLISE DE ESTOQUE
// =========================================
function loadStockData() {
    const products = JSON.parse(
        localStorage.getItem(STOCK_STORAGE_KEY) || "[]"
    );

    recommendations = products.map(product => {
        const quantity = Number(product.quantity || 0);
        const minStock = Number(product.minStock || 0);
        const cost = Number(product.cost || 0);

        let priority = "normal";
        let suggestion = 0;

        // Produto sem estoque
        if (quantity <= 0 && minStock > 0) {
            priority = "critical";
            suggestion = Math.ceil(
                (minStock * settings.safetyFactor) - quantity
            );
        }
        // Abaixo do mínimo
        else if (quantity <= minStock && minStock > 0) {
            priority = "high";
            suggestion = Math.ceil(
                (minStock * settings.safetyFactor) - quantity
            );
        }
        // Excesso de estoque
        else if (quantity >= minStock * settings.safetyFactor * 3 &&
                 minStock > 0) {
            priority = "excess";
            suggestion = 0;
        }

        return {
            id: product.id,
            name: product.name || "Produto sem nome",
            category: product.category || "",
            quantity,
            minStock,
            cost,
            suggestion: Math.max(0, suggestion),
            estimatedCost: Math.max(0, suggestion) * cost,
            priority
        };
    });

    render();
}

// =========================================
// RECARREGAR ANÁLISE
// =========================================
function reloadStock() {
    loadStockData();
}

// =========================================
// KPI
// =========================================
function updateStats(filtered = recommendations) {
    const toBuy = filtered.filter(item =>
        item.suggestion > 0
    );

    const urgent = filtered.filter(item =>
        item.priority === "critical"
    );

    const excess = filtered.filter(item =>
        item.priority === "excess"
    );

    const estimatedCost = toBuy.reduce((sum, item) =>
        sum + item.estimatedCost, 0
    );

    document.getElementById("statToBuy").textContent =
        toBuy.length;

    document.getElementById("statUrgent").textContent =
        urgent.length;

    document.getElementById("statExcess").textContent =
        excess.length;

    document.getElementById("statEstimatedCost").textContent =
        formatCurrency(estimatedCost);
}

// =========================================
// ALERTAS
// =========================================
function updateAlerts() {
    const alerts = [];

    const critical = recommendations.filter(item =>
        item.priority === "critical"
    ).length;

    const high = recommendations.filter(item =>
        item.priority === "high"
    ).length;

    if (recommendations.length === 0) {
        alerts.push(`
            <div class="alert warning">
                Nenhum produto encontrado no estoque.
            </div>
        `);
    } else {
        if (critical > 0) {
            alerts.push(`
                <div class="alert danger">
                    ${critical} produto(s) sem estoque.
                </div>
            `);
        }

        if (high > 0) {
            alerts.push(`
                <div class="alert warning">
                    ${high} produto(s) abaixo do estoque mínimo.
                </div>
            `);
        }

        if (critical === 0 && high === 0) {
            alerts.push(`
                <div class="alert success">
                    Estoque em situação controlada.
                </div>
            `);
        }
    }

    document.getElementById("alerts").innerHTML =
        alerts.join("");
}

// =========================================
// RESUMOS
// =========================================
function updateSummary() {
    const toBuy = recommendations.filter(item =>
        item.suggestion > 0
    );

    const excess = recommendations.filter(item =>
        item.priority === "excess"
    );

    document.getElementById("executiveSummary").innerHTML = `
        <p>
            O sistema identificou
            <strong>${toBuy.length}</strong> item(ns)
            com necessidade de reposição e
            <strong>${excess.length}</strong> item(ns)
            com excesso de estoque.
        </p>
    `;

    document.getElementById("systemInsights").innerHTML = `
        <p>
            A análise utiliza um fator de segurança de
            <strong>${settings.safetyFactor}x</strong>
            sobre o estoque mínimo para sugerir
            quantidades de compra.
        </p>
    `;
}

// =========================================
// RENDERIZAÇÃO
// =========================================
function render() {
    const tbody = document.getElementById(
        "recommendationTable"
    );

    const search = document
        .getElementById("search")
        .value
        .toLowerCase();

    const filterPriority = document
        .getElementById("filterPriority")
        .value;

    let filtered = recommendations.filter(item => {
        const text =
            `${item.name} ${item.category}`.toLowerCase();

        return text.includes(search);
    });

    if (filterPriority !== "all") {
        filtered = filtered.filter(item =>
            item.priority === filterPriority
        );
    }

    tbody.innerHTML = filtered.map(item => {
        const action =
            item.suggestion > 0
                ? `Comprar ${item.suggestion}`
                : "Monitorar";

        return `
            <tr>
                <td>
                    <strong>${escapeHtml(item.name)}</strong><br>
                    <small style="color:#64748b">
                        ${escapeHtml(item.category)}
                    </small>
                </td>

                <td>${item.quantity}</td>
                <td>${item.minStock}</td>
                <td>${item.suggestion}</td>

                <td>
                    <span class="badge ${item.priority}">
                        ${getPriorityLabel(item.priority)}
                    </span>
                </td>

                <td>
                    ${formatCurrency(item.estimatedCost)}
                </td>

                <td>${action}</td>
            </tr>
        `;
    }).join("");

    updateStats(filtered);
    updateAlerts();
    updateSummary();
}

// =========================================
// LABELS
// =========================================
function getPriorityLabel(priority) {
    const labels = {
        critical: "Crítica",
        high: "Alta",
        normal: "Normal",
        excess: "Excesso"
    };

    return labels[priority] || "Normal";
}

// =========================================
// EXPORTAÇÃO
// =========================================
function exportData() {
    const blob = new Blob(
        [JSON.stringify(recommendations, null, 2)],
        { type: "application/json" }
    );

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "compras-inteligentes.json";
    link.click();

    URL.revokeObjectURL(link.href);
}

// =========================================
// EVENTOS
// =========================================
document.addEventListener("DOMContentLoaded", () => {
    document
        .getElementById("search")
        .addEventListener("input", render);

    document
        .getElementById("filterPriority")
        .addEventListener("change", render);

    document
        .getElementById("loginPass")
        .addEventListener("keydown", event => {
            if (event.key === "Enter") {
                login();
            }
        });

    if (sessionStorage.getItem("purchases-auth") === "1") {
        showApp();
    }
});
