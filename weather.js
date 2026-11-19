(function () {
  const CACHE_KEY = "kyushu-weather-v1";
  const CACHE_MS = 3 * 60 * 60 * 1000;
  const TZ = "Asia/Tokyo";

  const PLACES = {
    fukuoka: { name: "福岡／博多", lat: 33.5904, lon: 130.4017 },
    nishijin: { name: "福岡／西新", lat: 33.5904, lon: 130.4017 },
    takachiho: { name: "高千穗", lat: 32.7114, lon: 131.3078 },
    yufuin: { name: "由布院", lat: 33.2628, lon: 131.3547 },
    kirishima: { name: "霧島（神宮附近）", lat: 31.8589, lon: 130.9214 },
    kagoshima: { name: "鹿兒島市", lat: 31.5966, lon: 130.5571 },
    kokura: { name: "小倉", lat: 33.8834, lon: 130.8752 },
  };

  const DAYS = [
    { id: "1", date: "2026-11-24", label: "D1", weekday: "二", placeLabel: "博多", places: [{ key: "fukuoka", when: "全日" }] },
    { id: "2", date: "2026-11-25", label: "D2", weekday: "三", placeLabel: "高千穗", places: [{ key: "takachiho", when: "日間（主）" }, { key: "fukuoka", when: "晚間（藥院晚餐）" }] },
    { id: "3", date: "2026-11-26", label: "D3", weekday: "四", placeLabel: "由布院", places: [{ key: "yufuin", when: "全日" }] },
    { id: "4", date: "2026-11-27", label: "D4", weekday: "五", placeLabel: "霧島", places: [{ key: "kirishima", when: "上午 · 霧島神宮" }, { key: "kagoshima", when: "午後／晚上 · 鹿兒島市" }] },
    { id: "5", date: "2026-11-28", label: "D5", weekday: "六", placeLabel: "小倉", places: [{ key: "kokura", when: "上午 · 小倉" }, { key: "nishijin", when: "午後 · 福岡／西新" }] },
    { id: "6", date: "2026-11-29", label: "D6", weekday: "日", placeLabel: "博多", places: [{ key: "fukuoka", when: "全日 · 休息" }] },
    { id: "7", date: "2026-11-30", label: "D7", weekday: "一", placeLabel: "博多", places: [{ key: "fukuoka", when: "午前退房、赴機" }] },
  ];

  function weatherLabel(code) {
    const n = Number(code);
    if (n === 0) return "晴";
    if (n === 1) return "大致晴朗";
    if (n === 2) return "多雲";
    if (n === 3) return "陰";
    if (n === 45 || n === 48) return "霧";
    if (n === 51) return "毛毛雨";
    if (n === 53) return "小雨";
    if (n === 55) return "持續小雨";
    if (n === 56 || n === 57) return "凍毛毛雨";
    if (n === 61) return "小雨";
    if (n === 63) return "雨";
    if (n === 65) return "大雨";
    if (n === 66 || n === 67) return "凍雨";
    if (n === 71) return "小雪";
    if (n === 73) return "雪";
    if (n === 75) return "大雪";
    if (n === 77) return "雪粒";
    if (n === 80) return "陣雨";
    if (n === 81) return "較強陣雨";
    if (n === 82) return "暴雨";
    if (n === 85) return "陣雪";
    if (n === 86) return "強陣雪";
    if (n === 95) return "雷暴";
    if (n === 96 || n === 99) return "雷暴冰雹";
    return "天氣狀況不明";
  }

  function weatherKind(code) {
    const n = Number(code);
    if (n === 0) return "sun";
    if (n === 1) return "mainly-sun";
    if (n === 2) return "partly-cloud";
    if (n === 3) return "cloud";
    if (n === 45 || n === 48) return "fog";
    if (n === 51 || n === 53 || n === 55 || n === 56 || n === 57) return "drizzle";
    if (n === 65 || n === 82) return "heavy-rain";
    if (n === 61 || n === 63 || n === 66 || n === 67 || n === 80 || n === 81) return "rain";
    if (n === 75 || n === 86) return "heavy-snow";
    if (n === 71 || n === 73 || n === 77 || n === 85) return "snow";
    if (n === 95) return "thunder";
    if (n === 96 || n === 99) return "thunder-hail";
    return "unknown";
  }

  function weatherIcon(code) {
    const kind = weatherKind(code);
    const icons = {
      sun:
        '<circle cx="32" cy="32" r="11" fill="#E8C9A0"/><g stroke="#D4A574" stroke-width="3" stroke-linecap="round" fill="none"><path d="M32 8v6M32 50v6M8 32h6M50 32h6M14.5 14.5l4.2 4.2M45.3 45.3l4.2 4.2M14.5 49.5l4.2-4.2M45.3 18.7l4.2-4.2"/></g>',
      "mainly-sun":
        '<circle cx="24" cy="22" r="8" fill="#E8C9A0"/><g stroke="#D4A574" stroke-width="2.4" stroke-linecap="round" fill="none"><path d="M24 8v4M8 22h4M13 11l3 3M13 33l3-3M35 11l-3 3"/></g><path d="M22 36h20a10 10 0 0 1 0 20H22a12 12 0 0 1 0-20z" fill="#F0E8DC" stroke="#2A3F66" stroke-width="2"/>',
      "partly-cloud":
        '<circle cx="22" cy="20" r="8" fill="#E8C9A0"/><g stroke="#D4A574" stroke-width="2.4" stroke-linecap="round" fill="none"><path d="M22 8v3.5M9 20h3.5M12 11l2.5 2.5"/></g><path d="M20 34h24a11 11 0 0 1 0 22H20a13 13 0 0 1 0-22z" fill="#F0E8DC" stroke="#2A3F66" stroke-width="2"/>',
      cloud:
        '<path d="M18 30h28a12 12 0 0 1 0 24H18a14 14 0 0 1 0-24z" fill="#E5DDD0" stroke="#2A3F66" stroke-width="2.2"/>',
      fog:
        '<path d="M16 22h28a10 10 0 0 1 0 20H16a12 12 0 0 1 0-20z" fill="#E5DDD0" stroke="#8B7BA8" stroke-width="2"/><g stroke="#8A857A" stroke-width="2.4" stroke-linecap="round"><path d="M14 48h36M18 54h28"/></g>',
      drizzle:
        '<path d="M18 18h28a12 12 0 0 1 0 24H18a14 14 0 0 1 0-24z" fill="#E5DDD0" stroke="#2A3F66" stroke-width="2.2"/><g stroke="#5A6B4A" stroke-width="2.4" stroke-linecap="round"><path d="M24 48v6M32 50v6M40 48v6"/></g>',
      rain:
        '<path d="M18 16h28a12 12 0 0 1 0 24H18a14 14 0 0 1 0-24z" fill="#E5DDD0" stroke="#2A3F66" stroke-width="2.2"/><g stroke="#1B2A4A" stroke-width="2.6" stroke-linecap="round"><path d="M24 46l-3 10M32 48l-3 10M40 46l-3 10"/></g>',
      "heavy-rain":
        '<path d="M16 14h30a13 13 0 0 1 0 26H16a15 15 0 0 1 0-26z" fill="#C9D0D8" stroke="#0F1A2E" stroke-width="2.2"/><g stroke="#1B2A4A" stroke-width="3" stroke-linecap="round"><path d="M22 44l-4 12M32 46l-4 12M42 44l-4 12"/></g>',
      snow:
        '<path d="M18 16h28a12 12 0 0 1 0 24H18a14 14 0 0 1 0-24z" fill="#F7F2EA" stroke="#2A3F66" stroke-width="2.2"/><g fill="#8B7BA8"><circle cx="24" cy="50" r="2.4"/><circle cx="32" cy="54" r="2.4"/><circle cx="40" cy="50" r="2.4"/></g>',
      "heavy-snow":
        '<path d="M16 14h30a13 13 0 0 1 0 26H16a15 15 0 0 1 0-26z" fill="#F7F2EA" stroke="#2A3F66" stroke-width="2.2"/><g fill="#8B7BA8"><circle cx="22" cy="48" r="2.6"/><circle cx="32" cy="52" r="2.8"/><circle cx="42" cy="48" r="2.6"/><circle cx="27" cy="56" r="2.2"/><circle cx="37" cy="56" r="2.2"/></g>',
      thunder:
        '<path d="M18 14h28a12 12 0 0 1 0 24H18a14 14 0 0 1 0-24z" fill="#2A3F66" stroke="#0F1A2E" stroke-width="2"/><path d="M34 36l-8 14h8l-4 12 14-18h-8l6-8z" fill="#E8C9A0" stroke="#C45C4A" stroke-width="1.2" stroke-linejoin="round"/>',
      "thunder-hail":
        '<path d="M16 12h30a13 13 0 0 1 0 24H16a15 15 0 0 1 0-24z" fill="#2A3F66" stroke="#0F1A2E" stroke-width="2"/><path d="M34 34l-8 13h8l-4 11 14-16h-8l6-8z" fill="#E8C9A0" stroke="#C45C4A" stroke-width="1.2" stroke-linejoin="round"/><g fill="#E8C9A0"><circle cx="20" cy="56" r="2.2"/><circle cx="46" cy="56" r="2.2"/></g>',
      unknown:
        '<circle cx="32" cy="32" r="16" fill="#F0E8DC" stroke="#8A857A" stroke-width="2"/><text x="32" y="38" text-anchor="middle" font-size="18" fill="#5C584F" font-family="Noto Serif JP, serif">?</text>',
    };
    const body = icons[kind] || icons.unknown;
    return (
      '<svg class="wx-icon-svg" viewBox="0 0 64 64" width="40" height="40" aria-hidden="true" focusable="false">' +
      body +
      "</svg>"
    );
  }

  function weatherConditionHtml(code) {
    return (
      '<span class="wx-cond">' +
      weatherIcon(code) +
      '<span class="wx-cond-text">' +
      weatherLabel(code) +
      "</span></span>"
    );
  }

  function prefersReduce() {
    return window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function pad(n) {
    return String(n).padStart(2, "0");
  }

  function fmtTemp(v) {
    if (v == null || Number.isNaN(Number(v))) return "–";
    const n = Number(v);
    return (Number.isInteger(n) ? String(n) : n.toFixed(1).replace(/\.0$/, "")) + "°C";
  }

  function uniquePlaceKeys() {
    const seen = new Set();
    const keys = [];
    DAYS.forEach((d) => {
      d.places.forEach((p) => {
        if (!seen.has(p.key)) {
          seen.add(p.key);
          keys.push(p.key);
        }
      });
    });
    return keys;
  }

  function readCache() {
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.fetchedAt || !parsed.data) return null;
      return parsed;
    } catch (e) {
      return null;
    }
  }

  function writeCache(data) {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ fetchedAt: Date.now(), data }));
    } catch (e) {}
  }

  function apiUrl(place) {
    const params = new URLSearchParams({
      latitude: String(place.lat),
      longitude: String(place.lon),
      hourly: "temperature_2m,weather_code,precipitation_probability,precipitation",
      daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max",
      timezone: TZ,
      start_date: "2026-11-24",
      end_date: "2026-11-30",
    });
    return "https://api.open-meteo.com/v1/forecast?" + params.toString();
  }

  async function fetchAll(force) {
    const cached = readCache();
    if (!force && cached && Date.now() - cached.fetchedAt < CACHE_MS) {
      return { data: cached.data, fromCache: true, fetchedAt: cached.fetchedAt };
    }
    const keys = uniquePlaceKeys();
    const results = await Promise.all(
      keys.map(async (key) => {
        const res = await fetch(apiUrl(PLACES[key]));
        if (!res.ok) throw new Error("預報服務回應異常（" + res.status + "）");
        const json = await res.json();
        if (json.error) throw new Error(json.reason || "預報服務回報錯誤");
        return [key, json];
      })
    );
    const data = Object.fromEntries(results);
    writeCache(data);
    return { data, fromCache: false, fetchedAt: Date.now() };
  }

  function sliceDay(forecast, date) {
    if (!forecast || !forecast.daily || !Array.isArray(forecast.daily.time)) return null;
    const di = forecast.daily.time.indexOf(date);
    const hourly = forecast.hourly || {};
    const times = hourly.time || [];
    const hours = [];
    for (let i = 0; i < times.length; i++) {
      if (times[i].slice(0, 10) === date) {
        hours.push({
          time: times[i],
          hour: Number(times[i].slice(11, 13)),
          temp: hourly.temperature_2m ? hourly.temperature_2m[i] : null,
          code: hourly.weather_code ? hourly.weather_code[i] : null,
          pop: hourly.precipitation_probability ? hourly.precipitation_probability[i] : null,
          precip: hourly.precipitation ? hourly.precipitation[i] : null,
        });
      }
    }
    if (di < 0 || hours.length === 0) return null;
    return {
      high: forecast.daily.temperature_2m_max[di],
      low: forecast.daily.temperature_2m_min[di],
      code: forecast.daily.weather_code[di],
      pop: forecast.daily.precipitation_probability_max[di],
      hours,
    };
  }

  function hourDetail(h) {
    const precipTxt =
      h.precip == null ? "" : Number(h.precip) > 0 ? "，降水量 " + Number(h.precip).toFixed(1) + " mm" : "";
    const popTxt = h.pop == null ? "" : "降水機率 " + Math.round(h.pop) + "%";
    return {
      timeLabel: pad(h.hour) + ":00 日本時間",
      temp: fmtTemp(h.temp),
      cond: weatherLabel(h.code),
      extra: (popTxt + precipTxt).replace(/^，/, ""),
    };
  }

  function buildChart(hours, panelId) {
    const temps = hours.map((h) => Number(h.temp)).filter((n) => !Number.isNaN(n));
    if (!temps.length) return "<p class='wx-hour-card'>這天未有小時溫度資料。</p>";
    const min = Math.min(...temps);
    const max = Math.max(...temps);
    const padY = Math.max(1, (max - min) * 0.18 || 2);
    const y0 = min - padY;
    const y1 = max + padY;
    const W = 640;
    const H = 220;
    const left = 42;
    const right = 16;
    const top = 16;
    const bottom = 32;
    const iw = W - left - right;
    const ih = H - top - bottom;
    const xOf = (i) => left + (hours.length === 1 ? iw / 2 : (i * iw) / (hours.length - 1));
    const yOf = (t) => top + ih - ((t - y0) / (y1 - y0)) * ih;
    const pts = hours.map((h, i) => [xOf(i), yOf(Number(h.temp))]);
    const line = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
    const area =
      "M" +
      pts[0][0].toFixed(1) +
      " " +
      (top + ih).toFixed(1) +
      " " +
      pts.map((p) => "L" + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ") +
      " L" +
      pts[pts.length - 1][0].toFixed(1) +
      " " +
      (top + ih).toFixed(1) +
      " Z";
    const ticks = [];
    for (let h = 0; h < 24; h += 3) {
      const i = hours.findIndex((x) => x.hour === h);
      if (i >= 0) {
        ticks.push(
          '<text x="' +
            xOf(i).toFixed(1) +
            '" y="' +
            (H - 10) +
            '" text-anchor="middle" fill="#8A857A" font-size="11">' +
            pad(h) +
            "</text>"
        );
      }
    }
    const yTicks = [min, (min + max) / 2, max];
    const yLabels = yTicks
      .map((t) => {
        const y = yOf(t);
        return (
          '<text x="' +
          (left - 8) +
          '" y="' +
          (y + 4).toFixed(1) +
          '" text-anchor="end" fill="#8A857A" font-size="11">' +
          Math.round(t) +
          "°</text>"
        );
      })
      .join("");
    const hits = hours
      .map((h, i) => {
        const x = xOf(i);
        const y = yOf(Number(h.temp));
        const hw = iw / Math.max(hours.length, 1) / 2 + 4;
        return (
          '<rect class="wx-hit" data-panel="' +
          panelId +
          '" data-i="' +
          i +
          '" x="' +
          (x - hw).toFixed(1) +
          '" y="' +
          top +
          '" width="' +
          (hw * 2).toFixed(1) +
          '" height="' +
          ih +
          '" fill="transparent"></rect>' +
          '<circle class="wx-dot" data-panel="' +
          panelId +
          '" data-i="' +
          i +
          '" cx="' +
          x.toFixed(1) +
          '" cy="' +
          y.toFixed(1) +
          '" r="3.5" fill="#D4A574" stroke="#1B2A4A" stroke-width="1.2" pointer-events="none"></circle>'
        );
      })
      .join("");
    return (
      '<div class="wx-chart-wrap" data-panel="' +
      panelId +
      '">' +
      '<svg class="wx-chart" viewBox="0 0 ' +
      W +
      " " +
      H +
      '" role="img" aria-label="當日 24 小時溫度折線圖，日本時間">' +
      '<rect x="0" y="0" width="' +
      W +
      '" height="' +
      H +
      '" fill="transparent"></rect>' +
      yLabels +
      ticks.join("") +
      '<path d="' +
      area +
      '" fill="rgba(212,165,116,0.22)"></path>' +
      '<path d="' +
      line +
      '" fill="none" stroke="#1B2A4A" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"></path>' +
      hits +
      "</svg>" +
      '<div class="wx-tooltip" hidden></div>' +
      "</div>" +
      '<div class="wx-hour-card" id="wx-card-' +
      panelId +
      '" data-default="將游標移到圖上，或點選某一小時，可查看該時段的溫度與天氣概況（日本時間）。">將游標移到圖上，或點選某一小時，可查看該時段的溫度與天氣概況（日本時間）。</div>'
    );
  }

  const dayNav = document.getElementById("wx-days");
  const root = document.getElementById("wx-root");
  const statusEl = document.getElementById("wx-status");
  const metaEl = document.getElementById("wx-meta");
  const refreshBtn = document.getElementById("wx-refresh");

  let store = null;
  let activeId = "1";
  const hourState = {};

  try {
    const saved = localStorage.getItem("kyushu-ehon-2026-day");
    if (saved && DAYS.some((d) => d.id === saved)) activeId = saved;
  } catch (e) {}

  const params = new URLSearchParams(location.search);
  if (params.get("day") && DAYS.some((d) => d.id === params.get("day"))) {
    activeId = params.get("day");
  }

  DAYS.forEach((d) => {
    const btn = document.createElement("button");
    btn.className = "day-btn";
    btn.type = "button";
    btn.role = "tab";
    btn.dataset.day = d.id;
    btn.setAttribute("aria-selected", d.id === activeId ? "true" : "false");
    btn.innerHTML =
      '<span class="d">' +
      d.label +
      '</span><span class="date">11/' +
      d.date.slice(8) +
      " " +
      d.weekday +
      '</span><span class="place">' +
      d.placeLabel +
      "</span>";
    btn.addEventListener("click", () => {
      activeId = d.id;
      renderDay();
      try {
        localStorage.setItem("kyushu-ehon-2026-day", d.id);
      } catch (e) {}
    });
    dayNav.appendChild(btn);
  });

  function setStatus(kind, text) {
    if (!text) {
      statusEl.hidden = true;
      statusEl.innerHTML = "";
      return;
    }
    statusEl.hidden = false;
    statusEl.className = kind === "error" ? "wx-error" : kind === "empty" ? "wx-empty" : "wx-loading";
    statusEl.textContent = text;
  }

  function formatFetched(ts) {
    try {
      return new Intl.DateTimeFormat("zh-Hant", {
        timeZone: "Asia/Hong_Kong",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(new Date(ts)) + "（香港時間）";
    } catch (e) {
      return "";
    }
  }

  function showHour(panelId, hours, index, evt) {
    const h = hours[index];
    if (!h) return;
    hourState[panelId] = index;
    const det = hourDetail(h);
    const card = document.getElementById("wx-card-" + panelId);
    if (card) {
      card.innerHTML =
        weatherConditionHtml(h.code) +
        "<span class='wx-hour-meta'><strong>" +
        det.timeLabel +
        "</strong>　" +
        det.temp +
        (det.extra ? "　" + det.extra : "") +
        "</span>";
    }
    const wrap = document.querySelector('.wx-chart-wrap[data-panel="' + panelId + '"]');
    if (!wrap) return;
    const tip = wrap.querySelector(".wx-tooltip");
    const svg = wrap.querySelector(".wx-chart");
    if (!tip || !svg) return;
    tip.hidden = false;
    tip.innerHTML =
      weatherConditionHtml(h.code) +
      "<span class='wx-tip-meta'><strong>" +
      det.timeLabel +
      "</strong><br>" +
      det.temp +
      (det.extra ? "<br>" + det.extra : "") +
      "</span>";
    const dot = svg.querySelector('.wx-dot[data-i="' + index + '"]');
    if (dot) {
      const ctm = svg.getScreenCTM();
      const wrapRect = wrap.getBoundingClientRect();
      if (ctm) {
        const cx = Number(dot.getAttribute("cx"));
        const cy = Number(dot.getAttribute("cy"));
        const x = ctm.a * cx + ctm.e - wrapRect.left;
        const y = ctm.d * cy + ctm.f - wrapRect.top;
        tip.style.left = x + "px";
        tip.style.top = y + "px";
      }
    } else if (evt) {
      const wrapRect = wrap.getBoundingClientRect();
      tip.style.left = evt.clientX - wrapRect.left + "px";
      tip.style.top = evt.clientY - wrapRect.top + "px";
    }
    svg.querySelectorAll(".wx-dot").forEach((el) => {
      el.setAttribute("r", el.getAttribute("data-i") === String(index) ? "5.5" : "3.5");
      el.setAttribute("fill", el.getAttribute("data-i") === String(index) ? "#C45C4A" : "#D4A574");
    });
  }

  function bindChart(panelId, hours) {
    const wrap = document.querySelector('.wx-chart-wrap[data-panel="' + panelId + '"]');
    if (!wrap) return;
    const svg = wrap.querySelector(".wx-chart");
    const hits = wrap.querySelectorAll(".wx-hit");
    hits.forEach((hit) => {
      const i = Number(hit.getAttribute("data-i"));
      hit.addEventListener("mouseenter", (e) => showHour(panelId, hours, i, e));
      hit.addEventListener("mousemove", (e) => showHour(panelId, hours, i, e));
      hit.addEventListener("click", (e) => showHour(panelId, hours, i, e));
      hit.addEventListener("focus", (e) => showHour(panelId, hours, i, e));
      hit.setAttribute("tabindex", "0");
      hit.setAttribute("role", "button");
      const h = hours[i];
      const det = hourDetail(h);
      hit.setAttribute("aria-label", det.timeLabel + "，" + det.temp + "，" + det.cond);
    });
    wrap.addEventListener("mouseleave", () => {
      if (prefersReduce()) return;
      /* keep last selection visible in the card; hide floating tooltip */
      const tip = wrap.querySelector(".wx-tooltip");
      if (tip) tip.hidden = true;
    });
    if (svg) {
      let mid = hours.findIndex((h) => h.hour === 12);
      if (mid < 0) mid = Math.floor(hours.length / 2);
      showHour(panelId, hours, mid);
      const tip = wrap.querySelector(".wx-tooltip");
      if (tip) tip.hidden = true;
    }
  }

  function renderDay() {
    Array.from(dayNav.querySelectorAll(".day-btn")).forEach((btn) => {
      const on = btn.dataset.day === activeId;
      btn.setAttribute("aria-selected", on ? "true" : "false");
      if (on && dayNav) {
        const left = btn.offsetLeft - dayNav.clientWidth / 2 + btn.offsetWidth / 2;
        dayNav.scrollTo({ left: Math.max(0, left), behavior: prefersReduce() ? "auto" : "smooth" });
      }
    });

    const day = DAYS.find((d) => d.id === activeId);
    if (!day) return;

    if (!store || !store.data) {
      root.innerHTML = "";
      return;
    }

    const blocks = [];
    let missing = 0;
    day.places.forEach((slot, idx) => {
      const forecast = store.data[slot.key];
      const sliced = sliceDay(forecast, day.date);
      const place = PLACES[slot.key];
      const panelId = day.id + "-" + slot.key + "-" + idx;
      if (!sliced) {
        missing += 1;
        blocks.push(
          '<article class="wx-panel">' +
            '<div class="wx-place-kicker">' +
            slot.when +
            " · " +
            day.label +
            "　11/" +
            day.date.slice(8) +
            "（" +
            day.weekday +
            "）</div>" +
            '<h2 class="wx-place-name">' +
            place.name +
            "</h2>" +
            '<div class="wx-empty">預報尚未覆蓋這天。不會顯示估計或氣候平均值，請稍後再用「重新整理預報」查看。</div>' +
            "</article>"
        );
        return;
      }
      blocks.push(
        '<article class="wx-panel">' +
          '<div class="wx-place-kicker">' +
          slot.when +
          " · " +
          day.label +
          "　11/" +
          day.date.slice(8) +
          "（" +
          day.weekday +
          "）· 日本時間</div>" +
          '<h2 class="wx-place-name">' +
          place.name +
          "</h2>" +
          '<div class="wx-overview">' +
          '<div class="wx-stat cond"><div class="wx-stat-label">天氣概況</div><div class="wx-stat-value">' +
          weatherConditionHtml(sliced.code) +
          "</div></div>" +
          '<div class="wx-stat"><div class="wx-stat-label">最高氣溫</div><div class="wx-stat-value">' +
          fmtTemp(sliced.high) +
          "</div></div>" +
          '<div class="wx-stat"><div class="wx-stat-label">最低氣溫</div><div class="wx-stat-value">' +
          fmtTemp(sliced.low) +
          "</div></div>" +
          '<div class="wx-stat"><div class="wx-stat-label">降水機率</div><div class="wx-stat-value">' +
          (sliced.pop == null ? "–" : Math.round(sliced.pop) + "%") +
          "</div></div>" +
          "</div>" +
          "<h3 style='font-size:1rem;margin:0 0 .6rem'>24 小時溫度（日本時間）</h3>" +
          buildChart(sliced.hours, panelId) +
          "</article>"
      );
    });

    root.className = "wx-places" + (day.places.length > 1 ? " pair" : "");
    root.innerHTML = blocks.join("");
    setStatus(false);

    day.places.forEach((slot, idx) => {
      const forecast = store.data[slot.key];
      const sliced = sliceDay(forecast, day.date);
      if (sliced) bindChart(day.id + "-" + slot.key + "-" + idx, sliced.hours);
    });

    const when = store.fetchedAt ? "最近更新 " + formatFetched(store.fetchedAt) : "";
    const cacheNote = store.fromCache ? "（瀏覽器暫存）" : "（剛剛重新整理）";
    metaEl.textContent =
      day.label +
      "　11/" +
      day.date.slice(8) +
      "（" +
      day.weekday +
      "）" +
      (when ? " · " + when + cacheNote : "");
  }

  async function load(force) {
    setStatus("loading", "正在載入 Open-Meteo 預報…");
    root.innerHTML = "";
    try {
      store = await fetchAll(force);
      renderDay();
    } catch (err) {
      store = null;
      root.innerHTML = "";
      setStatus(
        "error",
        "暫時無法載入天氣預報，請檢查網絡後再按「重新整理預報」。不會顯示假設數據。" +
          (err && err.message ? "（" + err.message + "）" : "")
      );
      metaEl.textContent = "預報載入失敗";
    }
  }

  refreshBtn.addEventListener("click", () => load(true));

  if (dayNav) {
    dayNav.addEventListener("keydown", (e) => {
      const keys = { ArrowRight: 1, ArrowLeft: -1 };
      if (!(e.key in keys)) return;
      const btns = Array.from(dayNav.querySelectorAll(".day-btn"));
      const i = btns.findIndex((b) => b.getAttribute("aria-selected") === "true");
      const next = btns[(i + keys[e.key] + btns.length) % btns.length];
      next.click();
      next.focus();
      e.preventDefault();
    });
  }

  load(false);
})();
