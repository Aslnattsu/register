// script.js

let editingId = null;
let total = 0;
let history = JSON.parse(localStorage.getItem('regiHistory')) || [];

// デフォルトの商品リスト
const defaultProducts = [
    { id: 1, name: "食品A", price: 500, color: "#007aff" },
    { id: 2, name: "食品B", price: 800, color: "#34c759" },
    { id: 3, name: "日用品A", price: 1500, color: "#ff9500" }
];

// 現在の商品リスト（保存されていればそれを読み込む）
let currentProducts = JSON.parse(localStorage.getItem('my_products')) || defaultProducts;

window.addEventListener('DOMContentLoaded', () => {
    renderButtons();
    updateDisplay();
});

// ボタン生成
function renderButtons() {
    const grid = document.getElementById('buttonGrid');
    grid.innerHTML = ""; // 再描画用に一旦空にする
    
    // ★まず最初に「自由入力」ボタンを作る
    const calcBtn = document.createElement('button');
    calcBtn.className = 'item-btn';
    calcBtn.style.backgroundColor = "#5856d6"; // 目立つ紫など
    calcBtn.innerHTML = `自由入力<br>(電卓)`;
    calcBtn.onclick = openCalc; // 電卓を開く
    grid.appendChild(calcBtn);

    currentProducts.forEach(product => {
        const btn = document.createElement('button');
        btn.className = 'item-btn';
        btn.style.backgroundColor = product.color;
        btn.innerHTML = `${product.name}<br>¥${product.price.toLocaleString()}`;

        // 通常クリック：商品追加
        btn.onclick = () => addItem(product.name, product.price);

        // --- iPhone対応：長押しタイマーの実装 ---
        let longPressTimer;

        // 指が触れた時
        btn.ontouchstart = (e) => {
            longPressTimer = setTimeout(() => {
                // 0.5秒間押し続けたら編集モード起動
                editProduct(product.id);
            }, 500); 
        };

        // 指が離れた、または動いた（スクロールした）時はキャンセル
        btn.ontouchend = () => clearTimeout(longPressTimer);
        btn.ontouchmove = () => clearTimeout(longPressTimer);

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
    editingId = id; // どの商品を編集するか覚えておく
    const index = currentProducts.findIndex(p => p.id === id);
    const product = currentProducts[index]

    document.getElementById('editTitle').innerText = `「${product.name}」の操作`;
    
    // モーダルを表示（C#の modal.ShowDialog() 的な感じ）
    document.getElementById('editModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('editModal').style.display = 'none';
}
//編集
function openNameAndPriceEdit() {
    closeModal();
    const product = currentProducts.find(p => p.id === editingId);

    const newName = prompt(`${product.name} の名前を変更しますか？`, product.name);
    const newPrice = prompt(`${newName}の価格を入力してください`, product.price);

    if (newName && newPrice) {
        const checkPrice = parseInt(newPrice, 10);

        if (isNaN(checkPrice)) {
            alert("数値を入れてください");
            return;
        }
        product.name = newName;
        product.price = checkPrice;
        
        saveProducts();
        renderButtons();
    }
}
//削除
function deleteTargetProduct() {
    closeModal();
    const index = currentProducts.findIndex(p => p.id === editingId);
    const product = currentProducts[index];
    
    if (confirm(`${product.name} を削除してよろしいですか？`)) {
        currentProducts.splice(index, 1); // 配列から特定の要素を削除
        saveProducts();
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

// 新しい商品を追加する関数
function addNewProduct() {
    // 1. 入力を受け取る（C#の入力ダイアログ相当）
    const name = prompt("商品名を入力してください", "商品名称");
    if (!name) return; // キャンセルなら終了

    const priceStr = prompt(`${name} の価格を入力してください`, "1000");
    if (!priceStr) return;
    const price = parseInt(priceStr, 10);

    // 2. 新しい商品オブジェクトを作成
    const newProduct = {
        id: Date.now(), // 現在時刻を簡易的なIDにする
        name: name,
        price: price,
        color: "#8e8e93" // デフォルトはグレー（後で変えられるようにしても◎）
    };

    // 3. 配列に追加（C#の List.Add ）
    currentProducts.push(newProduct);

    // 4. localStorageに保存して画面を再描画
    saveProducts();
    renderButtons();
    
    alert(`${name} を追加しました！`);
}

// 商品リスト専用の保存関数（共通化しておくと楽です）
function saveProducts() {
    localStorage.setItem('my_products', JSON.stringify(currentProducts));
}

function clearData() {
    if(confirm('履歴を削除して合計をリセットしますか？')) {
        history = [];
        saveAndRender();
    }
}

//---電卓の処理---

let calcInput = "0"; // 入力中の数値を文字列で保持

// 電卓を開く
function openCalc() {
    calcInput = "0";
    updateCalcDisplay();
    document.getElementById('calcModal').style.display = 'flex';
}

function closeCalc() {
    document.getElementById('calcModal').style.display = 'none';
}

// 数字ボタンを押したとき
function pressNum(num) {
    if (calcInput === "0") {
        calcInput = num.toString();
    } else {
        calcInput += num.toString();
    }
    updateCalcDisplay();
}

// Cボタン（クリア）
function clearCalc() {
    calcInput = "0";
    updateCalcDisplay();
}

// 表示の更新
function updateCalcDisplay() {
    document.getElementById('calcDisplay').innerText = `¥${parseInt(calcInput).toLocaleString()}`;
}

// 確定して売上に追加
function addCalcAmount() {
    const amount = parseInt(calcInput);
    if (amount > 0) {
        addItem("自由入力", amount); // 既存のaddItem関数を使い回す
        closeCalc();
    }
}