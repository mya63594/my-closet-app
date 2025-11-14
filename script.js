// クローゼット開閉アニメ
window.onload = () => {
    setTimeout(() => {
        document.getElementById("closet").classList.add("open");
    }, 300);
};

let items = JSON.parse(localStorage.getItem("closetItems") || "[]");

const addButton = document.getElementById("addButton");
const addForm = document.getElementById("addForm");
const saveButton = document.getElementById("saveButton");
const cancelButton = document.getElementById("cancelButton");
const itemsDiv = document.getElementById("items");

// アプリ開始時に表示
renderItems();

addButton.onclick = () => {
    addForm.classList.remove("hidden");
};

cancelButton.onclick = () => {
    addForm.classList.add("hidden");
};

// 保存
saveButton.onclick = () => {
    const scene = document.getElementById("scene").value;
    const season = document.getElementById("season").value;
    const material = document.getElementById("material").value;
    const photo = document.getElementById("photo").files[0];

    if (!photo) {
        alert("写真を選んでね！");
        return;
    }

    const reader = new FileReader();
    reader.onload = () => {
        items.push({
            scene,
            season,
            material,
            image: reader.result,
        });

        localStorage.setItem("closetItems", JSON.stringify(items));
        renderItems();
        addForm.classList.add("hidden");
    };

    reader.readAsDataURL(photo);
};

// 一覧表示
function renderItems() {
    itemsDiv.innerHTML = "";
    items.forEach(item => {
        const img = document.createElement("img");
        img.src = item.image;
        itemsDiv.appendChild(img);
    });
}
