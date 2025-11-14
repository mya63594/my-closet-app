/* ===========================================================
  完全版スクリプト — 背景切り抜き + 2段の円形ハンガーレール + 開閉演出
  - 起動時に扉がゆっくり一度だけ開く
  - 画像追加 → 背景自動削除（Mediapipe）→ kindでtop/bottom指定
  - items は localStorage に保存
  - 各リングはドラッグで回転（スワイプで探す感覚）
  - クリックで選択してコーデ表示
  - ワイヤーハンガー（SVG）を画像上に重ね、スライドで服が揺れる
=========================================================== */

const STORAGE_KEY = "my_closet_circle_v2";

/* ---------- state ---------- */
let items = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

/* ---------- DOM refs ---------- */
const imageInput = document.getElementById("imageInput");
const categoryEl = document.getElementById("category");
const seasonEl = document.getElementById("season");
const materialEl = document.getElementById("material");
const kindEl = document.getElementById("kind");
const addBtn = document.getElementById("addBtn");

const topRing = document.getElementById("top-ring");
const bottomRing = document.getElementById("bottom-ring");
const listEl = document.getElementById("list");
const closet = document.getElementById("closet");
const selectedTop = document.getElementById("selected-top");
const selectedBottom = document.getElementById("selected-bottom");

/* ---------- Mediapipe Segmentation setup ---------- */
let selfieSegmentation = null;
let segmentationReady = false;

async function initSegmentation() {
  if (segmentationReady) return;
  if (typeof SelfieSegmentation === "undefined") {
    console.warn("Mediapipe SelfieSegmentation not loaded");
    return;
  }
  selfieSegmentation = new SelfieSegmentation({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`
  });
  selfieSegmentation.setOptions({ modelSelection: 1 }); // 高精度
  await selfieSegmentation.initialize();
  segmentationReady = true;
}

/* remove background: input imageDataURL => returns PNG dataURL with transparent bg */
async function removeBackgroundFromDataUrl(dataUrl) {
  await initSegmentation();
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = async () => {
      const w = img.width;
      const h = img.height;
      // offscreen canvases
      const maskCanvas = document.createElement("canvas");
      maskCanvas.width = w; maskCanvas.height = h;
      const maskCtx = maskCanvas.getContext("2d");

      const outCanvas = document.createElement("canvas");
      outCanvas.width = w; outCanvas.height = h;
      const outCtx = outCanvas.getContext("2d");

      selfieSegmentation.onResults((results) => {
        // results.segmentationMask is an Image-like mask
        maskCtx.clearRect(0,0,w,h);
        maskCtx.drawImage(results.segmentationMask, 0, 0, w, h);
        const maskData = maskCtx.getImageData(0,0,w,h).data;
        outCtx.clearRect(0,0,w,h);
        outCtx.drawImage(img, 0, 0, w, h);
        const imgData = outCtx.getImageData(0,0,w,h);
        const d = imgData.data;

        for (let i=0;i<d.length;i+=4){
          const alpha = maskData[i]; // 0..255
          if (alpha < 128) {
            d[i+3] = 0; // transparent
          } else {
            // keep original pixel (already there)
          }
        }
        outCtx.putImageData(imgData, 0, 0);
        resolve(outCanvas.toDataURL("image/png"));
      });

      selfieSegmentation.send({image: img});
    };
    img.src = dataUrl;
  });
}

/* ---------- utility ---------- */
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }
function genId(){ return "i_"+Math.random().toString(36).slice(2,9); }

/* ---------- startup: open doors slowly ---------- */
window.addEventListener("load", async () => {
  // initialize segmentation in background (so first use is faster)
  initSegmentation().catch(()=>{ /* non-fatal */ });

  // render saved
  renderAll();

  // open doors once, slowly
  setTimeout(()=>{ closet.classList.add("open"); }, 900);
});

/* ---------- add item (with bg removal) ---------- */
addBtn.addEventListener("click", async () => {
  if (!imageInput.files || !imageInput.files[0]) { alert("写真を選んでください"); return; }

  const file = imageInput.files[0];
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      // remove background (if segmentation available)
      let processedDataUrl;
      if (segmentationReady) {
        processedDataUrl = await removeBackgroundFromDataUrl(reader.result);
      } else {
        // fallback: use original if segmentation not ready
        processedDataUrl = reader.result;
      }

      let itemKind = kindEl.value;
      if (itemKind === "infer") {
        itemKind = (categoryEl.value === "仕事" || categoryEl.value === "遊び") ? "top" : "bottom";
      }

      const newItem = {
        id: genId(),
        img: processedDataUrl,
        category: categoryEl.value,
        season: seasonEl.value,
        material: materialEl.value,
        kind: itemKind,
        createdAt: Date.now()
      };

      items.unshift(newItem);
      saveState();
      renderAll();
      imageInput.value = "";
    } catch (err) {
      console.error("背景除去でエラー:", err);
      alert("背景処理に失敗しました。元画像を使います。");
      // fallback to raw
      const newItem = {
        id: genId(),
        img: reader.result,
        category: categoryEl.value,
        season: seasonEl.value,
        material: materialEl.value,
        kind: (kindEl.value === "infer") ? ((categoryEl.value==="仕事"||categoryEl.value==="遊び")?"top":"bottom") : kindEl.value,
        createdAt: Date.now()
      };
      items.unshift(newItem);
      saveState();
      renderAll();
      imageInput.value = "";
    }
  };
  reader.readAsDataURL(file);
});

/* ---------- render list & rings ---------- */
function renderAll(){
  renderList();
  renderRing(topRing, items.filter(i=>i.kind==="top"));
  renderRing(bottomRing, items.filter(i=>i.kind==="bottom"));
}

function renderList(){
  listEl.innerHTML = "";
  if (items.length===0) {
    listEl.innerHTML = `<div style="color:var(--muted);padding:10px">まだ服がありません。フォームで写真を追加してね。</div>`;
    selectedTop.innerText = "トップス: まだ選ばれていません";
    selectedBottom.innerText = "ボトムス: まだ選ばれていません";
    return;
  }

  items.forEach(it=>{
    const row = document.createElement("div");
    row.className = "item-row";
    row.style = "display:flex;gap:10px;align-items:center;background:#0f0c12;padding:8px;border-radius:8px;border:1px solid rgba(255,255,255,0.03);";
    row.innerHTML = `
      <img src="${it.img}" style="width:44px;height:44px;border-radius:6px;object-fit:cover;">
      <div style="flex:1;font-size:13px;color:#cfaeff">
        ${it.category} / ${it.season} / ${it.material} / ${it.kind}
      </div>
      <button data-id="${it.id}" style="background:#ff6ad5;border:none;border-radius:6px;color:#000;padding:6px 10px;cursor:pointer;">削除</button>
    `;
    row.querySelector("button").onclick = ()=>{
      if(!confirm("この服を削除しますか？")) return;
      items = items.filter(x=>x.id!==it.id);
      saveState();
      renderAll();
    };
    listEl.appendChild(row);
  });
}

/* ---------- hanger SVG (wire style) ---------- */
function hangerSVGString() {
  return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 32' width='46' height='24'>
    <path d='M32 2c-6 0-12 6-12 10 0 0-0.5 4 6 4s6-4 6-4c0-4-6-10-12-10' stroke='white' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'/>
  </svg>`;
}

/* ---------- render ring (positions items around circle) ---------- */
function renderRing(ringEl, data){
  ringEl.innerHTML = "";
  const n = data.length;
  if(n===0){
    const placeholder = document.createElement("div");
    placeholder.style.position="absolute";
    placeholder.style.left="50%";
    placeholder.style.top="50%";
    placeholder.style.transform="translate(-50%,-50%)";
    placeholder.style.color="var(--muted)";
    placeholder.style.fontSize="14px";
    placeholder.innerText = "アイテムがありません";
    ringEl.appendChild(placeholder);
    return;
  }

  // compute radius based on ringEl size
  const rect = ringEl.getBoundingClientRect();
  const radius = Math.min(rect.width, rect.height)/2 - 70; // margin
  data.forEach((it, idx)=>{
    const angle = (360 / n) * idx; // degrees
    const rad = angle * Math.PI/180;
    const x = Math.cos(rad) * radius;
    const y = Math.sin(rad) * radius * 0.55; // squash a bit
    const item = document.createElement("div");
    item.className = "ring-item";
    // base transform places it around center; rotation handled by ring rotation
    item.style.left = "50%";
    item.style.top = "50%";
    item.style.transform = `translate(${x}px, ${y}px) rotate(${angle}deg)`;

    // inner content: hanger SVG + cloth image + caption
    const hangerSvg = hangerSVGString();
    item.innerHTML = `
      <div class="hanger">${hangerSvg}</div>
      <img class="cloth" src="${it.img}">
      <div class="cap">${it.category}</div>
    `;

    // click selects item
    item.addEventListener("click", ()=>{
      if(it.kind==="top"){
        selectedTop.innerHTML = `<img src="${it.img}"><div style="font-size:13px;color:var(--muted);margin-top:6px">${it.category}</div>`;
      } else {
        selectedBottom.innerHTML = `<img src="${it.img}"><div style="font-size:13px;color:var(--muted);margin-top:6px">${it.category}</div>`;
      }
      // small pop/scale animation
      item.classList.add("swing");
      setTimeout(()=>item.classList.remove("swing"),450);
    });

    ringEl.appendChild(item);
  });
}

/* ---------- ring rotation (drag) with swing effect ---------- */
function setupRingDrag(ringEl){
  let isDown=false;
  let startX=0;
  let startRot = parseFloat(ringEl.dataset.rotation || "0");
  ringEl.dataset.rotation = startRot;

  const onDown = (e)=>{
    isDown = true;
    startX = (e.touches ? e.touches[0].clientX : e.clientX);
    startRot = parseFloat(ringEl.dataset.rotation) || 0;
    ringEl.style.transition = "none";
    e.preventDefault();
  };
  const onMove = (e)=>{
    if(!isDown) return;
    const x = (e.touches ? e.touches[0].clientX : e.clientX);
    const dx = x - startX;
    const deltaDeg = dx * 0.25; // sensitivity
    const newRot = startRot + deltaDeg;
    ringEl.dataset.rotation = newRot;
    ringEl.style.transform = `translate(-50%,-50%) rotate(${newRot}deg)`;

    // add swing to visible items for natural effect
    ringEl.querySelectorAll(".ring-item").forEach(it=>{
      it.classList.add("swing");
      setTimeout(()=>it.classList.remove("swing"),450);
    });
  };
  const onUp = (e)=>{
    if(!isDown) return;
    isDown=false;
    ringEl.style.transition = "transform .5s cubic-bezier(.2,.8,.2,1)";
    // no snap implemented (keeps free rotation)
  };

  ringEl.addEventListener("mousedown", onDown);
  window.addEventListener("mousemove", onMove);
  window.addEventListener("mouseup", onUp);
  ringEl.addEventListener("touchstart", onDown, {passive:false});
  window.addEventListener("touchmove", onMove, {passive:false});
  window.addEventListener("touchend", onUp);
}

/* attach drag handlers once */
setupRingDrag(topRing);
setupRingDrag(bottomRing);

/* ---------- re-render on resize to recalc radii ---------- */
window.addEventListener("resize", ()=>{ renderAll(); });

/* ---------- helper to render everything ---------- */
function renderAll(){
  renderList();
  renderRing(topRing, items.filter(i=>i.kind==="top"));
  renderRing(bottomRing, items.filter(i=>i.kind==="bottom"));
}
