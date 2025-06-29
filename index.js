const discountCodes = {
  'GIAM10': 0.1,     // Giảm 10%
  'GIAM30': 0.3,     // Giảm 30%
  'FREE100': 1       // Giảm 100%
};


let currentFinalAmount = null;
let paymentConfirmed = false;

function copyText(text) {
  navigator.clipboard.writeText(text).then(() => {
    Swal.fire({
      icon: 'success',
      title: 'Đã sao chép!',
      text: text,
      toast: true,
      position: 'top-end',
      timer: 2000,
      showConfirmButton: false
    });
  });
}

function showPaymentInfo() {
  currentFinalAmount = null;
  paymentConfirmed = false;
  document.getElementById("confirmBtn").disabled = false;
  document.getElementById("resultBox").innerHTML = "";

  const game = document.getElementById("game").value;
  const duration = document.getElementById("duration").value;
  const discountCode = document.getElementById("discountCode").value.trim().toUpperCase();

  if (!game || !duration) {
    Swal.fire({
      icon: 'warning',
      title: 'Thông tin không hợp lệ!',
      text: 'Vui lòng chọn game và thời hạn!',
      confirmButtonColor: '#6366f1'
    });
    return;
  }

  const priceMap = { '1day': 10000, '7day': 40000, '30day': 100000 };
  const displayTextMap = { '1day': '1 ngày', '7day': '7 ngày', '30day': '30 ngày' };
  const originalAmount = priceMap[duration];

  if (!originalAmount) {
    Swal.fire({
      icon: 'error',
      title: 'Lỗi',
      text: 'Thời hạn không hợp lệ!',
      confirmButtonColor: '#6366f1'
    });
    return;
  }

  const product = `${displayTextMap[duration]} | ${game}`;
  const randomCode = "DXK" + Math.floor(1000 + Math.random() * 9000);

  document.getElementById("note").innerText = randomCode;
  document.getElementById("product").innerText = product;

  // ✅ Áp dụng mã giảm giá nếu có
  let discount = 0;
  let message = '';
  let isValid = false;

  if (discountCode && discountCodes.hasOwnProperty(discountCode)) {
    discount = discountCodes[discountCode];
    message = `✅ Mã giảm giá "${discountCode}" đã được áp dụng (${discount * 100}% OFF).`;
    isValid = true;
  } else if (discountCode) {
    message = `⚠️ Mã giảm giá "${discountCode}" không hợp lệ.`;
  }

  const finalAmount = Math.max(0, Math.round(originalAmount * (1 - discount)));
  currentFinalAmount = finalAmount;

  document.getElementById("amount").innerText = finalAmount.toLocaleString('vi-VN') + " VNĐ";

  const qrUrl = `https://qr.sepay.vn/img?acc=075020699999&bank=MBBank&amount=${finalAmount}&des=${randomCode}&template=compact`;
  document.getElementById("qrImage").src = qrUrl;

  const resultBox = document.getElementById("resultBox");
  if (message) {
    resultBox.innerHTML = `
      <div class="alert ${isValid ? 'alert-success' : 'alert-warning'}">${message}</div>
    `;
  }

  const paymentModal = new bootstrap.Modal(document.getElementById('paymentModal'));
  paymentModal.show();
}


document.addEventListener("DOMContentLoaded", () => {
  const invoiceUpload = document.getElementById("invoiceUpload");
  const previewImg = document.getElementById("previewImg");

  invoiceUpload.addEventListener("change", function () {
    const file = this.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (e) {
      previewImg.src = e.target.result;
      previewImg.style.display = "block";
    };
    reader.readAsDataURL(file);
  });
});

function confirmPayment() {
  const duration = document.getElementById("duration").value;
  const game = document.getElementById("game").value;
  const note = document.getElementById("note").innerText;

  if (!duration || !game) {
    Swal.fire({
      icon: 'warning',
      title: 'Thiếu thông tin!',
      text: 'Vui lòng chọn thời hạn và game.',
      confirmButtonColor: '#6366f1'
    });
    return;
  }

  Swal.fire({
    icon: 'success',
    title: '🎉 Thanh toán thành công!',
    html: `
      Cảm ơn bạn đã thanh toán.<br>
      <strong>Mã giao dịch:</strong> ${note}<br>
      Key sẽ được gửi trong vòng ít phút qua Zalo hoặc Email.
    `,
    confirmButtonColor: '#16a34a'
  });

  // Tùy chọn: Ghi kết quả vào resultBox
  document.getElementById("resultBox").innerHTML = `
    <div class="alert alert-success">
      ✅ Đã xác nhận thanh toán. Vui lòng đợi admin xử lý.
    </div>
  `;

  // Vô hiệu hóa nút xác nhận để tránh bấm lại
  document.getElementById("confirmBtn").disabled = true;
}
