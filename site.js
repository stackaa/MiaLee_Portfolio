const primaryNavShellHTML = `
  <div class="nav-shell">
    <div class="nav-left">
      <a class="brand" href="index.html">Mia Min</a>
    </div>
    <nav class="nav-links" id="site-nav" aria-label="Primary">
      <a href="index.html" data-nav="home">Home</a>
      <a href="influence.html" data-nav="influence">Influence</a>
      <div class="nav-dropdown">
        <a href="ugc.html" data-nav="ugc">UGC</a>
        <button type="button" class="nav-dropdown__toggle" aria-expanded="false" aria-controls="ugc-niches-menu" aria-label="Toggle UGC niches">&#9662;</button>
        <div class="nav-dropdown__menu" id="ugc-niches-menu">
          <a href="ugc.html">Overview</a>
          <a href="hair.html" data-nav="hair">Hair</a>
          <a href="beauty.html" data-nav="beauty">Beauty</a>
          <a href="fashion.html" data-nav="fashion">Fashion</a>
          <a href="lifestyle.html" data-nav="lifestyle">Lifestyle</a>
        </div>
      </div>
      <a href="about.html" data-nav="about">About</a>
    </nav>
    <div class="nav-right">
      <a class="button header-cta" href="#contact">Start a project</a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">Menu</button>
    </div>
  </div>
`;

const headerSimpleHTML = `<header class="site-header">${primaryNavShellHTML}</header>`;

const headerSplitHTML = headerSimpleHTML;

const ugcClusterPages = ["ugc", "hair", "beauty", "fashion", "lifestyle"];

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

// Recolor every marquee logo to the single brand brown (--logo-tint) with
// inline SVG filters. Default: a solid flood of the tint, cut to the logo's
// own alpha shape. Logos in duoToneLogos (solid shapes/fills that would
// otherwise merge with their lettering) use a two-tone filter instead:
// dark pixels -> tint, light pixels (luminance >= 0.5) -> white.
// Only applied from JS, so without JS logos keep their own colors.
const duoToneLogos = [
  "Garnier logo",
  "Superdry logo",
  "First_Aid_Beauty_Logo",
  "5bbc5f3f81817", // Zeeman
  "929d843236e50fecb78a", // Cillit Bang
  "3a0bfbd16500eefb8828b5a3b113d146", // Monopoly GO
  "images-8", // L'Escargot Montorgueil
  "lays-logo", // Lay's
];

// Two filter sets: ink for light backgrounds (brown, light fills -> white)
// and ink for dark backgrounds (cream, light fills -> page brown), so solid
// shapes always melt into whatever section they sit on. CSS picks the set.
const logoFilterDefs = (id, inkClass, fillClass) => `
  <filter id="${id}" color-interpolation-filters="sRGB">
    <feFlood class="${inkClass}" />
    <feComposite in2="SourceAlpha" operator="in" />
  </filter>
  <filter id="${id}-duo" color-interpolation-filters="sRGB">
    <feColorMatrix in="SourceGraphic" type="matrix"
      values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0.2126 0.7152 0.0722 0 0" result="lum" />
    <feComponentTransfer in="lum" result="light">
      <feFuncA type="discrete" tableValues="0 1" />
    </feComponentTransfer>
    <feComposite in="light" in2="SourceAlpha" operator="in" result="lightMask" />
    <feFlood class="${fillClass}" />
    <feComposite in2="lightMask" operator="in" result="fill" />
    <feFlood class="${inkClass}" />
    <feComposite in2="SourceAlpha" operator="in" result="ink" />
    <feMerge>
      <feMergeNode in="ink" />
      <feMergeNode in="fill" />
    </feMerge>
  </filter>`;

const tintLogos = (root = document) => {
  if (!document.getElementById("logo-tint")) {
    document.body.insertAdjacentHTML(
      "beforeend",
      `<svg class="logo-tint-defs" aria-hidden="true" focusable="false" width="0" height="0">
        ${logoFilterDefs("logo-tint", "logo-tint-ink", "logo-tint-fill")}
        ${logoFilterDefs("logo-tint-on-dark", "logo-tint-ink-on-dark", "logo-tint-fill-on-dark")}
      </svg>`
    );
  }
  root.querySelectorAll(".logo-marquee__logo").forEach((img) => {
    const src = decodeURI(img.getAttribute("src") || "");
    const duo = duoToneLogos.some((name) => src.includes(name));
    img.classList.add(duo ? "logo-marquee__logo--duo" : "logo-marquee__logo--tinted");
  });
};

// Widen the spacing between logos (never shrink it) until one group is wide
// enough that the same brand never appears twice in the band at once.
// Duration scales with the group width so the scroll speed stays the same.
const fitLogoMarquee = (carousel) => {
  const group = carousel.querySelector(".logo-marquee__group");
  const viewport = carousel.querySelector(".logo-marquee__viewport");
  if (!group || !viewport) return;

  carousel.style.removeProperty("--logo-gap");
  carousel.style.removeProperty("--logo-duration");
  const count = group.children.length;
  if (!count) return;
  const styles = getComputedStyle(carousel);
  const logoWidth = parseFloat(styles.getPropertyValue("--logo-width"));
  const baseDuration = parseFloat(styles.getPropertyValue("--logo-duration"));
  const baseGap = parseFloat(getComputedStyle(group).columnGap) || 0;
  if (!logoWidth) return;

  // Copies of a logo sit one group-width apart; both are visible whenever
  // group width < strip width + logo width. Solve n(w + gap) >= strip + w.
  const neededGap = Math.ceil((viewport.clientWidth + logoWidth) / count - logoWidth);
  if (neededGap <= baseGap) return;

  carousel.style.setProperty("--logo-gap", `${neededGap}px`);
  if (baseDuration) {
    const ratio = (logoWidth + neededGap) / (logoWidth + baseGap);
    carousel.style.setProperty("--logo-duration", `${(baseDuration * ratio).toFixed(1)}s`);
  }
};

const fitAllLogoMarquees = () => {
  document.querySelectorAll(".logo-marquee").forEach(fitLogoMarquee);
};

let logoFitFrame;
window.addEventListener("resize", () => {
  cancelAnimationFrame(logoFitFrame);
  logoFitFrame = requestAnimationFrame(fitAllLogoMarquees);
});

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
      tintLogos(carousel);
      fitLogoMarquee(carousel);
    })
  );
};

// "Back" link, only where it helps:
// - UGC niche pages (hair/beauty/fashion/lifestyle): always shown
// - influence/ugc: only when the visitor got there by clicking a Home path
//   card (flagged in sessionStorage on click), not via the top nav
// If the visitor came from another page of the site it behaves like the
// browser back button; otherwise (search, shared link) it goes to the
// logical parent: the UGC hub for niche pages, Home otherwise.
// sessionStorage is used because document.referrer is empty when the site
// is opened from local files.
const nichePages = ["hair", "beauty", "fashion", "lifestyle"];

const initBackLink = () => {
  const page = document.body.dataset.page || "";
  let cameFromSite = false;
  let fromPathCard = false;
  try {
    const last = sessionStorage.getItem("mm-last-page");
    cameFromSite = Boolean(last) && last !== (page || location.pathname); // a reload doesn't count
    sessionStorage.setItem("mm-last-page", page || location.pathname);
    fromPathCard = sessionStorage.getItem("mm-from-path-card") === page;
    sessionStorage.removeItem("mm-from-path-card");
  } catch (e) {
    cameFromSite = Boolean(document.referrer) && new URL(document.referrer).origin === location.origin;
  }

  // Remember path-card clicks so the target page knows to show "Back"
  document.querySelectorAll("a.path-card[href]").forEach((card) => {
    card.addEventListener("click", () => {
      const target = card.getAttribute("href").replace(/\.html.*$/, "");
      try {
        sessionStorage.setItem("mm-from-path-card", target);
      } catch (e) {}
    });
  });

  const showBack = nichePages.includes(page) || (fromPathCard && cameFromSite);
  if (!showBack) return;

  const main = document.querySelector("main");
  if (!main) return;
  const fallback = nichePages.includes(page) ? "ugc.html" : "index.html";

  const bar = document.createElement("div");
  bar.className = "back-bar";
  bar.innerHTML = `<a class="back-link" href="${fallback}"><span class="arrow" aria-hidden="true">&larr;</span> Back</a>`;
  bar.querySelector("a").addEventListener("click", (event) => {
    if (cameFromSite && window.history.length > 1) {
      event.preventDefault();
      window.history.back();
    }
  });
  main.prepend(bar);

  // Float just below the fixed header, whatever its real height (it grows
  // on small screens when the logo wraps)
  const placeBar = () => {
    const header = document.querySelector(".site-header");
    const bottom = header ? header.getBoundingClientRect().bottom : 0;
    bar.style.setProperty("--back-top", `${Math.round(bottom) + 14}px`);
  };
  placeBar();
  window.addEventListener("resize", placeBar);
  window.addEventListener("load", placeBar);

  // Text colour follows the background underneath while scrolling: find the
  // element behind the button, walk up to the first ancestor with a solid
  // background colour, and switch to dark ink when that colour is light.
  const link = bar.querySelector("a");
  const isLight = (rgb) => {
    const m = rgb.match(/[\d.]+/g);
    if (!m) return false;
    const [r, g, b] = m.map(Number);
    return 0.2126 * r + 0.7152 * g + 0.0722 * b > 150;
  };
  const updateTone = () => {
    const r = link.getBoundingClientRect();
    const stack = document.elementsFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    let el = stack.find((node) => !bar.contains(node));
    while (el && el !== document.documentElement) {
      const bg = getComputedStyle(el).backgroundColor;
      const alpha = bg.startsWith("rgba") ? parseFloat(bg.split(",")[3]) : 1;
      if (bg !== "transparent" && alpha > 0.5) {
        bar.classList.toggle("is-on-light", isLight(bg));
        return;
      }
      el = el.parentElement;
    }
    bar.classList.remove("is-on-light");
  };
  updateTone();
  window.addEventListener("scroll", updateTone, { passive: true });
  window.addEventListener("resize", updateTone);
  window.addEventListener("load", updateTone);
};

document.addEventListener("DOMContentLoaded", () => {
  const headerVariant = document.body.dataset.header === "split" ? headerSplitHTML : headerSimpleHTML;
  injectComponent('[data-component="header"]', headerVariant);
  injectComponent('[data-component="footer"]', footerHTML);
  // initBackLink(); // Back button disabled for now (client request); code kept above to re-enable

  const header = document.querySelector(".site-header");
  if (header) {
    const toggleShadow = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    toggleShadow();
    window.addEventListener("scroll", toggleShadow, { passive: true });

    // Expose the header's real rendered height (padding + content, which is
    // taller than --header-height) so the screen-fit rule in index-theme.css
    // can size sections to exactly the visible area below it
    const syncHeaderHeight = () => {
      document.documentElement.style.setProperty("--header-real", `${header.offsetHeight}px`);
    };
    syncHeaderHeight();
    if ("ResizeObserver" in window) {
      new ResizeObserver(syncHeaderHeight).observe(header);
    } else {
      window.addEventListener("resize", syncHeaderHeight);
    }
  }

  const activePage = document.body.dataset.page;
  if (activePage) {
    const activeLink = document.querySelector(`[data-nav="${activePage}"]`);
    if (activeLink) {
      activeLink.classList.add("active");
      activeLink.setAttribute("aria-current", "page");
    }

    if (ugcClusterPages.includes(activePage)) {
      const ugcLink = document.querySelector('[data-nav="ugc"]');
      if (ugcLink) ugcLink.classList.add("active");
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

  const ugcDropdown = document.querySelector(".nav-dropdown");
  const ugcDropdownToggle = document.querySelector(".nav-dropdown__toggle");

  if (ugcDropdown && ugcDropdownToggle) {
    const UGC_DROPDOWN_CLOSE_DELAY = 250;
    let ugcDropdownCloseTimer = null;

    const openUgcDropdown = () => {
      clearTimeout(ugcDropdownCloseTimer);
      ugcDropdown.classList.add("is-open");
      ugcDropdownToggle.setAttribute("aria-expanded", "true");
    };

    const closeUgcDropdown = () => {
      clearTimeout(ugcDropdownCloseTimer);
      ugcDropdown.classList.remove("is-open");
      ugcDropdownToggle.setAttribute("aria-expanded", "false");
    };

    const scheduleCloseUgcDropdown = () => {
      clearTimeout(ugcDropdownCloseTimer);
      ugcDropdownCloseTimer = setTimeout(closeUgcDropdown, UGC_DROPDOWN_CLOSE_DELAY);
    };

    const toggleUgcDropdown = (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (ugcDropdown.classList.contains("is-open")) {
        closeUgcDropdown();
      } else {
        openUgcDropdown();
      }
    };

    // Hover: open immediately on entry, close a beat after the pointer
    // leaves both the link and the menu (not instant, not sluggish).
    ugcDropdown.addEventListener("mouseenter", openUgcDropdown);
    ugcDropdown.addEventListener("mouseleave", scheduleCloseUgcDropdown);

    // Click/tap the caret to toggle the niches menu; the "UGC" text
    // itself stays a plain link to ugc.html (no preventDefault).
    ugcDropdownToggle.addEventListener("click", toggleUgcDropdown);

    document.addEventListener("click", (event) => {
      if (!ugcDropdown.classList.contains("is-open")) return;
      if (!ugcDropdown.contains(event.target)) {
        closeUgcDropdown();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && ugcDropdown.classList.contains("is-open")) {
        closeUgcDropdown();
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

  const contactForm = document.querySelector(".contact-form");
  if (contactForm) {
    const statusEl = contactForm.querySelector(".contact-form__status");
    const submitButton = contactForm.querySelector('button[type="submit"]');

    contactForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const name = contactForm.querySelector('[name="name"]').value.trim();
      const email = contactForm.querySelector('[name="email"]').value.trim();
      const message = contactForm.querySelector('[name="message"]').value.trim();

      if (statusEl) {
        statusEl.textContent = "Sending…";
        statusEl.classList.remove("is-success", "is-error");
      }
      if (submitButton) submitButton.disabled = true;

      try {
        const response = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({
            access_key: "2da7ec6d-1ebd-42f2-8add-d8fff8b2461d",
            subject: `New inquiry from ${name}`,
            name,
            email,
            message,
          }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.message || "Submission failed");
        }

        contactForm.reset();
        if (statusEl) {
          statusEl.textContent = "Message sent. Thank you! I'll be in touch soon.";
          statusEl.classList.add("is-success");
        }
      } catch (error) {
        if (statusEl) {
          statusEl.textContent = "Something went wrong. Please email hello@miamincreative.com directly.";
          statusEl.classList.add("is-error");
        }
      } finally {
        if (submitButton) submitButton.disabled = false;
      }
    });
  }

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

  tintLogos();
  initLogoMarquees();
  initTikTokTiles();
  initPortfolioVideos();
  initServicesOffset();
});

// UGC "Services" + Influence "What I Offer" (desktop): the heading + list sit a little above centre
// against the photo (half-way between top-aligned and centred, measured
// with every service closed). Being a fixed offset, opening a service only
// grows the list downward instead of re-centring it (no jump).
function initServicesOffset() {
  document.querySelectorAll("#services .split, #offers .split").forEach(placeSplit);
}

function placeSplit(split) {
  const content = split.querySelector(".split-content");
  const media = split.querySelector(".split-media");
  if (!content || !media) return;
  const desktop = window.matchMedia("(min-width: 901px)");

  const place = () => {
    content.style.marginTop = "";
    if (!desktop.matches) return;
    const items = [...content.querySelectorAll("details")];
    const openState = items.map((d) => d.open);
    items.forEach((d) => { d.open = false; });
    const closedHeight = content.offsetHeight;
    items.forEach((d, i) => { d.open = openState[i]; });
    const offset = (media.offsetHeight - closedHeight) / 4;
    content.style.marginTop = `${Math.max(0, offset)}px`;
  };

  place();
  window.addEventListener("load", place);
  window.addEventListener("resize", place);
}

// Portfolio videos (hair/beauty/fashion/lifestyle) have no browser player
// UI (no controls attribute) and nothing autoplays: each shows its cover
// (poster) until clicked. A click plays it with sound; clicking it again
// pauses it. Starting another video, or scrolling this one off screen,
// stops it and puts its cover back.
function initPortfolioVideos() {
  const videos = document.querySelectorAll(".video-card video");
  if (!videos.length) return;

  // Each card shows its cover as a real <img> laid over the video. The
  // browser's own poster isn't used to come back to the cover: re-showing
  // it needs video.load(), which some browsers (Safari especially) don't
  // always repaint, leaving a blank box. Hiding/showing an image is reliable.
  const resetToCover = (video) => {
    const card = video.closest(".video-card");
    if (!video.paused) video.pause();
    if (video.currentTime !== 0) {
      try { video.currentTime = 0; } catch (e) { /* not seekable yet */ }
    }
    if (card) card.classList.remove("has-started");
  };

  videos.forEach((video) => {
    const card = video.closest(".video-card");
    if (card && !card.querySelector(".video-card__play")) {
      if (video.poster) {
        const cover = document.createElement("img");
        cover.className = "video-card__cover";
        cover.src = video.poster;
        cover.alt = "";
        cover.setAttribute("aria-hidden", "true");
        cover.decoding = "async";
        card.appendChild(cover);
      }
      // Small play/pause badge in the card's top-right corner. Purely visual
      // (clicks pass through to the video, which is the real control).
      const badge = document.createElement("span");
      badge.className = "video-card__play";
      badge.setAttribute("aria-hidden", "true");
      card.appendChild(badge);
      video.addEventListener("playing", () => card.classList.add("has-started", "is-playing"));
      video.addEventListener("pause", () => card.classList.remove("is-playing"));
    }

    video.muted = false;
    video.setAttribute("tabindex", "0");
    video.setAttribute("role", "button");
    video.setAttribute("aria-label", "Play or pause video with sound");

    const toggle = () => {
      if (video.paused) {
        videos.forEach((other) => { if (other !== video) resetToCover(other); });
        video.muted = false;
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    };

    video.addEventListener("click", toggle);
    video.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggle();
      }
    });
  });

  if (!("IntersectionObserver" in window)) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (!isIntersecting) resetToCover(target);
    });
  }, { threshold: 0 });

  videos.forEach((video) => observer.observe(video));
}

// TikTok tiles (influence.html) show a local cover image and only swap in
// TikTok's official player on click, so the page doesn't load six players
// (and TikTok's cookie banner) up front.
function initTikTokTiles() {
  document.querySelectorAll(".tiktok-tile[data-tiktok-id]").forEach((tile) => {
    tile.addEventListener("click", () => {
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.tiktok.com/player/v1/${tile.dataset.tiktokId}?autoplay=1&description=0&music_info=0&rel=0`;
      iframe.title = tile.getAttribute("aria-label").replace(/^Play /, "");
      iframe.allow = "autoplay; fullscreen; encrypted-media; picture-in-picture";
      iframe.allowFullscreen = true;
      const frame = document.createElement("div");
      frame.className = "tiktok-tile is-playing";
      frame.appendChild(iframe);
      tile.replaceWith(frame);
    }, { once: true });
  });
}
