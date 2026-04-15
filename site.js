const headerHTML = `
  <header class="site-header">
    <div class="nav-shell">
      <div class="nav-left">
        <a class="brand" href="index.html">Mia Min</a>
      </div>
      <nav class="nav-links" id="site-nav" aria-label="Primary">
        <a href="index.html" data-nav="home">Home</a>
        <a href="hair.html" data-nav="hair">Hair</a>
        <a href="beauty.html" data-nav="beauty">Beauty</a>
        <a href="fashion.html" data-nav="fashion">Fashion</a>
        <a href="lifestyle.html" data-nav="lifestyle">Lifestyle</a>
        <a href="#services">Services</a>
        <a href="about.html" data-nav="about">About</a>
      </nav>
      <div class="nav-right">
        <a class="button header-cta" href="#contact">Let's work together</a>
        <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
      </div>
    </div>
  </header>
`;

const footerHTML = `
  <footer class="site-footer">
    <p>&copy; 2026 Mia Min | All Rights Reserved</p>
  </footer>
`;

const injectComponent = (selector, html) => {
  const target = document.querySelector(selector);
  if (target) {
    target.innerHTML = html;
  }
};

const imageFileRegex = /\.(apng|avif|gif|jpe?g|png|svg|webp)$/i;

const normalizeLogoList = (list) => {
  if (!Array.isArray(list)) return [];
  const cleaned = list
    .filter((item) => typeof item === "string")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .filter((item) => imageFileRegex.test(item));
  return Array.from(new Set(cleaned));
};

const resolveLogoSource = (folder, filename) => {
  if (/^https?:\/\//i.test(filename)) return filename;
  const base = folder.replace(/\/$/, "");
  return filename.startsWith(base) ? filename : `${base}/${filename}`;
};

const humanizeLogoName = (filename) => {
  const stripped = filename
    .replace(/\.[^/.]+$/, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return stripped || "Brand logo";
};

const fetchJson = async (path) => {
  try {
    const response = await fetch(encodeURI(path));
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    return null;
  }
};

const populateLogoMarquee = (carousel, logos) => {
  const groups = carousel.querySelectorAll("[data-logo-group]");
  if (!groups.length) return;

  groups.forEach((group) => {
    group.innerHTML = "";
    logos.forEach((file) => {
      const img = document.createElement("img");
      img.className = "logo-marquee__logo";
      img.src = encodeURI(resolveLogoSource(carousel.dataset.logoFolder, file));
      img.alt = humanizeLogoName(file);
      img.loading = "lazy";
      img.decoding = "async";
      group.appendChild(img);
    });
  });
};

const initLogoMarquees = async () => {
  const marquees = document.querySelectorAll(".logo-marquee[data-logo-folder]");
  if (!marquees.length) return;

  await Promise.all(
    Array.from(marquees).map(async (carousel) => {
      const folder = carousel.dataset.logoFolder;
      if (!folder) return;

      const manifestPath =
        carousel.dataset.logoManifest || `${folder.replace(/\/$/, "")}/manifest.json`;

      // Try inline manifest first (loaded via <script> tag, works on file://)
      let logos = [];
      if (window.LOGO_MANIFESTS) {
        const inline = window.LOGO_MANIFESTS[folder] || window.LOGO_MANIFESTS[manifestPath];
        if (inline) logos = Array.isArray(inline) ? inline : inline.files;
      }

      // Fall back to fetch (works on a real server)
      if (!logos.length) {
        const manifestData = await fetchJson(manifestPath);
        if (manifestData) logos = Array.isArray(manifestData) ? manifestData : manifestData.files;
      }

      logos = normalizeLogoList(logos);
      if (!logos.length) {
        carousel.classList.add("logo-marquee--empty");
        return;
      }

      populateLogoMarquee(carousel, logos);
    })
  );
};

document.addEventListener("DOMContentLoaded", () => {
  injectComponent('[data-component="header"]', headerHTML);
  injectComponent('[data-component="footer"]', footerHTML);

  const header = document.querySelector(".site-header");
  if (header) {
    const toggleShadow = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    toggleShadow();
    window.addEventListener("scroll", toggleShadow, { passive: true });
  }

  const activePage = document.body.dataset.page;
  if (activePage) {
    const activeLink = document.querySelector(`[data-nav="${activePage}"]`);
    if (activeLink) {
      activeLink.classList.add("active");
      activeLink.setAttribute("aria-current", "page");
    }
  }

  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");

  if (header && navToggle && navLinks) {
    navToggle.addEventListener("click", () => {
      const isOpen = header.classList.toggle("nav-open");
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });

    navLinks.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        header.classList.remove("nav-open");
        navToggle.setAttribute("aria-expanded", "false");
      });
    });

    document.addEventListener("click", (e) => {
      if (!header.classList.contains("nav-open")) return;
      if (!header.contains(e.target)) {
        header.classList.remove("nav-open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  const serviceLists = document.querySelectorAll(".services-list");
  serviceLists.forEach((list) => {
    const items = list.querySelectorAll("details");
    items.forEach((detail) => {
      detail.addEventListener("toggle", () => {
        if (!detail.open) return;
        items.forEach((other) => {
          if (other !== detail) {
            other.removeAttribute("open");
          }
        });
      });
    });
  });

  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;

    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;

    event.preventDefault();

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      target.scrollIntoView();
    } else {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });

  initLogoMarquees();
});
