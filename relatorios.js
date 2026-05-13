// =========================================
// STOCKMIND - CENTRAL DE RELATÓRIOS
// ARQUIVO: relatorios.js
// =========================================

const ADMIN_USER = "admin";
const ADMIN_PASS = "senha";

const STORAGE_KEY = "stockmind-reports-history";

let reportHistory = JSON.parse(
    localStorage.getItem(STORAGE_KEY) || "[]"
);

// =========================================
// AUTENTICAÇÃO
// =========================================
function login() {
    const user = document.getElementById("loginUser").value.trim();
    const pass = document.getElementById("loginPass").value;
    const error = document.getElementById("loginError");

    error.textContent = "";

    if (user === ADMIN_USER && pass === ADMIN_PASS) {
        sessionStorage.setItem("reports-auth", "1");
        showApp();
    } else {
        error.textContent = "Usuário ou senha inválidos.";
    }
}

function logout() {
    sessionStorage.removeItem("reports-auth");
    location.reload();
}

function showApp() {
    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    render();
}

function openSettings() {
    window.location.href = "configuracoes.html";
}

// =========================================
// UTILITÁRIOS
// =========================================
function saveData() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(reportHistory)
    );
}

function generateId() {
    if (window.crypto && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return "report-" + Date.now() + "-" +
        Math.random().toString(36).slice(2, 9);
}

function formatDate(date) {
    return new Date(date).toLocaleString("pt-BR");
}

function escapeHtml(str) {
    return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function showAlert(message, type = "success") {
    const container = document.getElementById("alerts");

    const styles = {
        success: {
            bg: "#dcfce7",
            color: "#166534"
        },
        error: {
            bg: "#fee2e2",
            color: "#991b1b"
        }
    };

    const style = styles[type] || styles.success;

    container.innerHTML = `
        <div style="
            padding:12px 14px;
            border-radius:12px;
            background:${style.bg};
            color:${style.color};
            font-weight:600;
            font-size:0.9rem;
        ">
            ${escapeHtml(message)}
        </div>
    `;

    setTimeout(() => {
        container.innerHTML = "";
    }, 3000);
}

// =========================================
// GERAÇÃO DE RELATÓRIOS
// =========================================
function generateReport() {
    const type =
        document.getElementById("reportType").value;

    const period =
        document.getElementById("reportPeriod").value;

    const format =
        document.getElementById("reportFormat").value;

    const report = {
        id: generateId(),
        type,
        period,
        format,
        createdAt: new Date().toISOString()
    };

    reportHistory.unshift(report);
    reportHistory = reportHistory.slice(0, 200);

    saveData();
    render();

    exportReport(report);

    showAlert(
        `Relatório de ${type} gerado em ${format}.`,
        "success"
    );
}

// =========================================
// EXPORTAÇÃO (SIMULADA)
// =========================================
function exportReport(report) {
    const content = {
        title: `Relatório de ${report.type}`,
        type: report.type,
        period: report.period,
        format: report.format,
        generatedAt: report.createdAt,
        source: "StockMind Reporting Center",
        data: []
    };

    const blob = new Blob(
        [JSON.stringify(content, null, 2)],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const extension =
        report.format === "Excel"
            ? "xlsx"
            : report.format === "PDF"
                ? "pdf"
                : "json";

    link.href = url;
    link.download =
        `${sanitizeFileName(report.type)}-${Date.now()}.${extension}`;

    link.click();

    URL.revokeObjectURL(url);
}

function sanitizeFileName(text) {
    return String(text)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "-")
        .toLowerCase();
}

// =========================================
// ESTATÍSTICAS
// =========================================
function updateStats() {
    const now = new Date();

    const today = reportHistory.filter(report => {
        const date = new Date(report.createdAt);
        return date.toDateString() === now.toDateString();
    }).length;

    const month = reportHistory.filter(report => {
        const date = new Date(report.createdAt);
        return (
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear()
        );
    }).length;

    const last =
        reportHistory.length > 0
            ? new Date(
                  reportHistory[0].createdAt
              ).toLocaleDateString("pt-BR")
            : "--";

    document.getElementById("statToday").textContent = today;
    document.getElementById("statMonth").textContent = month;
    document.getElementById("statLast").textContent = last;
}

// =========================================
// INSIGHT EXECUTIVO
// =========================================
function updateInsight() {
    const title = document.getElementById("insightTitle");
    const text = document.getElementById("insightText");

    if (reportHistory.length === 0) {
        title.textContent =
            "Ambiente pronto para consolidação de dados.";
        text.textContent =
            "Gere relatórios executivos para criar um " +
            "histórico de análises e exportações.";
        return;
    }

    const byType = {};

    reportHistory.forEach(report => {
        byType[report.type] =
            (byType[report.type] || 0) + 1;
    });

    let mostUsedType = null;
    let max = 0;

    for (const type in byType) {
        if (byType[type] > max) {
            max = byType[type];
            mostUsedType = type;
        }
    }

    title.textContent =
        `${reportHistory.length} relatórios já foram gerados.`;

    text.textContent =
        `O módulo mais utilizado é ${mostUsedType}, ` +
        `com ${max} exportação(ões) registradas.`;
}

// =========================================
// HISTÓRICO
// =========================================
function renderHistory() {
    const list = document.getElementById("historyList");
    const count = document.getElementById("historyCount");

    count.textContent =
        `${reportHistory.length} registro(s)`;

    if (reportHistory.length === 0) {
        list.innerHTML = `
            <div style="
                padding:24px;
                border-radius:18px;
                background:#f8fafc;
                border:1px dashed rgba(148,163,184,.25);
                color:#64748b;
                text-align:center;
            ">
                Nenhum relatório foi gerado.
            </div>
        `;
        return;
    }

    list.innerHTML = reportHistory.map(report => `
        <article style="
            padding:18px 20px;
            border-radius:18px;
            background:#ffffff;
            border:1px solid rgba(148,163,184,.12);
            box-shadow:0 8px 24px rgba(15,23,42,.04);
        ">
            <div style="
                display:flex;
                justify-content:space-between;
                gap:16px;
                flex-wrap:wrap;
                align-items:flex-start;
            ">
                <div>
                    <h3 style="
                        font-size:1rem;
                        font-weight:800;
                        margin-bottom:6px;
                    ">
                        ${escapeHtml(report.type)}
                    </h3>

                    <p style="
                        color:#64748b;
                        font-size:.9rem;
                        line-height:1.6;
                    ">
                        Período:
                        <strong>${escapeHtml(report.period)}</strong>
                        • Formato:
                        <strong>${escapeHtml(report.format)}</strong>
                    </p>
                </div>

                <div style="
                    text-align:right;
                    font-size:.85rem;
                    color:#64748b;
                ">
                    ${formatDate(report.createdAt)}
                </div>
            </div>
        </article>
    `).join("");
}

// =========================================
// LIMPAR HISTÓRICO (OPCIONAL)
// =========================================
function clearHistory() {
    if (!confirm("Deseja apagar todo o histórico?")) {
        return;
    }

    reportHistory = [];
    saveData();
    render();
}

// =========================================
// RENDER GERAL
// =========================================
function render() {
    updateStats();
    updateInsight();
    renderHistory();
}

// =========================================
// EVENTOS
// =========================================
document.addEventListener("DOMContentLoaded", () => {
    const loginPass =
        document.getElementById("loginPass");

    if (loginPass) {
        loginPass.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                login();
            }
        });
    }

    if (sessionStorage.getItem("reports-auth") === "1") {
        showApp();
    }
});
