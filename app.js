document.addEventListener('DOMContentLoaded', () => {
  // Biến toàn cục
  let productData = [];
  let locationData = {};
  let dataLoaded = false;

  // --- Lấy các phần tử DOM ---
  const welcomePageContainer = document.getElementById('welcome-page-container');
  const resultPageContainer = document.getElementById('result-page-container');
  
  const welcomeInput = document.getElementById('welcomeProductCode');
  const welcomeButton = document.getElementById('welcomeSearchButton');
  
  const resultInput = document.getElementById('resultProductCode');
  const resultButton = document.getElementById('resultSearchButton');

  const imageEl = document.getElementById('product-image');
  const sizeListEl = document.getElementById('size-list');
  const priceEl = document.getElementById('product-price');
  const locationEl = document.getElementById('product-location');

  // Kiểm tra xem tất cả các phần tử có tồn tại không
  if (!welcomePageContainer || !resultPageContainer || !welcomeInput || !welcomeButton || !resultInput || !resultButton) {
      console.error("Một hoặc nhiều thành phần UI không tìm thấy. Vui lòng kiểm tra lại ID trong file HTML.");
      alert("Lỗi tải giao diện người dùng. Vui lòng làm mới trang.");
      return;
  }

  // --- CÁC HÀM TẢI DỮ LIỆU ---
  function loadProductData() {
      const s3FileUrl = "https://productdata19971998.s3.ap-southeast-1.amazonaws.com/processed_new.txt";
      const urlWithTimestamp = `${s3FileUrl}?t=${new Date().getTime()}`;
      return fetch(urlWithTimestamp)
          .then(response => {
              if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
              return response.text();
          })
          .then(data => {
              const lines = data.split('\n');
              productData = []; // Xóa dữ liệu cũ
              lines.forEach(line => {
                  const [parentCode, size, stock, price, imageUrl] = line.split(',').map(item => item.trim());
                  if (parentCode && size && stock && price) {
                      productData.push({
                          parentCode: parentCode.toUpperCase(), // Chuẩn hóa mã thành chữ IN HOA
                          size: size,
                          stock: parseInt(stock, 10),
                          price: parseFloat(price),
                          imageUrl: imageUrl || null
                      });
                  }
              });
              console.log('Product data loaded.');
          });
  }

  function loadLocationData() {
      const locationS3Url = "https://productdata19971998.s3.ap-southeast-1.amazonaws.com/location_new.txt";
      const urlWithTimestamp = `${locationS3Url}?t=${new Date().getTime()}`;
      return fetch(urlWithTimestamp)
          .then(response => {
              if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
              return response.text();
          })
          .then(data => {
              const lines = data.split('\n');
              locationData = {}; // Dùng object để tra cứu nhanh hơn
              lines.forEach(line => {
                  const parts = line.split(',');
                  if (parts.length >= 2) {
                      const code = parts[0].trim().toUpperCase(); // Chuẩn hóa mã
                      const location = parts.slice(1).join(',').trim();
                      locationData[code] = location;
                  }
              });
              console.log('Location data loaded.');
          });
  }

  // --- HÀM TÌM KIẾM VÀ HIỂN THỊ ---
  function searchAndDisplay(code) {
      if (!dataLoaded) {
          alert("Dữ liệu đang được tải, vui lòng thử lại sau giây lát.");
          return;
      }
      
      const searchCode = code.trim().toUpperCase();
      if (!searchCode) {
          alert("Vui lòng nhập mã sản phẩm!");
          return;
      }

      const results = productData.filter(p => p.parentCode === searchCode);
      sizeListEl.innerHTML = ''; // Xóa kết quả cũ

      if (results.length > 0) {
          const firstProductWithImage = results.find(p => p.imageUrl && p.imageUrl !== 'null');
          imageEl.src = firstProductWithImage ? firstProductWithImage.imageUrl : 'comap_logo.jpg';
          imageEl.alt = `Hình ảnh cho sản phẩm ${searchCode}`;

          priceEl.textContent = `${results[0].price.toLocaleString('vi-VN')}đ`;
          locationEl.textContent = locationData[searchCode] || 'Chưa có vị trí';

          results.sort((a, b) => a.size.localeCompare(b.size)); // Sắp xếp size
          results.forEach(product => {
              const listItem = document.createElement('li');
              if (product.stock === 0) {
                  listItem.classList.add('out-of-stock');
              }
              listItem.innerHTML = `
                  <span class="sz">${product.size}</span>
                  <span class="sep">|</span>
                  <span class="qty">${product.stock > 0 ? product.stock : 'Hết'}</span>
              `;
              sizeListEl.appendChild(listItem);
          });
      } else {
          alert(`Không tìm thấy sản phẩm với mã: ${searchCode}`);
          imageEl.src = 'comap_logo.jpg';
          imageEl.alt = 'Không tìm thấy sản phẩm';
          priceEl.textContent = 'N/A';
          locationEl.textContent = 'N/A';
      }
      
      resultInput.value = '';
      resultInput.focus();
  }

  // --- HÀM CHÍNH & GẮN SỰ KIỆN ---
  function handleInitialSearch() {
      const code = welcomeInput.value;
      if (!code.trim()) {
          alert("Vui lòng nhập mã sản phẩm!");
          return;
      }
      welcomePageContainer.style.display = 'none';
      resultPageContainer.style.display = 'block';
      searchAndDisplay(code);
  }

  welcomeInput.focus();
  welcomeButton.addEventListener('click', handleInitialSearch);
  welcomeInput.addEventListener('keydown', (event) => {
      if (event.key === "Enter") {
          event.preventDefault();
          handleInitialSearch();
      }
  });

  resultButton.addEventListener('click', () => searchAndDisplay(resultInput.value));
  resultInput.addEventListener('keydown', (event) => {
      if (event.key === "Enter") {
          event.preventDefault();
          searchAndDisplay(resultInput.value);
      }
  });
  
  // Tải tất cả dữ liệu
  Promise.all([loadProductData(), loadLocationData()])
      .then(() => {
          dataLoaded = true;
          console.log('Tất cả dữ liệu đã được tải và sẵn sàng.');
      })
      .catch(error => {
          console.error('Lỗi khi tải dữ liệu:', error);
          alert('Không thể tải dữ liệu sản phẩm. Vui lòng kiểm tra kết nối mạng và thử lại.');
      });
});