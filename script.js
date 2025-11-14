/* ===================================================
   完全版スクリプト
   - 起動時に一度だけ扉を開く (B1)
   - 服の追加、削除、localStorage 保存
   - トップス・ボトムスの分離、円形スライダー更新
   - タップで選んでコーデ表示
   =================================================== */

const STORAGE_KEY = "my_closet_items_v3";

/* データモデル（簡易） */
let items = []; // {id, image, category, season, material, kind}  kind: "top"|"bottom"

/* DOM */
const closet = document.getElementById("closet");
const addBtn = document.getElementById("addBtn");
const imageInput = document.getElementById("imageInput");
const categoryEl = document.getElementById("category");
const seasonEl = document.getElementById("season");
const materialEl = document.getElementById("material");
const listEl = document.getElementById("list");
const topCarousel = document.getElementById("top-carousel");
const bottomCarousel = document.getElementById("bottom-carousel");
const selectedTopEl = document.getElementById("selected-top");
const selectedBottomEl = document.getElementById("selected-bottom");

/* 起動時ロード */
window.addEventListener("load", () => {
  loadItems();
  // 扉を「起動時に一度だけ」開く演出
  setTimeout(() => {
    closet.classList.add("open");
  }, 360); // 少しの遅延で雰囲気を出す
});

/* 追加ボタン */
addBtn.addEventListener("click", handleAdd);

/* 追加処理 */
function handleAdd() {
  if (!imageInput.files || !imageInput.files[0]) {
    alert("写真を選んでください！");
    return;
  }

  const file = imageInput.files[0];
  const reader = new FileReader();
  reader.onload = (ev) => {
    const dataUrl = ev.target.result;
    const id = generateId();
    const category = categoryEl.value;
    const season = seasonEl.value;
    const material = materialEl.value;

    // ユーザー操作でトップ/ボトムを分けたい場合はここで分けられるようにする。
    // 今は「仕事/遊び をトップス、それ以外をボトムス」にしているが、
    // 必要なら UI に kind 選択を追加できます。
    const kind = (category === "仕事" || category === "遊び") ? "top" : "bottom";

    const item = { id, image: dataUrl, category, season, material, kind, createdAt: Date.now() };
    items.unshift(item);
    saveItems();
    renderAll();
    // フォームリセット（画像のみ）
    imageInput.value = "";
  };
  reader.readAsDataURL(file);
}

/* 生成ID */
function generateId() {
  return "i_" + Math.random().toString(36).slice(2, 9);
}

/* 保存・読み込み */
function saveItems() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn("Storage error", e);
  }
}
function loadItems() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) items = JSON.parse(raw);
    else items = [];
  } catch (e) {
    items = [];
  }
  renderAll();
}

/* 描画まとめ */
function renderAll() {
  renderList();
  renderCarousel("top");
  renderCarousel("bottom");
}

/* 一覧表示（inside closet) */
function renderList() {
  listEl.innerHTML = "";
  items.forEach((it) => {
    const row = document.createElement("div");
    row.className = "item";
    row.dataset.id = it.id;

    row.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px">
        <img src="${it.image}" alt="">
        <div style="min-width:120px">
          <div style="font-weight:700;color:#ffd8ff">${it.category}</div>
          <div style="font-size:13px;color:var(--muted)">${it.season} / ${it.material}</div>
        </div>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <button class="delete-btn" title="削除">🗑️</button>
      </div>
    `;

    // 削除
    row.querySelector(".delete-btn").addEventListener("click", () => {
      if (!confirm("この服を削除しますか？")) return;
      items = items.filter(x => x.id !== it.id);
      saveItems();
      renderAll();
    });

    listEl.appendChild(row);
  });
}

/* カルーセル描画(top or bottom) */
function renderCarousel(type) {
  const target = type === "top" ? topCarousel : bottomCarousel;
  target.innerHTML = "";
  // collect items of that kind
  const data = items.filter(x => x.kind === (type === "top" ? "top" : "bottom"));
  data.forEach((it) => {
    const cell = document.createElement("div");
    cell.className = "carousel-item";
    cell.innerHTML = `<img src="${it.image}" alt=""><div style="font-size:12px;color:var(--muted);margin-top:6px">${it.category}</div>`;

    cell.addEventListener("click", () => {
      selectClothes(type, it.id);
    });

    target.appendChild(cell);
  });
}

/* 服を選択してコーデ領域に反映 */
function selectClothes(type, id) {
  const it = items.find(x => x.id === id);
  if (!it) return;
  if (type === "top") {
    selectedTopEl.innerHTML = `<img src="${it.image}" alt=""><div style="font-size:13px;color:var(--muted);margin-top:6px">${it.category}</div>`;
  } else {
    selectedBottomEl.innerHTML = `<img src="${it.image}" alt=""><div style="font-size:13px;color:var(--muted);margin-top:6px">${it.category}</div>`;
  }
}

/* ユーティリティ：アイテムが空ならヒントを表示（初回時） */
(function showInitialHints(){
  if (!localStorage.getItem(STORAGE_KEY)) {
    // 初回は中のテキストをやわらかく表示（すでにCSSで見える）
    selectedTopEl.innerText = "トップスを追加してみよう";
    selectedBottomEl.innerText = "ボトムスを追加してみよう";
  }
})();
