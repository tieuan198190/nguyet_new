let productData = [];
let locationData = [];
let dataLoaded = false;

// --- CÁC HÀM TẢI DỮ LIỆU (KHÔNG THAY ĐỔI NHIỀU) ---

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
      productData = [];
      lines.forEach(line => {
        const [parentCode, size, stock, price, imageUrl] = line.split(',').map(item => item.trim());
        if (parentCode && size && stock && price) {
          productData.push({
            parentCode: parentCode,
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
      locationData = [];
      lines.forEach(line => {
        const parts = line.split(',').map(item => item.trim());
        if (parts.length >= 3) {
          const [parentCode, shelf, row] = parts;
          if (parentCode && shelf && row) {
            locationData.push({ parentCode, shelf, row });
          }
        }
      });
      console.log('Location data loaded.');
    });
}

// --- HÀM TÌM KIẾM VÀ HIỂN THỊ KẾT QUẢ (ĐƯỢC TỐI ƯU) ---

function searchAndDisplay(productCode) {
  if (!dataLoaded) {
    alert("Dữ liệu chưa tải xong, vui lòng đợi!");
    return;
  }
  
  const code = productCode.trim().toLowerCase();
  if (!code) {
      alert("Vui lòng nhập mã sản phẩm!");
      return;
  }

  // Lấy các element để hiển thị kết quả
  const locationDiv = document.getElementById('location-info');
  const sizeList = document.getElementById('size-list');
  const productImage = document.getElementById('product-image');
  const priceDiv = document.getElementById('product-price');
  const resultInputField = document.getElementById('productCode');

  // Xóa nội dung cũ
  locationDiv.innerHTML = 'Không có vị trí';
  sizeList.innerHTML = '';
  productImage.style.display = 'none';
  priceDiv.innerHTML = '';

  const results = productData.filter(product => product.parentCode.toLowerCase() === code);

  if (results.length === 0) {
    alert("Sai Mã Sản Phẩm!");
    setTimeout(() => {
        resultInputField.value = "";
        resultInputField.focus();
    }, 500);
    return;
  }

  // Hiển thị thông tin
  const location = locationData.find(loc => loc.parentCode.toLowerCase() === code);
  if (location) {
    locationDiv.innerHTML = `<b>${location.shelf.toUpperCase()}</b><br><b>${location.row.toUpperCase()}</b>`;
  }

  if (results[0]?.price) {
    priceDiv.innerHTML = `Giá: <b>${results[0].price.toLocaleString('vi-VN')} VND</b>`;
  }
  
  if (results[0]?.imageUrl) {
    productImage.src = results[0].imageUrl;
    productImage.style.display = 'block';
  }

  // Sắp xếp và hiển thị size
  const sizeOrder = ["S", "M", "L", "XL", "XXL", "2XL", "3XL", "4XL", "5XL"];
  const compareSizes = (a, b) => {
      const indexA = sizeOrder.indexOf(a.size.toUpperCase());
      const indexB = sizeOrder.indexOf(b.size.toUpperCase());
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
  };
  const productsInStock = results.filter(product => product.stock > 0).sort(compareSizes);

  if (productsInStock.length > 0) {
    productsInStock.forEach(product => {
      sizeList.innerHTML += `<p><b>${product.stock}</b> ${product.size.toUpperCase()}</p>`;
    });
  } else {
    sizeList.innerHTML = '<p>Hết hàng</p>';
  }
  
  // Reset ô input trên trang kết quả và focus vào đó
  setTimeout(() => {
    resultInputField.value = "";
    resultInputField.focus();
  }, 500);
}

// --- KHỞI TẠO KHI TRANG TẢI XONG (PHẦN QUAN TRỌNG NHẤT) ---

window.onload = function() {
  // Lấy tất cả các phần tử cần thiết từ HTML
  const welcomePage = document.getElementById('welcome-page');
  const resultPage = document.getElementById('result-page');
  const welcomeInput = document.getElementById('welcomeProductCode');
  const welcomeButton = document.getElementById('welcomeSearchButton');
  const resultInput = document.getElementById('productCode');
  const resultButton = document.getElementById('resultSearchButton');

  // Kiểm tra để chắc chắn tất cả các phần tử đều tồn tại
  if (!welcomePage || !resultPage || !welcomeInput || !welcomeButton || !resultInput || !resultButton) {
      console.error("Lỗi: Một hoặc nhiều phần tử HTML không được tìm thấy. Hãy kiểm tra lại ID trong file HTML.");
      return;
  }

  // Tự động focus vào ô nhập liệu đầu tiên
  welcomeInput.focus();

  // Hàm xử lý tìm kiếm ban đầu và chuyển trang
  function handleInitialSearch() {
    const code = welcomeInput.value;
    if (!code.trim()) {
        alert("Vui lòng nhập mã sản phẩm!");
        return;
    }
    // Chuyển trang và tìm kiếm
    welcomePage.style.display = 'none';
    resultPage.style.display = 'block';
    searchAndDisplay(code);
  }

  // Gắn sự kiện cho trang chào mừng (Welcome Page)
  welcomeButton.addEventListener('click', handleInitialSearch);
  welcomeInput.addEventListener('keydown', function(event) {
    if (event.key === "Enter") {
      event.preventDefault(); // Ngăn hành vi mặc định của Enter
      handleInitialSearch();
    }
  });

  // Gắn sự kiện cho trang kết quả (Result Page)
  resultButton.addEventListener('click', () => searchAndDisplay(resultInput.value));
  resultInput.addEventListener('keydown', function(event) {
      if (event.key === "Enter") {
        event.preventDefault();
        searchAndDisplay(resultInput.value);
      }
  });
  
  // Tải dữ liệu sau khi đã gắn các sự kiện
  Promise.all([loadProductData(), loadLocationData()])
    .then(() => {
      dataLoaded = true;
      console.log('Tất cả dữ liệu đã được tải và sẵn sàng.');
    })
    .catch(error => {
      console.error('Lỗi nghiêm trọng khi tải dữ liệu:', error);
      alert('Có lỗi xảy ra khi tải dữ liệu. Vui lòng tải lại trang.');
    });
};
