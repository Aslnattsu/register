// script.js
let total = 0;
let history = JSON.parse(localStorage.getItem('regiHistory')) || [];

// デフォルトの商品リスト
const defaultProducts = [
    { id: 1, name: "アクセサリ", price: 500, color: "#007aff" },
    { id: 2, name: "小物", price: 800, color: "#34c759" },
    { id: 3, name: "Tシャツ", price: 1500, color: "#ff9500" }
];

// 1. 商品リスト
const products = [
    { name: "アクセサリ", price: 500, color: "#007aff" },
    { name: "小物", price: 800, color: "#34c759" },
    { name: "Tシャツ", price: 1500, color: "#ff9500" },
    { name: "バッグ", price: 3000, color: "#af52de" },
    { name: "特注品", price: 5000, color: "#ff3b30" }
];

// 現在の商品リスト（保存されていればそれを読み込む）
let currentProducts = JSON.parse(localStorage.getItem('my_products')) || defaultProducts;

window.addEventListener('DOMContentLoaded', () => {
    renderButtons();
    updateDisplay();
});

// ボタン生成時に「長押し」や「右クリック」で編集モードへ
function renderButtons() {
    const grid = document.getElementById('buttonGrid');
    grid.innerHTML = ""; // 再描画用に一旦空にする
    
    currentProducts.forEach(product => {
        const btn = document.createElement('button');
        btn.className = 'item-btn';
        btn.style.backgroundColor = product.color;
        btn.innerHTML = `${product.name}<br>¥${product.price.toLocaleString()}`;

        // 通常クリック：商品追加
        btn.onclick = () => addItem(product.name, product.price);

        // ★設定モード：右クリック（スマホなら長押し）で価格変更
        btn.oncontextmenu = (e) => {
            e.preventDefault(); // メニューが出るのを防ぐ
            editProduct(product.id);
        };

        grid.appendChild(btn); 
    });
}

// 商品編集（簡易版：プロンプトを使用）
function editProduct(id) {
    const product = currentProducts.find(p => p.id === id);
    if (!product) return;

    // C#のInputBox的な簡易入力
    const newName = prompt(`${product.name} の名前を変更しますか？`, product.name);
    const newPrice = prompt(`${product.name} の価格を入力してください`, product.price);

    if (newName && newPrice) {
        product.name = newName;
        product.price = parseInt(newPrice, 10);
        
        // 保存して再描画
        localStorage.setItem('my_products', JSON.stringify(currentProducts));
        renderButtons();
    }
}

// 起動時に保存データを復元
updateDisplay();

function addItem(name, price) {
    const item = { name, price, time: new Date().toLocaleTimeString() };
    history.push(item);
    saveAndRender();
}

function saveAndRender() {
    localStorage.setItem('regiHistory', JSON.stringify(history));
    updateDisplay();
}

function updateDisplay() {
    const listDiv = document.getElementById('historyList');
    // もしHTML側に historyList というIDがないとここでエラーになるので注意
    if (!listDiv) return; 

    listDiv.innerHTML = '<strong>販売履歴</strong>';
    
    total = 0;
    history.forEach((item, index) => {
        total += item.price;
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `<span>${item.time} ${item.name}</span><span>¥${item.price}</span>`;
        listDiv.prepend(div); 
    });
    
    const totalDisplay = document.getElementById('totalDisplay');
    if (totalDisplay) {
        totalDisplay.innerText = `合計: ¥${total.toLocaleString()}`;
    }
}

function clearData() {
    if(confirm('履歴を削除して合計をリセットしますか？')) {
        history = [];
        saveAndRender();
    }
}