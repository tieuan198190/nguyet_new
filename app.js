let productData = [];
let locationData = [];
let dataLoaded = false;

// Load dữ liệu sản phẩm từ S3
function loadProductData() {
    const s3FileUrl = "https://productdata198170.s3.ap-southeast-1.amazonaws.com/processed_data.txt";
    const urlWithTimestamp = `${s3FileUrl}?t=${new Date().getTime()}`; // Thêm timestamp để tránh cache

    return fetch(urlWithTimestamp)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.text();
        })
        .then(data => {
            const lines = data.split('\n');
            productData = []; // Xóa dữ liệu cũ để cập nhật mới
            lines.forEach(line => {
                const [parentCode, size, stock, imageUrl] = line.split(',').map(item => item.trim());
                productData.push({
                    parentCode: parentCode.trim(),
                    size: size.trim(),
                    stock: parseInt(stock, 10),
                    imageUrl: imageUrl ? imageUrl.trim() : null
                });
            });
            console.log('Product data loaded:', productData);
        })
        .catch(error => {
            console.error('Error loading product data:', error);
            alert('Không thể tải dữ liệu sản phẩm. Vui lòng thử lại sau.');
        });
}

// Load dữ liệu vị trí từ file nội bộ
function loadLocationData() {
    return fetch('location.txt')
        .then(response => response.text())
        .then(data => {
            const lines = data.split('\n');
            locationData = []; // Xóa dữ liệu cũ
            lines.forEach(line => {
                const [parentCode, shelf, row] = line.split(',').map(item => item.trim());
                locationData.push({
                    parentCode: parentCode.trim(),
                    shelf: shelf.trim(),
                    row: row.trim()
                });
            });
            console.log('Location data loaded:', locationData);
        })
        .catch(error => console.error('Error loading location data:', error));
}

// Tìm kiếm sản phẩm
function searchProduct() {
    if (!dataLoaded) {
        alert("Đang chạy. Đợi 5-10 giây đi!");
        return;
    }

    const productCode = document.getElementById('productCode').value.trim().toLowerCase();
    const locationDiv = document.getElementById('location-info');
    const sizeList = document.getElementById('size-list');
    const productImage = document.getElementById('product-image');

    // Xóa nội dung cũ
    sizeList.innerHTML = '';
    locationDiv.innerHTML = '';
    productImage.style.display = 'none';

    // Lọc dữ liệu
    const locations = locationData.filter(loc => loc.parentCode.toLowerCase() === productCode);
    const results = productData.filter(product => product.parentCode.toLowerCase() === productCode);

    // Hiển thị kết quả
    if (results.length === 0) {
        alert("SAI MÃ SẢN PHẨM!");
        return;
    }

    // Hiển thị thông tin vị trí
    if (locations.length > 0) {
        const location = locations[locations.length - 1];
        locationDiv.innerHTML = `${location.shelf.toUpperCase()}, ${location.row.toUpperCase()}`;
    } else {
        locationDiv.innerHTML = 'Không Có Vị Trí';
    }

    // Hiển thị size và stock
    let hasStock = false;
    results.forEach(product => {
        if (product.stock > 0) {
            sizeList.innerHTML += `<p><b>${product.stock}</b> ${product.size}</p>`;
            hasStock = true;
        }
    });

    if (!hasStock) {
        sizeList.innerHTML = '<p>Hết hàng</p>';
    }

    // Hiển thị hình ảnh sản phẩm
    const imageUrl = results.find(product => product.imageUrl)?.imageUrl || null;
    if (imageUrl) {
        productImage.src = imageUrl;
        productImage.style.display = 'block';
    }
}

// Khi trang được tải
window.onload = function() {
    Promise.all([loadProductData(), loadLocationData()])
        .then(() => {
            console.log('Both data files have been loaded');
            dataLoaded = true;
        })
        .catch(error => {
            console.error('Error loading data:', error);
            alert('There was an error loading the data files. Please try again later.');
        });
};
