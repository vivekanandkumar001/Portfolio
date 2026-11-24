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
      /* Storage may be unavailable; theme still works for this page. */
    }
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    if (themeColorMeta) {
      themeColorMeta.setAttribute("content", theme === "light" ? "#f7f8fc" : "#080b12");
    }
    if (themeToggle) {
      const next = theme === "dark" ? "light" : "dark";
      themeToggle.setAttribute("aria-label", "Switch to " + next + " theme");
    }
  }

  applyTheme(getStoredTheme() || "dark");

  if (themeToggle) {
    themeToggle.addEventListener("click", function () {
      const next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      storeTheme(next);
    });
  }

  /* ---------------- Header + mobile menu ---------------- */
  const header = $("#site-header");
  const toTop = $("#to-top");
  const menuToggle = $(".menu-toggle");
  const mobileNav = $("#mobile-nav");

  function updateScrollState() {
    const scrolled = window.scrollY > 24;
    if (header) header.classList.toggle("is-scrolled", scrolled);
    if (toTop) toTop.classList.toggle("is-visible", window.scrollY > 700);
  }

  updateScrollState();
  window.addEventListener("scroll", updateScrollState, { passive: true });

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

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape") setMenu(false);
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

  /* ---------------- Reveal on scroll ---------------- */
  const revealItems = $$("[data-reveal]");

  if ("IntersectionObserver" in window && !reduceMotion) {
    const revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-revealed");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });

    revealItems.forEach(function (item) { revealObserver.observe(item); });
  } else {
    revealItems.forEach(function (item) { item.classList.add("is-revealed"); });
  }

  /* ---------------- Active navigation ---------------- */
  const navLinks = $$(".desktop-nav a");
  const sections = $$("main section[id]").filter(function (section) {
    return section.id !== "top";
  });

  if ("IntersectionObserver" in window && sections.length) {
    const navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (link) {
          const active = link.getAttribute("href") === "#" + entry.target.id;
          link.classList.toggle("is-active", active);
          if (active) link.setAttribute("aria-current", "true");
          else link.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-35% 0px -55% 0px" });

    sections.forEach(function (section) { navObserver.observe(section); });
  }

  /* ---------------- Terminal typing ---------------- */
  const typed = $("#typed-text");

  if (typed) {
    const phrases = ["ship --impact", "deploy --proof"];
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
          window.setTimeout(tickTyping, 1600);
          return;
        }
        window.setTimeout(tickTyping, 85);
        return;
      }

      charIndex -= 1;
      if (charIndex < 0) {
        deleting = false;
        phraseIndex = (phraseIndex + 1) % phrases.length;
        charIndex = 0;
        window.setTimeout(tickTyping, 400);
        return;
      }
      window.setTimeout(tickTyping, 42);
    }

    if (reduceMotion) {
      typed.textContent = phrases[0];
    } else {
      window.setTimeout(tickTyping, 900);
    }
  }

  /* ---------------- Stat counters ---------------- */
  const counters = $$("[data-count]");
  const statsWrap = $(".hero-stats");

  function animateCounters() {
    counters.forEach(function (counter) {
      const target = Number(counter.getAttribute("data-count")) || 0;
      if (reduceMotion) {
        counter.textContent = String(target);
        return;
      }

      const duration = 1100;
      const start = performance.now();

      function frame(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        counter.textContent = String(Math.round(target * eased));
        if (progress < 1) window.requestAnimationFrame(frame);
      }

      window.requestAnimationFrame(frame);
    });
  }

  if (statsWrap && "IntersectionObserver" in window && !reduceMotion) {
    const statObserver = new IntersectionObserver(function (entries) {
      if (entries.some(function (entry) { return entry.isIntersecting; })) {
        animateCounters();
        statObserver.disconnect();
      }
    }, { threshold: 0.4 });
    statObserver.observe(statsWrap);
  } else {
    animateCounters();
  }

  /* ---------------- Project filters ---------------- */
  const filterButtons = $$(".filter-btn");
  const projectCards = $$(".project-card");

  filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      const filter = button.getAttribute("data-filter");

      filterButtons.forEach(function (item) {
        const active = item === button;
        item.classList.toggle("is-active", active);
        if (active) item.setAttribute("aria-pressed", "true");
        else item.setAttribute("aria-pressed", "false");
      });

      projectCards.forEach(function (card) {
        const category = card.getAttribute("data-category");
        card.classList.toggle("is-hidden", filter !== "all" && category !== filter);
      });
    });
  });

  filterButtons.forEach(function (button) {
    button.setAttribute("aria-pressed", button.classList.contains("is-active") ? "true" : "false");
  });

  /* ---------------- Toast + copy email ---------------- */
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

  $$(".copy-btn").forEach(function (button) {
    button.addEventListener("click", async function () {
      const value = button.getAttribute("data-copy") || "";

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
        showToast("Email address copied.");
      } catch (error) {
        showToast("Copy failed — please select the address manually.");
      }
    });
  });

  /* ---------------- Contact form -> email draft ---------------- */
  const contactForm = $("#contact-form");

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

  /* ---------------- Footer year ---------------- */
  const year = $("#year");
  if (year) year.textContent = String(new Date().getFullYear());
})();
