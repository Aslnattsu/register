// script.js

let editingId = null;
let total = 0;
let history = JSON.parse(localStorage.getItem('regiHistory')) || [];

// 初期データ（カテゴリ分けした構造）
const defaultData = {
    "Aセット": [
        { id: 1, name: "食品A", price: 500, color: "#007aff" },
    ],
    "Bセット": [
        { id: 101, name: "食品A", price: 1000, color: "#ff9500" },
    ],
    "Cセット": [
        { id: 201, name: "食品A", price: 300, color: "#34c759" },
    ]
};

// V2用の新しいキーで読み込む
let rawData = localStorage.getItem('my_pos_v2');
let allProducts;

if (rawData) {
    allProducts = JSON.parse(rawData);
} else {
    // もし古いデータ（配列）が残っていたら「基本」カテゴリに無理やり入れる
    let oldData = localStorage.getItem('my_products');
    if (oldData) {
        allProducts = { "Aセット": JSON.parse(oldData) };
    } else {
        allProducts = defaultData;
    }
    // 新しい形式で即保存
    localStorage.setItem('my_pos_v2', JSON.stringify(allProducts));
}

// アクティブなカテゴリをセット
let activeCategory = Object.keys(allProducts)[0] || "Aセット";

// 現在の商品リスト（保存されていればそれを読み込む）
//let allProducts = JSON.parse(localStorage.getItem('my_pos_v2')) || defaultData;
//let activeCategory = Object.keys(allProducts)[0]; // 最初は1つ目のカテゴリを表示

window.addEventListener('DOMContentLoaded', () => {
    renderTabs();
    renderButtons();
    updateDisplay();
});

// タブを表示する
function renderTabs() {
    const tabContainer = document.getElementById('categoryTabs');
    tabContainer.innerHTML = "";

    Object.keys(allProducts).forEach(catName => {
        const btn = document.createElement('button');
        btn.className = `tab-btn ${catName === activeCategory ? 'active' : ''}`;
        btn.innerText = catName;

        // タップで切り替え
        btn.onclick = () => {
            activeCategory = catName;
            renderTabs();
            renderButtons();
        };

        // --- タブ名の変更（長押し） ---
        let longPressTimer;
        btn.ontouchstart = () => {
            longPressTimer = setTimeout(() => {
                editCategory(catName); // 名前変更関数を呼ぶ
            }, 800); // タブは誤操作防止のため少し長めの800ms
        };
        btn.ontouchend = () => clearTimeout(longPressTimer);
        btn.ontouchmove = () => clearTimeout(longPressTimer);
        
        // PC用（右クリック）
        btn.oncontextmenu = (e) => {
            e.preventDefault();
            editCategory(catName);
        };

        tabContainer.appendChild(btn);
    });
    const addBtn = document.createElement('button');
    addBtn.className = 'tab-btn';
    addBtn.innerText = "＋";
    addBtn.onclick = () => {
        const name = prompt("新しいカテゴリ名を入力してください");
    
        // 入力がない、またはキャンセルされたら何もしない
        if (!name) return;

        // すでに同じ名前があるかチェック（C#の ContainsKey 的な処理）
        if (allProducts[name]) {
            alert("その名前は既に使われています");
            return;
        }

        // 1. 新しい空のカテゴリ（配列）を作成
        allProducts[name] = []; 
    
        // 2. 作ったカテゴリをすぐに表示するように切り替え（UX向上）
        activeCategory = name;

        // 3. 保存して再描画
        saveAllData();
        renderTabs();
        renderButtons();
    };
    tabContainer.appendChild(addBtn);
}

// ボタン生成
function renderButtons() {
    const grid = document.getElementById('buttonGrid');
    grid.innerHTML = ""; // 再描画用に一旦空にする
    
    // 自由入力ボタン
    const calcBtn = document.createElement('button');
    calcBtn.className = 'item-btn';
    calcBtn.style.backgroundColor = "#5856d6"; // 目立つ紫など
    calcBtn.innerHTML = `自由入力<br>(電卓)`;
    calcBtn.onclick = openCalc; // 電卓を開く
    grid.appendChild(calcBtn);

    const targetProducts = allProducts[activeCategory];
    targetProducts.forEach(product => {

        if (!targetProducts) return;

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
    const index = allProducts[activeCategory].findIndex(p => p.id === id);
    const product = allProducts[activeCategory][index]

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
    const product = allProducts[activeCategory].find(p => p.id === editingId);

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
        
        saveAllData();
        renderButtons();
    }
}
//削除
function deleteTargetProduct() {
    closeModal();
    const index = allProducts[activeCategory].findIndex(p => p.id === editingId);
    const product = allProducts[activeCategory][index];
    
    if (confirm(`${product.name} を削除してよろしいですか？`)) {
        allProducts[activeCategory].splice(index, 1); // 配列から特定の要素を削除
        saveAllData();
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
    allProducts[activeCategory].push(newProduct);

    // 4. localStorageに保存して画面を再描画
    saveAllData();
    renderButtons();
    
    alert(`${name} を追加しました！`);
}

//ボタンデータを保存
function saveAllData() {
    localStorage.setItem('my_pos_data', JSON.stringify(allProducts));
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

//--- タブのリネーム ---

let editingCategoryName = ""; // 操作中のカテゴリ名を保持

// モーダルを開く
function editCategory(catName) {
    editingCategoryName = catName;
    document.getElementById('categoryModalTitle').innerText = `カテゴリ「${catName}」の操作`;
    document.getElementById('categoryModal').style.display = 'flex';
}

// モーダルを閉じる
function closeCategoryModal() {
    document.getElementById('categoryModal').style.display = 'none';
}

// 1. 名前変更の実行
function openCategoryRename() {
    closeCategoryModal();
    const oldName = editingCategoryName;
    const newName = prompt(`「${oldName}」の新しい名前を入力してください`, oldName);
    
    if (!newName || newName === oldName) return;
    if (allProducts[newName]) {
        alert("その名前は既に使われています");
        return;
    }

    // キーの書き換え（コピーして削除）
    allProducts[newName] = allProducts[oldName];
    delete allProducts[oldName];

    if (activeCategory === oldName) {
        activeCategory = newName;
    }

    saveAllData();
    renderTabs();
    renderButtons();
}

// 2. 削除の実行
function deleteTargetCategory() {
    closeCategoryModal();
    const target = editingCategoryName;

    // 最後の1つは消させないガード
    if (Object.keys(allProducts).length <= 1) {
        alert("これ以上カテゴリを削除できません。");
        return;
    }

    if (confirm(`カテゴリ「${target}」を削除しますか？\n中の商品もすべて消えます。`)) {
        delete allProducts[target];
        
        // 表示中のカテゴリを消した場合は先頭に移動
        if (activeCategory === target) {
            activeCategory = Object.keys(allProducts)[0];
        }

        saveAllData();
        renderTabs();
        renderButtons();
    }
}