// =========================================
// STOCKMIND - CONTROLE DE ESTOQUE
// ARQUIVO: estoque.js
// =========================================

const ADMIN_USER = "admin";
const ADMIN_PASS = "senha";
const STORAGE_KEY = "stockmind-products";

let products = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

// =========================================
// AUTENTICAÇÃO
// =========================================
function login() {
    const user = document.getElementById("loginUser").value.trim();
    const pass = document.getElementById("loginPass").value;
    const error = document.getElementById("loginError");

    error.textContent = "";

    if (user === ADMIN_USER && pass === ADMIN_PASS) {
        sessionStorage.setItem("stockmind-auth", "1");
        showApp();
    } else {
        error.textContent = "Usuário ou senha inválidos.";
    }
}

function logout() {
    sessionStorage.removeItem("stockmind-auth");
    location.reload();
}

function showApp() {
    document.getElementById("loginScreen").classList.add("hidden");
    document.getElementById("app").classList.remove("hidden");
    render();
}

// =========================================
// UTILITÁRIOS
// =========================================
function saveProducts() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

function getInput(id) {
    return document.getElementById(id).value;
}

function resetForm() {
    [
        "productId",
        "name",
        "category",
        "barcode",
        "supplier",
        "expiry",
        "quantity",
        "minStock",
        "cost",
        "price"
    ].forEach(id => {
        document.getElementById(id).value = "";
    });
}

function daysUntil(dateStr) {
    if (!dateStr) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const date = new Date(dateStr + "T00:00:00");

    return Math.ceil((date - today) / 86400000);
}

function formatCurrency(value) {
    return Number(value).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
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
// STATUS DO PRODUTO
// =========================================
function getStatus(product) {
    const days = daysUntil(product.expiry);

    if (days !== null && days <= 30) {
        return {
            text: days < 0 ? "Vencido" : "Vencendo",
            class: "expired"
        };
    }

    if (product.quantity <= product.minStock) {
        return {
            text: "Baixo",
            class: "low"
        };
    }

    return {
        text: "Normal",
        class: "ok"
    };
}

// =========================================
// CRUD DE PRODUTOS
// =========================================
function saveProduct() {
    const id = getInput("productId");

    const product = {
        id: id || crypto.randomUUID(),
        name: getInput("name").trim(),
        category: getInput("category").trim(),
        barcode: getInput("barcode").trim(),
        supplier: getInput("supplier").trim(),
        expiry: getInput("expiry"),
        quantity: Number(getInput("quantity") || 0),
        minStock: Number(getInput("minStock") || 0),
        cost: Number(getInput("cost") || 0),
        price: Number(getInput("price") || 0)
    };

    if (!product.name) {
        alert("Informe o nome do produto.");
        return;
    }

    const index = products.findIndex(p => p.id === product.id);

    if (index >= 0) {
        products[index] = product;
    } else {
        products.push(product);
    }

    saveProducts();
    resetForm();
    render();
}

function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;

    document.getElementById("productId").value = product.id;
    document.getElementById("name").value = product.name;
    document.getElementById("category").value = product.category;
    document.getElementById("barcode").value = product.barcode;
    document.getElementById("supplier").value = product.supplier;
    document.getElementById("expiry").value = product.expiry;
    document.getElementById("quantity").value = product.quantity;
    document.getElementById("minStock").value = product.minStock;
    document.getElementById("cost").value = product.cost;
    document.getElementById("price").value = product.price;

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function deleteProduct(id) {
    if (!confirm("Deseja excluir este produto?")) return;

    products = products.filter(p => p.id !== id);

    saveProducts();
    render();
}

// =========================================
// RENDERIZAÇÃO
// =========================================
function render() {
    const tbody = document.getElementById("productTable");
    const search = document.getElementById("search").value.toLowerCase();
    const filter = document.getElementById("filterStatus").value;

    let filtered = products.filter(product => {
        const text =
            `${product.name} ${product.category} ${product.supplier}`.toLowerCase();

        return text.includes(search);
    });

    if (filter !== "all") {
        filtered = filtered.filter(product => {
            return getStatus(product).class === filter;
        });
    }

    tbody.innerHTML = filtered.map(product => {
        const status = getStatus(product);

        return `
            <tr>
                <td>
                    <strong>${escapeHtml(product.name)}</strong><br>
                    <small style="color:#64748b">
                        ${escapeHtml(product.category || "Sem categoria")}
                    </small>
                </td>

                <td>${product.quantity}</td>

                <td>
                    <span class="badge ${status.class}">
                        ${status.text}
                    </span>
                </td>

                <td>${escapeHtml(product.supplier || "-")}</td>

                <td>${formatCurrency(product.quantity * product.cost)}</td>

                <td>
                    <button
                        class="icon-btn"
                        onclick="editProduct('${product.id}')"
                        title="Editar"
                    >
                        <i class="fas fa-pen"></i>
                    </button>

                    <button
                        class="icon-btn"
                        onclick="deleteProduct('${product.id}')"
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
// KPIs
// =========================================
function updateStats() {
    const total = products.length;

    const low = products.filter(product => {
        return product.quantity <= product.minStock;
    }).length;

    const expiry = products.filter(product => {
        const days = daysUntil(product.expiry);
        return days !== null && days <= 30;
    }).length;

    const value = products.reduce((sum, product) => {
        return sum + (product.quantity * product.cost);
    }, 0);

    document.getElementById("statTotal").textContent = total;
    document.getElementById("statLow").textContent = low;
    document.getElementById("statExpiry").textContent = expiry;
    document.getElementById("statValue").textContent = formatCurrency(value);
}

// =========================================
// ALERTAS
// =========================================
function updateAlerts() {
    const alerts = [];

    const low = products.filter(product => {
        return product.quantity <= product.minStock;
    }).length;

    const expiry = products.filter(product => {
        const days = daysUntil(product.expiry);
        return days !== null && days <= 30;
    }).length;

    if (low > 0) {
        alerts.push(`
            <div class="alert warning">
                ${low} produto(s) abaixo do estoque mínimo.
            </div>
        `);
    }

    if (expiry > 0) {
        alerts.push(`
            <div class="alert danger">
                ${expiry} produto(s) vencidos ou próximos do vencimento.
            </div>
        `);
    }

    if (alerts.length === 0) {
        alerts.push(`
            <div class="alert success">
                Nenhum alerta crítico no momento.
            </div>
        `);
    }

    document.getElementById("alerts").innerHTML = alerts.join("");
}

// =========================================
// EXPORTAÇÃO
// =========================================
function exportData() {
    const blob = new Blob(
        [JSON.stringify(products, null, 2)],
        { type: "application/json" }
    );

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "estoque.json";
    link.click();

    URL.revokeObjectURL(link.href);
}

// =========================================
// EVENTOS
// =========================================
document.addEventListener("DOMContentLoaded", () => {
    // Pesquisa
    document.getElementById("search").addEventListener("input", render);

    // Filtro
    document.getElementById("filterStatus").addEventListener("change", render);

    // Enter no login
    document.getElementById("loginPass").addEventListener("keydown", event => {
        if (event.key === "Enter") {
            login();
        }
    });

    // Sessão já autenticada
    if (sessionStorage.getItem("stockmind-auth") === "1") {
        showApp();
    }
});
