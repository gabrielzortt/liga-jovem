// =========================================
// STOCKMIND - GESTÃO DE FUNCIONÁRIOS
// ARQUIVO: funcionarios.js
// =========================================

const ADMIN_USER = "admin";
const ADMIN_PASS = "senha";

const STORAGE_KEY = "stockmind-employees";
const AUDIT_KEY = "stockmind-employee-audit";

let employees = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
let auditLogs = JSON.parse(localStorage.getItem(AUDIT_KEY) || "[]");

// =========================================
// AUTENTICAÇÃO
// =========================================
function login() {
    const user = document.getElementById("loginUser").value.trim();
    const pass = document.getElementById("loginPass").value;
    const error = document.getElementById("loginError");

    error.textContent = "";

    if (user === ADMIN_USER && pass === ADMIN_PASS) {
        sessionStorage.setItem("employees-auth", "1");
        showApp();
    } else {
        error.textContent = "Usuário ou senha inválidos.";
    }
}

function logout() {
    sessionStorage.removeItem("employees-auth");
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(employees));
    localStorage.setItem(AUDIT_KEY, JSON.stringify(auditLogs));
}

function generateId() {
    if (window.crypto && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return "emp-" + Date.now() + "-" +
        Math.random().toString(36).slice(2, 9);
}

function getValue(id) {
    return document.getElementById(id).value.trim();
}

function escapeHtml(str) {
    return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function resetForm() {
    document.getElementById("employeeId").value = "";
    document.getElementById("name").value = "";
    document.getElementById("email").value = "";
    document.getElementById("position").value = "";
    document.getElementById("department").value = "";
    document.getElementById("accessLevel").value = "Administrador";
    document.getElementById("status").value = "Ativo";
}

function formatDate(date) {
    return new Date(date).toLocaleString("pt-BR");
}

function getInitials(name) {
    const parts = String(name).trim().split(/\s+/).slice(0, 2);
    return parts.map(p => p[0]?.toUpperCase() || "").join("");
}

function getStatusClass(status) {
    const map = {
        "Ativo": "status-active",
        "Férias": "status-vacation",
        "Afastado": "status-leave",
        "Desligado": "status-off"
    };
    return map[status] || "status-active";
}

function getAccessClass(level) {
    const map = {
        "Administrador": "access-admin",
        "Gerente": "access-manager",
        "Funcionário": "access-user"
    };
    return map[level] || "access-user";
}

// =========================================
// AUDITORIA
// =========================================
function addAudit(message) {
    auditLogs.unshift({
        id: generateId(),
        message,
        date: new Date().toISOString()
    });

    // Mantém apenas os 100 eventos mais recentes
    auditLogs = auditLogs.slice(0, 100);
}

// =========================================
// CRUD
// =========================================
function saveEmployee() {
    const id = document.getElementById("employeeId").value;
    const name = getValue("name");
    const email = getValue("email");
    const position = getValue("position");
    const department = getValue("department");
    const accessLevel = document.getElementById("accessLevel").value;
    const status = document.getElementById("status").value;

    if (!name) {
        showAlert("Informe o nome do colaborador.", "error");
        return;
    }

    if (!email) {
        showAlert("Informe o e-mail corporativo.", "error");
        return;
    }

    if (!position) {
        showAlert("Informe o cargo.", "error");
        return;
    }

    const employee = {
        id: id || generateId(),
        name,
        email,
        position,
        department,
        accessLevel,
        status,
        createdAt: new Date().toISOString()
    };

    const index = employees.findIndex(item => item.id === employee.id);

    if (index >= 0) {
        employee.createdAt = employees[index].createdAt;
        employee.updatedAt = new Date().toISOString();
        employees[index] = employee;
        addAudit(`Colaborador ${name} foi atualizado.`);
        showAlert("Colaborador atualizado com sucesso.", "success");
    } else {
        employees.unshift(employee);
        addAudit(`Colaborador ${name} foi cadastrado.`);
        showAlert("Colaborador cadastrado com sucesso.", "success");
    }

    saveData();
    resetForm();
    render();
}

function editEmployee(id) {
    const employee = employees.find(item => item.id === id);
    if (!employee) return;

    document.getElementById("employeeId").value = employee.id;
    document.getElementById("name").value = employee.name;
    document.getElementById("email").value = employee.email;
    document.getElementById("position").value = employee.position;
    document.getElementById("department").value =
        employee.department || "";
    document.getElementById("accessLevel").value =
        employee.accessLevel;
    document.getElementById("status").value = employee.status;

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function deleteEmployee(id) {
    const employee = employees.find(item => item.id === id);
    if (!employee) return;

    if (!confirm(`Deseja remover ${employee.name}?`)) {
        return;
    }

    employees = employees.filter(item => item.id !== id);
    addAudit(`Colaborador ${employee.name} foi removido.`);

    saveData();
    render();
}

function duplicateEmployee(id) {
    const employee = employees.find(item => item.id === id);
    if (!employee) return;

    const copy = {
        ...employee,
        id: generateId(),
        name: employee.name + " (Cópia)",
        createdAt: new Date().toISOString()
    };

    employees.unshift(copy);
    addAudit(`Colaborador ${employee.name} foi duplicado.`);

    saveData();
    render();
}

// =========================================
// ALERTAS
// =========================================
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
// KPIs
// =========================================
function updateStats() {
    const total = employees.length;
    const active = employees.filter(
        e => e.status === "Ativo"
    ).length;
    const admins = employees.filter(
        e => e.accessLevel === "Administrador"
    ).length;
    const logs = auditLogs.length;

    document.getElementById("statTotal").textContent = total;
    document.getElementById("statActive").textContent = active;
    document.getElementById("statAdmins").textContent = admins;
    document.getElementById("statLogs").textContent = logs;
}

// =========================================
// RESUMO EXECUTIVO
// =========================================
function updateExecutiveBanner() {
    const total = employees.length;
    const active = employees.filter(
        e => e.status === "Ativo"
    ).length;
    const managers = employees.filter(
        e => e.accessLevel === "Gerente"
    ).length;

    const title = document.getElementById("executiveTitle");
    const text = document.getElementById("executiveText");

    if (total === 0) {
        title.textContent =
            "Estrutura operacional ainda não configurada.";
        text.textContent =
            "Cadastre colaboradores para iniciar o controle " +
            "de acessos e auditoria.";
        return;
    }

    title.textContent =
        `${active} colaboradores ativos em operação.`;

    text.textContent =
        `A empresa possui ${total} colaboradores cadastrados, ` +
        `${managers} em nível gerencial e ${auditLogs.length} ` +
        `eventos registrados em auditoria.`;
}

// =========================================
// RENDERIZAÇÃO DOS FUNCIONÁRIOS
// =========================================
function renderEmployees() {
    const grid = document.getElementById("employeeGrid");

    const search = document
        .getElementById("search")
        .value
        .toLowerCase();

    const filterAccess = document
        .getElementById("filterAccess")
        .value;

    let filtered = employees.filter(employee => {
        const text = (
            employee.name + " " +
            employee.position + " " +
            (employee.department || "")
        ).toLowerCase();

        return text.includes(search);
    });

    if (filterAccess !== "all") {
        filtered = filtered.filter(employee =>
            employee.accessLevel === filterAccess
        );
    }

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div style="
                grid-column:1 / -1;
                padding:40px;
                text-align:center;
                border:1px dashed rgba(148,163,184,.35);
                border-radius:20px;
                color:#64748b;
            ">
                Nenhum colaborador encontrado.
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map(employee => `
        <article style="
            background:#ffffff;
            border:1px solid rgba(148,163,184,.14);
            border-radius:22px;
            padding:22px;
            box-shadow:0 12px 24px rgba(15,23,42,.05);
        ">
            <div style="
                display:flex;
                align-items:center;
                gap:14px;
                margin-bottom:16px;
            ">
                <div style="
                    width:52px;
                    height:52px;
                    border-radius:16px;
                    background:linear-gradient(135deg,#2563eb,#7c3aed);
                    color:#ffffff;
                    display:flex;
                    align-items:center;
                    justify-content:center;
                    font-weight:800;
                ">
                    ${escapeHtml(getInitials(employee.name))}
                </div>

                <div>
                    <h4 style="
                        font-size:1rem;
                        font-weight:800;
                        margin-bottom:4px;
                    ">
                        ${escapeHtml(employee.name)}
                    </h4>

                    <p style="
                        font-size:.85rem;
                        color:#64748b;
                    ">
                        ${escapeHtml(employee.position)}
                    </p>
                </div>
            </div>

            <div style="
                display:grid;
                gap:8px;
                margin-bottom:16px;
                color:#64748b;
                font-size:.88rem;
            ">
                <div>
                    <strong>E-mail:</strong>
                    ${escapeHtml(employee.email)}
                </div>

                <div>
                    <strong>Setor:</strong>
                    ${escapeHtml(employee.department || "-")}
                </div>
            </div>

            <div style="
                display:flex;
                gap:8px;
                flex-wrap:wrap;
                margin-bottom:16px;
            ">
                <span style="
                    padding:6px 10px;
                    border-radius:999px;
                    font-size:.75rem;
                    font-weight:700;
                    background:${getAccessBadgeBg(employee.accessLevel)};
                    color:${getAccessBadgeColor(employee.accessLevel)};
                ">
                    ${escapeHtml(employee.accessLevel)}
                </span>

                <span style="
                    padding:6px 10px;
                    border-radius:999px;
                    font-size:.75rem;
                    font-weight:700;
                    background:${getStatusBadgeBg(employee.status)};
                    color:${getStatusBadgeColor(employee.status)};
                ">
                    ${escapeHtml(employee.status)}
                </span>
            </div>

            <div style="
                display:grid;
                grid-template-columns:repeat(3,1fr);
                gap:8px;
            ">
                <button
                    class="btn btn-secondary"
                    onclick="editEmployee('${employee.id}')"
                    style="padding:10px 12px"
                >
                    <i class="fas fa-pen"></i>
                </button>

                <button
                    class="btn btn-secondary"
                    onclick="duplicateEmployee('${employee.id}')"
                    style="padding:10px 12px"
                >
                    <i class="fas fa-copy"></i>
                </button>

                <button
                    class="btn btn-secondary"
                    onclick="deleteEmployee('${employee.id}')"
                    style="padding:10px 12px"
                >
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </article>
    `).join("");
}

// =========================================
// AUDITORIA
// =========================================
function renderAudit() {
    const list = document.getElementById("auditList");
    const count = document.getElementById("auditCount");

    count.textContent =
        `${auditLogs.length} evento(s)`;

    if (auditLogs.length === 0) {
        list.innerHTML = `
            <div style="
                padding:18px;
                border-radius:16px;
                background:#f8fafc;
                color:#64748b;
            ">
                Nenhum evento registrado.
            </div>
        `;
        return;
    }

    list.innerHTML = auditLogs.slice(0, 20).map(log => `
        <div style="
            padding:14px 16px;
            border-radius:16px;
            background:#f8fafc;
            border:1px solid rgba(148,163,184,.12);
        ">
            <div style="
                font-weight:600;
                margin-bottom:4px;
            ">
                ${escapeHtml(log.message)}
            </div>

            <div style="
                font-size:.8rem;
                color:#64748b;
            ">
                ${formatDate(log.date)}
            </div>
        </div>
    `).join("");
}

// =========================================
// BADGES
// =========================================
function getAccessBadgeBg(level) {
    const map = {
        "Administrador": "#dbeafe",
        "Gerente": "#ede9fe",
        "Funcionário": "#ecfeff"
    };
    return map[level] || "#f1f5f9";
}

function getAccessBadgeColor(level) {
    const map = {
        "Administrador": "#1d4ed8",
        "Gerente": "#6d28d9",
        "Funcionário": "#0f766e"
    };
    return map[level] || "#334155";
}

function getStatusBadgeBg(status) {
    const map = {
        "Ativo": "#dcfce7",
        "Férias": "#fef3c7",
        "Afastado": "#fee2e2",
        "Desligado": "#e2e8f0"
    };
    return map[status] || "#f1f5f9";
}

function getStatusBadgeColor(status) {
    const map = {
        "Ativo": "#166534",
        "Férias": "#92400e",
        "Afastado": "#991b1b",
        "Desligado": "#475569"
    };
    return map[status] || "#334155";
}

// =========================================
// EXPORTAÇÃO
// =========================================
function exportData() {
    const data = {
        employees,
        auditLogs,
        exportedAt: new Date().toISOString()
    };

    const blob = new Blob(
        [JSON.stringify(data, null, 2)],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "funcionarios.json";
    link.click();

    URL.revokeObjectURL(url);
}

// =========================================
// RENDER GERAL
// =========================================
function render() {
    updateStats();
    updateExecutiveBanner();
    renderEmployees();
    renderAudit();
}

// =========================================
// EVENTOS
// =========================================
document.addEventListener("DOMContentLoaded", () => {
    const search = document.getElementById("search");
    const filter = document.getElementById("filterAccess");
    const loginPass = document.getElementById("loginPass");

    if (search) {
        search.addEventListener("input", render);
    }

    if (filter) {
        filter.addEventListener("change", render);
    }

    if (loginPass) {
        loginPass.addEventListener("keydown", event => {
            if (event.key === "Enter") {
                login();
            }
        });
    }

    if (sessionStorage.getItem("employees-auth") === "1") {
        showApp();
    }
});
