document.addEventListener('DOMContentLoaded', () => {
  let locationData = {};        // Chỉ giữ location (tải 1 lần)
  let dataLoaded = false;       // Đợi location tải xong

  const welcomePageContainer = document.getElementById('welcome-page-container');
  const resultPageContainer = document.getElementById('result-page-container');
  const welcomeInput = document.getElementById('welcomeProductCode');
  const welcomeButton = document.getElementById('welcomeSearchButton');
  const resultInput = document.getElementById('resultProductCode');
  const resultButton = document.getElementById('resultSearchButton');
  const imageBackgroundEl = document.getElementById('image-background');
  const imageDesktopEl = document.getElementById('product-image-desktop');
  const sizeListEl = document.getElementById('size-list');
  const priceEl = document.getElementById('product-price');
  const locationEl = document.getElementById('product-location');

  if (!welcomePageContainer || !resultPageContainer) {
    console.error("Lỗi: Thiếu phần tử DOM cần thiết.");
    return;
  }

  // 🔔 Thay alert bằng hàm linh hoạt (dễ nâng cấp sau)
  function showAlert(message) {
    alert(message); // có thể thay bằng toast, modal, v.v.
  }

  // 🌐 Webhook URL — nhớ xóa dấu cách!
  const WEBHOOK_URL = 'https://n8n-hongnhung198198-u40833.vm.elestio.app/webhook/22aa9e0d-0baa-48db-8f14-fe2da449de38';

  // 📍 Vẫn tải location từ S3 1 lần lúc khởi động
  async function loadLocationData() {
    const locationS3Url = "https://productdata19971998.s3.ap-southeast-1.amazonaws.com/location_new.txt"; // ✅ không dấu cách
    const res = await fetch(`${locationS3Url}?t=${Date.now()}`);
    if (!res.ok) throw new Error(`Lỗi tải location: ${res.status}`);
    const text = await res.text();
    const locMap = {};
    text.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const parts = trimmed.split(',');
      if (parts.length >= 2) {
        const code = parts[0].toUpperCase();
        locMap[code] = parts.slice(1).join(',').trim();
      }
    });
    return locMap;
  }

  // 🔍 Gọi webhook để lấy product theo mã
  async function fetchProductByCode(productCode) {
    try {
      const res = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productCode })
      });

      if (!res.ok) {
        console.warn(`Webhook trả về lỗi: ${res.status}`);
        return null;
      }

      const data = await res.json();
      if (data?.found && Array.isArray(data.sizes)) {
        return {
          imageUrl: data.imageUrl || null,
          price: data.price || 0,
          sizes: data.sizes.map(s => ({
            size: s.size,
            stock: s.stock
          }))
        };
      }
      return null;
    } catch (err) {
      console.error('Lỗi gọi webhook:', err);
      return null;
    }
  }

  // 🖼 Hiển thị kết quả tìm kiếm
  async function searchAndDisplay(code) {
    if (!dataLoaded) {
      showAlert("Đang tải dữ liệu vị trí... Vui lòng đợi.");
      return;
    }

    const searchCode = code.trim().toUpperCase();
    if (!searchCode) return;

    // 1. Gọi webhook để lấy product
    const product = await fetchProductByCode(searchCode);
    sizeListEl.innerHTML = '';

    if (product) {
      const imageUrl = product.imageUrl && product.imageUrl !== 'null' ? product.imageUrl : 'comap_logo.jpg';
      imageBackgroundEl.style.backgroundImage = `url('${imageUrl}')`;
      imageDesktopEl.src = imageUrl;
      priceEl.textContent = `${product.price.toLocaleString('vi-VN')}đ`;
      locationEl.textContent = locationData[searchCode] || 'Chưa có vị trí';

      const available = product.sizes
        .filter(s => s.stock > 0)
        .sort((a, b) => a.size.localeCompare(b.size, 'vi'));

      if (available.length === 0) {
        const li = document.createElement('li');
        li.textContent = 'Sản phẩm này đã hết hàng';
        sizeListEl.appendChild(li);
      } else {
        available.forEach(item => {
          const li = document.createElement('li');
          li.innerHTML = `<span class="sz">${item.size}</span><span class="sep">|</span><span class="qty">${item.stock}</span>`;
          sizeListEl.appendChild(li);
        });
      }
    } else {
      // Không tìm thấy product
      showAlert(`Không tìm thấy sản phẩm: ${searchCode}`);
      const fallback = 'comap_logo.jpg';
      imageBackgroundEl.style.backgroundImage = `url('${fallback}')`;
      imageDesktopEl.src = fallback;
      priceEl.textContent = '—';
      locationEl.textContent = locationData[searchCode] || 'Chưa có vị trí';
    }

    resultInput.value = '';
    resultInput.focus();
  }

  // 🚪 Xử lý tìm kiếm ban đầu
  function handleInitialSearch() {
    const code = welcomeInput.value.trim();
    if (!code) {
      showAlert("Vui lòng nhập mã sản phẩm!");
      return;
    }
    welcomePageContainer.style.display = 'none';
    resultPageContainer.style.display = 'block';
    searchAndDisplay(code);
  }

  // 🔘 Gắn sự kiện
  welcomeInput.focus();
  welcomeButton.addEventListener('click', handleInitialSearch);
  welcomeInput.addEventListener('keydown', (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleInitialSearch();
    }
  });
  resultButton.addEventListener('click', () => searchAndDisplay(resultInput.value));
  resultInput.addEventListener('keydown', (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      searchAndDisplay(resultInput.value);
    }
  });

  // 📥 Chỉ tải location lúc khởi động
  loadLocationData()
    .then(locMap => {
      locationData = locMap;
      dataLoaded = true;
      console.log('✅ Location data đã sẵn sàng.');
    })
    .catch(err => {
      console.error('❌ Lỗi tải location:', err);
      showAlert('Không thể tải dữ liệu vị trí. Một số tính năng có thể bị hạn chế.');
      dataLoaded = true; // vẫn cho dùng, nhưng không có vị trí
    });
});