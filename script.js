// ============================
// script.js
// ============================

const FAVORITES_KEY = "favorites";
const HISTORY_KEY   = "favorite_history";
const HISTORY_MAX   = 15;

let eventsData    = [];
let optionsData   = null;
let festivalsData = [];
let linksData     = [];
let contactData   = null;

// カテゴリ色定義
const CATEGORY_COLORS = {
  "エンタメ・お笑い":                 { bg: "rgba(254,240,138,0.35)", border: "#fbbf24", tag: "#92400e" },
  "音楽・パフォーマンス":             { bg: "rgba(196,181,253,0.35)", border: "#8b5cf6", tag: "#5b21b6" },
  "展示・発表":                       { bg: "rgba(167,243,208,0.35)", border: "#34d399", tag: "#065f46" },
  "体験・実験（理工系）":             { bg: "rgba(252,165,165,0.35)", border: "#f87171", tag: "#991b1b" },
  "体験・実験":                       { bg: "rgba(252,165,165,0.35)", border: "#f87171", tag: "#991b1b" },
  "講演・セミナー":                   { bg: "rgba(147,197,253,0.35)", border: "#60a5fa", tag: "#1e40af" },
  "飲食":                             { bg: "rgba(253,186,116,0.35)", border: "#fb923c", tag: "#9a3412" },
  "物販":                             { bg: "rgba(253,186,116,0.25)", border: "#f59e0b", tag: "#78350f" },
  "ダンス系":                         { bg: "rgba(249,168,212,0.35)", border: "#f472b6", tag: "#9d174d" },
  "コスプレ・ファッション系":         { bg: "rgba(249,168,212,0.25)", border: "#ec4899", tag: "#831843" },
  "アトラクション・ゲーム（参加型）": { bg: "rgba(110,231,183,0.35)", border: "#10b981", tag: "#064e3b" },
  "相談・ワークショップ系":           { bg: "rgba(165,180,252,0.35)", border: "#818cf8", tag: "#3730a3" },
  "その他":                           { bg: "rgba(209,213,219,0.35)", border: "#9ca3af", tag: "#374151" },
};

// 複数選択対応: チップの選択状態管理
const chipSelections = {}; // { fieldId: Set<value> }

function getCategoryColor(category) {
  if (!category) return CATEGORY_COLORS["その他"];
  if (CATEGORY_COLORS[category]) return CATEGORY_COLORS[category];
  for (const key of Object.keys(CATEGORY_COLORS)) {
    if (category.includes(key) || key.includes(category)) return CATEGORY_COLORS[key];
  }
  return CATEGORY_COLORS["その他"];
}

// ============================
// 📥 データ読み込み
// ============================
async function loadAllData() {
  try {
    const [events, options, festivals, links, contact] = await Promise.all([
      fetch('data/events.json').then(r => r.json()),
      fetch('data/options.json').then(r => r.json()),
      fetch('data/festivals.json').then(r => r.json()),
      fetch('data/links.json').then(r => r.json()),
      fetch('data/contact.json').then(r => r.json())
    ]);
    eventsData = events; optionsData = options;
    festivalsData = festivals; linksData = links; contactData = contact;
    return true;
  } catch (e) {
    console.error('データ読み込みエラー:', e);
    alert('データの読み込みに失敗しました。ページを再読み込みしてください。');
    return false;
  }
}

function getAllEvents()       { return Array.isArray(eventsData) ? eventsData : []; }
function evTitle(ev)         { return ev.name || ev["企画名"] || ev.title || "(無題)"; }
function evUniversity(ev)    { return ev.university || ev["大学"] || ""; }
function evCategory(ev)      { return ev.category || ev["カテゴリ"] || ""; }
function evField(ev)         { return ev.field || ev["分野"] || ""; }
function evDescription(ev)   { return ev.description || ev["説明"] || ""; }
function evStartDateTime(ev) { return ev.startDatetime || ev.start_datetime || ev["start_datetime"] || ""; }
function evEndDateTime(ev)   { return ev.endDatetime   || ev.end_datetime   || ev["end_datetime"]   || ""; }

function escapeHtml(str) {
  if (!str && str !== 0) return "";
  return String(str)
    .replaceAll("&","&amp;").replaceAll("<","&lt;")
    .replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#39;");
}

// ============================
// 初期ロード
// ============================
document.addEventListener("DOMContentLoaded", async () => {
  const loaded = await loadAllData();
  if (!loaded) return;

  try { loadOptionsSafe();         } catch(e){ console.warn(e); }
  restoreSearchFromURL();
  try { setupNavigation();         } catch(e){ console.warn(e); }
  try { setupIntroModal();         } catch(e){ console.warn(e); }
  try { setupFestivalSlider();     } catch(e){ console.warn(e); }
  try { setupInfoPage();           } catch(e){ console.warn(e); }
  try { setupDescriptionButtons(); } catch(e){ console.warn(e); }
  try { setupRoomGuide();          } catch(e){ console.warn(e); }
  try { setupStory();              } catch(e){ console.warn(e); }
  try { setupSearchHelp();         } catch(e){ console.warn(e); }

  if (checkIfFiltersApplied()) onSearch();
  else renderResults(getAllEvents());

  loadFavorites();
  loadHistory();

  document.getElementById("searchBtn")?.addEventListener("click", onSearch);
  document.getElementById("clearBtn")?.addEventListener("click", onClear);
});

// ============================
// 🎪 学祭情報スライダー
// ============================
let currentSlide = 0;

function setupFestivalSlider() {
  if (!festivalsData || festivalsData.length === 0) return;
  const dotsContainer = document.getElementById("sliderDots");
  festivalsData.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.className = "slider-dot";
    dot.type = "button";
    if (i === 0) dot.classList.add("active");
    dot.addEventListener("click", () => goToSlide(i));
    dotsContainer.appendChild(dot);
  });
  document.getElementById("sliderPrev")?.addEventListener("click", () => changeSlide(-1));
  document.getElementById("sliderNext")?.addEventListener("click", () => changeSlide(1));
  updateSlide();
  setInterval(() => changeSlide(1), 5000);
}

function changeSlide(d) {
  currentSlide = (currentSlide + d + festivalsData.length) % festivalsData.length;
  updateSlide();
}
function goToSlide(i) { currentSlide = i; updateSlide(); }

function updateSlide() {
  if (!festivalsData || festivalsData.length === 0) return;
  const f = festivalsData[currentSlide];
  const nameEl  = document.getElementById("sliderFestivalName");
  const datesEl = document.getElementById("sliderDates");
  const hlEl    = document.getElementById("sliderHighlight");
  const msgEl   = document.getElementById("sliderMessage");
  if (nameEl)  nameEl.textContent  = `${f.university} ${f.number||""}${f.festivalName}`;
  if (datesEl) datesEl.textContent = `開催日：${f.dates}`;
  if (hlEl)    hlEl.textContent    = `目玉企画：${f.highlight}`;
  if (msgEl)   msgEl.textContent   = f.message;
  document.querySelectorAll(".slider-dot").forEach((d,i) => d.classList.toggle("active", i === currentSlide));

  const sliderCard = document.querySelector('.festival-slider-card');
  if (sliderCard && optionsData) {
    const newCard = sliderCard.cloneNode(true);
    sliderCard.parentNode.replaceChild(newCard, sliderCard);
    newCard.onclick = () => {
      const uniName    = f.university.replace("大学","");
      const campusName = (f.campus||"").replace("キャンパス","").replace("（","").replace("）","");
      const match = optionsData.universityOptions?.find(o => o.includes(uniName) && o.includes(campusName));
      if (match) {
        setChipValue("university", match);
        onSearch();
        document.querySelector('.nav-btn[data-view="search"]')?.click();
        setTimeout(() => document.getElementById("search-area")?.scrollIntoView({ behavior:"smooth" }), 100);
      }
    };
  }
}

// ============================
// ℹ️ 情報ページ
// ============================
function setupInfoPage() {
  const linksList = document.getElementById("links-list");
  if (linksList && linksData?.length > 0) {
    linksData.forEach(link => {
      const card    = document.createElement("div");
      card.className = "link-card";
      const hasUrl  = link.url && link.url !== "";
      const hasInst = link.sns?.instagram && link.sns.instagram !== "";
      const hasX    = link.sns?.x && link.sns.x !== "";
      card.innerHTML = `
        <div class="link-card-title">${escapeHtml(link.university)}</div>
        <div class="link-card-campus">${escapeHtml(link.campus)}</div>
        <div class="link-card-festival">${escapeHtml(link.festivalName)}</div>
        ${hasUrl
          ? `<a href="${escapeHtml(link.url)}" target="_blank" rel="noopener" class="link-card-url">${escapeHtml(link.url)}</a>`
          : '<div class="link-card-url" style="color:#999;">URL準備中</div>'}
        ${hasInst||hasX ? `<div class="link-card-sns">
          ${hasInst ? `<a href="https://instagram.com/${escapeHtml(link.sns.instagram).replace('@','')}" target="_blank" rel="noopener" class="sns-link">📷 ${escapeHtml(link.sns.instagram)}</a>` : ''}
          ${hasX    ? `<a href="https://x.com/${escapeHtml(link.sns.x).replace('@','')}" target="_blank" rel="noopener" class="sns-link">𝕏 ${escapeHtml(link.sns.x)}</a>` : ''}
        </div>` : ''}
      `;
      linksList.appendChild(card);
    });
  }

  const contactInfo = document.getElementById("contact-info");
  if (contactInfo && contactData) {
    const sns  = contactData.sns || {};
    const inst = sns.instagram;
    const xSns = sns.x;
    const line = sns["公式LINE"];
    contactInfo.innerHTML = `
      <p class="contact-message">${escapeHtml(contactData.message||"")}</p>
      ${contactData.email ? `<div class="contact-item"><span class="contact-label">📧 Email</span><span class="contact-value">${escapeHtml(contactData.email)}</span></div>` : ''}
      ${inst ? `<div class="contact-item"><span class="contact-label">📷 Instagram</span><a href="${escapeHtml(inst.url)}" target="_blank" rel="noopener" class="contact-link">${escapeHtml(inst.id)}</a></div>` : ''}
      ${xSns ? `<div class="contact-item"><span class="contact-label">𝕏 X (Twitter)</span><a href="${escapeHtml(xSns.url)}" target="_blank" rel="noopener" class="contact-link">${escapeHtml(xSns.id)}</a></div>` : ''}
      ${line ? `<div class="contact-item"><span class="contact-label">💬 公式LINE</span><a href="${escapeHtml(line.url)}" target="_blank" rel="noopener" class="contact-link">${escapeHtml(line.id)}</a></div>` : ''}
    `;
  }
}

// ============================
// 📖 説明ボタン
// ============================
function setupDescriptionButtons() {
  const descModal = document.getElementById("descModal");
  const descTitle = document.getElementById("descTitle");
  const descText  = document.getElementById("descText");

  document.querySelectorAll(".info-btn[data-type]").forEach(btn => {
    btn.addEventListener("click", () => {
      const type = btn.dataset.type;
      let title = "", text = "";

      if (type === "category") {
        title = "カテゴリについて";
        const legendHtml = Object.entries(CATEGORY_COLORS)
          .filter(([name]) => name !== "体験・実験") // 重複エイリアスを除外
          .map(([name, col]) =>
            `<span style="background:${col.bg};border:1.5px solid ${col.border};color:${col.tag};padding:3px 10px;border-radius:999px;display:inline-flex;align-items:center;font-size:0.85rem;font-weight:600;margin:3px;">${name}</span>`
          ).join("");
        if (descTitle) descTitle.textContent = title;
        if (descText)  descText.innerHTML = `<p style="margin-bottom:10px;">企画のジャンルを選択できます。色の意味は以下の通りです：</p><div style="display:flex;flex-wrap:wrap;gap:4px;">${legendHtml}</div>`;
        descModal?.classList.remove("hidden");
        return;
      } else if (type === "field") {
        const val = getChipValue("field");
        const fd  = optionsData?.fieldOptions?.find(f => f.value === val);
        title = fd ? fd.value : "分野について";
        text  = fd ? fd.description : "企画の学問分野を選択できます。";
      } else if (type === "university") {
        title = "大学について"; text = "開催キャンパスで絞り込めます。";
      } else if (type === "date") {
        title = "開催日について"; text = "開催日で絞り込めます。";
      }
      if (descTitle) descTitle.textContent = title;
      if (descText)  descText.textContent  = text;
      descModal?.classList.remove("hidden");
    });
  });
  document.getElementById("descClose")?.addEventListener("click", () => descModal?.classList.add("hidden"));
  document.getElementById("descOk")?.addEventListener("click",    () => descModal?.classList.add("hidden"));
}

// ============================
// ❓ 検索ヘルプボタン
// ============================
function setupSearchHelp() {
  const btn = document.getElementById("searchHelpBtn");
  if (!btn) return;
  const descModal = document.getElementById("descModal");
  const descTitle = document.getElementById("descTitle");
  const descText  = document.getElementById("descText");
  btn.addEventListener("click", () => {
    if (descTitle) descTitle.textContent = "企画の検索について";
    if (descText)  descText.textContent  = "ここでは条件を絞って検索ができます。「大学」からは協力キャンパスが、「カテゴリ」からはお笑いや講演といった企画の種類が、「分野」からは企画がどの学問分野に分類されるかが、「開催日」からは開催日が指定できます。一部の条件を未指定のまま検索することもできます。クリアボタンから検索条件をすべて解除できます。";
    descModal?.classList.remove("hidden");
  });
}

// ============================
// 🔍 Choice Chips ユーティリティ
// ============================
function getChipValue(fieldId) {
  const active = document.querySelector(`.chip-group[data-field="${fieldId}"] .chip-btn.active`);
  return active ? active.dataset.value : "";
}

function setChipValue(fieldId, value) {
  const group = document.querySelector(`.chip-group[data-field="${fieldId}"]`);
  if (!group) return;
  group.querySelectorAll(".chip-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.value === value);
  });
}

function buildChipGroup(fieldId, options) {
  const group = document.querySelector(`.chip-group[data-field="${fieldId}"]`);
  if (!group) return;
  group.innerHTML = "";

  const allBtn = document.createElement("button");
  allBtn.className    = "chip-btn active";
  allBtn.dataset.value = "";
  allBtn.textContent  = "指定なし";
  allBtn.type         = "button";
  allBtn.addEventListener("click", () => {
    group.querySelectorAll(".chip-btn").forEach(b => b.classList.remove("active"));
    allBtn.classList.add("active");
  });
  group.appendChild(allBtn);

  options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className    = "chip-btn";
    btn.type         = "button";
    btn.dataset.value = opt.value;
    btn.textContent  = opt.label || opt.value;

    if (fieldId === "category") {
      const col = getCategoryColor(opt.value);
      btn.style.setProperty("--chip-bg",     col.bg);
      btn.style.setProperty("--chip-border", col.border);
      btn.style.setProperty("--chip-color",  col.tag);
      btn.classList.add("chip-colored");
    }

    btn.addEventListener("click", () => {
      group.querySelectorAll(".chip-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
    group.appendChild(btn);
  });
}

// ============================
// 🔍 検索
// ============================
function onSearch() {
  const uni   = getChipValue("university");
  const cat   = getChipValue("category");
  const field = getChipValue("field");
  const date  = getChipValue("date");
  saveSearchFilters({ university:uni, category:cat, field, date });
  const filtered = getAllEvents().filter(ev => {
    if (uni   && evUniversity(ev) !== uni)                       return false;
    if (cat   && evCategory(ev)   !== cat)                       return false;
    if (field && evField(ev)      !== field)                     return false;
    if (date  && evStartDateTime(ev).split('T')[0] !== date)     return false;
    return true;
  });
  renderResults(filtered);
  updateFilterStatus();
}

function onClear() {
  ["university","category","field","date"].forEach(fieldId => {
    const group = document.querySelector(`.chip-group[data-field="${fieldId}"]`);
    if (!group) return;
    group.querySelectorAll(".chip-btn").forEach(b => b.classList.remove("active"));
    const first = group.querySelector('.chip-btn[data-value=""]');
    if (first) first.classList.add("active");
  });
  saveSearchFilters({ university:"", category:"", field:"", date:"" });
  renderResults(getAllEvents());
  updateFilterStatus();
}

function saveSearchFilters(f) { localStorage.setItem('searchFilters', JSON.stringify(f)); }

function restoreSearchFromURL() {
  const p = new URLSearchParams(window.location.search);
  [["uni","university"],["cat","category"],["field","field"],["date","date"]].forEach(([param,id]) => {
    const val = p.get(param);
    if (val) setChipValue(id, val);
  });
  saveSearchFilters({
    university: p.get('uni')||"",
    category:   p.get('cat')||"",
    field:      p.get('field')||"",
    date:       p.get('date')||""
  });
}

function checkIfFiltersApplied() {
  return ["university","category","field","date"].some(id => !!getChipValue(id));
}

function updateFilterStatus() {
  const el = document.getElementById("filter-status");
  if (!el) return;
  const has = checkIfFiltersApplied();
  el.textContent    = has ? "(絞り込み)" : "(全体)";
  el.style.color    = has ? "#dc2626" : "#6b7280";
  el.style.fontWeight = has ? "600" : "normal";
}

// ============================
// 📄 結果表示
// ============================
async function renderResults(list) {
  const area   = document.getElementById("results");
  const noData = document.getElementById("no-results");
  if (!area) return;
  area.innerHTML = "";
  if (!Array.isArray(list) || list.length === 0) {
    if (noData) noData.hidden = false;
    return;
  }
  if (noData) noData.hidden = true;
  for (const ev of list) area.appendChild(createEventCard(ev));
}

function createEventCard(ev) {
  const card = document.createElement("article");
  card.className = "result-card";
  card.dataset.eventId = ev.id;
  const isFav = loadFavoritesArray().includes(ev.id);

  const col = getCategoryColor(evCategory(ev));
  card.style.background = col.bg;
  card.style.borderLeft = `4px solid ${col.border}`;

  const catHtml = evCategory(ev)
    ? `<span class="category-tag" style="background:${col.bg};border:1.5px solid ${col.border};color:${col.tag};">${escapeHtml(evCategory(ev))}</span>`
    : "";

  card.innerHTML = `
    <button class="fav-btn ${isFav?"active":""}" data-id="${ev.id}" aria-label="お気に入り" type="button">⭐</button>
    <h4>${escapeHtml(evTitle(ev))}</h4>
    <p class="muted event-summary">${escapeHtml(evDescription(ev))}</p>
    <div class="card-meta">
      <span class="university-tag">${escapeHtml(evUniversity(ev))}</span>
      ${catHtml}
      <span class="field-tag">${escapeHtml(evField(ev))}</span>
    </div>
  `;
  card.addEventListener("click", e => {
    if (e.target.closest('.fav-btn')) return;
    window.location.href = `events_detail.html?id=${ev.id}`;
  });
  card.querySelector(".fav-btn").addEventListener("click", e => {
    e.stopPropagation();
    toggleFavorite(ev);
  });
  return card;
}

// ============================
// ⭐ お気に入り
// ============================
function loadFavoritesArray() {
  try { return JSON.parse(localStorage.getItem(FAVORITES_KEY)||"[]"); } catch { return []; }
}
function loadHistoryArray() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY)||"[]"); } catch { return []; }
}
function saveFavoritesArray(a) { localStorage.setItem(FAVORITES_KEY, JSON.stringify(a)); }
function saveHistoryArray(a)   { localStorage.setItem(HISTORY_KEY,   JSON.stringify(a)); }

function toggleFavorite(ev) {
  const id = ev.id;
  if (typeof id === "undefined") return;
  let favs = loadFavoritesArray();
  let hist = loadHistoryArray();
  if (favs.includes(id)) {
    favs = favs.filter(x => x !== id);
  } else {
    favs.unshift(id);
    hist = addToHistory(id, hist);
  }
  saveFavoritesArray(favs);
  saveHistoryArray(hist);
  renderFavoritesTable();
  renderHistory();
  if (checkIfFiltersApplied()) onSearch();
  else renderResults(getAllEvents());
}

// ============================
// ⭐ 時系列テーブル
// ============================
function renderFavoritesTable() {
  const tbody = document.getElementById("favorites-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";
  const favs = loadFavoritesArray();
  if (favs.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="muted" style="padding:16px;text-align:center;">お気に入りはまだありません。</td></tr>';
    return;
  }
  const weekdays = ["日","月","火","水","木","金","土"];
  const all = getAllEvents();
  favs.map(id => all.find(x => x.id === id)).filter(Boolean)
    .sort((a,b) => {
      const as = evStartDateTime(a), bs = evStartDateTime(b);
      if (!as && !bs) return 0; if (!as) return 1; if (!bs) return -1;
      return new Date(as) - new Date(bs);
    })
    .forEach(ev => {
      const s = evStartDateTime(ev);
      let dateLabel = "—", timeLabel = "—";
      if (s) {
        try {
          const d = new Date(s);
          dateLabel = `${d.getMonth()+1}/${d.getDate()}（${weekdays[d.getDay()]}）`;
          timeLabel = `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
        } catch(e){}
      }
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td class="fav-table-date">${escapeHtml(dateLabel)}</td>
        <td class="fav-table-time">${escapeHtml(timeLabel)}</td>
        <td class="fav-table-name">
          <a href="events_detail.html?id=${ev.id}" class="fav-table-link">${escapeHtml(evTitle(ev))}</a>
          <div class="fav-table-uni">${escapeHtml(evUniversity(ev))}</div>
        </td>
        <td><button class="fav-btn fav-table-remove" type="button" aria-label="解除">⭐</button></td>
      `;
      tr.querySelector(".fav-table-remove").addEventListener("click", () => toggleFavorite(ev));
      tbody.appendChild(tr);
    });
}

function loadFavorites() { renderFavoritesTable(); }
function loadHistory()   { renderHistory(); }

// ============================
// 🕘 履歴
// ============================
function addToHistory(id, history) {
  let h = Array.isArray(history) ? history.slice() : loadHistoryArray();
  h = h.filter(x => x !== id);
  h.unshift(id);
  return h.length > HISTORY_MAX ? h.slice(0, HISTORY_MAX) : h;
}

function renderHistory() {
  const area = document.getElementById("fav-history");
  if (!area) return;
  area.innerHTML = "";
  const history = loadHistoryArray();
  if (history.length === 0) {
    area.innerHTML = '<div class="muted">履歴はありません。</div>';
    return;
  }
  const all = getAllEvents();
  history.forEach(id => {
    const ev = all.find(e => e.id === id);
    if (!ev) return;
    const item = document.createElement("div");
    item.className = "history-item";
    item.innerHTML = `
      <div>
        <strong>${escapeHtml(evTitle(ev))}</strong>
        <div class="muted">${escapeHtml(evUniversity(ev))}</div>
      </div>
      <div class="history-actions">
        <button class="btn small readd" type="button" data-id="${id}">再登録</button>
        <button class="btn small del"   type="button" data-id="${id}">🗑️</button>
      </div>
    `;
    item.querySelector(".readd").addEventListener("click", () => {
      const favs = loadFavoritesArray();
      if (!favs.includes(id)) { favs.unshift(id); saveFavoritesArray(favs); }
      renderFavoritesTable(); renderHistory();
    });
    item.querySelector(".del").addEventListener("click", () => {
      saveHistoryArray(loadHistoryArray().filter(x => x !== id));
      renderHistory();
    });
    area.appendChild(item);
  });
}

// ============================
// 📱 ナビゲーション
// ============================
function setupNavigation() {
  const allAreaIds = ["search-area","results-area","favorites-area","room-guide-area","story-area","map-area","info-area"];
  const viewMap    = {
    "search":     ["search-area","results-area"],
    "favorites":  ["favorites-area"],
    "room-guide": ["room-guide-area"],
    "story":      ["story-area"],
    "map":        ["map-area"],
    "info":       ["info-area"]
  };

  function switchView(view) {
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(`.nav-btn[data-view="${view}"]`).forEach(b => b.classList.add("active"));
    allAreaIds.forEach(id => document.getElementById(id)?.classList.add("hidden"));
    (viewMap[view]||[]).forEach(id => document.getElementById(id)?.classList.remove("hidden"));
    document.getElementById("festival-slider-section")?.classList.toggle("hidden", view !== "search");
    if (view === "favorites") { renderFavoritesTable(); renderHistory(); }
    document.getElementById("hamburger-menu")?.classList.remove("open");
    document.getElementById("hamburger-overlay")?.classList.remove("open");
  }

  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => switchView(btn.dataset.view));
  });

  document.getElementById("hamburger-toggle")?.addEventListener("click", () => {
    document.getElementById("hamburger-menu")?.classList.toggle("open");
    document.getElementById("hamburger-overlay")?.classList.toggle("open");
  });
  document.getElementById("hamburger-overlay")?.addEventListener("click", () => {
    document.getElementById("hamburger-menu")?.classList.remove("open");
    document.getElementById("hamburger-overlay")?.classList.remove("open");
  });
}

// ============================
// 📝 初回モーダル
// ============================
function setupIntroModal() {
  const modal    = document.getElementById("introModal");
  const dontShow = document.getElementById("dontShow");
  [document.getElementById("introClose"), document.getElementById("introOk")].forEach(btn => {
    if (!btn) return;
    btn.addEventListener("click", () => {
      if (dontShow?.checked) localStorage.setItem("hideIntro","1");
      modal?.classList.add("hidden");
    });
  });
  if (!localStorage.getItem("hideIntro") && modal) setTimeout(() => modal.classList.remove("hidden"), 280);
}

// ============================
// 📌 Choice Chips 生成
// ============================
function loadOptionsSafe() {
  if (!optionsData) return;

  if (Array.isArray(optionsData.universityOptions)) {
    buildChipGroup("university", optionsData.universityOptions.map(u => ({ value: u, label: u })));
  }
  if (Array.isArray(optionsData.categoryOptions)) {
    buildChipGroup("category", optionsData.categoryOptions.map(c => ({ value: c.value, label: c.value })));
  }
  if (Array.isArray(optionsData.fieldOptions)) {
    buildChipGroup("field", optionsData.fieldOptions.map(f => ({ value: f.value, label: f.value })));
  }

  const dateOptions = [
    { value: "2025-11-01", label: "11/1(土)" },
    { value: "2025-11-02", label: "11/2(日)" },
    { value: "2025-11-03", label: "11/3(月)" },
    { value: "2025-11-04", label: "11/4(火)" }
  ];
  buildChipGroup("date", dateOptions);
}

// ============================
// 🏫 教室案内データ
// ============================
/*
  ▼▼▼ キャンパス・建物・教室を書き足す場所 ▼▼▼

  "キャンパスID": {
    label: "〇〇大学 〇〇キャンパス",
    buildings: {
      "建物ID": {
        label: "〇〇棟",
        rooms: [
          {
            id:       "部屋ID（一意）",
            label:    "1F 101教室",
            desc:     "正門から〇〇を目指して...",
            mapImage: "img/map_XXX.jpg"   // なければ ""
          }
        ]
      }
    }
  }
*/
const roomGuideData = {
  "campus-sample": {
    label: "（サンプル）〇〇大学 〇〇キャンパス",
    buildings: {
      "bldg-a": {
        label: "A棟",
        rooms: [
          { id:"a-101", label:"1F 101教室", desc:"正門を入り、まっすぐ進むとA棟が見えます。1階左手が101教室です。", mapImage:"" },
          { id:"a-201", label:"2F 201教室", desc:"A棟1階の階段を上り、右手が201教室です。", mapImage:"" }
        ]
      },
      "bldg-b": {
        label: "B棟",
        rooms: [
          { id:"b-101", label:"1F 講義室1", desc:"正門を入り右手にある建物がB棟です。1階正面が講義室1です。", mapImage:"" }
        ]
      }
    }
  }
};

function setupRoomGuide() {
  const campusSel   = document.getElementById("room-campus");
  const buildingSel = document.getElementById("room-building");
  const roomSel     = document.getElementById("room-room");
  const guideBtn    = document.getElementById("room-guide-btn");
  if (!campusSel) return;

  Object.entries(roomGuideData).forEach(([key, campus]) => {
    const opt = document.createElement("option");
    opt.value = key; opt.textContent = campus.label;
    campusSel.appendChild(opt);
  });

  campusSel.addEventListener("change", () => {
    const ck = campusSel.value;
    buildingSel.innerHTML = '<option value="">建物を選択</option>';
    roomSel.innerHTML     = '<option value="">教室を選択</option>';
    buildingSel.disabled  = !ck; roomSel.disabled = true;
    if (!ck) return;
    Object.entries(roomGuideData[ck]?.buildings || {}).forEach(([bk, b]) => {
      const opt = document.createElement("option");
      opt.value = bk; opt.textContent = b.label;
      buildingSel.appendChild(opt);
    });
  });

  buildingSel.addEventListener("change", () => {
    const ck = campusSel.value, bk = buildingSel.value;
    roomSel.innerHTML = '<option value="">教室を選択</option>';
    roomSel.disabled  = !bk;
    if (!ck || !bk) return;
    (roomGuideData[ck]?.buildings[bk]?.rooms || []).forEach(room => {
      const opt = document.createElement("option");
      opt.value = room.id; opt.textContent = room.label;
      roomSel.appendChild(opt);
    });
  });

  guideBtn?.addEventListener("click", () => {
    const ck = campusSel.value, bk = buildingSel.value, rk = roomSel.value;
    if (!ck || !bk || !rk) { alert("キャンパス・建物・教室をすべて選択してください"); return; }
    const campus = roomGuideData[ck];
    const bldg   = campus?.buildings[bk];
    const room   = bldg?.rooms.find(r => r.id === rk);
    if (!room) return;
    const titleEl  = document.getElementById("room-result-title");
    const descEl   = document.getElementById("room-result-desc");
    const mapEl    = document.getElementById("room-map-placeholder");
    const resultEl = document.getElementById("room-guide-result");
    if (titleEl) titleEl.textContent = `${campus.label}　${bldg.label}　${room.label}`;
    if (descEl)  descEl.textContent  = room.desc || "案内文は準備中です。";
    if (mapEl) {
      mapEl.innerHTML = room.mapImage
        ? `<img src="${escapeHtml(room.mapImage)}" alt="フロアマップ" style="width:100%;border-radius:8px;">`
        : `<p>🗺️ フロアマップ</p><p style="font-size:0.85em;color:#9ca3af;">準備中</p>`;
    }
    resultEl?.classList.remove("hidden");
    resultEl?.scrollIntoView({ behavior:"smooth", block:"nearest" });
  });
}

// ============================
// 📹 ストーリーデータ
// ============================
/*
  ▼▼▼ 動画を書き足す場所 ▼▼▼

  {
    id:          "story-1",
    title:       "学祭オープニング",
    description: "開幕を飾る映像です。",       // 省略可（"" でもOK）
    thumbnail:   "img/thumb1.jpg",             // サムネ画像パス（なければ ""）
    type:        "youtube",                    // "youtube" / "vimeo" / "direct"
    url:         "https://www.youtube.com/watch?v=XXXXX"
  }

  typeの説明：
    "youtube" → YouTubeのURLをそのままコピペ（youtu.beの短縮URLも可）
    "vimeo"   → VimeoのURLをそのままコピペ
    "direct"  → mp4など動画ファイルの直接URL
*/
const storyData = [
  // ここに追加（複数ある場合はカンマ区切り）
];

function setupStory() {
  const listEl  = document.getElementById("story-list");
  const emptyEl = document.getElementById("story-empty");
  if (!listEl) return;
  if (storyData.length === 0) { if (emptyEl) emptyEl.style.display = "block"; return; }
  if (emptyEl) emptyEl.style.display = "none";
  storyData.forEach(story => {
    const card = document.createElement("div");
    card.className = "story-card";
    const thumbHtml = story.thumbnail
      ? `<img src="${escapeHtml(story.thumbnail)}" class="story-thumb" alt="${escapeHtml(story.title)}">`
      : `<div class="story-thumb-placeholder">🎬</div>`;
    card.innerHTML = `
      ${thumbHtml}
      <div class="story-info">
        <div class="story-title">${escapeHtml(story.title)}</div>
        ${story.description ? `<div class="story-desc">${escapeHtml(story.description)}</div>` : ''}
      </div>
    `;
    card.addEventListener("click", () => openStoryModal(story));
    listEl.appendChild(card);
  });
}

function getEmbedUrl(story) {
  if (story.type === "youtube") {
    const m = story.url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if (m) return `https://www.youtube.com/embed/${m[1]}`;
  }
  if (story.type === "vimeo") {
    const m = story.url.match(/vimeo\.com\/(\d+)/);
    if (m) return `https://player.vimeo.com/video/${m[1]}`;
  }
  return story.url;
}

function openStoryModal(story) {
  document.getElementById("story-modal")?.remove();
  const modal = document.createElement("div");
  modal.id = "story-modal"; modal.className = "modal"; modal.style.zIndex = "300";
  const embedUrl   = getEmbedUrl(story);
  const playerHtml = story.type === "direct"
    ? `<video src="${escapeHtml(embedUrl)}" controls autoplay style="width:100%;border-radius:8px;"></video>`
    : `<iframe src="${escapeHtml(embedUrl)}" frameborder="0" allowfullscreen allow="autoplay; encrypted-media" style="width:100%;aspect-ratio:16/9;border-radius:8px;"></iframe>`;
  modal.innerHTML = `
    <div class="modal-content" style="max-width:680px;">
      <button class="modal-close" id="story-modal-close" type="button">✕</button>
      <h3 style="margin:0 2rem 1rem 0;">${escapeHtml(story.title)}</h3>
      ${playerHtml}
      ${story.description ? `<p style="margin-top:12px;color:#555;font-size:0.9rem;">${escapeHtml(story.description)}</p>` : ''}
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById("story-modal-close").addEventListener("click", () => modal.remove());
  modal.addEventListener("click", e => { if (e.target === modal) modal.remove(); });
}
