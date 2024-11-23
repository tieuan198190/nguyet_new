let productData = [];
let locationData = [];
let dataLoaded = false;

function loadProductData() {
    return fetch('product_data.txt')
        .then(response => response.text())
        .then(data => {
            const lines = data.split('\n');
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
        .catch(error => console.error('Error loading product data:', error));
}

function loadLocationData() {
    return fetch('location.txt')
        .then(response => response.text())
        .then(data => {
            const lines = data.split('\n');
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

function searchProduct() {
    if (!dataLoaded) {
        alert("Data is still loading. Please wait.");
        return;
    }

    const productCode = document.getElementById('productCode').value.trim().toLowerCase();

    // Lấy các box
    const locationBox = document.querySelector('.location-box');
    const sizeBox = document.querySelector('.size-box');
    const imageBox = document.querySelector('.image-box');
    const resultDiv = document.getElementById('result'); // Khu vực kết quả

    // Mặc định ẩn tất cả các box
    locationBox.style.display = 'none';
    sizeBox.style.display = 'none';
    imageBox.style.display = 'none';

    // Nếu không nhập mã sản phẩm, hiển thị thông báo
    if (!productCode) {
        resultDiv.innerHTML = '<p class="error-message">Vui lòng nhập mã sản phẩm!</p>';
        return;
    }

    const locationDiv = document.getElementById('location-info');
    const sizeList = document.getElementById('size-list');
    const productImageDiv = document.getElementById('product-image');

    sizeList.innerHTML = ''; // Xóa nội dung cũ
    locationDiv.innerHTML = ''; // Xóa nội dung vị trí cũ
    productImageDiv.innerHTML = ''; // Xóa nội dung hình ảnh cũ

    const locations = locationData.filter(loc => loc.parentCode.toLowerCase() === productCode);
    const results = productData.filter(product => product.parentCode.toLowerCase() === productCode);

    // Kiểm tra mã sản phẩm
    if (results.length === 0) {
        // Hiển thị thông báo sai mã
        resultDiv.innerHTML = '<p class="error-message">SAI MÃ SẢN PHẨM!</p>';
        return;
    }

    // Xử lý hiển thị Location Box
    if (locations.length > 0) {
        const location = locations[locations.length - 1];
        locationDiv.innerHTML = `${location.shelf.toUpperCase()}, ${location.row.toUpperCase()}`;
        locationBox.style.display = 'block'; // Hiển thị box Location
    } else {
        locationDiv.innerHTML = 'Không có vị trí';
        locationBox.style.display = 'block'; // Luôn hiển thị box Location
    }

    // Xử lý hiển thị Sizes Box
    if (results.length > 0) {
        let hasStock = false;
        results.forEach(product => {
            if (product.stock > 0) {
                sizeList.innerHTML += `<li>${product.stock} - ${product.size}</li>`;
                hasStock = true;
            }
        });

        if (hasStock) {
            sizeBox.style.display = 'block'; // Hiển thị box Sizes nếu có hàng
        } else {
            sizeList.innerHTML = '<li>Hết hàng</li>';
            sizeBox.style.display = 'block';
        }
    }

    // Xử lý hiển thị Product Image Box
    const imageUrl = results.find(product => product.imageUrl)?.imageUrl || null;
    if (imageUrl) {
        productImageDiv.innerHTML = `<img src="${imageUrl}" alt="Image of product ${productCode}" />`;
        imageBox.style.display = 'block'; // Hiển thị box Product Image
    }
}




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
