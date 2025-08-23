document.addEventListener('DOMContentLoaded', () => {
  let productData = [];
  let locationData = {};
  let dataLoaded = false;

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
      alert("Lỗi: Không tìm thấy các trang chính.");
      return;
  }

  function loadProductData() {
      const s3FileUrl = "https://productdata19971998.s3.ap-southeast-1.amazonaws.com/processed_new.txt";
      return fetch(`${s3FileUrl}?t=${new Date().getTime()}`).then(res => res.text()).then(data => {
          productData = data.split('\n').map(line => {
              const [parentCode, size, stock, price, imageUrl] = line.split(',').map(item => item.trim());
              if (parentCode && size && stock && price) {
                  return { parentCode: parentCode.toUpperCase(), size, stock: parseInt(stock, 10), price: parseFloat(price), imageUrl: imageUrl || null };
              }
              return null;
          }).filter(p => p);
      });
  }

  function loadLocationData() {
      const locationS3Url = "https://productdata19971998.s3.ap-southeast-1.amazonaws.com/location_new.txt";
      return fetch(`${locationS3Url}?t=${new Date().getTime()}`).then(res => res.text()).then(data => {
          locationData = {};
          data.split('\n').forEach(line => {
              const parts = line.split(',');
              if (parts.length >= 2) {
                  locationData[parts[0].trim().toUpperCase()] = parts.slice(1).join(',').trim();
              }
          });
      });
  }

  function searchAndDisplay(code) {
      if (!dataLoaded) { alert("Dữ liệu đang tải..."); return; }
      const searchCode = code.trim().toUpperCase();
      if (!searchCode) { return; }

      const results = productData.filter(p => p.parentCode === searchCode);
      sizeListEl.innerHTML = '';

      if (results.length > 0) {
          const firstProductWithImage = results.find(p => p.imageUrl && p.imageUrl !== 'null');
          const imageUrl = firstProductWithImage ? firstProductWithImage.imageUrl : 'comap_logo.jpg';
          imageBackgroundEl.style.backgroundImage = `url('${imageUrl}')`;
          imageDesktopEl.src = imageUrl;
          priceEl.textContent = `${results[0].price.toLocaleString('vi-VN')}đ`;
          locationEl.textContent = locationData[searchCode] || 'Chưa có vị trí';

          results
              .filter(product => product.stock > 0)
              .sort((a, b) => a.size.localeCompare(b.size))
              .forEach(product => {
                  const li = document.createElement('li');
                  li.innerHTML = `<span class="sz">${product.size}</span><span class="sep">|</span><span class="qty">${product.stock}</span>`;
                  sizeListEl.appendChild(li);
              });
      } else {
          alert(`Không tìm thấy mã: ${searchCode}`);
          const defaultImg = 'comap_logo.jpg';
          imageBackgroundEl.style.backgroundImage = `url('${defaultImg}')`;
          imageDesktopEl.src = defaultImg;
          priceEl.textContent = 'N/A';
          locationEl.textContent = 'N/A';
      }
      resultInput.value = '';
      resultInput.focus();
  }
  
  function handleInitialSearch() {
      const code = welcomeInput.value;
      if (!code.trim()) { alert("Vui lòng nhập mã!"); return; }
      welcomePageContainer.style.display = 'none';
      resultPageContainer.style.display = 'block';
      searchAndDisplay(code);
  }

  welcomeInput.focus();
  welcomeButton.addEventListener('click', handleInitialSearch);
  welcomeInput.addEventListener('keydown', (e) => { if (e.key === "Enter") { e.preventDefault(); handleInitialSearch(); } });
  resultButton.addEventListener('click', () => searchAndDisplay(resultInput.value));
  resultInput.addEventListener('keydown', (e) => { if (e.key === "Enter") { e.preventDefault(); searchAndDisplay(resultInput.value); } });
  
  Promise.all([loadProductData(), loadLocationData()])
      .then(() => { dataLoaded = true; console.log('Dữ liệu đã sẵn sàng.'); })
      .catch(error => { console.error('Lỗi tải dữ liệu:', error); alert('Không thể tải dữ liệu sản phẩm.'); });
});