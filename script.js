const API_URL = 'https://script.google.com/macros/s/AKfycbxJHUBhK9x4zsyoAafACZrViWKjbnqELzndhdA8uqmtRdlPNnx4tQpDPyd09q2xt0oT7A/exec';

// THÔNG TIN NGÂN HÀNG
const MY_BANK = 'MB';
const MY_STK = '075020699999';
const MY_NAME = 'DAO XUAN KHANH';

let globalDB = {};

// --- 1. TẢI DỮ LIỆU & CẤU HÌNH ---
async function fetchGameData() {
    try {
        console.log("🚀 Đang tải dữ liệu...");
        const response = await fetch(API_URL);
        const result = await response.json();

        // Bóc tách dữ liệu từ thuộc tính .data của API mới
        if (result.status === 'success' && result.data) {
            globalDB = result.data;
        } else {
            globalDB = result; 
        }

        console.log("Dữ liệu thực tế:", globalDB);

        // Hàm cập nhật nội dung văn bản (Giá tiền)
        const updateText = (id, key) => { 
            const el = document.getElementById(id); 
            if (el && globalDB[key]) el.innerHTML = globalDB[key]; 
        };

        // Hàm cập nhật đường dẫn (Link tải)
        const updateLink = (id, key) => { 
            const el = document.getElementById(id); 
            if (el && globalDB[key]) el.href = globalDB[key]; 
        };

        // Cập nhật Link và Giá
        updateLink('link_free', 'link_free');
        updateLink('btn_dl_android', 'link_android');
        updateLink('btn_dl_ios', 'link_ios');
        updateLink('btn_dl_clone', 'link_clone');

        updateText('price_free', 'price_free');
        updateText('price_day', 'price_day');
        updateText('price_week', 'price_week');
        updateText('price_month', 'price_month');
        updateText('price_season', 'price_season');

        // Cập nhật hỗ trợ và nhạc
        if (globalDB['link_zalo']) {
            const supportLink = document.getElementById('link_zalo_support');
            if (supportLink) supportLink.href = globalDB['link_zalo'];
        }

        if (globalDB['link_music']) {
            const audio = document.getElementById('bgMusic');
            if (audio) {
                audio.src = globalDB['link_music'];
                autoPlayMusic(audio);
            }
        }

        // --- SỬA ĐỔI CHÍNH: GẮN SỰ KIỆN NÚT MUA TƯƠNG ỨNG ---
        setupBuyButton('btn_buy_day', 'Gói Ngày', 'price_day');
        setupBuyButton('btn_buy_week', 'Gói Tuần', 'price_week');
        setupBuyButton('btn_buy_month', 'Gói Tháng', 'price_month');
        setupBuyButton('btn_buy_season', 'Gói Mùa', 'price_season');

    } catch (error) {
        console.error('🔥 Lỗi API:', error);
    }
}

// --- HÀM XỬ LÝ AUTOPLAY THÔNG MINH ---
function autoPlayMusic(audio) {
    const playPromise = audio.play();
    if (playPromise !== undefined) {
        playPromise.then(_ => {
            console.log("✅ Nhạc đã tự động phát thành công!");
        }).catch(error => {
            console.log("⚠️ Trình duyệt chặn Autoplay. Chờ tương tác...");
            document.addEventListener('click', () => {
                audio.play();
                console.log("✅ Đã kích hoạt nhạc!");
            }, { once: true });
        });
    }
}

// --- 2. CÁC HÀM THANH TOÁN ---
function setupBuyButton(btnID, packageName, priceKey) {
    const btn = document.getElementById(btnID);
    if (!btn) return;
    
    btn.removeAttribute('href'); // Loại bỏ link cũ
    btn.style.cursor = "pointer";
    btn.onclick = function () {
        // Lấy giá trị đang hiển thị trên giao diện của gói đó
        const priceElement = document.getElementById(priceKey);
        if (priceElement) {
            let rawPrice = priceElement.innerText;
            let cleanPrice = parsePrice(rawPrice);
            openPayment(packageName, cleanPrice);
        }
    };
}

function openPayment(title, amount) {
    const modal = document.getElementById('paymentModal');
    const transCode = Math.floor(1000 + Math.random() * 9000);
    const syntax = "MOD36 " + transCode;

    // Hiển thị giá và nội dung thanh toán vào Modal
    document.getElementById('pay_price').innerText = formatCurrency(amount);
    document.getElementById('pay_syntax_display').innerText = syntax;
    document.getElementById('input_trans_code').value = transCode;

    // Tạo mã QR động dựa trên số tiền của gói đã chọn
    const qrURL = `https://img.vietqr.io/image/${MY_BANK}-${MY_STK}-compact.jpg?amount=${amount}&addInfo=${syntax}&accountName=${encodeURIComponent(MY_NAME)}`;
    document.getElementById('qr_img').src = qrURL;
    
    document.getElementById('result_area').style.display = 'none';
    modal.style.display = 'flex';
}

function closePayment() { document.getElementById('paymentModal').style.display = 'none'; }

async function checkOrder() {
    const codeInput = document.getElementById('input_trans_code').value.trim();
    const resultArea = document.getElementById('result_area');
    const statusText = document.getElementById('status_text');
    const keyBox = document.getElementById('key_display_box');
    const finalKey = document.getElementById('final_key');

    if (!codeInput) { alert("Vui lòng nhập Mã Giao Dịch!"); return; }

    resultArea.style.display = 'block';
    statusText.innerText = "🔄 Đang kết nối máy chủ...";
    statusText.style.color = "#fff";
    keyBox.style.display = 'none';

    try {
        const response = await fetch(API_URL);
        const result = await response.json();
        const data = result.data || result; // Hỗ trợ cả 2 định dạng API
        const myKey = data[codeInput];

        if (myKey) {
            statusText.innerHTML = "✅ Giao dịch thành công!";
            statusText.style.color = "#0f0";
            finalKey.innerText = myKey;
            keyBox.style.display = 'block';
        } else {
            statusText.innerHTML = "⏳ Đang chờ duyệt...<br><small>(Vui lòng đợi hệ thống trả về, thử lại sau 2 phút)</small>";
            statusText.style.color = "orange";
        }
    } catch (e) {
        statusText.innerText = "❌ Lỗi kết nối. Vui lòng thử lại.";
        statusText.style.color = "red";
    }
}

function copyKey() {
    const text = document.getElementById('final_key').innerText;
    navigator.clipboard.writeText(text);
    const toast = document.getElementById('toast');
    if(toast) {
        toast.classList.add('show');
        setTimeout(() => { toast.classList.remove('show'); }, 2000);
    }
}

function parsePrice(str) {
    if (!str) return 0;
    let num = str.replace(/[^0-9]/g, '');
    if (str.toLowerCase().includes('k')) num = parseInt(num) * 1000;
    return parseInt(num);
}

function formatCurrency(num) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
}

function createParticles() {
    const container = document.getElementById('particles-js');
    if (!container) return;
    const particleCount = 50; 
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        const size = Math.random() * 3 + 1 + 'px';
        particle.style.width = size;
        particle.style.height = size;
        particle.style.left = Math.random() * 100 + 'vw';
        const color = Math.random() > 0.5 ? 'var(--primary)' : 'var(--secondary)';
        particle.style.background = color;
        particle.style.boxShadow = `0 0 10px ${color}`;
        particle.style.animationDuration = Math.random() * 3 + 2 + 's';
        particle.style.animationDelay = Math.random() * 5 + 's';
        container.appendChild(particle);
    }
}

// Khởi chạy
document.addEventListener('DOMContentLoaded', () => {
    fetchGameData();
    createParticles();
});


