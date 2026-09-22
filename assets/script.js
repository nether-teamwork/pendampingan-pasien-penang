const WHATSAPP_NUMBERS = ["60164322445", "6281388618804", "628134944452"];

const DEFAULT_MESSAGE =
  "Halo, saya ingin berkonsultasi mengenai pendampingan pasien untuk berobat ke Penang.";

function getRandomNumber() {
  if (!WHATSAPP_NUMBERS || WHATSAPP_NUMBERS.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * WHATSAPP_NUMBERS.length);
  return WHATSAPP_NUMBERS[randomIndex];
}

function waUrl(message = DEFAULT_MESSAGE) {
  const activeNumber = getRandomNumber();

  if (!activeNumber || activeNumber.includes("[NOMOR")) {
    return "#whatsapp-placeholder";
  }
  return `https://wa.me/${activeNumber}?text=${encodeURIComponent(message)}`;
}

function initWhatsApp() {
  document.querySelectorAll("[data-whatsapp]").forEach((el) => {
    const message = el.dataset.message || DEFAULT_MESSAGE;
    const url = waUrl(message);

    el.setAttribute("href", url);

    el.addEventListener("click", (e) => {
      if (url.startsWith("#")) {
        e.preventDefault();
        alert(
          "Nomor WhatsApp belum diisi. Silakan isi array WHATSAPP_NUMBERS pada file script terlebih dahulu.",
        );
      }
    });
  });
}

function initMobileMenu() {
  const menuToggle = document.getElementById("menu-toggle");
  const navMenu = document.getElementById("nav-menu");

  if (!menuToggle || !navMenu) return;

  menuToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    const isExpanded = menuToggle.getAttribute("aria-expanded") === "true";
    menuToggle.setAttribute("aria-expanded", !isExpanded);
    navMenu.classList.toggle("show");
  });

  document.addEventListener("click", (e) => {
    const isMenuOpen = navMenu.classList.contains("show");

    if (isMenuOpen) {
      const clickedOutsideMenu = !navMenu.contains(e.target);
      const clickedOutsideToggle = !menuToggle.contains(e.target);

      if (clickedOutsideMenu && clickedOutsideToggle) {
        navMenu.classList.remove("show");
        menuToggle.setAttribute("aria-expanded", "false");
      }
    }
  });
}

function initActiveMenu() {
  const currentPath = window.location.pathname.split("/").pop();
  const navLinks = document.querySelectorAll(".nav-links a");

  navLinks.forEach((link) => {
    link.classList.remove("active");

    const linkPath = link.getAttribute("href");

    if (
      currentPath === linkPath ||
      (currentPath === "" && linkPath === "index.html")
    ) {
      link.classList.add("active");
    }
  });
}

function initYear() {
  document
    .querySelectorAll("[data-year]")
    .forEach((el) => (el.textContent = new Date().getFullYear()));
}

const DOCTOR_DIRECTORY = {
  gleneagles: {
    name: "Gleneagles Hospital Penang",
    data: "../data/gleneagles.js",
  },
  island: {
    name: "Island Hospital Penang",
    data: "../data/island-hospital.js",
  },
  northern: {
    name: "Northern Hospital Penang",
    data: "../data/northern-hospital.js",
  },
  fourth: {
    name: "Rumah Sakit Keempat Penang",
    data: "../data/fourth-hospital.js",
  },
};

function doctorEscape(value) {
  return String(value ?? "").replace(
    /[&<>"']/g,
    (m) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      })[m],
  );
}

function doctorInitials(name) {
  return (
    String(name)
      .replace(/^dr\.?\s*/i, "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((x) => x[0])
      .join("")
      .toUpperCase() || "DR"
  );
}

function loadDoctorData(key, callback) {
  const config = DOCTOR_DIRECTORY[key];
  if (!config) return callback([]);
  const script = document.createElement("script");
  script.src = config.data;
  script.onload = () => callback(window.DOCTORS || []);
  script.onerror = () => callback([]);
  document.head.appendChild(script);
}

function initDoctorDirectory() {
  const directory = document.getElementById("doctor-directory");
  if (!directory) return;
  const key = directory.dataset.hospital;
  loadDoctorData(key, (doctors) => {
    const grid = document.getElementById("doctor-grid");
    const search = document.getElementById("doctor-search");
    const filter = document.getElementById("doctor-specialty");
    const count = document.getElementById("doctor-count");
    const modal = document.getElementById("doctor-modal");
    if (!grid || !search || !filter || !count) return;

    const specialties = [
      ...new Set(doctors.map((d) => d.specialty).filter(Boolean)),
    ].sort();
    filter.innerHTML =
      '<option value="">Semua spesialisasi</option>' +
      specialties
        .map(
          (s) =>
            `<option value="${doctorEscape(s)}">${doctorEscape(s)}</option>`,
        )
        .join("");

    function draw() {
      const q = search.value.toLowerCase().trim();
      const selected = filter.value;
      const result = doctors.filter((d) => {
        const text =
          `${d.name} ${d.specialty} ${d.qualification}`.toLowerCase();
        return (
          (!q || text.includes(q)) && (!selected || d.specialty === selected)
        );
      });
      count.textContent = `Menampilkan ${result.length} dari ${doctors.length} dokter`;

      grid.innerHTML = result.length
        ? result
            .map((d, i) => {
              const fotoUrl = d.foto ? doctorEscape(d.foto) : "";

              const isiAvatar = fotoUrl
                ? `<img src="${fotoUrl}" alt="${doctorEscape(d.name)}" class="doctor-photo-render">`
                : doctorEscape(doctorInitials(d.name));

              return `
        <article class="doctor-card">
          <div class="doctor-avatar">${isiAvatar}</div>
          <h3>${doctorEscape(d.name)}</h3>
          <div class="doctor-specialty">${doctorEscape(d.specialty)}</div>
          <div class="doctor-meta">${doctorEscape(d.hospital)}<br>${doctorEscape(d.note || "")}</div>
          <div class="doctor-actions"><button class="btn btn-secondary" type="button" data-doctor-index="${doctors.indexOf(d)}">Lihat profil</button></div>
        </article>`;
            })
            .join("")
        : '<div class="doctor-empty">Dokter tidak ditemukan. Coba kata kunci atau spesialisasi lain.</div>';

      grid.querySelectorAll("[data-doctor-index]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const d = doctors[Number(btn.dataset.doctorIndex)];
          if (!modal) return;

          const fotoUrlModal = d.foto ? doctorEscape(d.foto) : "";
          const wadahAvatarModal = document.getElementById(
            "doctor-modal-avatar",
          );

          if (wadahAvatarModal) {
            wadahAvatarModal.innerHTML = fotoUrlModal
              ? `<img src="${fotoUrlModal}" alt="${doctorEscape(d.name)}" class="doctor-photo-render">`
              : doctorEscape(doctorInitials(d.name));
          }

          document.getElementById("doctor-modal-name").textContent = d.name;
          document.getElementById("doctor-modal-specialty").textContent =
            d.specialty;
          document.getElementById("doctor-modal-hospital").textContent =
            d.hospital;
          document.getElementById("doctor-modal-qualification").textContent =
            d.qualification;
          document.getElementById("doctor-modal-profile").textContent =
            d.profile;
          document.getElementById("doctor-modal").classList.add("show");
          document.body.style.overflow = "hidden";
        });
      });

      search.addEventListener("input", draw);
      filter.addEventListener("change", draw);
    }

    draw();

    const close = document.getElementById("doctor-modal-close");
    if (close)
      close.addEventListener("click", () => {
        modal.classList.remove("show");
        document.body.style.overflow = "";
      });
    if (modal)
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          modal.classList.remove("show");
          document.body.style.overflow = "";
        }
      });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initWhatsApp();
  initMobileMenu();
  initYear();
  initActiveMenu();
  initDoctorDirectory();

  const tabsNav = document.getElementById("tabs-navigation");
  const currentTitle = document.getElementById("current-spesialis-title");
  const cardsGrid = document.getElementById("dokter-cards-grid");
  const btnLeft = document.getElementById("slide-left");
  const btnRight = document.getElementById("slide-right");

  function tampilkanDokter(spesialis) {
    if (!cardsGrid || !currentTitle) return;

    cardsGrid.innerHTML = "";
    currentTitle.textContent = spesialis.namaSpesialis;

    spesialis.dokter.forEach((doc) => {
      const cardLink = document.createElement("a");
      cardLink.href = doc.link;
      cardLink.className = "dokter-card-anchor";

      // PERBAIKAN: Menambahkan /pendampingan-pasien-penang/ pada src foto utama AND onerror logo cadangan
      cardLink.innerHTML = `
          <div class="dokter-premium-card">
              <div class="avatar-frame-container">
                  <img src="${doc.foto}" 
                       alt="${doc.nama}" 
                       class="dokter-avatar-img" 
                       onerror="this.onerror=null; this.src='/pendampingan-pasien-penang/img/Logo-pendampingan-pasien-penang.png';">
              </div>
              <h4 class="dokter-card-name">${doc.nama}</h4>
              <span class="hospital-cta-badge">Lihat Profil RS →</span>
          </div>
      `;
      cardsGrid.appendChild(cardLink);
    });
  }

  if (tabsNav && cardsGrid) {
    dataSpesialisDokter.forEach((spesialis, index) => {
      const btn = document.createElement("button");
      btn.className = "category-tab-btn";
      btn.textContent = spesialis.namaSpesialis.replace("Spesialisasi ", "");

      if (index === 0) {
        btn.classList.add("active-tab");
        tampilkanDokter(spesialis);
      }

      btn.addEventListener("click", () => {
        document
          .querySelectorAll(".category-tab-btn")
          .forEach((t) => t.classList.remove("active-tab"));
        btn.classList.add("active-tab");

        tampilkanDokter(spesialis);

        btn.scrollIntoView({
          behavior: "smooth",
          inline: "center",
          block: "nearest",
        });
      });
      tabsNav.appendChild(btn);
    });
  }

  if (tabsNav && btnLeft && btnRight) {
    const hitungJarakGeser = () => tabsNav.clientWidth * 0.6;

    btnRight.addEventListener("click", () => {
      tabsNav.scrollLeft += hitungJarakGeser();
    });

    btnLeft.addEventListener("click", () => {
      tabsNav.scrollLeft -= hitungJarakGeser();
    });

    tabsNav.addEventListener("scroll", () => {
      const mentokKanan =
        tabsNav.scrollLeft >= tabsNav.scrollWidth - tabsNav.clientWidth - 2;
      const mentokKiri = tabsNav.scrollLeft <= 2;

      btnLeft.style.opacity = mentokKiri ? "0.3" : "1";
      btnLeft.style.pointerEvents = mentokKiri ? "none" : "auto";

      btnRight.style.opacity = mentokKanan ? "0.3" : "1";
      btnRight.style.pointerEvents = mentokKanan ? "none" : "auto";
    });

    setTimeout(() => {
      if (tabsNav.scrollWidth <= tabsNav.clientWidth) {
        btnLeft.style.display = "none";
        btnRight.style.display = "none";
      } else {
        btnLeft.style.opacity = "0.3";
        btnLeft.style.pointerEvents = "none";
      }
    }, 300);
  }
});
