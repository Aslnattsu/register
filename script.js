// script.js

let editingId = null;
let total = 0;
let cart = [];
let history = JSON.parse(localStorage.getItem('regiHistory')) || [];

// 初期データ（カテゴリ分けした構造）
const defaultData = {
    "Aセット": [
        { id: 1, name: "食品A", price: 500, color: "#8B7355" },
    ],
    "Bセット": [
        { id: 101, name: "食品A", price: 1000, color: "#C4A482" },
    ],
    "Cセット": [
        { id: 201, name: "食品A", price: 300, color: "#A88F70" },
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
    calcBtn.style.backgroundColor = "#C78283"; // 目立つ紫など
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

// 商品ボタンを押したときに呼ばれる処理
function addItem(name, price) {
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const item = { name, price, time: timeStr };
    cart.push(item);
    updateDisplay();
}

function saveAndRender() {
    localStorage.setItem('regiHistory', JSON.stringify(history));
    updateDisplay();
}

function updateDisplay() {
    const listDiv = document.getElementById('historyList');
    if (!listDiv) return; 

    // 1. 下の「販売履歴」を描画（会計ごとにグループ化して表示）
    listDiv.innerHTML = '<strong>販売履歴</strong>';
    
    history.forEach((receipt, index) => {
        // 会計ごとに枠（コンテナ）を作る
        const receiptDiv = document.createElement('div');
        
        // スタイル：太い境界線をつける
        receiptDiv.style.borderBottom = '3px double #333'; // 二重線（または 2px solid #333 など）
        receiptDiv.style.padding = '10px 5px';
        
        // スタイル：色を交互に変える（奇数番目と偶数番目で背景色を変更）
        if (index % 2 === 0) {
            receiptDiv.style.backgroundColor = '#ffffff'; // 白
        } else {
            receiptDiv.style.backgroundColor = '#f2f2f7'; // 薄いグレー
        }

        // 会計のヘッダー（時間と合計金額）
        const header = document.createElement('div');
        header.style.fontWeight = 'bold';
        header.style.color = '#555';
        header.style.marginBottom = '5px';
        header.innerText = `🕒 ${receipt.time} のお会計（小計: ¥${receipt.totalPrice.toLocaleString()}）`;
        receiptDiv.appendChild(header);

        // その会計に含まれる商品たちを並べる
        receipt.items.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.style.display = 'flex';
            itemDiv.style.justifyContent = 'space-between';
            itemDiv.style.paddingLeft = '10px';
            itemDiv.style.fontSize = '14px';
            itemDiv.style.color = '#333';
            itemDiv.innerHTML = `<span>・${item.name}</span><span>¥${item.price.toLocaleString()}</span>`;
            receiptDiv.appendChild(itemDiv);
        });

        listDiv.appendChild(receiptDiv); 
    });

    total = 0;
    const itemCounts = {}; // 商品名ごとの個数を数えるための箱

    cart.forEach((item) => {
        total += item.price;
        // すでに箱にあったら+1、なければ1からスタート
        if (itemCounts[item.name]) {
            itemCounts[item.name].count += 1;
        } else {
            itemCounts[item.name] = { count: 1, price: item.price };
        }
    });
    
    // 合計金額の表示を更新
    const totalDisplay = document.getElementById('totalDisplay');
    if (totalDisplay) {
        totalDisplay.innerText = `合計: ¥${total.toLocaleString()}`;
    }

    // 合計金額のすぐ下に「会計中の品目と点数」を表示する
    const cartListDiv = document.getElementById('cartList');
    if (cartListDiv) {
        cartListDiv.style.margin = '10px 0';
        cartListDiv.style.padding = '10px';
        cartListDiv.style.background = '#f9f9f9';
        cartListDiv.style.border = '1px solid #ddd';
        cartListDiv.style.borderRadius = '5px';

        // カートの中身を画面に描き出す
        if (cart.length === 0) {
            cartListDiv.innerHTML = '<span style="color:#8e8e93;">🛒 カートは空っぽです</span>';
        } else {
            cartListDiv.innerHTML = '<strong>🛒 会計中の品目</strong>';
            Object.keys(itemCounts).forEach(name => {
                const info = itemCounts[name];
                const itemDiv = document.createElement('div');
                itemDiv.style.display = 'flex';
                itemDiv.style.justifyContent = 'space-between';
                itemDiv.style.marginTop = '5px';
                itemDiv.innerHTML = `<span>${name} × ${info.count}点</span><span>¥${(info.price * info.count).toLocaleString()}</span>`;
                cartListDiv.appendChild(itemDiv);
            });
        }
}
}

//Googleスプレッドシート（GAS）の送信先URL
const GAS_URL = "https://script.google.com/macros/s/AKfycbwRT-lwehwyqQ8OKEnCD2jpl1qcaA8DTB-4rKRAMGvA7UE7kMfkIABiiz2GY9056KMk/exec";

// お会計を確定する（カートの中身を履歴に合体させて保存）
function checkout() {
    if (cart.length === 0) {
        alert("カートが空っぽです");
        return;
    }
    
    // 現在の時刻を取得
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    // スプレッドシート送信用の日時フォーマット (例: 2026/07/01 12:34)
    const fullTimestamp = `${now.getFullYear()}/${(now.getMonth()+1).toString().padStart(2, '0')}/${now.getDate().toString().padStart(2, '0')} ${timeStr}`;
    
    // ユニークな会計ID（現在時刻のミリ秒）
    const receiptId = Date.now();
    
    // 1回のお会計の「塊」を作る
    const receipt = {
        id: receiptId,
        time: timeStr,
        items: [...cart], // カートの中身をそのままコピー
        totalPrice: total // 合計金額
    };
    
    // 履歴の配列の「先頭」に追加する
    history.unshift(receipt);
    
    // ローカルストレージに保存
    localStorage.setItem('regiHistory', JSON.stringify(history));

    // Googleスプレッドシートへ裏側でデータを自動送信
    sendToSpreadsheet(fullTimestamp, receiptId, [...cart]);
    
    // カートを空にして画面を更新
    cart = [];
    updateDisplay();
    alert("お会計が完了しました！");
}

// アプリ起動時にLocalStorageから「未送信リスト」を読み込む（なければ空っぽ）
let failedQueue = JSON.parse(localStorage.getItem('regiFailedQueue')) || [];

// アプリ起動時、ちょっと時間を置いてから未送信データの再送を試みる
window.addEventListener('load', () => {
    setTimeout(retryFailedPayloads, 3000); // 起動3秒後にチェック
});

// 🌐 スプレッドシートへデータを飛ばす関数（失敗したらストックする）
function sendToSpreadsheet(timestamp, receiptId, itemsToSend) {
    const payload = {
        timestamp: timestamp,
        receiptId: receiptId,
        items: itemsToSend.map(item => ({
            name: item.name,
            price: item.price,
            category: activeCategory
        }))
    };

    executePost(payload);
}

// 実際に通信を行うコア関数
function executePost(payload) {
    // オフライン状態なら、通信せずに即ストックへ
    if (!navigator.onLine) {
        console.warn("⚠️ オフラインのため、データを未送信リストに保存しました。");
        queuePayload(payload);
        return;
    }

    fetch(GAS_URL, {
        method: "POST",
        headers: {
            "Content-Type": "text/plain" // GASで一番エラーが起きにくい形式
        },
        body: JSON.stringify(payload)
    })
    .then(response => {
        console.log("スプレッドシートへの自動バックアップに成功しました！");
        // 送信が成功したら、他にも溜まっている未送信データがあれば再送を試みる
        retryFailedPayloads();
    })
    .catch(error => {
        console.error("❌ 送信エラーが発生したため、データを未送信リストに保存します:", error);
        queuePayload(payload);
    });
}

// 📦 送信失敗データをLocalStorageにストックする関数
function queuePayload(payload) {
    // 重複して同じIDが入らないようにチェック
    if (!failedQueue.some(p => p.receiptId === payload.receiptId)) {
        failedQueue.push(payload);
        localStorage.setItem('regiFailedQueue', JSON.stringify(failedQueue));
    }
}

// 🔄 溜まった未送信データをまとめて再送する関数
function retryFailedPayloads() {
    if (failedQueue.length === 0) return;
    if (!navigator.onLine) return; // 依然としてオフラインなら何もしない

    console.log(`🔄 未送信の売上データが ${failedQueue.length} 件あります。再送を試みます...`);
    
    // 溜まっているデータを1個ずつ順番に再送
    const currentQueue = [...failedQueue];
    failedQueue = []; // 一旦メモリ上を空にして、失敗したやつだけ再度入れ直す
    localStorage.setItem('regiFailedQueue', JSON.stringify(failedQueue));

    currentQueue.forEach(payload => {
        fetch(GAS_URL, {
            method: "POST",
            headers: { "Content-Type": "text/plain" },
            body: JSON.stringify(payload)
        })
        .then(() => {
            console.log(`✅ 会計ID: ${payload.receiptId} のデータ送信に成功しました！`);
        })
        .catch(() => {
            console.error(`❌ 会計ID: ${payload.receiptId} の再送に失敗。ストックに戻します。`);
            queuePayload(payload); // 失敗したら再度ストックに戻す
        });
    });
}

// 今の合計をクリア
function clearCurrentCart() {
    if (confirm("現在カートに入っている内容を消去しますか？")) {
        cart = [];
        updateDisplay();
    }
}

// 過去の売上履歴をリセット
function clearSalesHistory() {
    if (confirm("これまでの売上履歴をすべて削除しますか？\n（現在カートに入っている合計金額は消えません）")) {
        history = [];
        localStorage.setItem('regiHistory', JSON.stringify(history));
        updateDisplay();
        alert("売上履歴をリセットしました。");
    }
}

// 標準10色を用意
const uiColors = [
    "#8B7355", // 01. エスプレッソ（深みのあるブラウン）
    "#C4A482", // 02. カフェラテ（ミルクブラウン）
    "#A88F70", // 03. ローストベージュ（白文字がクッキリ見える濃さに調整！）
    "#A3B19B", // 04. 抹茶ラテ（くすんだセージグリーン）
    "#738276", // 05. ユーカリ（深みのあるオリーブグリーン）
    "#D9A066", // 06. キャメル（焼き菓子のようなシナモンオレンジ）
    "#C78283", // 07. ベイクドベリー（くすんだアンティークピンク）
    "#8A9A86", // 08. ハーブ（スモーキーなグリーン）
    "#9A8AA6", // 09. ラベンダーアッシュ（落ち着いたニュアンスパープル）
    "#9c9c9c"  // 10. クラフト（主張しないマットグレー）
];
let selectedColor = uiColors[0]; // デフォルトは1番目の青

// 「＋商品追加」ボタンが押されたらここが呼ばれる
function addNewProduct() {
    // 入力欄を初期化
    document.getElementById('newProdName').value = "新商品";
    document.getElementById('newProdPrice').value = "1000";
    selectedColor = uiColors[0]; // 青を初期選択
    
    // カラーパレットのボタンを生成
    const paletteDiv = document.getElementById('colorPalette');
    paletteDiv.innerHTML = "";
    
    uiColors.forEach(color => {
        const cBtn = document.createElement('button');
        cBtn.type = "button";
        cBtn.style.backgroundColor = color;
        cBtn.style.height = "40px";
        cBtn.style.border = color === selectedColor ? "3px solid #333" : "1px solid #ccc";
        cBtn.style.borderRadius = "5px";
        cBtn.style.cursor = "pointer";
        
        // 色を選択したときの処理
        cBtn.onclick = () => {
            selectedColor = color;
            // 一旦全部の枠線を普通に戻してから、選んだやつだけ太枠にする
            Array.from(paletteDiv.children).forEach((btn, idx) => {
                btn.style.border = uiColors[idx] === selectedColor ? "3px solid #333" : "1px solid #ccc";
            });
        };
        paletteDiv.appendChild(cBtn);
    });

    // モーダルを表示
    document.getElementById('addProductModal').style.display = 'flex';
}

function closeAddProductModal() {
    document.getElementById('addProductModal').style.display = 'none';
}

// 「追加する」ボタンを押したときの確定処理
function submitNewProduct() {
    const name = document.getElementById('newProdName').value.trim();
    const priceStr = document.getElementById('newProdPrice').value;
    const price = parseInt(priceStr, 10);

    if (!name) {
        alert("商品名を入力してください");
        return;
    }
    if (isNaN(price) || price < 0) {
        alert("正しい価格を入力してください");
        return;
    }

    // 新しい商品オブジェクトを作成
    const newProduct = {
        id: Date.now(),
        name: name,
        price: price,
        color: selectedColor
    };

    // 配列に追加して保存・再描画
    allProducts[activeCategory].push(newProduct);
    saveAllData();
    renderButtons();
    
    closeAddProductModal();
    alert(`${name} を追加しました！`);
}

//ボタンデータを保存
function saveAllData() {
    localStorage.setItem('my_pos_data', JSON.stringify(allProducts));
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

// --- お釣り計算電卓の処理 ---

let otsuriAzukariInput = "0"; // 預かり金の入力保持

// お釣り電卓を開く
function openOtsuriCalc() {
    otsuriAzukariInput = "0";
    // 現在の会計合計金額（total）をタイトルに小さく表示
    document.getElementById('otsuriTitle').innerText = `お釣り計算 (合計: ¥${total.toLocaleString()})`;
    updateOtsuriDisplay();
    document.getElementById('otsuriModal').style.display = 'flex';
}

// お釣り電卓を閉じる
function closeOtsuriModal() {
    document.getElementById('otsuriModal').style.display = 'none';
}

// 数字が押されたとき
function pressOtsuriNum(num) {
    if (otsuriAzukariInput === "0") {
        if (num === '00') return; // 最初が0のときは00を押しても意味ない
        otsuriAzukariInput = num.toString();
    } else {
        otsuriAzukariInput += num.toString();
    }
    updateOtsuriDisplay();
}

// クリア（C）が押されたとき
function clearOtsuriCalc() {
    otsuriAzukariInput = "0";
    updateOtsuriDisplay();
}

// 画面の数値をリアルタイム更新（引き算もここで行う）
function updateOtsuriDisplay() {
    const azukariAmount = parseInt(otsuriAzukariInput, 10);
    
    // 1. お預かり金額の表示
    document.getElementById('otsuriAzukari').innerText = `¥${azukariAmount.toLocaleString()}`;
    
    // 2. お釣りの計算（預かり金 - カートの合計金額）
    const otsuri = azukariAmount - total;
    
    const otsuriResultDiv = document.getElementById('otsuriResult');
    if (azukariAmount === 0) {
        otsuriResultDiv.innerText = "¥0";
        otsuriResultDiv.style.color = "#ff3b30";
    } else if (otsuri < 0) {
        otsuriResultDiv.innerText = `¥-${Math.abs(otsuri).toLocaleString()}`;
        otsuriResultDiv.style.color = "#ff3b30"; // 足りない時は赤
    } else {
        otsuriResultDiv.innerText = `¥${otsuri.toLocaleString()}`;
        otsuriResultDiv.style.color = "#34c759"; // お釣りがある時は緑
    }
}