// =========================================
// STOCKMIND - LOGS DO SISTEMA
// ARQUIVO: logs.js
// =========================================

const LOGS_STORAGE_KEY = "stockmind-system-logs";

let logs = JSON.parse(
    localStorage.getItem(LOGS_STORAGE_KEY) || "[]"
);

// =========================================
// UTILITÁRIOS
// =========================================
function saveLogs() {
    localStorage.setItem(
        LOGS_STORAGE_KEY,
        JSON.stringify(logs)
    );
}

function generateId() {
    if (window.crypto && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return "log-" + Date.now() + "-" +
        Math.random().toString(36).slice(2, 9);
}

function escapeHtml(str) {
    return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatDate(date) {
    return new Date(date).toLocaleString("pt-BR");
}

// =========================================
// CRIAÇÃO DE LOGS
// =========================================
function addLog(level, title, message) {
    logs.unshift({
        id: generateId(),
        level,
        title,
        message,
        createdAt: new Date().toISOString()
    });

    logs = logs.slice(0, 500);

    saveLogs();
    render();
}

function generateDemoLogs() {
    addLog(
        "info",
        "Sistema iniciado",
        "A aplicação foi carregada com sucesso."
    );

    addLog(
        "warning",
        "Estoque abaixo do mínimo",
        "7 produtos estão com quantidade crítica."
    );

    addLog(
        "error",
        "Falha de exportação",
        "Não foi possível concluir uma exportação financeira."
    );

    addLog(
        "security",
        "Tentativa de acesso",
        "Um usuário tentou acessar uma área restrita."
    );
}

// =========================================
// FILTROS
// =========================================
function getFilteredLogs() {
    const search = document
        .getElementById("search")
        .value
        .trim()
        .toLowerCase();

    const level = document
        .getElementById("filterLevel")
        .value;

    return logs.filter(log => {
        const matchesSearch =
            !search ||
            log.title.toLowerCase().includes(search) ||
            log.message.toLowerCase().includes(search);

        const matchesLevel =
            level === "all" ||
            log.level === level;

        return matchesSearch && matchesLevel;
    });
}

// =========================================
// LIMPAR LOGS
// =========================================
function clearLogs() {
    if (!confirm("Deseja remover todos os logs do sistema?")) {
        return;
    }

    logs = [];
    saveLogs();
    render();
}

// =========================================
// ESTATÍSTICAS
// =========================================
function updateStats() {
    const countByLevel = level =>
        logs.filter(log => log.level === level).length;

    document.getElementById("statInfo").textContent =
        countByLevel("info");

    document.getElementById("statWarning").textContent =
        countByLevel("warning");

    document.getElementById("statError").textContent =
        countByLevel("error");

    document.getElementById("statSecurity").textContent =
        countByLevel("security");
}

// =========================================
// INSIGHT EXECUTIVO
// =========================================
function updateInsight() {
    const title = document.getElementById("insightTitle");
    const text = document.getElementById("insightText");

    if (logs.length === 0) {
        title.textContent = "Nenhum log registrado.";
        text.textContent =
            "O sistema exibirá automaticamente os eventos de auditoria.";
        return;
    }

    const errors = logs.filter(
        log => log.level === "error"
    ).length;

    const security = logs.filter(
        log => log.level === "security"
    ).length;

    if (errors > 0) {
        title.textContent =
            `${errors} erro(s) detectado(s).`;

        text.textContent =
            "Recomenda-se analisar falhas operacionais para evitar impactos.";
    } else if (security > 0) {
        title.textContent =
            `${security} evento(s) de segurança registrados.`;

        text.textContent =
            "O ambiente está monitorando acessos e ações críticas.";
    } else {
        title.textContent =
            `${logs.length} evento(s) monitorado(s).`;

        text.textContent =
            "A auditoria está registrando as operações normalmente.";
    }
}

// =========================================
// RENDER LISTA
// =========================================
function renderLogs() {
    const list = document.getElementById("logList");
    const count = document.getElementById("logCount");

    const filtered = getFilteredLogs();

    count.textContent =
        `${filtered.length} registro(s)`;

    if (filtered.length === 0) {
        list.innerHTML = `
            <div style="
                padding:24px;
                border-radius:18px;
                background:#f8fafc;
                border:1px dashed rgba(148,163,184,.25);
                color:#64748b;
                text-align:center;
            ">
                Nenhum log encontrado.
            </div>
        `;
        return;
    }

    const levelMap = {
        info: {
            label: "Informação",
            icon: "fa-circle-info",
            color: "#2563eb"
        },
        warning: {
            label: "Aviso",
            icon: "fa-triangle-exclamation",
            color: "#d97706"
        },
        error: {
            label: "Erro",
            icon: "fa-circle-xmark",
            color: "#dc2626"
        },
        security: {
            label: "Segurança",
            icon: "fa-shield-halved",
            color: "#7c3aed"
        }
    };

    list.innerHTML = filtered.map(log => {
        const meta = levelMap[log.level];

        return `
            <article style="
                padding:20px;
                border-radius:20px;
                background:#ffffff;
                border:1px solid rgba(148,163,184,.12);
                border-left:4px solid ${meta.color};
                box-shadow:0 8px 24px rgba(15,23,42,.04);
            ">
                <div style="
                    display:flex;
                    justify-content:space-between;
                    gap:16px;
                    flex-wrap:wrap;
                ">
                    <div style="flex:1;">
                        <div style="
                            display:flex;
                            align-items:center;
                            gap:10px;
                            margin-bottom:8px;
                        ">
                            <i class="fas ${meta.icon}"
                               style="color:${meta.color};"></i>

                            <span style="
                                font-size:.75rem;
                                font-weight:800;
                                letter-spacing:.08em;
                                text-transform:uppercase;
                                color:${meta.color};
                            ">
                                ${meta.label}
                            </span>
                        </div>

                        <h3 style="
                            font-size:1rem;
                            font-weight:800;
                            margin-bottom:6px;
                        ">
                            ${escapeHtml(log.title)}
                        </h3>

                        <p style="
                            color:#64748b;
                            line-height:1.7;
                            margin-bottom:10px;
                        ">
                            ${escapeHtml(log.message)}
                        </p>

                        <small style="color:#94a3b8;">
                            ${formatDate(log.createdAt)}
                        </small>
                    </div>
                </div>
            </article>
        `;
    }).join("");
}

// =========================================
// RENDER GERAL
// =========================================
function render() {
    updateStats();
    updateInsight();
    renderLogs();
}

// =========================================
// EVENTOS
// =========================================
document.addEventListener("DOMContentLoaded", () => {
    const search =
        document.getElementById("search");

    const filterLevel =
        document.getElementById("filterLevel");

    [search, filterLevel].forEach(element => {
        element.addEventListener("input", render);
        element.addEventListener("change", render);
    });

    render();
});
