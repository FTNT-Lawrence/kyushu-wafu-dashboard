(function () {
  const DEPART = new Date("2026-11-24T08:15:00+08:00");
  const RETURNED = new Date("2026-11-30T18:00:00+08:00");
  const STORE_PREFIX = "kyushu-ehon-2026-";

  /* ----- Countdown ----- */
  const cdRoot = document.getElementById("countdown");
  const cdRow = document.getElementById("countdown-row");
  const cdStatus = document.getElementById("countdown-status");
  const cdLabel = document.getElementById("countdown-label");
  const elDays = document.getElementById("cd-days");
  const elHours = document.getElementById("cd-hours");
  const elMins = document.getElementById("cd-mins");

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function tickCountdown() {
    if (!cdRoot) return;
    const now = new Date();
    if (now >= RETURNED) {
      cdRoot.classList.add("is-home");
      cdRoot.classList.remove("is-trip");
      cdRow.hidden = true;
      cdStatus.hidden = false;
      cdStatus.textContent = "已回程，多謝一路同行。";
      cdLabel.textContent = "旅程狀態";
      return;
    }
    if (now >= DEPART) {
      cdRoot.classList.add("is-trip");
      cdRoot.classList.remove("is-home");
      cdRow.hidden = true;
      cdStatus.hidden = false;
      cdStatus.textContent = "旅途中，慢慢行、慢慢食。";
      cdLabel.textContent = "旅程狀態";
      return;
    }
    const ms = DEPART - now;
    const minsTotal = Math.floor(ms / 60000);
    const days = Math.floor(minsTotal / (60 * 24));
    const hours = Math.floor((minsTotal - days * 60 * 24) / 60);
    const mins = minsTotal % 60;
    elDays.textContent = String(days);
    elHours.textContent = pad(hours);
    elMins.textContent = pad(mins);
    cdRow.hidden = false;
    cdStatus.hidden = true;
    cdLabel.textContent = "距離 HX638 起飛還有";
  }

  tickCountdown();
  setInterval(tickCountdown, 30000);

  /* ----- Day switcher ----- */
  const dayBtns = Array.from(document.querySelectorAll(".day-btn"));
  const dayPanels = Array.from(document.querySelectorAll(".day-panel"));
  const switcher = document.querySelector(".day-switch");

  function prefersReduce() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function showDay(id, { scroll } = {}) {
    let activeBtn = null;
    dayBtns.forEach((btn) => {
      const on = btn.dataset.day === id;
      btn.setAttribute("aria-selected", on ? "true" : "false");
      btn.tabIndex = on ? 0 : -1;
      if (on) activeBtn = btn;
    });
    dayPanels.forEach((panel) => {
      const on = panel.dataset.day === id;
      panel.classList.toggle("is-active", on);
      panel.hidden = !on;
    });
    if (activeBtn && switcher) {
      const left = activeBtn.offsetLeft - switcher.clientWidth / 2 + activeBtn.offsetWidth / 2;
      switcher.scrollTo({ left: Math.max(0, left), behavior: prefersReduce() ? "auto" : "smooth" });
    }
    try {
      localStorage.setItem(STORE_PREFIX + "day", id);
    } catch (e) {}
    if (scroll) {
      document.getElementById("itinerary")?.scrollIntoView({ block: "start" });
    }
  }

  dayBtns.forEach((btn) => {
    btn.addEventListener("click", () => showDay(btn.dataset.day));
  });

  if (switcher) {
    switcher.addEventListener("keydown", (e) => {
      const keys = { ArrowRight: 1, ArrowLeft: -1 };
      if (!(e.key in keys)) return;
      const i = dayBtns.findIndex((b) => b.getAttribute("aria-selected") === "true");
      const next = dayBtns[(i + keys[e.key] + dayBtns.length) % dayBtns.length];
      showDay(next.dataset.day);
      next.focus();
      e.preventDefault();
    });
  }

  let initialDay = "1";
  try {
    initialDay = localStorage.getItem(STORE_PREFIX + "day") || "1";
  } catch (e) {}
  if (!dayBtns.some((b) => b.dataset.day === initialDay)) initialDay = "1";
  showDay(initialDay);

  /* ----- Checklists + localStorage ----- */
  const boxes = Array.from(document.querySelectorAll('input[type="checkbox"][data-store]'));
  const groups = {};
  boxes.forEach((box) => {
    (groups[box.dataset.store] ||= []).push(box);
  });

  function applyState(box, checked) {
    box.checked = checked;
    box.closest(".check")?.classList.toggle("is-done", checked);
  }

  Object.entries(groups).forEach(([name, list]) => {
    const key = STORE_PREFIX + name;
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(key) || "null");
    } catch (e) {
      saved = null;
    }
    if (saved && typeof saved === "object") {
      list.forEach((box) => {
        if (Object.prototype.hasOwnProperty.call(saved, box.dataset.id)) {
          applyState(box, !!saved[box.dataset.id]);
        } else {
          applyState(box, box.defaultChecked);
        }
      });
    } else {
      list.forEach((box) => applyState(box, box.defaultChecked));
    }

    const persist = () => {
      const data = {};
      list.forEach((box) => {
        data[box.dataset.id] = box.checked;
      });
      try {
        localStorage.setItem(key, JSON.stringify(data));
      } catch (e) {}
    };

    list.forEach((box) => {
      box.addEventListener("change", () => {
        applyState(box, box.checked);
        persist();
      });
    });
    persist();
  });

  /* ----- Active nav ----- */
  const navLinks = Array.from(document.querySelectorAll(".nav-links a"));
  const navScroller = document.querySelector(".nav-links");
  const navMore = document.querySelector(".nav-more");
  const sections = navLinks
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  function setActive(id) {
    navLinks.forEach((a) => {
      a.classList.toggle("is-active", a.getAttribute("href") === "#" + id);
    });
  }

  function updateNav() {
    const navH = document.querySelector(".nav")?.offsetHeight || 68;
    const probe = window.scrollY + navH + 20;
    let current = sections[0]?.id;
    sections.forEach((sec) => {
      if (sec.offsetTop <= probe) current = sec.id;
    });
    const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 12;
    if (atBottom) current = sections[sections.length - 1]?.id;
    if (current) setActive(current);
  }

  window.addEventListener("scroll", updateNav, { passive: true });
  window.addEventListener("resize", updateNav);
  updateNav();

  navLinks.forEach((a) => {
    a.addEventListener("click", () => {
      const id = a.getAttribute("href").slice(1);
      setActive(id);
    });
  });

  if (navMore && navScroller) {
    navMore.addEventListener("click", () => {
      const max = navScroller.scrollWidth - navScroller.clientWidth;
      const next = navScroller.scrollLeft + 120;
      navScroller.scrollTo({
        left: next >= max - 8 ? 0 : next,
        behavior: prefersReduce() ? "auto" : "smooth",
      });
    });
  }
})();
