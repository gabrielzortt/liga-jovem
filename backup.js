// =========================================
// STOCKMIND - BACKUP E RECUPERAÇÃO
// ARQUIVO: backup.js
// =========================================

const BACKUP_STORAGE_KEY = "stockmind-backup-history";

let backupHistory = JSON.parse(
    localStorage.getItem(BACKUP_STORAGE_KEY) || "[]"
);

// =========================================
// UTILITÁRIOS
// =========================================
function saveHistory() {
    localStorage.setItem(
        BACKUP_STORAGE_KEY,
        JSON.stringify(backupHistory)
    );
}

function generateId() {
    if (window.crypto && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return "backup-" + Date.now() + "-" +
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
    }, 4000);
}

// =========================================
// COLETA DE DADOS DO LOCALSTORAGE
// =========================================
function collectSystemData() {
    const data = {};

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);

        // Não incluir o próprio histórico de backups
        if (key === BACKUP_STORAGE_KEY) {
            continue;
        }

        try {
            data[key] = JSON.parse(localStorage.getItem(key));
        } catch {
            data[key] = localStorage.getItem(key);
        }
    }

    return data;
}

// =========================================
// CRIAR BACKUP
// =========================================
function createBackup() {
    const systemData = collectSystemData();

    const payload = {
        metadata: {
            system: "StockMind",
            version: "1.0.0",
            createdAt: new Date().toISOString(),
            generatedBy: "Backup Center"
        },
        data: systemData
    };

    const json = JSON.stringify(payload, null, 2);

    // Download do arquivo
    const blob = new Blob([json], {
        type: "application/json"
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    const fileName =
        "stockmind-backup-" +
        new Date().toISOString().slice(0, 19)
            .replace(/:/g, "-") +
        ".json";

    link.href = url;
    link.download = fileName;
    link.click();

    URL.revokeObjectURL(url);

    // Registrar histórico
    backupHistory.unshift({
        id: generateId(),
        fileName,
        createdAt: new Date().toISOString(),
        sizeBytes: json.length
    });

    backupHistory = backupHistory.slice(0, 100);

    saveHistory();
    render();

    showAlert("Backup criado com sucesso.");
}

// =========================================
// RESTAURAR BACKUP
// =========================================
function restoreBackup(file) {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (event) {
        try {
            const payload = JSON.parse(event.target.result);

            if (!payload || !payload.data) {
                throw new Error("Estrutura inválida.");
            }

            if (!confirm(
                "A restauração substituirá os dados atuais. Deseja continuar?"
            )) {
                return;
            }

            // Restaurar dados
            Object.entries(payload.data).forEach(([key, value]) => {
                localStorage.setItem(
                    key,
                    JSON.stringify(value)
                );
            });

            showAlert(
                "Backup restaurado com sucesso. Recarregando...",
                "success"
            );

            setTimeout(() => {
                location.reload();
            }, 1500);
        } catch (error) {
            showAlert(
                "Arquivo de backup inválido.",
                "error"
            );
        }
    };

    reader.readAsText(file);
}

// =========================================
// LIMPAR HISTÓRICO
// =========================================
function clearHistory() {
    if (!confirm("Deseja apagar todo o histórico de backups?")) {
        return;
    }

    backupHistory = [];
    saveHistory();
    render();

    showAlert("Histórico removido.");
}

// =========================================
// ESTATÍSTICAS
// =========================================
function updateStats() {
    const total = backupHistory.length;

    const last =
        total > 0
            ? new Date(
                  backupHistory[0].createdAt
              ).toLocaleDateString("pt-BR")
            : "--";

    const totalBytes = backupHistory.reduce(
        (sum, item) => sum + (item.sizeBytes || 0),
        0
    );

    const sizeKB = (totalBytes / 1024).toFixed(1);

    document.getElementById("statTotal").textContent =
        total;

    document.getElementById("statLast").textContent =
        last;

    document.getElementById("statSize").textContent =
        `${sizeKB} KB`;

    document.getElementById("statStatus").textContent =
        total > 0 ? "Protegido" : "Seguro";
}

// =========================================
// INSIGHT EXECUTIVO
// =========================================
function updateInsight() {
    const title = document.getElementById("insightTitle");
    const text = document.getElementById("insightText");

    if (backupHistory.length === 0) {
        title.textContent = "Nenhum backup registrado.";
        text.textContent =
            "Recomenda-se criar backups periódicos para garantir a segurança das informações.";
        return;
    }

    title.textContent =
        `${backupHistory.length} backup(s) armazenado(s).`;

    text.textContent =
        "O ambiente possui histórico de proteção e está preparado para recuperação de dados.";
}

// =========================================
// HISTÓRICO
// =========================================
function renderHistory() {
    const list = document.getElementById("historyList");
    const count = document.getElementById("historyCount");

    count.textContent =
        `${backupHistory.length} registro(s)`;

    if (backupHistory.length === 0) {
        list.innerHTML = `
            <div style="
                padding:24px;
                border-radius:18px;
                background:#f8fafc;
                border:1px dashed rgba(148,163,184,.25);
                color:#64748b;
                text-align:center;
            ">
                Nenhum backup realizado.
            </div>
        `;
        return;
    }

    list.innerHTML = backupHistory.map(item => `
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
                        ${escapeHtml(item.fileName)}
                    </h3>

                    <p style="
                        color:#64748b;
                        font-size:.9rem;
                        line-height:1.6;
                    ">
                        Tamanho:
                        <strong>
                            ${((item.sizeBytes || 0) / 1024).toFixed(1)} KB
                        </strong>
                    </p>
                </div>

                <div style="
                    text-align:right;
                    font-size:.85rem;
                    color:#64748b;
                ">
                    ${formatDate(item.createdAt)}
                </div>
            </div>
        </article>
    `).join("");
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
    const restoreInput =
        document.getElementById("restoreFile");

    restoreInput.addEventListener("change", event => {
        const file = event.target.files[0];
        restoreBackup(file);

        // Permite selecionar o mesmo arquivo novamente
        event.target.value = "";
    });

    render();
});
