// Các hàm loadProductData và loadLocationData giữ nguyên vì đã hoạt động tốt.
let productData = [];
let locationData = [];
let dataLoaded = false;

// Load dữ liệu sản phẩm từ file
function loadProductData() {
  const s3FileUrl = "https://productdata19971998.s3.ap-southeast-1.amazonaws.com/processed_new.txt";
  const urlWithTimestamp = `${s3FileUrl}?t=${new Date().getTime()}`;

  return fetch(urlWithTimestamp)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
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
    })
    .catch(error => {
      console.error('Error loading product data:', error);
      alert('Không thể tải dữ liệu sản phẩm. Vui lòng thử lại sau.');
    });
}

// Load dữ liệu vị trí từ S3
function loadLocationData() {
  const locationS3Url = "https://productdata19971998.s3.ap-southeast-1.amazonaws.com/location_new.txt";
  const urlWithTimestamp = `${locationS3Url}?t=${new Date().getTime()}`;

  return fetch(urlWithTimestamp)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
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
    })
    .catch(error => {
      console.error('Error loading location data:', error);
      alert('Không thể tải dữ liệu vị trí. Vui lòng thử lại sau.');
    });
}

// Tìm kiếm sản phẩm và hiển thị kết quả
function searchProduct() {
  if (!dataLoaded) {
    alert("Dữ liệu đang được tải, vui lòng đợi trong giây lát!");
    return;
  }

  const inputField = document.getElementById('productCode');
  const productCode = inputField.value.trim().toLowerCase();
  const locationDiv = document.getElementById('location-info');
  const sizeList = document.getElementById('size-list');
  const productImage = document.getElementById('product-image');
  const priceDiv = document.getElementById('product-price');

  // Nếu không nhập mã thì không làm gì cả
  if (!productCode) {
      return;
  }

  // Xóa nội dung cũ
  sizeList.innerHTML = '';
  locationDiv.innerHTML = 'Không có vị trí';
  productImage.style.display = 'none';
  priceDiv.innerHTML = '';

  const results = productData.filter(product => product.parentCode.toLowerCase() === productCode);

  if (results.length === 0) {
    alert("Sai Mã Sản Phẩm!");
    setTimeout(() => {
      inputField.value = "";
      inputField.focus();
    }, 500);
    return;
  }

  const location = locationData.find(loc => loc.parentCode.toLowerCase() === productCode);
  if (location) {
    locationDiv.innerHTML = `<b>${location.shelf.toUpperCase()}</b><br><b>${location.row.toUpperCase()}</b>`;
  }

  if (results[0] && typeof results[0].price !== 'undefined') {
    priceDiv.innerHTML = `Giá: <b>${results[0].price.toLocaleString('vi-VN')} VND</b>`;
  }
  
  // Sắp xếp và hiển thị size
  const sizeOrder = ["S", "M", "L", "XL", "XXL", "2XL", "3XL", "4XL", "5XL"];
  const compareSizes = (a, b) => {
    const sizeA = a.size.toUpperCase();
    const sizeB = b.size.toUpperCase();
    const indexA = sizeOrder.indexOf(sizeA);
    const indexB = sizeOrder.indexOf(sizeB);
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

  if (results[0] && results[0].imageUrl) {
    productImage.src = results[0].imageUrl;
    productImage.style.display = 'block';
  }

  // Xóa input & focus lại
  setTimeout(() => {
    inputField.value = "";
    inputField.focus();
  }, 500);
}

// Khi trang được tải, load dữ liệu và thiết lập sự kiện
window.onload = function() {
  Promise.all([loadProductData(), loadLocationData()])
    .then(() => {
      console.log('Tất cả dữ liệu đã được tải thành công.');
      dataLoaded = true;
      document.getElementById('loading-message').style.display = 'none'; // Ẩn thông báo loading
      document.getElementById('search-form').style.display = 'block'; // Hiển thị form tìm kiếm
    })
    .catch(error => {
      console.error('Lỗi nghiêm trọng khi tải dữ liệu:', error);
      alert('Có lỗi xảy ra khi tải dữ liệu. Vui lòng tải lại trang.');
    });
    
  // Gắn sự kiện vào form
  const searchForm = document.getElementById('search-form');
  if (searchForm) {
      searchForm.addEventListener('submit', function(event) {
          event.preventDefault(); // Ngăn trình duyệt tải lại trang
          searchProduct(); // Gọi hàm tìm kiếm
      });
  }
};
