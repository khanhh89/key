const API_URL = 'https://script.google.com/macros/s/AKfycbwLZHszgTmqd2KpHLDkRsHI06MOXU3U63jekUwnqaUwB9_5GNPDlRbCSngKZkEzBpIZ/exec';

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
        globalDB = await response.json();

        // Cập nhật giá tiền & Link tải
        const updateText = (id, key) => { const el = document.getElementById(id); if (el && globalDB[key]) el.innerHTML = globalDB[key]; };
        const updateLink = (id, key) => { const el = document.getElementById(id); if (el && globalDB[key]) el.href = globalDB[key]; };

        updateText('price_free', 'price_free');
        updateText('price_day', 'price_day');
        updateText('price_week', 'price_week');
        updateText('price_month', 'price_month');
        updateText('price_season', 'price_season');

        updateLink('link_free', 'link_free');
        updateLink('btn_dl_android', 'link_android');
        updateLink('btn_dl_ios', 'link_ios');
        updateLink('btn_dl_clone', 'link_clone');
        updateLink('link_zalo', 'link_zalo');
        updateLink('link_tele', 'link_tele');

        // Link hỗ trợ Modal
        const supportLink = document.getElementById('link_zalo_support');
        if (supportLink && globalDB['link_zalo']) supportLink.href = globalDB['link_zalo'];

        // --- XỬ LÝ NHẠC NỀN TỰ ĐỘNG ---
        // Lấy link nhạc từ cột 'link_music' trong Sheet
        if (globalDB['link_music']) {
            const audio = document.getElementById('bgMusic');
            if (audio) {
                audio.src = globalDB['link_music'];
                audio.volume = 0.5; // Âm lượng 50%
                autoPlayMusic(audio);
            }
        }

        // --- GẮN SỰ KIỆN NÚT MUA ---
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
    // Cố gắng phát nhạc ngay lập tức
    const playPromise = audio.play();

    if (playPromise !== undefined) {
        playPromise.then(_ => {
            console.log("✅ Nhạc đã tự động phát thành công!");
        }).catch(error => {
            console.log("⚠️ Trình duyệt chặn Autoplay. Đang chờ người dùng tương tác...");
            // NẾU BỊ CHẶN: Gắn sự kiện click vào TOÀN BỘ TRANG WEB
            // Chỉ cần người dùng bấm bất kỳ đâu 1 lần là nhạc sẽ chạy
            document.addEventListener('click', () => {
                audio.play();
                console.log("✅ Đã kích hoạt nhạc sau khi click!");
            }, { once: true }); // 'once: true' nghĩa là sự kiện này chỉ chạy 1 lần rồi tự hủy
        });
    }
}

// --- 2. CÁC HÀM THANH TOÁN ---
function setupBuyButton(btnID, packageName, priceKey) {
    const btn = document.getElementById(btnID);
    if (!btn) return;
    btn.removeAttribute('href');
    btn.style.cursor = "pointer";
    btn.onclick = function () {
        let rawPrice = document.getElementById(priceKey).innerText;
        let cleanPrice = parsePrice(rawPrice);
        openPayment(packageName, cleanPrice);
    };
}

function openPayment(title, amount) {
    const modal = document.getElementById('paymentModal');
    const transCode = Math.floor(1000 + Math.random() * 9000);
    const syntax = "MOD36 " + transCode;

    document.getElementById('pay_price').innerText = formatCurrency(amount);
    document.getElementById('pay_syntax_display').innerText = syntax;
    document.getElementById('input_trans_code').value = transCode;

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
        const newData = await response.json();
        const myKey = newData[codeInput];

        if (myKey) {
            statusText.innerHTML = "✅ Giao dịch thành công!";
            statusText.style.color = "#0f0";
            finalKey.innerText = myKey;
            keyBox.style.display = 'block';
        } else {
            statusText.innerHTML = "⏳ Đang chờ duyệt...<br><small>(Vui lòng đợi Admin cập nhật, thử lại sau 2 phút)</small>";
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
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}


function parsePrice(str) {
    if (!str) return 0;
    let num = str.replace(/[^0-9]/g, '');
    if (str.toLowerCase().includes('k')) num = parseInt(num) * 1000;
    return num;
}

function formatCurrency(num) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num);
}

function createParticles() {
    const container = document.getElementById('particles-js');
    if (!container) return; // Kiểm tra lỗi nếu không có div
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

