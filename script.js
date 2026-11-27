(function () {
  "use strict";

  const root = document.documentElement;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

  /* ---------------- Theme ---------------- */
  const themeToggle = $(".theme-toggle");
  const themeColorMeta = $('meta[name="theme-color"]');

  function getStoredTheme() {
    try {
      return localStorage.getItem("vk-portfolio-theme");
    } catch (error) {
      return null;
    }
  }

  function storeTheme(theme) {
    try {
      localStorage.setItem("vk-portfolio-theme", theme);
    } catch (error) {
      /* Storage may be unavailable; theme still works for this session. */
    }
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    if (themeColorMeta) {
      themeColorMeta.setAttribute("content", theme === "light" ? "#f5f7fd" : "#070913");
    }
    if (themeToggle) {
      const next = theme === "dark" ? "light" : "dark";
      themeToggle.setAttribute("aria-label", "Switch to " + next + " theme");
    }
  }

  function toggleTheme() {
    const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next);
    storeTheme(next);
    showToast("Switched to " + next + " theme.");
  }

  applyTheme(getStoredTheme() || "dark");

  if (themeToggle) {
    themeToggle.addEventListener("click", toggleTheme);
  }

  /* ---------------- Header + Mobile Menu + Scroll State ---------------- */
  const header = $("#site-header");
  const toTop = $("#to-top");
  const menuToggle = $(".menu-toggle");
  const mobileNav = $("#mobile-nav");
  const scrollProgress = $("#scroll-progress");
  const navLinks = $$(".desktop-nav a");

  function clearActiveNav() {
    navLinks.forEach(function (link) {
      link.classList.remove("is-active");
      link.removeAttribute("aria-current");
    });
  }

  function setActiveNav(sectionId) {
    navLinks.forEach(function (link) {
      const active = link.getAttribute("href") === "#" + sectionId;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  }

  function updateScrollState() {
    const y = window.scrollY;
    if (header) header.classList.toggle("is-scrolled", y > 24);
    if (toTop) toTop.classList.toggle("is-visible", y > 650);
    if (y < 240) clearActiveNav();

    if (scrollProgress) {
      const maxScroll = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
      const progress = Math.min(y / maxScroll, 1);
      scrollProgress.style.transform = "scaleX(" + progress + ")";
    }
  }

  updateScrollState();
  window.addEventListener("scroll", updateScrollState, { passive: true });
  window.addEventListener("resize", updateScrollState, { passive: true });

  function setMenu(open) {
    if (!menuToggle || !mobileNav) return;
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    mobileNav.hidden = !open;
  }

  if (menuToggle && mobileNav) {
    menuToggle.addEventListener("click", function () {
      setMenu(menuToggle.getAttribute("aria-expanded") !== "true");
    });

    $$("a", mobileNav).forEach(function (link) {
      link.addEventListener("click", function () { setMenu(false); });
    });

    window.addEventListener("resize", function () {
      if (window.innerWidth > 860) setMenu(false);
    });
  }

  if (toTop) {
    toTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* ---------------- Reveal on Scroll ---------------- */
  const revealItems = $$("[data-reveal]");

  const staggerGroups = [
    ".hero-copy > [data-reveal]",
    ".hero-stats > div",
    ".proof-rail .proof-item",
    ".about-values > div",
    ".stack-grid > [data-reveal]",
    ".projects-grid > [data-reveal]",
    ".timeline > .timeline-item",
    ".journey-aside > *"
  ];

  staggerGroups.forEach(function (selector) {
    $$(selector).forEach(function (item, index) {
      item.style.setProperty("--reveal-delay", Math.min(index * 65, 360) + "ms");
    });
  });

  if ("IntersectionObserver" in window && !reduceMotion) {
    root.classList.add("reveal-ready");

    const revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.04, rootMargin: "0px 0px -20px 0px" });

    revealItems.forEach(function (item) {
      const rect = item.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.96) {
        item.classList.add("is-revealed");
      } else {
        revealObserver.observe(item);
      }
    });
  } else {
    revealItems.forEach(function (item) { item.classList.add("is-revealed"); });
  }

  /* ---------------- Active Navigation Observer ---------------- */
  const sections = $$("main section[id]").filter(function (section) {
    return section.id !== "top";
  });

  if ("IntersectionObserver" in window && sections.length) {
    const navObserver = new IntersectionObserver(function (entries) {
      if (window.scrollY < 240) return;
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          setActiveNav(entry.target.id);
        }
      });
    }, { rootMargin: "-32% 0px -56% 0px" });

    sections.forEach(function (section) { navObserver.observe(section); });
  }

  /* ---------------- Hero Console Tabs ---------------- */
  const terminalTabs = $$(".terminal-tab");
  const terminalPanes = $$(".terminal-pane");

  terminalTabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      const target = tab.getAttribute("data-tab");

      terminalTabs.forEach(function (btn) {
        const active = btn === tab;
        btn.classList.toggle("is-active", active);
        btn.setAttribute("aria-selected", String(active));
      });

      terminalPanes.forEach(function (pane) {
        const match = pane.getAttribute("data-pane") === target;
        pane.classList.toggle("is-active", match);
        pane.hidden = !match;
      });
    });
  });

  /* ---------------- Terminal Typing ---------------- */
  const typed = $("#typed-text");

  if (typed) {
    const phrases = ["ship --impact", "deploy --proof", "rag --eval --strict"];
    let phraseIndex = 0;
    let charIndex = 0;
    let deleting = false;

    function tickTyping() {
      const phrase = phrases[phraseIndex];
      typed.textContent = phrase.slice(0, charIndex);

      if (!deleting) {
        charIndex += 1;
        if (charIndex > phrase.length) {
          deleting = true;
          window.setTimeout(tickTyping, 1500);
          return;
        }
        window.setTimeout(tickTyping, 80);
        return;
      }

      charIndex -= 1;
      if (charIndex < 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        charIndex = 0;
        window.setTimeout(tickTyping, 380);
        return;
      }
      window.setTimeout(tickTyping, 40);
    }

    if (reduceMotion) {
      typed.textContent = phrases[0];
    } else {
      window.setTimeout(tickTyping, 750);
    }
  }

  /* ---------------- Stat Counters ---------------- */
  const counters = $$("[data-count]");
  const statsWrap = $(".hero-stats");
  let countersAnimated = false;

  function formatCounter(counter, val) {
    const suffix = counter.getAttribute("data-suffix") || "";
    return String(val) + suffix;
  }

  function animateCounters() {
    if (countersAnimated) return;
    countersAnimated = true;

    counters.forEach(function (counter) {
      const target = Number(counter.getAttribute("data-count")) || 0;
      if (reduceMotion) {
        counter.textContent = formatCounter(counter, target);
        return;
      }

      const duration = 950;
      const start = performance.now();

      function frame(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        counter.textContent = formatCounter(counter, Math.round(target * eased));
        if (progress < 1) window.requestAnimationFrame(frame);
      }

      window.requestAnimationFrame(frame);
    });
  }

  if (statsWrap && "IntersectionObserver" in window && !reduceMotion) {
    const rect = statsWrap.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.98) {
      animateCounters();
    } else {
      const statObserver = new IntersectionObserver(function (entries) {
        if (entries.some(function (entry) { return entry.isIntersecting; })) {
          animateCounters();
          statObserver.disconnect();
        }
      }, { threshold: 0.15 });
      statObserver.observe(statsWrap);
    }
  } else {
    animateCounters();
  }

  /* ---------------- Project Filters ---------------- */
  const filterButtons = $$(".filter-btn");
  const projectCards = $$(".project-card");

  filterButtons.forEach(function (button) {
    button.setAttribute("aria-pressed", button.classList.contains("is-active") ? "true" : "false");

    button.addEventListener("click", function () {
      const filter = button.getAttribute("data-filter");

      filterButtons.forEach(function (item) {
        const active = item === button;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });

      projectCards.forEach(function (card) {
        const category = card.getAttribute("data-category");
        const hidden = filter !== "all" && category !== filter;
        card.classList.toggle("is-hidden", hidden);
        if (!hidden) card.classList.add("is-revealed");
      });
    });
  });

  /* ---------------- Project Case Brief Modal ---------------- */
  const projectModal = $("#project-modal");
  const modalTag = $("#modal-tag");
  const modalImg = $("#modal-img");
  const modalTitle = $("#modal-title");
  const modalSummary = $("#modal-summary");
  const modalPoints = $("#modal-points");
  const modalTech = $("#modal-tech");
  const modalLinks = $("#modal-links");
  const modalCloseBtn = projectModal ? $(".modal-close", projectModal) : null;
  let lastFocusedEl = null;

  function openProjectModal(projectId) {
    if (!projectModal) return;
    const card = $('.project-card[data-project="' + projectId + '"]');
    if (!card) return;

    lastFocusedEl = document.activeElement;

    const img = $("img", card);
    const tag = $(".project-meta .tag", card);
    const title = $("h3", card);
    const summary = $(".project-body > p", card);
    const points = $$(".project-points li", card);
    const tech = $$(".tech-row span", card);
    const links = $$(".project-links a", card);

    if (modalTag && tag) modalTag.textContent = tag.textContent.trim();
    if (modalImg && img) {
      modalImg.src = img.getAttribute("src") || "";
      modalImg.alt = img.getAttribute("alt") || "";
    }
    if (modalTitle && title) modalTitle.textContent = title.textContent.trim();
    if (modalSummary && summary) modalSummary.textContent = summary.textContent.trim();

    if (modalPoints) {
      modalPoints.innerHTML = "";
      points.forEach(function (li) {
        const item = document.createElement("li");
        item.textContent = li.textContent.trim();
        modalPoints.appendChild(item);
      });
    }

    if (modalTech) {
      modalTech.innerHTML = "";
      tech.forEach(function (chip) {
        const span = document.createElement("span");
        span.textContent = chip.textContent.trim();
        modalTech.appendChild(span);
      });
    }

    if (modalLinks) {
      modalLinks.innerHTML = "";
      links.forEach(function (link, idx) {
        const a = document.createElement("a");
        a.href = link.getAttribute("href") || "#";
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.className = idx === 0 ? "btn btn-primary btn-small" : "btn btn-ghost btn-small";
        a.textContent = link.textContent.trim();
        modalLinks.appendChild(a);
      });
    }

    projectModal.hidden = false;
    document.body.style.overflow = "hidden";
    if (modalCloseBtn) modalCloseBtn.focus();
  }

  function closeProjectModal() {
    if (!projectModal || projectModal.hidden) return;
    projectModal.hidden = true;
    document.body.style.overflow = "";
    if (lastFocusedEl && typeof lastFocusedEl.focus === "function") {
      lastFocusedEl.focus();
    }
  }

  $$("[data-open-project]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      openProjectModal(btn.getAttribute("data-open-project"));
    });
  });

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener("click", closeProjectModal);
  }
  if (projectModal) {
    projectModal.addEventListener("click", function (event) {
      if (event.target === projectModal) closeProjectModal();
    });
  }

  /* ---------------- Toast + Copy Email ---------------- */
  const toast = $("#toast");
  let toastTimer;

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () {
      toast.classList.remove("is-visible");
    }, 2400);
  }

  async function copyText(value, successMsg) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
      } else {
        const helper = document.createElement("textarea");
        helper.value = value;
        helper.setAttribute("readonly", "");
        helper.style.position = "fixed";
        helper.style.opacity = "0";
        document.body.appendChild(helper);
        helper.select();
        document.execCommand("copy");
        document.body.removeChild(helper);
      }
      showToast(successMsg || "Copied to clipboard.");
    } catch (error) {
      showToast("Copy failed — please select the address manually.");
    }
  }

  $$("[data-copy]").forEach(function (button) {
    button.addEventListener("click", function () {
      const value = button.getAttribute("data-copy") || "";
      copyText(value, "Email address copied.");
    });
  });

  /* ---------------- Contact Subject Presets + Mailto Form ---------------- */
  const contactForm = $("#contact-form");
  const contactSubject = $("#contact-subject");
  const presetChips = $$(".preset-chip");

  presetChips.forEach(function (chip) {
    chip.addEventListener("click", function () {
      const value = chip.getAttribute("data-subject") || "";
      if (contactSubject) {
        contactSubject.value = value;
        contactSubject.focus();
      }
      presetChips.forEach(function (c) { c.classList.toggle("is-selected", c === chip); });
    });
  });

  if (contactForm) {
    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const data = new FormData(contactForm);
      const name = String(data.get("name") || "").trim();
      const email = String(data.get("email") || "").trim();
      const subject = String(data.get("subject") || "").trim();
      const message = String(data.get("message") || "").trim();

      if (!name || !email || !subject || !message) {
        showToast("Please fill in every field first.");
        return;
      }

      const body = [
        "Hi Vivekanand,",
        "",
        message,
        "",
        "— " + name,
        email
      ].join("\n");

      const mailto = "mailto:vivekanandkumar865124@gmail.com" +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);

      showToast("Opening your email app...");
      window.location.href = mailto;
    });
  }

  /* ---------------- Command Palette (Ctrl+K / Cmd+K) ---------------- */
  const cmdTrigger = $("#cmd-trigger");
  const cmdBackdrop = $("#cmd-palette");
  const cmdInput = $("#cmd-input");
  const cmdList = $("#cmd-list");

  if (cmdTrigger) {
    const isMac = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
    const kbd = $("kbd", cmdTrigger);
    if (kbd && isMac) kbd.textContent = "⌘K";
  }

  const commands = [
    { label: "Jump to Selected Work", hint: "#work", run: function () { location.hash = "#work"; } },
    { label: "Jump to Tech Stack", hint: "#stack", run: function () { location.hash = "#stack"; } },
    { label: "Jump to About", hint: "#about", run: function () { location.hash = "#about"; } },
    { label: "Jump to Journey", hint: "#journey", run: function () { location.hash = "#journey"; } },
    { label: "Jump to Contact", hint: "#contact", run: function () { location.hash = "#contact"; } },
    { label: "Inspect Progeni Atlas AI", hint: "Case brief", run: function () { openProjectModal("atlas"); } },
    { label: "Inspect Progeni-Lens", hint: "Case brief", run: function () { openProjectModal("lens"); } },
    { label: "Inspect Progeni Bench", hint: "Case brief", run: function () { openProjectModal("bench"); } },
    { label: "Inspect WaKit / WhatsSwift", hint: "Case brief", run: function () { openProjectModal("wakit"); } },
    { label: "Inspect Progeni Platform", hint: "Case brief", run: function () { openProjectModal("progeni"); } },
    { label: "Toggle Dark / Light Theme", hint: "Theme", run: toggleTheme },
    { label: "Copy Email Address", hint: "vivekanandkumar865124@gmail.com", run: function () { copyText("vivekanandkumar865124@gmail.com", "Email address copied."); } },
    { label: "Download Resume (PDF)", hint: "Resume", run: function () { window.open("assets/Vivekanand_Kumar_Resume.pdf", "_blank", "noopener,noreferrer"); } },
    { label: "Open GitHub Profile", hint: "github.com", run: function () { window.open("https://github.com/vivekanandkumar001", "_blank", "noopener,noreferrer"); } },
    { label: "Open LinkedIn Profile", hint: "linkedin.com", run: function () { window.open("https://www.linkedin.com/in/vivekanand2003", "_blank", "noopener,noreferrer"); } },
    { label: "Open Hugging Face", hint: "huggingface.co", run: function () { window.open("https://huggingface.co/vivekananda0010", "_blank", "noopener,noreferrer"); } }
  ];

  let cmdIndex = 0;
  let filteredCommands = commands.slice();

  function renderCommands(query) {
    if (!cmdList) return;
    const q = (query || "").trim().toLowerCase();
    filteredCommands = commands.filter(function (cmd) {
      return cmd.label.toLowerCase().includes(q) || cmd.hint.toLowerCase().includes(q);
    });
    cmdIndex = 0;
    cmdList.innerHTML = "";

    if (!filteredCommands.length) {
      const empty = document.createElement("div");
      empty.className = "cmd-empty";
      empty.textContent = "No matching commands.";
      cmdList.appendChild(empty);
      return;
    }

    filteredCommands.forEach(function (cmd, idx) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "cmd-item" + (idx === 0 ? " is-selected" : "");
      btn.setAttribute("role", "option");

      const title = document.createElement("span");
      title.textContent = cmd.label;
      const hint = document.createElement("small");
      hint.textContent = cmd.hint;

      btn.appendChild(title);
      btn.appendChild(hint);
      btn.addEventListener("click", function () {
        closeCmdPalette();
        cmd.run();
      });
      cmdList.appendChild(btn);
    });
  }

  function updateCmdSelection() {
    const items = $$(".cmd-item", cmdList);
    items.forEach(function (item, idx) {
      item.classList.toggle("is-selected", idx === cmdIndex);
      if (idx === cmdIndex) item.scrollIntoView({ block: "nearest" });
    });
  }

  function openCmdPalette() {
    if (!cmdBackdrop || !cmdInput) return;
    lastFocusedEl = document.activeElement;
    cmdBackdrop.hidden = false;
    document.body.style.overflow = "hidden";
    cmdInput.value = "";
    renderCommands("");
    cmdInput.focus();
  }

  function closeCmdPalette() {
    if (!cmdBackdrop || cmdBackdrop.hidden) return;
    cmdBackdrop.hidden = true;
    document.body.style.overflow = "";
    if (lastFocusedEl && typeof lastFocusedEl.focus === "function") {
      lastFocusedEl.focus();
    }
  }

  if (cmdTrigger) {
    cmdTrigger.addEventListener("click", openCmdPalette);
  }
  if (cmdBackdrop) {
    cmdBackdrop.addEventListener("click", function (event) {
      if (event.target === cmdBackdrop) closeCmdPalette();
    });
  }
  if (cmdInput) {
    cmdInput.addEventListener("input", function () {
      renderCommands(cmdInput.value);
    });
    cmdInput.addEventListener("keydown", function (event) {
      if (!filteredCommands.length) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        cmdIndex = (cmdIndex + 1) % filteredCommands.length;
        updateCmdSelection();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        cmdIndex = (cmdIndex - 1 + filteredCommands.length) % filteredCommands.length;
        updateCmdSelection();
      } else if (event.key === "Enter") {
        event.preventDefault();
        const chosen = filteredCommands[cmdIndex];
        closeCmdPalette();
        if (chosen) chosen.run();
      }
    });
  }

  /* ---------------- Global Keyboard Shortcuts ---------------- */
  document.addEventListener("keydown", function (event) {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      if (cmdBackdrop && cmdBackdrop.hidden) openCmdPalette();
      else closeCmdPalette();
      return;
    }

    if (event.key === "Escape") {
      setMenu(false);
      closeProjectModal();
      closeCmdPalette();
    }
  });

  /* ---------------- Footer Year ---------------- */
  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
