// ==========================================
// 学園祭ナビ 制御スクリプト
// ==========================================

let allEvents = [];
let allFestivals = [];

document.addEventListener('DOMContentLoaded', () => {
    // 1. データの読み込み
    Promise.all([
        fetch('events.json').then(res => res.json()),
        fetch('festivals.json').then(res => res.json())
    ]).then(([events, festivals]) => {
        allEvents = events;
        allFestivals = festivals;
        initApp();
    }).catch(err => console.error("データ読み込み失敗:", err));

    // 2. タブ切り替えの設定
    const navBtns = document.querySelectorAll('.nav-btn');
    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.getAttribute('data-view');
            switchView(view);
            
            // ボタンの活性化
            navBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
});

// アプリの初期化（プルダウン生成など）
function initApp() {
    const uniSelect = document.getElementById('university');
    // 重複を除去して大学リストを作成
    const universities = [...new Set(allEvents.map(e => e.university))];
    universities.forEach(uni => {
        const opt = document.createElement('option');
        opt.value = uni;
        opt.textContent = uni;
        uniSelect.appendChild(opt);
    });

    // 検索ボタン
    document.getElementById('searchBtn').addEventListener('click', executeSearch);
    
    // タグの生成（改善点：検索をタグに）
    const tags = ["体験", "展示", "飲食", "ステージ"];
    const tagContainer = document.getElementById('tag-container');
    tags.forEach(tag => {
        const btn = document.createElement('button');
        btn.className = 'tag-btn';
        btn.textContent = tag;
        btn.onclick = () => {
            btn.classList.toggle('active');
            executeSearch(); // タップ即検索
        };
        tagContainer.appendChild(btn);
    });

    // 初期表示
    executeSearch();
}

// 画面切り替え
function switchView(viewId) {
    const sections = ['search-area', 'results-area', 'favorites-area', 'transit-area', 'map-area'];
    sections.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });

    if (viewId === 'search') {
        document.getElementById('search-area').classList.remove('hidden');
        document.getElementById('results-area').classList.remove('hidden');
    } else {
        document.getElementById(`${viewId}-area`).classList.remove('hidden');
    }
}

// 検索実行
function executeSearch() {
    const uni = document.getElementById('university').value;
    const activeTags = Array.from(document.querySelectorAll('.tag-btn.active')).map(b => b.textContent);
    
    const filtered = allEvents.filter(ev => {
        const matchUni = !uni || ev.university === uni;
        const matchTag = activeTags.length === 0 || activeTags.includes(ev.category);
        return matchUni && matchTag;
    });

    displayResults(filtered);
}

// 結果表示
function displayResults(events) {
    const container = document.getElementById('results');
    container.innerHTML = '';

    if (events.length === 0) {
        container.innerHTML = '<p class="muted">該当する企画が見つかりませんでした。</p>';
        return;
    }

    events.forEach(ev => {
        const card = document.createElement('div');
        card.className = 'result-card';
        card.innerHTML = `
            <h4>${ev.title}</h4>
            <p class="muted">${ev.university} / ${ev.place}</p>
            <p class="event-summary">${ev.description || '詳細準備中'}</p>
            <div class="card-meta">📅 ${ev.date}</div>
        `;
        container.appendChild(card);
    });
}
