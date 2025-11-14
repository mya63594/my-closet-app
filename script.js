function addItem() {
    const imageInput = document.getElementById("imageInput");
    const category = document.getElementById("category").value;
    const season = document.getElementById("season").value;
    const material = document.getElementById("material").value;

    if (!imageInput.files[0]) {
        alert("写真を選んでね！");
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        const imgSrc = e.target.result;

        const list = document.getElementById("list");
        const item = document.createElement("div");
        item.className = "item";

        item.innerHTML = `
            <img src="${imgSrc}">
            <div>${category} / ${season} / ${material}</div>
            <button class="delete-btn">🗑️</button>
        `;

        // 💜削除ボタン → アイテムを消す
        item.querySelector(".delete-btn").addEventListener("click", () => {
            item.remove();
        });

        list.appendChild(item);
    };

    reader.readAsDataURL(imageInput.files[0]);
}
