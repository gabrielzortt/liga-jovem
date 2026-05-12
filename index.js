// ===============================
// STOCKMIND - DASHBOARD HOME JS
// ===============================

document.addEventListener("DOMContentLoaded", () => {
  // -------------------------------
  // ELEMENTOS
  // -------------------------------
  const body = document.body;
  const themeToggle = document.getElementById("themeToggle");
  const sidebarToggle = document.getElementById("sidebarToggle");
  const sidebar = document.getElementById("sidebar");

  // -------------------------------
  // TEMA (DARK / LIGHT)
  // -------------------------------
  const savedTheme = localStorage.getItem("stockmind-theme");

  if (savedTheme === "light") {
    body.classList.remove("dark");
    body.classList.add("light");
    updateThemeIcon(true);
  } else {
    body.classList.remove("light");
    body.classList.add("dark");
    updateThemeIcon(false);
  }

  themeToggle?.addEventListener("click", () => {
    const isLight = body.classList.toggle("light");

    if (isLight) {
      body.classList.remove("dark");
      localStorage.setItem("stockmind-theme", "light");
    } else {
      body.classList.add("dark");
      localStorage.setItem("stockmind-theme", "dark");
    }

    updateThemeIcon(isLight);

    // Atualiza gráficos após troca de tema
    setTimeout(() => {
      Object.values(charts).forEach((chart) => chart.update());
    }, 100);
  });

  function updateThemeIcon(isLight) {
    const icon = themeToggle?.querySelector("i");
    if (!icon) return;

    if (isLight) {
      icon.className = "fas fa-sun";
    } else {
      icon.className = "fas fa-moon";
    }
  }

  // -------------------------------
  // SIDEBAR RESPONSIVA
  // -------------------------------
  sidebarToggle?.addEventListener("click", () => {
    if (window.innerWidth <= 768) {
      sidebar.classList.toggle("mobile-open");
    } else {
      sidebar.classList.toggle("collapsed");
    }
  });

  // Fecha sidebar no mobile ao clicar fora
  document.addEventListener("click", (event) => {
    if (
      window.innerWidth <= 768 &&
      sidebar.classList.contains("mobile-open") &&
      !sidebar.contains(event.target) &&
      !sidebarToggle.contains(event.target)
    ) {
      sidebar.classList.remove("mobile-open");
    }
  });

  // -------------------------------
  // CONFIGURAÇÕES DE CORES
  // -------------------------------
  function getCssVar(name) {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
  }

  function createGradient(ctx, color1, color2) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    return gradient;
  }

  // -------------------------------
  // CONFIGURAÇÃO PADRÃO DOS GRÁFICOS
  // -------------------------------
  function defaultOptions() {
    const textColor = getCssVar("--text-secondary");
    const borderColor = getCssVar("--border");

    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: "index",
        intersect: false
      },
      plugins: {
        legend: {
          labels: {
            color: textColor,
            font: {
              family: "Inter"
            }
          }
        },
        tooltip: {
          backgroundColor: getCssVar("--card"),
          titleColor: getCssVar("--text"),
          bodyColor: getCssVar("--text-secondary"),
          borderColor: borderColor,
          borderWidth: 1
        }
      },
      scales: {
        x: {
          ticks: {
            color: textColor
          },
          grid: {
            color: borderColor
          }
        },
        y: {
          ticks: {
            color: textColor
          },
          grid: {
            color: borderColor
          }
        }
      }
    };
  }

  const charts = {};

  // -------------------------------
  // GRÁFICO 1 - FATURAMENTO X LUCRO
  // -------------------------------
  const revenueCanvas = document.getElementById("revenueChart");

  if (revenueCanvas) {
    const ctx = revenueCanvas.getContext("2d");

    const revenueGradient = createGradient(
      ctx,
      "rgba(59, 130, 246, 0.45)",
      "rgba(59, 130, 246, 0.03)"
    );

    const profitGradient = createGradient(
      ctx,
      "rgba(34, 197, 94, 0.35)",
      "rgba(34, 197, 94, 0.03)"
    );

    charts.revenueChart = new Chart(ctx, {
      type: "line",
      data: {
        labels: [
          "Jan",
          "Fev",
          "Mar",
          "Abr",
          "Mai",
          "Jun",
          "Jul",
          "Ago",
          "Set",
          "Out",
          "Nov",
          "Dez"
        ],
        datasets: [
          {
            label: "Faturamento",
            data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            borderColor: "#3b82f6",
            backgroundColor: revenueGradient,
            fill: true,
            tension: 0.4,
            borderWidth: 3,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: "Lucro",
            data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            borderColor: "#22c55e",
            backgroundColor: profitGradient,
            fill: true,
            tension: 0.4,
            borderWidth: 3,
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ]
      },
      options: defaultOptions()
    });
  }

  // -------------------------------
  // GRÁFICO 2 - DISTRIBUIÇÃO DO ESTOQUE
  // -------------------------------
  const categoryCanvas = document.getElementById("categoryChart");

  if (categoryCanvas) {
    const ctx = categoryCanvas.getContext("2d");

    charts.categoryChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: [
          "Categoria 1",
          "Categoria 2",
          "Categoria 3",
          "Categoria 4",
          "Categoria 5"
        ],
        datasets: [
          {
            data: [1, 1, 1, 1, 1],
            backgroundColor: [
              "#3b82f6",
              "#22c55e",
              "#f59e0b",
              "#ef4444",
              "#8b5cf6"
            ],
            borderWidth: 0
          }
        ]
      },
      options: {
        ...defaultOptions(),
        scales: {}
      }
    });
  }

  // -------------------------------
  // GRÁFICO 3 - STATUS DO ESTOQUE
  // -------------------------------
  const stockStatusCanvas = document.getElementById("stockStatusChart");

  if (stockStatusCanvas) {
    const ctx = stockStatusCanvas.getContext("2d");

    charts.stockStatusChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: [
          "Normal",
          "Baixo",
          "Excesso",
          "Sem Giro",
          "Vencendo"
        ],
        datasets: [
          {
            label: "Quantidade",
            data: [0, 0, 0, 0, 0],
            backgroundColor: [
              "#22c55e",
              "#f59e0b",
              "#3b82f6",
              "#8b5cf6",
              "#ef4444"
            ],
            borderRadius: 8
          }
        ]
      },
      options: {
        ...defaultOptions(),
        plugins: {
          ...defaultOptions().plugins,
          legend: {
            display: false
          }
        }
      }
    });
  }

  // -------------------------------
  // EFEITO DE ATIVAÇÃO DO MENU
  // -------------------------------
  const navItems = document.querySelectorAll(".nav-item");

  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      navItems.forEach((nav) => nav.classList.remove("active"));
      item.classList.add("active");
    });
  });

  // -------------------------------
  // PESQUISA (FRONT-END VISUAL)
  // -------------------------------
  const searchInput = document.querySelector(".search-box input");

  searchInput?.addEventListener("input", function () {
    const value = this.value.trim();

    if (value.length > 0) {
      this.parentElement.style.boxShadow =
        "0 0 0 3px rgba(59, 130, 246, 0.15)";
    } else {
      this.parentElement.style.boxShadow = "none";
    }
  });

  // -------------------------------
  // NOTIFICAÇÃO DE BOAS-VINDAS
  // -------------------------------
  setTimeout(() => {
    showToast("Dashboard carregado com sucesso.");
  }, 600);

  // -------------------------------
  // SISTEMA DE TOAST
  // -------------------------------
  function showToast(message) {
    const toast = document.createElement("div");
    toast.className = "stockmind-toast";
    toast.innerHTML = `
      <i class="fas fa-circle-check"></i>
      <span>${message}</span>
    `;

    Object.assign(toast.style, {
      position: "fixed",
      bottom: "24px",
      right: "24px",
      background: getCssVar("--card"),
      color: getCssVar("--text"),
      border: `1px solid ${getCssVar("--border")}`,
      borderRadius: "14px",
      padding: "14px 18px",
      display: "flex",
      alignItems: "center",
      gap: "10px",
      boxShadow: "0 15px 40px rgba(0,0,0,0.25)",
      zIndex: "9999",
      opacity: "0",
      transform: "translateY(20px)",
      transition: "all 0.35s ease"
    });

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateY(0)";
    });

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(20px)";

      setTimeout(() => {
        toast.remove();
      }, 350);
    }, 3000);
  }

  // -------------------------------
  // REDIMENSIONA GRÁFICOS
  // -------------------------------
  window.addEventListener("resize", () => {
    Object.values(charts).forEach((chart) => chart.resize());
  });
});
