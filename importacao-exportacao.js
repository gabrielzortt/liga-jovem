// =========================================
// STOCKMIND - IMPORTAÇÃO E EXPORTAÇÃO
// ARQUIVO: importacao-exportacao.js
// =========================================

const STORAGE_KEY = "stockmind-import-export-history";

let history = JSON.parse(
    localStorage.getItem(STORAGE_KEY) || "[]"
);

// =========================================
// UTILITÁRIOS
// =========================================
function saveHistory() {
    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(history)
    );
}

function generateId() {
    if (window.crypto && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return "op-" + Date.now() + "-" +
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
// REGISTRO DE OPERAÇÕES
// =========================================
function addHistory(type, fileName, sizeBytes = 0) {
    history.unshift({
        id: generateId(),
        type,
        fileName,
        sizeBytes,
        createdAt: new Date().toISOString()
    });

    history = history.slice(0, 200);

    saveHistory();
    render();
}

// =========================================
// COLETA DE DADOS DO SISTEMA
// =========================================
function collectAllData() {
    const data = {};

    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);

        // Ignorar o próprio histórico
        if (key === STORAGE_KEY) {
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
// EXPORTAÇÃO JSON
// =========================================
function exportJSON() {
    const payload = {
        metadata: {
            system: "StockMind",
            exportedAt: new Date().toISOString()
        },
        data: collectAllData()
    };

    const content = JSON.stringify(payload, null, 2);
    const fileName =
        "stockmind-export-" +
        new Date().toISOString().slice(0, 19)
            .replace(/:/g, "-") +
        ".json";

    downloadFile(
        content,
        fileName,
        "application/json"
    );

    addHistory(
        "Exportação",
        fileName,
        content.length
    );

    showAlert("Arquivo JSON exportado com sucesso.");
}

// =========================================
// EXPORTAÇÃO CSV
// =========================================
function exportCSV() {
    const data = collectAllData();

    let csv = "Chave,Valor\n";

    Object.entries(data).forEach(([key, value]) => {
        const line = [
            escapeCSV(key),
            escapeCSV(JSON.stringify(value))
        ].join(",");

        csv += line + "\n";
    });

    const fileName =
        "stockmind-export-" +
        new Date().toISOString().slice(0, 19)
            .replace(/:/g, "-") +
        ".csv";

    downloadFile(
        csv,
        fileName,
        "text/csv;charset=utf-8;"
    );

    addHistory(
        "Exportação",
        fileName,
        csv.length
    );

    showAlert("Arquivo CSV exportado com sucesso.");
}

function escapeCSV(value) {
    const text = String(value || "");
    return `"${text.replace(/"/g, '""')}"`;
}

// =========================================
// DOWNLOAD
// =========================================
function downloadFile(content, fileName, mimeType) {
    const blob = new Blob([content], {
        type: mimeType
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = fileName;
    link.click();

    URL.revokeObjectURL(url);
}

// =========================================
// IMPORTAÇÃO
// =========================================
function importFile(file) {
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (event) {
        try {
            const extension =
                file.name.split(".").pop().toLowerCase();

            if (extension === "json") {
                importJSON(event.target.result);
            } else if (extension === "csv") {
                importCSV(event.target.result);
            } else {
                throw new Error("Formato inválido.");
            }

            addHistory(
                "Importação",
                file.name,
                file.size
            );

            showAlert(
                `${file.name} importado com sucesso.`
            );
        } catch (error) {
            showAlert(
                "Não foi possível processar o arquivo.",
                "error"
            );
        }
    };

    reader.readAsText(file);
}

function importJSON(content) {
    const payload = JSON.parse(content);

    if (payload.data) {
        Object.entries(payload.data).forEach(([key, value]) => {
            localStorage.setItem(
                key,
                JSON.stringify(value)
            );
        });
    } else {
        Object.entries(payload).forEach(([key, value]) => {
            localStorage.setItem(
                key,
                JSON.stringify(value)
            );
        });
    }
}

function importCSV(content) {
    const lines = content.split(/\r?\n/).filter(Boolean);

    // Ignorar cabeçalho
    lines.slice(1).forEach(line => {
        const match = line.match(/^"(.+?)","(.*)"$/);

        if (!match) return;

        const key = match[1].replace(/""/g, '"');
        const rawValue = match[2].replace(/""/g, '"');

        try {
            const parsed = JSON.parse(rawValue);
            localStorage.setItem(
                key,
                JSON.stringify(parsed)
            );
        } catch {
            localStorage.setItem(key, rawValue);
        }
    });
}

// =========================================
// LIMPAR HISTÓRICO
// =========================================
function clearHistory() {
    if (!confirm("Deseja remover todo o histórico?")) {
        return;
    }

    history = [];
    saveHistory();
    render();

    showAlert("Histórico removido.");
}

// =========================================
// ESTATÍSTICAS
// =========================================
function updateStats() {
    const imports = history.filter(
        item => item.type === "Importação"
    ).length;

    const exports = history.filter(
        item => item.type === "Exportação"
    ).length;

    const last =
        history.length > 0
            ? new Date(
                  history[0].createdAt
              ).toLocaleDateString("pt-BR")
            : "--";

    document.getElementById("statImports").textContent =
        imports;

    document.getElementById("statExports").textContent =
        exports;

    document.getElementById("statLast").textContent =
        last;

    document.getElementById("statStatus").textContent =
        "Ativo";
}

// =========================================
// INSIGHT
// =========================================
function updateInsight() {
    const title = document.getElementById("insightTitle");
    const text = document.getElementById("insightText");

    if (history.length === 0) {
        title.textContent =
            "Nenhuma operação registrada.";

        text.textContent =
            "O histórico de importações e exportações será exibido aqui.";
        return;
    }

    title.textContent =
        `${history.length} operação(ões) registradas.`;

    text.textContent =
        "O centro de integração está rastreando todas as transferências de dados.";
}

// =========================================
// HISTÓRICO
// =========================================
function renderHistory() {
    const list = document.getElementById("historyList");
    const count = document.getElementById("historyCount");

    count.textContent =
        `${history.length} registro(s)`;

    if (history.length === 0) {
        list.innerHTML = `
            <div style="
                padding:24px;
                border-radius:18px;
                background:#f8fafc;
                border:1px dashed rgba(148,163,184,.25);
                color:#64748b;
                text-align:center;
            ">
                Nenhuma operação realizada.
            </div>
        `;
        return;
    }

    list.innerHTML = history.map(item => {
        const isImport = item.type === "Importação";
        const color = isImport ? "#16a34a" : "#2563eb";
        const icon = isImport
            ? "fa-file-arrow-up"
            : "fa-file-arrow-down";

        return `
            <article style="
                padding:18px 20px;
                border-radius:18px;
                background:#ffffff;
                border:1px solid rgba(148,163,184,.12);
                border-left:4px solid ${color};
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
                            display:flex;
                            align-items:center;
                            gap:8px;
                        ">
                            <i class="fas ${icon}"
                               style="color:${color};"></i>
                            ${escapeHtml(item.fileName)}
                        </h3>

                        <p style="
                            color:#64748b;
                            font-size:.9rem;
                            line-height:1.6;
                        ">
                            ${item.type}
                            •
                            ${((item.sizeBytes || 0) / 1024).toFixed(1)} KB
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
        `;
    }).join("");
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
    const input = document.getElementById("importFile");
    const uploadZone = document.querySelector(".upload-zone");

    input.addEventListener("change", event => {
        const file = event.target.files[0];
        importFile(file);
        event.target.value = "";
    });

    // Drag and Drop
    ["dragenter", "dragover"].forEach(eventName => {
        uploadZone.addEventListener(eventName, event => {
            event.preventDefault();
            uploadZone.style.borderColor =
                "rgba(37, 99, 235, 0.5)";
        });
    });

    ["dragleave", "drop"].forEach(eventName => {
        uploadZone.addEventListener(eventName, event => {
            event.preventDefault();
            uploadZone.style.borderColor =
                "rgba(37, 99, 235, 0.2)";
        });
    });

    uploadZone.addEventListener("drop", event => {
        const file = event.dataTransfer.files[0];
        importFile(file);
    });

    render();
});
