// =========================================
// STOCKMIND - CENTRAL DE NOTIFICAÇÕES
// ARQUIVO: notificacoes.js
// =========================================

const STORAGE_KEY = "stockmind-notificacoes";

let notifications = JSON.parse(
    localStorage.getItem(STORAGE_KEY) || "[]"
);

// =========================================
// UTILITÁRIOS
// =========================================
function saveData() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(notifications)
    );
}

function generateId() {
    if (window.crypto && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return "notif-" + Date.now() + "-" +
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
// DADOS DE DEMONSTRAÇÃO
// =========================================
function generateDemoNotifications() {
    const demo = [
        {
            title: "Estoque crítico detectado",
            message: "O produto 'Parafuso 8mm' atingiu o nível mínimo.",
            type: "critical"
        },
        {
            title: "Reposição recomendada",
            message: "Sugestão automática de compra para 12 produtos.",
            type: "warning"
        },
        {
            title: "Backup concluído",
            message: "Backup diário executado com sucesso.",
            type: "success"
        },
        {
            title: "Novo relatório gerado",
            message: "Relatório financeiro mensal foi exportado em PDF.",
            type: "info"
        }
    ];

    demo.forEach(item => {
        notifications.unshift({
            id: generateId(),
            title: item.title,
            message: item.message,
            type: item.type,
            read: false,
            createdAt: new Date().toISOString()
        });
    });

    notifications = notifications.slice(0, 300);

    saveData();
    render();
}

// =========================================
// CRUD
// =========================================
function markAsRead(id) {
    const item = notifications.find(n => n.id === id);

    if (item) {
        item.read = true;
        saveData();
        render();
    }
}

function markAllAsRead() {
    notifications.forEach(n => {
        n.read = true;
    });

    saveData();
    render();
}

function deleteNotification(id) {
    notifications = notifications.filter(
        n => n.id !== id
    );

    saveData();
    render();
}

function clearAllNotifications() {
    if (!confirm("Deseja remover todas as notificações?")) {
        return;
    }

    notifications = [];
    saveData();
    render();
}

// =========================================
// FILTROS
// =========================================
function getFilteredNotifications() {
    const search = document
        .getElementById("search")
        .value
        .trim()
        .toLowerCase();

    const type = document
        .getElementById("filterType")
        .value;

    const status = document
        .getElementById("filterStatus")
        .value;

    return notifications.filter(item => {
        const matchesSearch =
            !search ||
            item.title.toLowerCase().includes(search) ||
            item.message.toLowerCase().includes(search);

        const matchesType =
            type === "all" || item.type === type;

        const matchesStatus =
            status === "all" ||
            (status === "read" && item.read) ||
            (status === "unread" && !item.read);

        return (
            matchesSearch &&
            matchesType &&
            matchesStatus
        );
    });
}

// =========================================
// ESTATÍSTICAS
// =========================================
function updateStats() {
    const critical = notifications.filter(
        n => n.type === "critical"
    ).length;

    const warning = notifications.filter(
        n => n.type === "warning"
    ).length;

    const info = notifications.filter(
        n => n.type === "info"
    ).length;

    const unread = notifications.filter(
        n => !n.read
    ).length;

    document.getElementById("statCritical").textContent =
        critical;

    document.getElementById("statWarning").textContent =
        warning;

    document.getElementById("statInfo").textContent =
        info;

    document.getElementById("statUnread").textContent =
        unread;
}

// =========================================
// INSIGHT EXECUTIVO
// =========================================
function updateInsight() {
    const title =
        document.getElementById("insightTitle");

    const text =
        document.getElementById("insightText");

    if (notifications.length === 0) {
        title.textContent =
            "Nenhuma notificação registrada.";

        text.textContent =
            "O sistema exibirá automaticamente alertas e " +
            "eventos operacionais.";
        return;
    }

    const unread = notifications.filter(
        n => !n.read
    ).length;

    if (unread > 0) {
        title.textContent =
            `${unread} notificação(ões) exigem atenção.`;

        text.textContent =
            "Priorize a análise dos alertas não lidos " +
            "para manter a operação sob controle.";
    } else {
        title.textContent =
            "Todas as notificações foram analisadas.";

        text.textContent =
            "Não há pendências no centro de monitoramento.";
    }
}

// =========================================
// RENDER LISTA
// =========================================
function renderNotifications() {
    const list =
        document.getElementById("notificationList");

    const count =
        document.getElementById("notificationCount");

    const filtered = getFilteredNotifications();

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
                Nenhuma notificação encontrada.
            </div>
        `;
        return;
    }

    list.innerHTML = filtered.map(item => {
        const typeMap = {
            critical: {
                icon: "fa-triangle-exclamation",
                color: "#dc2626",
                label: "Crítica"
            },
            warning: {
                icon: "fa-bell",
                color: "#d97706",
                label: "Alerta"
            },
            info: {
                icon: "fa-circle-info",
                color: "#0ea5e9",
                label: "Informativa"
            },
            success: {
                icon: "fa-circle-check",
                color: "#16a34a",
                label: "Sucesso"
            }
        };

        const meta = typeMap[item.type];

        return `
            <article style="
                padding:20px;
                border-radius:20px;
                background:${item.read ? "#ffffff" : "#f8fbff"};
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

                            ${
                                !item.read
                                    ? `
                                    <span style="
                                        padding:4px 8px;
                                        border-radius:999px;
                                        font-size:.7rem;
                                        font-weight:700;
                                        background:#dbeafe;
                                        color:#1d4ed8;
                                    ">
                                        NOVA
                                    </span>
                                    `
                                    : ""
                            }
                        </div>

                        <h3 style="
                            font-size:1rem;
                            font-weight:800;
                            margin-bottom:6px;
                        ">
                            ${escapeHtml(item.title)}
                        </h3>

                        <p style="
                            color:#64748b;
                            line-height:1.7;
                            margin-bottom:10px;
                        ">
                            ${escapeHtml(item.message)}
                        </p>

                        <small style="color:#94a3b8;">
                            ${formatDate(item.createdAt)}
                        </small>
                    </div>

                    <div style="
                        display:flex;
                        gap:8px;
                        flex-wrap:wrap;
                    ">
                        ${
                            !item.read
                                ? `
                                <button onclick="markAsRead('${item.id}')"
                                    style="
                                        padding:8px 12px;
                                        border:none;
                                        border-radius:10px;
                                        background:#dbeafe;
                                        color:#1d4ed8;
                                        font-weight:700;
                                        cursor:pointer;
                                    ">
                                    Ler
                                </button>
                                `
                                : ""
                        }

                        <button onclick="deleteNotification('${item.id}')"
                            style="
                                padding:8px 12px;
                                border:none;
                                border-radius:10px;
                                background:#fee2e2;
                                color:#991b1b;
                                font-weight:700;
                                cursor:pointer;
                            ">
                            Excluir
                        </button>
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
    renderNotifications();
}

// =========================================
// EVENTOS
// =========================================
document.addEventListener("DOMContentLoaded", () => {
    const search =
        document.getElementById("search");

    const filterType =
        document.getElementById("filterType");

    const filterStatus =
        document.getElementById("filterStatus");

    [search, filterType, filterStatus].forEach(el => {
        el.addEventListener("input", render);
        el.addEventListener("change", render);
    });

    render();
});
