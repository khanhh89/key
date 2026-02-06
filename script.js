const API_URL = 'https://script.google.com/macros/s/AKfycbyA5tJvs9UpaNI8Jj-izAlcVZF8T7JsfBzoAIlbbDq4I92VI11fBgNZySlUi8aXyZ6SOA/exec';

// THÔNG TIN NGÂN HÀNG
const MY_BANK = 'MB';
const MY_STK = '075020699999';
const MY_NAME = 'DAO XUAN KHANH';

let globalDB = {};

async function fetchGameData() {
    try {
        const response = await fetch(API_URL);
        const result = await response.json();
        globalDB = (result.status === 'success' && result.data) ? result.data : result;

        console.log("Dữ liệu nhận được:", globalDB);

        // --- TỰ ĐỘNG RENDER BẢNG GIÁ ---
        renderPricing();

        // Cập nhật các link tải bên ngoài (Android, iOS...)
        const updateLink = (id, key) => { 
            const el = document.getElementById(id); 
            if (el && globalDB[key]) el.href = globalDB[key]; 
        };
        updateLink('btn_dl_android', 'link_android');
        updateLink('btn_dl_ios', 'link_ios');

    } catch (error) {
        console.error('🔥 Lỗi API:', error);
        document.getElementById('pricing-grid').innerHTML = "<p style='color:red'>Lỗi tải dữ liệu!</p>";
    }
}

function renderPricing() {
    const grid = document.getElementById('pricing-grid');
    if (!grid || !globalDB) return;

    grid.innerHTML = ''; // Xóa thông báo đang tải

    // 1. Tìm tất cả các key bắt đầu bằng "price_" trong dữ liệu API
    const priceKeys = Object.keys(globalDB).filter(key => key.startsWith('price_'));

    priceKeys.forEach(key => {
        const type = key.replace('price_', ''); // Lấy tên gói (ví dụ: day, week, year)
        const price = globalDB[key];
        
        // Tự động định dạng tên hiển thị (viết hoa chữ đầu)
        const displayName = type === 'free' ? 'Key Free' : 'Gói ' + type.charAt(0).toUpperCase() + type.slice(1);
        
        // Thiết lập icon và mô tả mặc định dựa trên loại gói
        let icon = 'fa-cart-shopping';
        let desc = 'Sử dụng đầy đủ tính năng';
        let isHot = false;

        if (type === 'free') { icon = 'fa-link'; desc = 'Vượt link quảng cáo'; }
        if (type === 'month') { icon = 'fa-fire'; desc = 'Leo rank Thách Đấu'; isHot = true; }
        if (type === 'season') { icon = 'fa-gem'; desc = 'Bảo hành reset mùa'; }
        if (type === 'year') { icon = 'fa-crown'; desc = 'Sử dụng lâu dài, tiết kiệm'; }

        // 2. Tạo thẻ HTML tự động
        const card = document.createElement('div');
        card.className = `glass-card ${isHot ? 'hot-border' : ''}`;
        if (type === 'free') card.style.border = "1px dashed rgba(255,255,255,0.3)";

        card.innerHTML = `
            ${type === 'free' ? '<div class="badge-test">TEST</div>' : ''}
            ${isHot ? '<div class="badge-hot">HOT</div>' : ''}
            <h3>${displayName}</h3>
            <div class="price-tag" id="${key}">${price}</div>
            <p>${desc}</p>
            ${type === 'free' 
                ? `<a href="${globalDB['link_free'] || '#'}" target="_blank" class="btn-key free"><i class="fa-solid ${icon}"></i> Lấy Key</a>`
                : `<button class="btn-key ${isHot ? 'hot' : ''}" onclick="handleBuyClick('${displayName}', '${key}')">
                    <i class="fa-solid ${icon}"></i> Mua Ngay
                   </button>`
            }
        `;
        grid.appendChild(card);
    });
}

// Hàm xử lý riêng khi bấm nút Mua (được gọi từ HTML sinh ra ở trên)
function handleBuyClick(packageName, priceKey) {
    let rawPrice = document.getElementById(priceKey).innerText;
    let cleanPrice = parsePrice(rawPrice);
    openPayment(packageName, cleanPrice);
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
    const statusText = document.getElementById('status_text');
    const resultArea = document.getElementById('result_area'); // Vùng chứa kết quả
    const keyBox = document.getElementById('key_display_box');   // Khung chứa mã Key
    const finalKeyEl = document.getElementById('final_key');     // Thẻ chứa text Key

    if (!codeInput) { 
        alert("Vui lòng nhập Mã Giao Dịch!"); 
        return; 
    }
    resultArea.style.display = 'block'; 
    keyBox.style.display = 'none'; // Ẩn ô Key đi nếu trước đó đang hiện
    statusText.style.color = '#aaa';
    statusText.innerText = "🔄 Đang đối soát mã: " + codeInput;
    
    try {
        const response = await fetch(`${API_URL}?action=get_all_keys`);
        const result = await response.json();
        const allKeys = (result.status === 'success') ? result.data : [];
        const foundData = allKeys.find(item => 
            item.owner && item.owner.toString().trim() === codeInput.toString().trim()
        );

        if (foundData) {
            console.log("✅ Tìm thấy Key:", foundData.key);
            
            // 1. Cập nhật trạng thái
            statusText.style.color = '#00ff00';
            statusText.innerHTML = "✅ Giao dịch thành công!";
            
            // 2. Điền Key và hiện khung chứa Key
            finalKeyEl.innerText = foundData.key;
            keyBox.style.display = 'block'; 
            
            // 3. Ẩn phần QR và các hướng dẫn thừa để tập trung vào Key
            const qrBox = document.querySelector('.qr-box');
            const stepPay = document.getElementById('step_pay');
            if (qrBox) qrBox.style.display = 'none';
            if (stepPay) stepPay.style.display = 'none';

            // Cuộn xuống để người dùng thấy Key
            keyBox.scrollIntoView({ behavior: 'smooth', block: 'center' });

        } else {
            statusText.style.color = '#ff9800';
            statusText.innerHTML = "⏳ Chưa tìm thấy giao dịch...<br><small>Đợi 1-2 phút để hệ thống cập nhật nhé!</small>";
        }
    } catch (e) {
        console.error("Lỗi:", e);
        statusText.style.color = '#ff4444';
        statusText.innerText = "❌ Lỗi kết nối máy chủ!";
    }
}
function confettiEffect() {
    console.log("Chúc mừng! Bạn đã nhận được key.");
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
    let cleanStr = str.toString().toLowerCase().replace(/[^0-9.km]/g, '');
    let num = parseFloat(cleanStr);

    if (cleanStr.includes('k')) num *= 1000;
    if (cleanStr.includes('m')) num *= 1000000; // Xử lý 1000M hoặc 1M

    return Math.floor(num);
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
async function applyCoupon() {
    const code = document.getElementById('coupon_input').value.trim();
    const msg = document.getElementById('coupon_msg');
    const priceDisplay = document.getElementById('pay_price');
    
    if (!code) return;

    msg.style.color = "#aaa";
    msg.innerText = "⌛ Đang kiểm tra...";

    try {
        const originalPrice = parseInt(priceDisplay.innerText.replace(/[^0-9]/g, ""));
        const response = await fetch(`${API_URL}?action=check_coupon&code=${code}&price=${originalPrice}`);
        const result = await response.json();

        if (result.status === "success") {
            msg.style.color = "#00ff00";
            msg.innerText = `✅ ${result.message}`;
            priceDisplay.innerText = result.newPrice.toLocaleString() + "đ";
            
            // 2. Cập nhật lại QR Code với số tiền đã giảm
            // Hàm updateQR của bạn cần nhận tham số số tiền mới
            if (typeof updateQR === "function") {
                updateQR(result.newPrice);
            }
        } else {
            msg.style.color = "#ff4444";
            msg.innerText = result.message;
        }
    } catch (e) {
        msg.innerText = "❌ Lỗi kết nối!";
    }
}
//vòng quay may mắn
const rewards = [
  { label: "Mã 10K", color: "#ff6b6b" },
  { label: "Mã 20K", color: "#feca57" },
  { label: "Mã 50K", color: "#48dbfb" },
  { label: "Thêm 1 Ngày", color: "#1dd1a1" },
  { label: "Mã 100K", color: "#c8d6e5" },
  { label: "Chúc may mắn", color: "#576574" }
];


function drawWheel() {
    const canvas = document.getElementById("wheel");
    const ctx = canvas.getContext("2d");
    const arc = Math.PI / (rewards.length / 2);

    ctx.clearRect(0,0,380,380);
    rewards.forEach((item, i) => {
        const angle = i * arc;
        ctx.beginPath();
        ctx.fillStyle = item.color;
        ctx.moveTo(190, 190);
        ctx.arc(190, 190, 180, angle, angle + arc);
        ctx.fill();
        ctx.strokeStyle = "rgba(0,0,0,0.1)"; ctx.stroke();

        ctx.save();
        ctx.translate(190, 190);
        ctx.rotate(angle + arc/2);
        ctx.fillStyle = "white";
        ctx.font = "bold 14px Montserrat";
        ctx.fillText(item.label, 90, 5);
        ctx.restore();
    });
}
let currentRotation = 0;
let spinning = false;

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function startSpin() {
  if (spinning) return;
  spinning = true;

  const wheel = document.getElementById("wheel");
  const btn = document.getElementById("spin-btn");
  btn.disabled = true;

  const sliceDeg = 360 / rewards.length;

  // quay ngẫu nhiên (không biết trước trúng gì)
  const rounds = Math.floor(Math.random() * 4) + 8;
  const randomDeg = Math.random() * 360;

  const totalRotation =
    currentRotation + rounds * 360 + randomDeg;

  const duration = 5500;
  const start = performance.now();

  function animate(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = easeOutCubic(progress);

    const angle =
      currentRotation +
      (totalRotation - currentRotation) * eased;

    wheel.style.transform = `rotate(${angle}deg)`;

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      currentRotation = totalRotation % 360;
      spinning = false;
      btn.disabled = false;

      // 🎯 TÍNH Ô TRÚNG
      const index = Math.floor(
        ((360 - currentRotation + 180) % 360) / sliceDeg
      );

      const reward = rewards[index];
      showToast(`🎁 Bạn trúng: <b>${reward.label}</b>`);
    }
  }

  requestAnimationFrame(animate);
}

// Khởi tạo lần đầu
window.onload = () => { drawWheel(); };

function toggleWheelModal() {
    const m = document.getElementById('wheel-modal');
    m.style.display = (m.style.display === 'flex') ? 'none' : 'flex';
}
function showToast(message) {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = message;

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 7700);
}

// Khởi chạy
document.addEventListener('DOMContentLoaded', () => {
    fetchGameData();
    createParticles();
});


