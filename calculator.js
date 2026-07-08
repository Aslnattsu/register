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