//----------------------------------------------------
// 収納データ
//----------------------------------------------------
let items = JSON.parse(localStorage.getItem("closetItems") || "[]");

//----------------------------------------------------
// 要素取得
//----------------------------------------------------
const imageInput = document.getElementById("imageInput");
const category = document.getElementById("category");
const season = document.getElementById("season");
const material = document.getElementById("material");
const kind = document.getElementById("kind");

const addBtn = document.getElementById("addBtn");

const topRing = document.getElementById("top-ring");
const bottomRing = document.getElementById("bottom-ring");

const listEl = document.getElementById("list");
const closet = document.getElementById("closet");

const selectedTop = document.getElementById("selected-top");
const selectedBottom = document.getElementById("selected-bottom");

// 現在選ばれているコーデ
let selectedTopItem = null;
let selectedBottomItem = null;

//----------------------------------------------------
// 扉開閉（ロード時に開く演出）
//----------------------------------------------------
window.addEventListener("load", () => {
  setTimeout(() => {
    closet.classList.add("open");
  }, 300);
});

//----------------------------------------------------
// アイテム追加
//----------------------------------------------------
addBtn.addEventListener("click", () => {
  const file = imageInput.files[0];
  if (!file) {
    alert("写真を選んでね！");
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    let itemKind = kind.value;

    // 種類 自動判定
    if (itemKind === "infer") {
      itemKind =
        category.value === "仕事" || category.value === "遊び"
          ? "top"
          : "bottom";
    }

    const newItem = {
      id: Date.now(),
      img: reader.result,
      category: category.value,
      season: season.value,
      material: material.value,
      kind: itemKind,
    };

    items.push(newItem);
    localStorage.setItem("closetItems", JSON.stringify(items));

    renderAll();
    imageInput.value = "";
  };

  reader.readAsDataURL(file);
});

//----------------------------------------------------
// レンダリング
//----------------------------------------------------
function renderAll() {
  renderRing(topRing, items.filter((i) => i.kind === "top"));
  renderRing(bottomRing, items.filter((i) => i.kind === "bottom"));
  renderList();
}

//----------------------------------------------------
// リング表示
//----------------------------------------------------
function renderRing(ringEl, data) {
  ringEl.innerHTML = "";
  const total = data.length;

  data.forEach((item, idx) => {
    const angle = (360 / total) * idx;

    const itemEl = document.createElement("div");
    itemEl.className = "ring-item";
    itemEl.style.transform = `translate(-50%, -50%) rotate(${angle}deg) translate(0, -160px)`;

    itemEl.innerHTML = `
      <img src="${item.img}">
      <div class="cap">${item.category}</div>
    `;

    // クリックで選択
    itemEl.addEventListener("click", () => {
      if (item.kind === "top") {
        selectedTopItem = item;
        selectedTop.innerHTML = `<img src="${item.img}">`;
      } else {
        selectedBottomItem = item;
        selectedBottom.innerHTML = `<img src="${item.img}">`;
      }
    });

    ringEl.appendChild(itemEl);
  });
}

//----------------------------------------------------
// 管理リスト
//----------------------------------------------------
function renderList() {
  listEl.innerHTML = "";

  items.forEach((item) => {
    const row = document.createElement("div");
    row.style = `
      display:flex;
      gap:10px;
      align-items:center;
      background:#0f0c12;
      padding:8px;
      border-radius:8px;
      border:1px solid rgba(255,255,255,0.04);
    `;

    row.innerHTML = `
      <img src="${item.img}" style="width:40px;height:40px;border-radius:6px;object-fit:cover;">
      <div style="flex:1;font-size:13px;color:#cfaeff">
        ${item.category} / ${item.season} / ${item.material} / ${item.kind}
      </div>
      <button data-id="${item.id}" style="
        background:#ff6ad5;border:none;border-radius:6px;color:#000;padding:6px 10px;cursor:pointer;
      ">削除</button>
    `;

    // 削除
    row.querySelector("button").onclick = () => {
      items = items.filter((x) => x.id !== item.id);
      localStorage.setItem("closetItems", JSON.stringify(items));
      renderAll();
    };

    listEl.appendChild(row);
  });
}

//----------------------------------------------------
// リングのスワイプ（ドラッグ回転）
//----------------------------------------------------
function enableRingDrag(ringEl) {
  let isDragging = false;
  let startY = 0;
  let rotation = parseFloat(ringEl.dataset.rotation || "0");

  ringEl.addEventListener("mousedown", (e) => {
    isDragging = true;
    startY = e.clientY;
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;

    let delta = e.clientY - startY;
    startY = e.clientY;

    rotation += delta * 0.4;
    ringEl.style.transform = `translate(-50%, -50%) rotate(${rotation}deg)`;
    ringEl.dataset.rotation = rotation;
  });
}

enableRingDrag(topRing);
enableRingDrag(bottomRing);

//----------------------------------------------------
// 初期描画
//----------------------------------------------------
renderAll();
