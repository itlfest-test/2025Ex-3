// ==========================================
// script.js - 受験生応援ナビ・スリム統合版
// ==========================================

// --- 設定・キー
const FAVORITES_KEY = "favorites";
const HISTORY_KEY = "favorite_history";

// --- グローバルデータ
let eventsData = [];
let commonData = null; // links.jsonの内容を保持

// ==========================================
// 📥 データ読み込み（最小限の通信に整理）
// ==========================================
async function loadAllData() {
  try {
    // 既存のevents.jsonと、新しく整理したlinks.jsonを読み込み
    const [events, links] = await Promise.all([
      fetch('data/events.json').then(r => r.json()),
      fetch('data/links.json').then(r => r.json())
    ]);

    eventsData = events;
    commonData = links;

    // 初期表示の組み立て
    renderTagFilters();
    renderScheduleTable();
    renderUniversityOptions();
    
    return true;
  } catch (error) {
    console.error('データ読み込みエラー:', error);
    return false;
  }
}

// ==========================================
// 🛠️ UI生成（指示に基づいた整理）
// ==========================================

// 1. タグ検索ボタンを生成
function renderTagFilters() {
  const container = document.getElementById('tag-container');
  if (!container || !commonData.tags) return;

  container.innerHTML = commonData.tags.map(tag => `
    <button class="tag-btn" onclick="filterByTag('${tag}')">${tag}</button>
  `).join('');
}

// 2. カレンダー代わりの簡易スケジュール表を生成
function renderScheduleTable() {
  const tbody = document.getElementById('schedule-body');
  if (!tbody || !commonData.schedule) return;

  tbody.innerHTML = commonData.schedule.map(item => `
    <tr>
      <td class="time-col">${item.time}</td>
      <td class="event-col">
        <strong>${item.event}</strong>
        <span class="category-badge ${getCategoryClass(item.category)}">${item.category}</span>
      </td>
      <td class="place-col">${item.place}</td>
    </tr>
  `).join('');
}

// カテゴリごとに色を変えるためのクラス判定
function getCategoryClass(cat) {
  if (cat.includes("体験")) return "bg-pink";
  if (cat.includes("展示")) return "bg-blue";
  if (cat.includes("相談")) return "bg-green";
  return "bg-gray";
}

// 3. 大学選択肢の生成
function renderUniversityOptions() {
  const select = document.getElementById('university');
  if (!select) return;
  
  // 重複を除去して大学名をリストアップ
  const universities = [...new Set(eventsData.map(ev => ev.university || ev["大学"]))];
  universities.forEach(uni => {
    if(!uni) return;
    const opt = document.createElement('option');
    opt.value = opt.textContent = uni;
    select.appendChild(opt);
  });
}

// ==========================================
// 📱 メニュー・ナビゲーション制御
// ==========================================
function setupNavigation() {
  // 三本線メニューの開閉
  const menuBtn = document.getElementById('menu-toggle');
  if (menuBtn) {
    menuBtn.addEventListener('click', () => {
      document.body.classList.toggle('menu-open');
    });
  }

  // ボトムナビゲーションの切り替え（既存ロジックを簡略化）
  const navBtns = document.querySelectorAll('.nav-btn');
  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const view = btn.dataset.view;
      switchView(view);
      
      navBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

function switchView(viewId) {
  // 全エリアを隠す
  const sections = ['search-area', 'results-area', 'favorites-area', 'transit-area', 'map-area'];
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });

  // 選択されたエリアだけ表示
  if (viewId === 'search') {
    document.getElementById('search-area').classList.remove('hidden');
    document.getElementById('results-area').classList.remove('hidden');
  } else {
    const target = document.getElementById(`${viewId}-area`);
    if (target) target.classList.remove('hidden');
  }
}

// ==========================================
// 🚀 初期実行
// ==========================================
document.addEventListener("DOMContentLoaded", async () => {
  const loaded = await loadAllData();
  if (!loaded) return;

  setupNavigation();
  
  // 初回表示は全件表示
  renderResults(eventsData);
});

// ==========================================
// 🔍 検索・フィルタロジック（受験生・タグ対応版）
// ==========================================

// 1. タグをクリックした時の検索処理
function filterByTag(tagName) {
  // 全イベントからカテゴリ名が一致するものを抽出
  const filtered = eventsData.filter(ev => {
    const category = ev.category || ev["カテゴリ"] || "";
    return category.includes(tagName);
  });
  
  // タグの見た目を「選択中」にする
  const tags = document.querySelectorAll('.tag-btn');
  tags.forEach(t => {
    t.classList.toggle('active', t.textContent === tagName);
  });

  renderResults(filtered);
  
  // 検索結果までスクロール
  document.getElementById("results-area").scrollIntoView({ behavior: "smooth" });
}

// 2. セレクトボックス等での詳細検索
function onSearch() {
  const uni = document.getElementById("university")?.value || "";
  const date = document.getElementById("date-select")?.value || "";

  const filtered = eventsData.filter(ev => {
    const evUni = ev.university || ev["大学"] || "";
    const evDate = (ev.startDatetime || ev["start_datetime"] || "").split('T')[0];

    if (uni && evUni !== uni) return false;
    if (date && evDate !== date) return false;
    return true;
  });

  renderResults(filtered);
}

// 3. クリア処理
function onClear() {
  document.getElementById("university").value = "";
  document.getElementById("date-select").value = "";
  
  const tags = document.querySelectorAll('.tag-btn');
  tags.forEach(t => t.classList.remove('active'));

  renderResults(eventsData);
}

// ==========================================
// 📄 結果表示（時系列順・ストーリー形式）
// ==========================================
function renderResults(list) {
  const area = document.getElementById("results");
  if (!area) return;

  if (list.length === 0) {
    area.innerHTML = `<div class="muted">該当する企画が見つかりませんでした。</div>`;
    return;
  }

  // 受験生向けに「開催時間が早い順」に並び替える（ストーリー形式）
  const sortedList = list.sort((a, b) => {
    const timeA = a.startDatetime || a["start_datetime"] || "";
    const timeB = b.startDatetime || b["start_datetime"] || "";
    return timeA.localeCompare(timeB);
  });

  area.innerHTML = sortedList.map(ev => `
    <div class="event-card" onclick="openDetail('${ev.id || ev.name}')">
      <div class="event-time">${formatTime(ev.startDatetime || ev["start_datetime"])}〜</div>
      <div class="event-info">
        <span class="uni-badge">${ev.university || ev["大学"]}</span>
        <h3 class="event-name">${ev.name || ev["企画名"]}</h3>
        <p class="event-loc">📍 ${ev.location || ev["場所"]}</p>
      </div>
      <div class="event-tag-box">
        <span class="tag ${getCategoryClass(ev.category || ev["カテゴリ"])}">
          ${ev.category || ev["カテゴリ"] || "展示"}
        </span>
      </div>
    </div>
  `).join('');
}

// 時間を「10:30」のような形式に変換
function formatTime(dateStr) {
  if (!dateStr) return "--:--";
  const d = new Date(dateStr);
  return d.getHours().toString().padStart(2, '0') + ":" + 
         d.getMinutes().toString().padStart(2, '0');
}

// ==========================================
// 🚇 企画間ルート案内（ロジックの入れ物）
// ==========================================
function searchTransitRoute() {
  const from = document.getElementById('transit-departure').value;
  const to = document.getElementById('transit-arrival').value;
  const resultArea = document.getElementById('transit-result');

  if (!from || !to) {
    resultArea.innerHTML = "出発地と到着地を選んでください。";
    return;
  }

  // ここに将来的に「教室Aから教室Bへの行き方」のテキストを出す
  resultArea.innerHTML = `
    <div class="route-result">
      <p>🏃‍♂️ <strong>${from}</strong> から <strong>${to}</strong> へのルート</p>
      <ol>
        <li>建物を出て右に進みます。</li>
        <li>階段で2階へ上がってください。</li>
        <li>突き当たりが目的地です。</li>
      </ol>
      <p class="hint">※混雑時は係員の指示に従ってください。</p>
    </div>
  `;
}

// HTML特殊文字の無効化（セキュリティ用）
function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

// ==========================================
// ⭐ お気に入り・履歴管理（シンプル版）
// ==========================================

function loadFavoritesArray() {
  return JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]");
}

function saveFavoritesArray(arr) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(arr));
}

// お気に入りの切り替え
function toggleFavorite(evId) {
  let favs = loadFavoritesArray();
  if (favs.includes(evId)) {
    favs = favs.filter(id => id !== evId);
  } else {
    favs.unshift(evId);
  }
  saveFavoritesArray(favs);
  renderFavorites();
  
  // 履歴にも保存（簡易化）
  let history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  history = [evId, ...history.filter(id => id !== evId)].slice(0, 10);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  renderHistory();
}

// お気に入りリストを表示（カレンダーの代わりに時系列順に並べる）
function renderFavorites() {
  const list = document.getElementById("favorites-list");
  if (!list) return;

  const favs = loadFavoritesArray();
  if (favs.length === 0) {
    list.innerHTML = '<div class="muted">お気に入りはまだありません。受験生に人気の企画をチェックしてみましょう！</div>';
    return;
  }

  const all = eventsData;
  const favEvents = favs.map(id => all.find(x => (x.id || x.name) === id)).filter(Boolean);

  // 時間順にソート（ストーリー形式）
  favEvents.sort((a, b) => {
    const timeA = a.startDatetime || a["start_datetime"] || "";
    const timeB = b.startDatetime || b["start_datetime"] || "";
    return timeA.localeCompare(timeB);
  });

  list.innerHTML = favEvents.map(ev => `
    <div class="fav-item-row">
      <div class="fav-time">${formatTime(ev.startDatetime || ev["start_datetime"])}</div>
      <div class="fav-content">
        <strong>${ev.name || ev["企画名"]}</strong>
        <p>📍 ${ev.location || ev["場所"]}</p>
      </div>
      <button onclick="toggleFavorite('${ev.id || ev.name}')" class="btn-del">✕</button>
    </div>
  `).join('');
}

// 履歴の表示
function renderHistory() {
  const area = document.getElementById("fav-history");
  if (!area) return;

  const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  const all = eventsData;
  const historyEvents = history.map(id => all.find(x => (x.id || x.name) === id)).filter(Boolean);

  area.innerHTML = historyEvents.map(ev => `
    <div class="history-chip" onclick="openDetail('${ev.id || ev.name}')">
      ${ev.name || ev["企画名"]}
    </div>
  `).join('');
}

// ==========================================
// 📖 詳細画面への移動
// ==========================================
function openDetail(eventId) {
  // 19歳大学生・PR担当としてのこだわり：
  // 企画ごとに異なる地図を表示できるよう、IDをURLに載せて飛ばす
  window.location.href = `event_detail.html?id=${encodeURIComponent(eventId)}`;
}

// ==========================================
// 🗺️ 初期設定の呼び出し
// ==========================================
function initTransitPage() {
  const dep = document.getElementById('transit-departure');
  const arr = document.getElementById('transit-arrival');
  if (!dep || !arr) return;

  // 教室やエリアのリストを自動生成（events.jsonの場所データから）
  const locations = [...new Set(eventsData.map(ev => ev.location || ev["場所"]))].filter(Boolean);
  
  const options = locations.map(loc => `<option value="${loc}">${loc}</option>`).join('');
  dep.innerHTML = '<option value="">出発地を選択</option>' + options;
  arr.innerHTML = '<option value="">到着地を選択</option>' + options;
}

// ==========================================
// 📱 ナビゲーション・UI制御
// ==========================================

// 1. 初回訪問時の案内（シンプル版）
function setupIntroModal() {
  if (!localStorage.getItem("hideIntro")) {
    // 19歳大学生・PR担当として：まずは「楽しんでもらう」ための案内を表示
    const welcomeMsg = "学園祭ナビへようこそ！受験生向けに「体験・相談」企画をまとめています。";
    console.log(welcomeMsg);
    // 実際のプロジェクトではここでモーダルを表示（HTML側にIDが必要）
  }
}

// 2. セレクトボックスの選択肢更新
// events.jsonから動的に作成することで、options.jsonへの依存を減らします
function loadOptionsSafe() {
  const uniEl = document.getElementById("university");
  if (!uniEl) return;

  // 大学名の重複を排除してリスト化
  const unis = [...new Set(eventsData.map(ev => ev.university || ev["大学"]))].filter(Boolean);
  
  unis.forEach(u => {
    const op = document.createElement("option");
    op.value = u;
    op.textContent = u;
    uniEl.appendChild(op);
  });
}

// ==========================================
// 🚇 教室・ルート案内（鉄道データの代わりに導入）
// ==========================================

/**
 * 以前の膨大な鉄道運賃データは「links.json」などの外部データに逃がすか、
 * 今回の「学内ナビ」という目的に合わせ、教室移動の案内に特化させました。
 */
function searchTransitRoute() {
  const from = document.getElementById('transit-departure').value;
  const to = document.getElementById('transit-arrival').value;
  const resultArea = document.getElementById('transit-result');

  if (!from || !to) {
    resultArea.innerHTML = '<p class="error">出発地と到着地を選択してください。</p>';
    return;
  }

  // PR担当のアドバイス：
  // 慣れないキャンパスで迷わないよう、具体的な目印（自販機、掲示板など）を出す
  resultArea.innerHTML = `
    <div class="route-card">
      <div class="route-header">🚶‍♂️ <strong>${from}</strong> ➔ <strong>${to}</strong></div>
      <div class="route-body">
        <p>1. <strong>${from}</strong> を出て、廊下を右（食堂方面）に進みます。</p>
        <p>2. エレベーターホールを過ぎた先の階段を上がってください。</p>
        <p>3. <strong>${to}</strong> は、2階に上がってすぐ左側の部屋です。</p>
      </div>
      <p class="hint">💡 迷ったら、青いハッピを着た実行委員に声をかけてね！</p>
    </div>
  `;
}

// ==========================================
// 🛠️ 共通ツール
// ==========================================

// HTMLエスケープ（セキュリティ対策）
function escapeHtml(str) {
  if (!str && str !== 0) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// 時間の表示形式を整える (例: 2026-11-26T10:00 -> 10:00)
function formatTime(dateStr) {
  if (!dateStr) return "--:--";
  const d = new Date(dateStr);
  return d.getHours().toString().padStart(2, '0') + ":" + 
         d.getMinutes().toString().padStart(2, '0');
}

// ページ読み込み完了時に実行
document.addEventListener("DOMContentLoaded", () => {
  setupIntroModal();
  // 他の初期化処理はloadAllData()の完了後に行われます
});

// ==========================================
// 🚇 アクセス・学内ナビゲーション
// ==========================================

// 1. 目的地リスト（links.jsonに逃がすのもアリですが、ここにあると編集しやすいです）
const transitDestinations = [
  { name: "中央大学（市谷田町）", station: "市ヶ谷" },
  { name: "中央大学（後楽園）", station: "後楽園" },
  { name: "中央大学（茗荷谷）", station: "茗荷谷" },
  { name: "中央大学（多摩）", station: "中央大学・明星大学" },
  { name: "東京理科大（神楽坂）", station: "飯田橋" },
  { name: "法政大学（市ヶ谷）", station: "飯田橋" },
  { name: "上智大学（四谷）", station: "四ツ谷" },
  { name: "明治大学（和泉）", station: "明大前" },
  { name: "東京大学（駒場）", station: "駒場東大前" },
  { name: "早稲田大学（早稲田）", station: "早稲田" }
];

// 2. ナビゲーションの初期化
function initTransitPage() {
  const departureSelect = document.getElementById("transit-departure");
  const arrivalSelect = document.getElementById("transit-arrival");
  
  if (!departureSelect || !arrivalSelect) return;
  if (departureSelect.options.length > 1) return; // 重複防止

  transitDestinations.forEach(dest => {
    departureSelect.add(new Option(dest.name, dest.name));
    arrivalSelect.add(new Option(dest.name, dest.name));
  });
}

// 3. ルート案内（複雑なダイクストラ法を廃止し、学内案内に特化）
function searchTransitRoute() {
  const departure = document.getElementById("transit-departure")?.value;
  const arrival = document.getElementById("transit-arrival")?.value;
  const resultDiv = document.getElementById("transit-result");

  if (!departure || !arrival) {
    alert("出発地と目的地を選択してください");
    return;
  }

  // PR担当からのワンポイントアドバイス：
  // 鉄道の複雑な計算はGoogleマップに任せ、アプリ内では「キャンパス内の歩き方」を教える
  resultDiv.innerHTML = `
    <div class="route-display-card">
      <div class="route-header">
        <span class="badge-route">学内ガイド</span>
        <h4>${departure} から ${arrival} への最短ルート</h4>
      </div>
      <div class="route-timeline">
        <div class="checkpoint">📍 <strong>${departure}</strong> を出発</div>
        <div class="path-line"></div>
        <div class="checkpoint">🏃 <strong>1号館エントランス</strong> を右折してスロープへ</div>
        <div class="path-line"></div>
        <div class="checkpoint">🚩 <strong>${arrival}</strong> に到着！</div>
      </div>
      <p class="route-footer">※当日は混雑が予想されます。足元に注意して進んでね！</p>
      <button onclick="window.open('https://www.google.com/maps/search/${encodeURIComponent(arrival)}')" class="btn-external">
        外部マップで周辺を確認 ↗
      </button>
    </div>
  `;
}

// ==========================================
// 🚀 最終的な仕上げ
// ==========================================

// 初期ロード時に必要な関数を動かす
window.onload = () => {
  if (document.getElementById('transit-departure')) {
    initTransitPage();
  }
};
// ==========================================
// 🚅 ルート案内の補助ロジック
// ==========================================

// 路線名から会社カラーを返す（UIのアクセント用）
function getCompanyColor(line) {
  if (line.includes("東京メトロ")) return "#0078ba";
  if (line.includes("都営")) return "#009b3e";
  if (line.includes("JR")) return "#00b20d";
  if (line.includes("京王")) return "#dd0077";
  return "#666666";
}

// ==========================================
// 📅 スケジュール表示（カレンダーを簡略化）
// ==========================================

/**
 * 受験生は「カレンダー」よりも「1日の流れ（タイムライン）」が見たいはず！
 * お気に入り登録された企画を、当日回りやすいように時間順に表示します。
 */
function initCalendar() {
  const container = document.getElementById('calendar-grid');
  if (!container) return;

  const favs = loadFavoritesArray();
  if (favs.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <p>気になる企画の ⭐ボタン を押すと、<br>自分だけの「当日スケジュール」がここに作成されます！</p>
      </div>`;
    return;
  }

  // お気に入り企画を抽出してソート
  const favEvents = favs.map(id => eventsData.find(x => (x.id || x.name) === id)).filter(Boolean);
  favEvents.sort((a, b) => {
    const timeA = a.startDatetime || a["start_datetime"] || "";
    const timeB = b.startDatetime || b["start_datetime"] || "";
    return timeA.localeCompare(timeB);
  });

  // タイムライン形式で表示
  container.innerHTML = `
    <div class="timeline-wrapper">
      ${favEvents.map((ev, index) => `
        <div class="timeline-item">
          <div class="timeline-time">${formatTime(ev.startDatetime || ev["start_datetime"])}</div>
          <div class="timeline-marker"></div>
          <div class="timeline-card" onclick="openDetail('${ev.id || ev.name}')">
            <span class="uni-tag">${ev.university || ev["大学"]}</span>
            <h4>${ev.name || ev["企画名"]}</h4>
            <p>📍 ${ev.location || ev["場所"]}</p>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

// ==========================================
// 🛠️ ナビゲーションの最終接続
// ==========================================

// 既存のナビゲーション機能を拡張
const originalSetupNavigation = setupNavigation;
setupNavigation = function() {
  // 元々のボタン切り替え処理を呼び出し
  if (typeof originalSetupNavigation === 'function') {
    originalSetupNavigation();
  }
  
  // お気に入り（マイページ）が表示された時の追加アクション
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.dataset.view === 'favorites') {
        // 表示が切り替わるのを少し待ってから実行
        setTimeout(initCalendar, 50);
      }
    });
  });
};

// ==========================================
// 🏁 全体の初期化（実行コード）
// ==========================================
async function initializeApp() {
  // 全データを読み込んでから画面を構築
  const success = await loadAllData();
  if (success) {
    setupNavigation();
    loadOptionsSafe();
    // 最初に全企画を表示
    renderResults(eventsData);
  } else {
    console.error("アプリの初期化に失敗しました。JSONファイルを確認してください。");
  }
}

// 起動！
initializeApp();
