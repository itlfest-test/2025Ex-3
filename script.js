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
let changelogData = [];

// カテゴリ色定義（グループ順・色の濃さ順）
const CATEGORY_COLORS = {
  // ── 観る・聴く（オレンジ・ピンク系） ──
  "エンタメ・お笑い":                 { bg: "#fffaf5", border: "#ff7850", tag: "#ff7850" },
  "ダンス系":                         { bg: "#fff5f5", border: "#ff7070", tag: "#ff7070" },
  "音楽・パフォーマンス":             { bg: "#fff8f0", border: "#f0a050", tag: "#f0a050" },
  "コスプレ・ファッション系":         { bg: "#fff0f5", border: "#f080a0", tag: "#f080a0" },
  // ── 知る・学ぶ（ブルー・水色系） ──
  "講演・セミナー":                   { bg: "#f5fcff", border: "#50a0ff", tag: "#50a0ff" },
  "展示・発表":                       { bg: "#f0faff", border: "#4090f0", tag: "#4090f0" },
  "体験・実験（理工系）":             { bg: "#f8f8ff", border: "#7070f0", tag: "#7070f0" },
  "体験・実験":                       { bg: "#f8f8ff", border: "#7070f0", tag: "#7070f0" },
  "相談・ワークショップ系":           { bg: "#f5faff", border: "#50b0f0", tag: "#50b0f0" },
  // ── 楽しむ・巡る（グリーン・レモン系） ──
  "飲食":                             { bg: "#f5fffa", border: "#3cbc8c", tag: "#3cbc8c" },
  "物販":                             { bg: "#fafff5", border: "#80c060", tag: "#80c060" },
  "アトラクション・ゲーム（参加型）": { bg: "#ffffef", border: "#b0b040", tag: "#b0b040" },
  // ── その他 ──
  "その他":                           { bg: "#f9f9f9", border: "#6b7280", tag: "#6b7280" },
};

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
    const [events, options, festivals, links, contact, rooms, changelog] = await Promise.all([
      fetch('data/events.json').then(r => r.json()),
      fetch('data/options.json').then(r => r.json()),
      fetch('data/festivals.json').then(r => r.json()),
      fetch('data/links.json').then(r => r.json()),
      fetch('data/contact.json').then(r => r.json()),
      fetch('data/rooms.json').then(r => r.json()),
      fetch('data/changelog.json').then(r => r.json())
    ]);
    eventsData = events; optionsData = options;
    festivalsData = festivals; linksData = links; contactData = contact;
    roomGuideData = rooms; changelogData = changelog;
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
  try { setupChangelog();          } catch(e){ console.warn(e); }
  try { setupPageHelp();           } catch(e){ console.warn(e); }
  try { setupDarkmode();           } catch(e){ console.warn(e); }
  try { setupFeedbackBtn();        } catch(e){ console.warn(e); }

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
        // 全条件をリセットしてからキャンパスだけセット
        onClear();
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
      const hasInfo = !!link.campusInfo;
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
        ${hasInfo ? `<button class="campus-info-btn" type="button">🏫 キャンパス情報</button>` : ''}
      `;
      if (hasInfo) {
        card.querySelector(".campus-info-btn").addEventListener("click", () => {
          showCampusInfoModal(link);
        });
      }
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

function showCampusInfoModal(link) {
  const info = link.campusInfo;
  if (!info) return;
  const pay = info.payment || {};
  const payItems = [
    pay.cash   ? "現金" : null,
    pay.ic     ? "ICカード" : null,
    pay.credit ? "クレジットカード" : null,
    pay.qr     ? "スマホ決済（QR）" : null,
  ].filter(Boolean);

  const modal = document.createElement("div");
  modal.className = "modal";
  modal.style.zIndex = "250";
  modal.innerHTML = `
    <div class="modal-content" style="max-width:480px;">
      <button class="modal-close" id="campusInfoClose">✕</button>
      <h3 style="margin:0 0 1rem;color:#667eea;">🏫 ${escapeHtml(link.university)} ${escapeHtml(link.campus)}</h3>
      <div class="campus-info-grid">
        <div class="campus-info-item"><span class="campus-info-label">👟 上履き</span><span>${escapeHtml(info.shoes||"—")}</span></div>
        <div class="campus-info-item"><span class="campus-info-label">🚉 アクセス</span><span>${escapeHtml(info.access||"—").replace(/\n/g,"<br>")}</span></div>
        <div class="campus-info-item"><span class="campus-info-label">🍼 授乳室等</span><span>${escapeHtml(info.babyRoom||"—")}</span></div>
        <div class="campus-info-item"><span class="campus-info-label">🍱 飲食持込</span><span>${escapeHtml(info.food||"—")}</span></div>
        <div class="campus-info-item campus-info-item--full">
          <span class="campus-info-label">💳 使える決済</span>
          <span>${payItems.length ? payItems.join("・") : "現金のみ"}${pay.note ? `<br><small style="color:#9ca3af;">${escapeHtml(pay.note)}</small>` : ""}</span>
        </div>
      </div>
      <div class="modal-actions"><button class="btn primary-3d" id="campusInfoOk">閉じる</button></div>
    </div>
  `;
  document.body.appendChild(modal);
  const close = () => modal.remove();
  modal.querySelector("#campusInfoClose").addEventListener("click", close);
  modal.querySelector("#campusInfoOk").addEventListener("click", close);
  modal.addEventListener("click", e => { if (e.target === modal) close(); });
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
        const vals = getChipValue("field");
        const val  = vals.length === 1 ? vals[0] : "";
        const fd   = optionsData?.fieldOptions?.find(f => f.value === val);
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
// 🔍 Choice Chips ユーティリティ（複数選択対応）
// ============================
const chipSelections = {}; // { fieldId: Set<value> }

// 選択中の値を配列で返す（未選択は空配列）
function getChipValue(fieldId) {
  const sel = chipSelections[fieldId];
  if (!sel || sel.size === 0) return [];
  return [...sel];
}

// URLリストアなど外部から値をセットする
function setChipValue(fieldId, value) {
  if (!chipSelections[fieldId]) chipSelections[fieldId] = new Set();
  chipSelections[fieldId].add(value);
  const group = document.querySelector(`.chip-group[data-field="${fieldId}"]`);
  if (!group) return;
  group.querySelectorAll(".chip-btn").forEach(btn => {
    if (btn.dataset.value === value) btn.classList.add("active");
  });
}

function buildChipGroup(fieldId, options) {
  const group = document.querySelector(`.chip-group[data-field="${fieldId}"]`);
  if (!group) return;
  chipSelections[fieldId] = new Set();
  group.innerHTML = "";

  // 「指定なし」ボタン
  const allBtn = document.createElement("button");
  allBtn.className     = "chip-btn active";
  allBtn.type          = "button";
  allBtn.dataset.value = "";
  allBtn.textContent   = "指定なし";
  allBtn.addEventListener("click", () => {
    chipSelections[fieldId] = new Set();
    group.querySelectorAll(".chip-btn").forEach(b => b.classList.remove("active"));
    allBtn.classList.add("active");
  });
  group.appendChild(allBtn);

  options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className     = "chip-btn";
    btn.type          = "button";
    btn.dataset.value = opt.value;
    btn.textContent   = opt.label || opt.value;

    if (fieldId === "category") {
      const col = getCategoryColor(opt.value);
      btn.style.setProperty("--chip-bg",     col.bg);
      btn.style.setProperty("--chip-border", col.border);
      btn.style.setProperty("--chip-color",  col.tag);
      btn.classList.add("chip-colored");
    }

    btn.addEventListener("click", () => {
      const val = btn.dataset.value;
      if (chipSelections[fieldId].has(val)) {
        chipSelections[fieldId].delete(val);
        btn.classList.remove("active");
      } else {
        chipSelections[fieldId].add(val);
        btn.classList.add("active");
        allBtn.classList.remove("active"); // 何か選んだら「指定なし」を外す
      }
      // 何も選ばれていなければ「指定なし」を戻す
      if (chipSelections[fieldId].size === 0) allBtn.classList.add("active");
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
    if (uni.length   && !uni.includes(evUniversity(ev)))                        return false;
    if (cat.length   && !cat.includes(evCategory(ev)))                          return false;
    if (field.length && !field.includes(evField(ev)))                           return false;
    if (date.length  && !date.includes(evStartDateTime(ev).split('T')[0]))      return false;
    return true;
  });
  renderResults(filtered);
  updateFilterStatus();
}

function onClear() {
  ["university","category","field","date"].forEach(fieldId => {
    chipSelections[fieldId] = new Set();
    const group = document.querySelector(`.chip-group[data-field="${fieldId}"]`);
    if (group) group.querySelectorAll(".chip-btn").forEach(b => b.classList.remove("active"));
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
  return ["university","category","field","date"].some(id => {
    const sel = chipSelections[id];
    return sel && sel.size > 0;
  });
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

// 削除取り消し用一時セット（ページ遷移までは見た目だけ残す）
const pendingRemoveFavs = new Set();

function renderFavoritesTable() {
  const tbody = document.getElementById("favorites-table-body");
  if (!tbody) return;
  tbody.innerHTML = "";
  const favs = loadFavoritesArray();

  // 表示対象: 確定済み + pending（グレー表示）
  const displayIds = [...new Set([...favs, ...pendingRemoveFavs])];

  if (displayIds.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="muted" style="padding:16px;text-align:center;">お気に入りはまだありません。</td></tr>';
    return;
  }
  const weekdays = ["日","月","火","水","木","金","土"];
  const all = getAllEvents();

  displayIds
    .map(id => all.find(x => x.id === id))
    .filter(Boolean)
    .sort((a,b) => {
      const as = evStartDateTime(a), bs = evStartDateTime(b);
      if (!as && !bs) return 0; if (!as) return 1; if (!bs) return -1;
      return new Date(as) - new Date(bs);
    })
    .forEach(ev => {
      const isPending = pendingRemoveFavs.has(ev.id);
      const s   = evStartDateTime(ev);
      const e   = evEndDateTime(ev);
      let dateLabel = "—", timeLabel = "—";
      if (s) {
        try {
          const ds = new Date(s);
          dateLabel = `${ds.getMonth()+1}/${ds.getDate()}（${weekdays[ds.getDay()]}）`;
          const sh = String(ds.getHours()).padStart(2,'0');
          const sm = String(ds.getMinutes()).padStart(2,'0');
          timeLabel = `${sh}:${sm}`;
          if (e) {
            const de = new Date(e);
            timeLabel += `～${String(de.getHours()).padStart(2,'0')}:${String(de.getMinutes()).padStart(2,'0')}`;
          }
        } catch(err){}
      }
      const tr = document.createElement("tr");
      if (isPending) tr.style.opacity = "0.4";
      tr.innerHTML = `
        <td class="fav-table-date">${escapeHtml(dateLabel)}</td>
        <td class="fav-table-time" style="white-space:nowrap;">${escapeHtml(timeLabel)}</td>
        <td class="fav-table-name">
          <a href="events_detail.html?id=${ev.id}" class="fav-table-link">${escapeHtml(evTitle(ev))}</a>
          <div class="fav-table-uni">${escapeHtml(evUniversity(ev))}</div>
        </td>
        <td><button class="fav-btn fav-table-remove ${isPending ? "" : "active"}" type="button" aria-label="解除" style="position:static;">⭐</button></td>
      `;
      tr.querySelector(".fav-table-remove").addEventListener("click", () => {
        if (isPending) {
          // 取り消し: pending から外して再登録
          pendingRemoveFavs.delete(ev.id);
          const favs2 = loadFavoritesArray();
          if (!favs2.includes(ev.id)) { favs2.unshift(ev.id); saveFavoritesArray(favs2); }
        } else {
          // 削除: pendingに入れてlocalStorageからは即削除、見た目だけ残す
          pendingRemoveFavs.add(ev.id);
          const favs2 = loadFavoritesArray().filter(x => x !== ev.id);
          saveFavoritesArray(favs2);
        }
        renderFavoritesTable();
        renderHistory();
        if (checkIfFiltersApplied()) onSearch();
        else renderResults(getAllEvents());
      });
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
// モーダル開閉ヘルパー（背面スクロール防止）
function openModal(el)  { el?.classList.remove("hidden"); document.body.classList.add("modal-open"); }
function closeModal(el) { el?.classList.add("hidden");    document.body.classList.remove("modal-open"); }

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
    { value: "2025-11-04", label: "11/4(火)" },
  ];
  buildChipGroup("date", dateOptions);
}

// ============================
// 🏫 教室案内データ（data/rooms.jsonから読み込み）
// ============================
let roomGuideData = {};

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
// ❓ ページ説明ボタン
// ============================
// ▼▼▼ 各ページの説明文を編集する場所 ▼▼▼
const PAGE_HELP_TEXT = {
  "search": {
    title: "🔍 企画を探す",
    text: `本サイトは、複数の学祭で出展する各ブースについて、来場者の皆様に魅力を事前により知っていただき、学祭を楽しんでもらうことを目標に作成しました。

メインのコンテンツは、最初に表示されている「企画を探す」機能です！こちらでは、大学やカテゴリ等を絞って検索できるほか、何も指定せず検索すると企画を一覧で見ることができます！

ここでは文字情報のみですが、下のメニューバーから「ストーリー」を選択すると、各企画担当者による説明を流し見できるようになっています！

また、検索条件については「？」ボタンから説明を確認できます。

制作：iTLFest.2026実行委員会・C3`
  },
  "favorites": {
    title: "⭐ お気に入り",
    text: `こちらはお気に入り登録した企画を一覧で表示する画面です！日付・時間順に表示されるようになっています。誤ってお気に入りから削除してしまった企画も「履歴」から再登録できます。また、横のゴミ箱マークから履歴を削除することもできます。`
  },
  "room-guide": {
    title: "🏫 教室案内",
    text: `こちらは教室を案内する画面です！協力いただけるキャンパスや教室の情報が定まり次第追加します。また、最終的にはフロアマップとともに表示する予定です。`
  },
  "story": {
    title: "📹 ストーリー",
    text: `こちらは企画概要を担当者が楽しく説明してくれる画面です。後々ここにコンテンツが追加され、Youtubeのショート動画のように流して一気見できるコンテンツにする予定です。`
  },
  "map": {
    title: "🗺️ キャンパスマップ",
    text: `こちらは当サイトを開発したiTLFest.実行委員会とC3の本拠地、中央大学市谷田町キャンパスの周辺の魅力をまとめた地図を見られる画面です。

東京シティガイド検定と呼ばれる、都のガイド検定資格を持つメンバーがすべて自ら選定した魅力のスポットたちを是非ご覧ください。`
  },
  "info": {
    title: "ℹ️ 情報",
    text: `こちらは情報ページです。協力いただいた大学・キャンパスの公式サイト・SNSを一覧で表示しています。当サイトに関して、及びiTLFest.2026に関してお問い合わせがありましたらInstagram, X, 公式LINE等からお願いいたします。`
  }
};

function setupPageHelp() {
  const modal    = document.getElementById("pageHelpModal");
  const titleEl  = document.getElementById("pageHelpTitle");
  const textEl   = document.getElementById("pageHelpText");

  document.querySelectorAll(".page-help-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const page = btn.dataset.page;
      const data = PAGE_HELP_TEXT[page];
      if (!data) return;
      if (titleEl) titleEl.textContent = data.title;
      if (textEl)  textEl.innerHTML = data.text.split("\n").map(line =>
        line.trim() === "" ? "<br>" : `<p style="margin:0 0 0.8em;">${escapeHtml(line)}</p>`
      ).join("");
      modal?.classList.remove("hidden");
    });
  });

  document.getElementById("pageHelpClose")?.addEventListener("click", () => modal?.classList.add("hidden"));
  document.getElementById("pageHelpOk")?.addEventListener("click",    () => modal?.classList.add("hidden"));
}

// ============================
// 🌙 ダークモード
// ============================
function setupDarkmode() {
  const toggle = document.getElementById("darkmodeToggle");
  if (!toggle) return;
  const saved = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const isDark = saved ? saved === "dark" : prefersDark;
  applyTheme(isDark);

  toggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") === "dark";
    applyTheme(!current);
    localStorage.setItem("theme", !current ? "dark" : "light");
  });
}

function applyTheme(dark) {
  document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
  const toggle = document.getElementById("darkmodeToggle");
  if (toggle) toggle.classList.toggle("on", dark);
}

// ============================
// 💡 機能提案チャット（AIによる匿名整理）
// ============================
function setupFeedbackBtn() {
  const btn   = document.getElementById("feedbackFloatBtn");
  const modal = document.getElementById("feedbackFloatModal");
  const closeBtn = document.getElementById("feedbackFloatClose");
  const input = document.getElementById("feedbackInput");
  const sendBtn = document.getElementById("feedbackSendBtn");
  const log   = document.getElementById("feedbackChatLog");
  if (!btn || !modal) return;

  let chatHistory = [];
  let opened = false;

  btn.addEventListener("click", () => {
    modal.classList.remove("hidden");
    if (!opened) {
      opened = true;
      addBubble("ai", "こんにちは！提案したい機能や廃止してほしい機能を教えてください。どんな小さなことでも大丈夫です😊");
    }
    setTimeout(() => input.focus(), 100);
  });

  closeBtn.addEventListener("click", () => modal.classList.add("hidden"));
  modal.addEventListener("click", e => { if (e.target === modal) modal.classList.add("hidden"); });

  sendBtn.addEventListener("click", doSend);
  input.addEventListener("keydown", e => { if (e.key === "Enter" && !e.isComposing) doSend(); });

  async function doSend() {
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    addBubble("user", text);
    sendBtn.disabled = true;
    input.disabled = true;
    addBubble("ai", "...", "thinking");

    chatHistory.push({ role: "user", content: text });

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `あなたは学祭イベント検索サイトの機能改善チャットボットです。
ユーザーから機能の提案・廃止要望を匿名で受け付けています。
以下のルールに従ってください：
- ユーザーの意見を丁寧に聞き、内容を整理・確認してください
- 個人情報は一切聞かないでください
- 会話は日本語で、フレンドリーかつ簡潔に
- 提案内容が具体的になったら「ご意見を開発チームに届けます！」と伝えてください
- 返答は3文以内にしてください`,
          messages: chatHistory
        })
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "ありがとうございます！ご意見を受け付けました。";
      removeBubble("thinking");
      addBubble("ai", reply);
      chatHistory.push({ role: "assistant", content: reply });
    } catch(e) {
      removeBubble("thinking");
      addBubble("ai", "送信中にエラーが発生しました。公式LINEからご連絡ください：https://lin.ee/rrxrnLv");
    }

    sendBtn.disabled = false;
    input.disabled = false;
    input.focus();
  }

  function addBubble(role, text, id) {
    const wrap = document.createElement("div");
    wrap.style.cssText = `display:flex;justify-content:${role==="user"?"flex-end":"flex-start"};`;
    if (id) wrap.dataset.bubbleId = id;
    const bubble = document.createElement("div");
    bubble.style.cssText = `
      max-width:80%;padding:10px 14px;border-radius:${role==="user"?"18px 18px 4px 18px":"18px 18px 18px 4px"};
      font-size:0.88rem;line-height:1.6;white-space:pre-wrap;
      background:${role==="user"?"linear-gradient(135deg,#667eea,#764ba2)":"#f1f5f9"};
      color:${role==="user"?"#fff":"#374151"};
    `;
    bubble.textContent = text;
    wrap.appendChild(bubble);
    log.appendChild(wrap);
    log.scrollTop = log.scrollHeight;
  }

  function removeBubble(id) {
    log.querySelector(`[data-bubble-id="${id}"]`)?.remove();
  }
}

// ============================
// 📋 更新履歴
// ============================
function setupChangelog() {
  const area = document.getElementById("changelog-area");
  if (!area || !changelogData.length) return;

  // 新しい順に並べる
  const sorted = [...changelogData].reverse();
  const latest = sorted[0];

  // 最新バージョン番号バッジ
  const versionBadge = `
    <div class="changelog-version-badge">
      <span class="changelog-version-num">v${escapeHtml(latest.version)}</span>
      <span class="changelog-version-date">${escapeHtml(latest.date)}</span>
    </div>
  `;

  // 最新5件のchangeをリスト化（バージョンをまたいでもOK）
  const recentItems = [];
  for (const entry of sorted) {
    for (const change of entry.changes) {
      recentItems.push({ version: entry.version, date: entry.date, text: change });
      if (recentItems.length >= 5) break;
    }
    if (recentItems.length >= 5) break;
  }

  const recentHtml = recentItems.map(item =>
    `<li class="changelog-item">${escapeHtml(item.text)}</li>`
  ).join("");

  area.innerHTML = `
    ${versionBadge}
    <ul class="changelog-list">${recentHtml}</ul>
    <button class="changelog-more-btn" id="changelogMoreBtn">View More</button>
  `;

  // View More → 全件モーダル
  document.getElementById("changelogMoreBtn")?.addEventListener("click", () => {
    const allEl = document.getElementById("changelog-all");
    if (allEl) {
      allEl.innerHTML = sorted.map(entry => `
        <div class="changelog-entry">
          <div class="changelog-entry-header">
            <span class="changelog-version-num">v${escapeHtml(entry.version)}</span>
            <span class="changelog-version-date">${escapeHtml(entry.date)}</span>
          </div>
          <ul class="changelog-list">
            ${entry.changes.map(c => `<li class="changelog-item">${escapeHtml(c)}</li>`).join("")}
          </ul>
        </div>
      `).join("");
    }
    document.getElementById("changelogModal")?.classList.remove("hidden");
  });

  document.getElementById("changelogClose")?.addEventListener("click", () =>
    document.getElementById("changelogModal")?.classList.add("hidden"));
  document.getElementById("changelogOk")?.addEventListener("click", () =>
    document.getElementById("changelogModal")?.classList.add("hidden"));
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
