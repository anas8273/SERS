<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SERS Backend Test Dashboard</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: '#6366f1',
                        secondary: '#8b5cf6',
                    }
                }
            }
        }
    </script>
    <style>
        .card { @apply bg-white rounded-xl shadow-lg p-6 mb-6; }
        .btn { @apply px-4 py-2 rounded-lg font-medium transition-all duration-200 disabled:opacity-50; }
        .btn-primary { @apply bg-indigo-600 text-white hover:bg-indigo-700; }
        .btn-secondary { @apply bg-gray-200 text-gray-800 hover:bg-gray-300; }
        .btn-danger { @apply bg-red-500 text-white hover:bg-red-600; }
        .btn-success { @apply bg-green-500 text-white hover:bg-green-600; }
        .input { @apply w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent; }
        .label { @apply block text-sm font-medium text-gray-700 mb-1; }
        .section-title { @apply text-xl font-bold text-gray-800 mb-4 flex items-center gap-2; }
        .toast { @apply fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300; }
        .product-card { @apply bg-gray-50 rounded-lg p-4 border hover:shadow-md transition-shadow; }
    </style>
</head>
<body class="bg-gradient-to-br from-indigo-50 to-purple-50 min-h-screen">
    <!-- Toast Container -->
    <div id="toast-container"></div>

    <!-- Header -->
    <header class="bg-white shadow-sm sticky top-0 z-40">
        <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
            <h1 class="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                🧪 SERS Backend Test Dashboard
            </h1>
            <div id="user-status" class="flex items-center gap-4">
                <span class="text-gray-500">غير مسجل</span>
            </div>
        </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-8">
        <!-- Quick Info -->
        <div class="bg-indigo-100 rounded-xl p-4 mb-6 flex flex-wrap gap-4 items-center justify-between">
            <div>
                <strong>بيانات الاختبار:</strong>
                <code class="bg-white px-2 py-1 rounded mx-2">admin@sers.com</code> /
                <code class="bg-white px-2 py-1 rounded mx-2">password</code>
            </div>
            <div>
                <strong>Base URL:</strong>
                <code id="base-url" class="bg-white px-2 py-1 rounded">http://localhost:8000/api</code>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- ==================== AUTH SECTION ==================== -->
            <div class="card">
                <h2 class="section-title">
                    <span>🔐</span> المصادقة (Auth)
                </h2>
                
                <!-- Login Form -->
                <div id="login-section">
                    <h3 class="font-semibold mb-2">تسجيل الدخول</h3>
                    <div class="space-y-3">
                        <input type="email" id="login-email" class="input" placeholder="البريد الإلكتروني" value="admin@sers.com">
                        <input type="password" id="login-password" class="input" placeholder="كلمة المرور" value="password">
                        <button onclick="login()" class="btn btn-primary w-full">تسجيل الدخول</button>
                    </div>
                </div>

                <!-- Register Form (collapsed) -->
                <details class="mt-4">
                    <summary class="cursor-pointer font-semibold text-indigo-600">📝 تسجيل حساب جديد</summary>
                    <div class="mt-3 space-y-3">
                        <input type="text" id="reg-name" class="input" placeholder="الاسم">
                        <input type="email" id="reg-email" class="input" placeholder="البريد الإلكتروني">
                        <input type="password" id="reg-password" class="input" placeholder="كلمة المرور">
                        <input type="password" id="reg-password-confirm" class="input" placeholder="تأكيد كلمة المرور">
                        <button onclick="register()" class="btn btn-success w-full">إنشاء حساب</button>
                    </div>
                </details>

                <!-- Social Login -->
                <details class="mt-4">
                    <summary class="cursor-pointer font-semibold text-indigo-600">🔗 تسجيل دخول اجتماعي (Firebase)</summary>
                    <div class="mt-3 space-y-3">
                        <textarea id="firebase-token" class="input" rows="3" placeholder="Firebase ID Token"></textarea>
                        <button onclick="socialLogin()" class="btn btn-secondary w-full">تسجيل دخول بـ Firebase</button>
                    </div>
                </details>

                <!-- User Info (shown when logged in) -->
                <div id="user-info" class="mt-4 p-4 bg-green-50 rounded-lg hidden">
                    <h3 class="font-semibold mb-2">👤 المستخدم الحالي</h3>
                    <pre id="user-data" class="text-sm bg-white p-3 rounded overflow-auto max-h-40"></pre>
                    <button onclick="logout()" class="btn btn-danger mt-3">تسجيل الخروج</button>
                </div>
            </div>

            <!-- ==================== CATEGORIES SECTION ==================== -->
            <div class="card">
                <h2 class="section-title">
                    <span>📁</span> التصنيفات (Categories)
                </h2>
                <button onclick="loadCategories()" class="btn btn-primary mb-4">تحميل التصنيفات</button>
                <div id="categories-list" class="grid grid-cols-2 gap-3">
                    <p class="text-gray-500 col-span-2">اضغط لتحميل التصنيفات</p>
                </div>
            </div>

            <!-- ==================== PRODUCTS SECTION ==================== -->
            <div class="card lg:col-span-2">
                <h2 class="section-title">
                    <span>🛍️</span> المنتجات (Products)
                </h2>

                <!-- Search & Filters -->
                <div class="flex flex-wrap gap-3 mb-4">
                    <input type="text" id="product-search" class="input flex-1" placeholder="بحث عن منتج...">
                    <button onclick="searchProducts()" class="btn btn-primary">بحث</button>
                    <button onclick="loadProducts()" class="btn btn-secondary">كل المنتجات</button>
                    <button onclick="loadFeatured()" class="btn btn-secondary">المميزة</button>
                </div>

                <!-- Products Grid -->
                <div id="products-grid" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <p class="text-gray-500">اضغط لتحميل المنتجات</p>
                </div>

                <!-- Admin: Create Product -->
                <details class="mt-4 border-t pt-4">
                    <summary class="cursor-pointer font-semibold text-purple-600">⚙️ إدارة المنتجات (Admin)</summary>
                    <div class="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" id="prod-name-ar" class="input" placeholder="الاسم بالعربية">
                        <input type="text" id="prod-name-en" class="input" placeholder="Name in English">
                        <input type="text" id="prod-slug" class="input" placeholder="Slug (اختياري)">
                        <input type="number" id="prod-price" class="input" placeholder="السعر" step="0.01">
                        <select id="prod-type" class="input">
                            <option value="interactive">تفاعلي</option>
                            <option value="downloadable">قابل للتحميل</option>
                        </select>
                        <input type="text" id="prod-category" class="input" placeholder="Category ID (UUID)">
                        <textarea id="prod-desc-ar" class="input col-span-2" placeholder="الوصف بالعربية"></textarea>
                        <textarea id="prod-desc-en" class="input col-span-2" placeholder="Description in English"></textarea>
                        <div class="col-span-2 flex gap-3">
                            <button onclick="createProduct()" class="btn btn-success">➕ إضافة منتج</button>
                            <button onclick="loadAdminProducts()" class="btn btn-secondary">📋 عرض كل المنتجات (Admin)</button>
                        </div>
                    </div>
                </details>
            </div>

            <!-- ==================== ORDERS SECTION ==================== -->
            <div class="card">
                <h2 class="section-title">
                    <span>🛒</span> سلة المشتريات والطلبات
                </h2>

                <!-- Cart -->
                <div class="mb-4 p-4 bg-gray-50 rounded-lg">
                    <h3 class="font-semibold mb-2">السلة</h3>
                    <div id="cart-items" class="space-y-2 mb-3">
                        <p class="text-gray-500 text-sm">السلة فارغة</p>
                    </div>
                    <div class="flex justify-between items-center border-t pt-3">
                        <span class="font-bold">المجموع: <span id="cart-total">0</span> ر.س</span>
                        <button onclick="createOrder()" class="btn btn-success" id="create-order-btn" disabled>إنشاء طلب</button>
                    </div>
                </div>

                <!-- Orders List -->
                <button onclick="loadOrders()" class="btn btn-primary mb-3">تحميل الطلبات</button>
                <div id="orders-list" class="space-y-3">
                    <p class="text-gray-500 text-sm">اضغط لتحميل الطلبات</p>
                </div>
            </div>

            <!-- ==================== PAYMENTS SECTION ==================== -->
            <div class="card">
                <h2 class="section-title">
                    <span>💳</span> الدفع (Stripe)
                </h2>
                <div class="space-y-3">
                    <input type="text" id="payment-order-id" class="input" placeholder="Order ID (UUID)">
                    <button onclick="createPaymentIntent()" class="btn btn-primary w-full">إنشاء نية دفع</button>
                    <div id="payment-result" class="p-4 bg-gray-50 rounded-lg hidden">
                        <h4 class="font-semibold mb-2">نتيجة الدفع:</h4>
                        <pre id="payment-data" class="text-sm overflow-auto"></pre>
                    </div>
                </div>
            </div>

            <!-- ==================== RECORDS SECTION ==================== -->
            <div class="card">
                <h2 class="section-title">
                    <span>📄</span> السجلات التفاعلية (Firestore)
                </h2>
                <button onclick="loadRecords()" class="btn btn-primary mb-4">تحميل السجلات</button>
                <div id="records-list" class="space-y-3">
                    <p class="text-gray-500">اضغط لتحميل السجلات</p>
                </div>
                
                <!-- Update Record Form -->
                <details class="mt-4">
                    <summary class="cursor-pointer font-semibold text-indigo-600">تحديث سجل</summary>
                    <div class="mt-3 space-y-3">
                        <input type="text" id="record-id" class="input" placeholder="Record ID">
                        <textarea id="record-data" class="input" rows="4" placeholder='{"field": "value"}'></textarea>
                        <button onclick="updateRecord()" class="btn btn-success">تحديث السجل</button>
                    </div>
                </details>
            </div>

            <!-- ==================== AI SECTION ==================== -->
            <div class="card">
                <h2 class="section-title">
                    <span>🤖</span> الذكاء الاصطناعي
                </h2>
                <div class="space-y-3">
                    <input type="text" id="ai-record-id" class="input" placeholder="Record ID">
                    <input type="text" id="ai-field-name" class="input" placeholder="اسم الحقل">
                    <textarea id="ai-prompt" class="input" rows="3" placeholder="اكتب طلبك هنا..."></textarea>
                    <button onclick="requestAISuggestion()" class="btn btn-primary w-full">طلب اقتراح</button>
                    <div id="ai-result" class="p-4 bg-purple-50 rounded-lg hidden">
                        <h4 class="font-semibold mb-2">اقتراح الذكاء الاصطناعي:</h4>
                        <p id="ai-suggestion" class="text-gray-700"></p>
                        <div class="flex gap-2 mt-3">
                            <button onclick="acceptAISuggestion()" class="btn btn-success btn-sm">✓ قبول</button>
                            <button onclick="rejectAISuggestion()" class="btn btn-danger btn-sm">✗ رفض</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ==================== API RESPONSE LOG ==================== -->
        <div class="card mt-6">
            <h2 class="section-title">
                <span>📜</span> سجل الاستجابات
                <button onclick="clearLog()" class="btn btn-secondary text-sm mr-auto">مسح</button>
            </h2>
            <div id="response-log" class="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-80 overflow-auto">
                Waiting for API calls...
            </div>
        </div>
    </main>

    <script>
        // ==================== CONFIG ====================
        const BASE_URL = '/api';
        let authToken = localStorage.getItem('sers_token') || null;
        let currentUser = null;
        let cart = [];
        let lastAIInteractionId = null;

        // ==================== HELPERS ====================
        function showToast(message, type = 'success') {
            const toast = document.createElement('div');
            toast.className = `toast ${type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`;
            toast.innerText = message;
            document.getElementById('toast-container').appendChild(toast);
            setTimeout(() => toast.remove(), 3000);
        }

        function log(endpoint, method, data) {
            const logEl = document.getElementById('response-log');
            const time = new Date().toLocaleTimeString('ar-EG');
            const entry = `[${time}] ${method} ${endpoint}\n${JSON.stringify(data, null, 2)}\n${'─'.repeat(60)}\n`;
            logEl.innerText = entry + logEl.innerText;
        }

        function clearLog() {
            document.getElementById('response-log').innerText = 'Log cleared...';
        }

        async function api(endpoint, method = 'GET', body = null) {
            const headers = {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            };
            if (authToken) {
                headers['Authorization'] = `Bearer ${authToken}`;
            }

            const options = { method, headers };
            if (body && method !== 'GET') {
                options.body = JSON.stringify(body);
            }

            try {
                const res = await fetch(`${BASE_URL}${endpoint}`, options);
                const data = await res.json();
                log(endpoint, method, data);
                
                if (!res.ok) {
                    showToast(data.message || 'حدث خطأ', 'error');
                }
                return data;
            } catch (err) {
                log(endpoint, method, { error: err.message });
                showToast('خطأ في الاتصال: ' + err.message, 'error');
                throw err;
            }
        }

        // ==================== AUTH ====================
        async function login() {
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            const res = await api('/auth/login', 'POST', { email, password });
            if (res.success) {
                authToken = res.data.token;
                currentUser = res.data.user;
                localStorage.setItem('sers_token', authToken);
                updateUserUI();
                showToast('تم تسجيل الدخول بنجاح');
            }
        }

        async function register() {
            const res = await api('/auth/register', 'POST', {
                name: document.getElementById('reg-name').value,
                email: document.getElementById('reg-email').value,
                password: document.getElementById('reg-password').value,
                password_confirmation: document.getElementById('reg-password-confirm').value,
            });
            if (res.success) {
                authToken = res.data.token;
                currentUser = res.data.user;
                localStorage.setItem('sers_token', authToken);
                updateUserUI();
                showToast('تم إنشاء الحساب بنجاح');
            }
        }

        async function socialLogin() {
            const token = document.getElementById('firebase-token').value;
            const res = await api('/auth/social', 'POST', { firebase_token: token });
            if (res.success) {
                authToken = res.data.token;
                currentUser = res.data.user;
                localStorage.setItem('sers_token', authToken);
                updateUserUI();
                showToast('تم تسجيل الدخول بنجاح');
            }
        }

        async function logout() {
            await api('/auth/logout', 'POST');
            authToken = null;
            currentUser = null;
            localStorage.removeItem('sers_token');
            updateUserUI();
            showToast('تم تسجيل الخروج');
        }

        async function loadCurrentUser() {
            if (!authToken) return;
            const res = await api('/auth/me');
            if (res.success) {
                currentUser = res.data.user;
                updateUserUI();
            }
        }

        function updateUserUI() {
            const userStatus = document.getElementById('user-status');
            const userInfo = document.getElementById('user-info');
            const loginSection = document.getElementById('login-section');

            if (currentUser) {
                userStatus.innerHTML = `
                    <span class="text-green-600 font-medium">${currentUser.name}</span>
                    <span class="px-2 py-1 rounded text-xs ${currentUser.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}">${currentUser.role}</span>
                `;
                userInfo.classList.remove('hidden');
                loginSection.classList.add('hidden');
                document.getElementById('user-data').innerText = JSON.stringify(currentUser, null, 2);
            } else {
                userStatus.innerHTML = '<span class="text-gray-500">غير مسجل</span>';
                userInfo.classList.add('hidden');
                loginSection.classList.remove('hidden');
            }
        }

        // ==================== CATEGORIES ====================
        async function loadCategories() {
            const res = await api('/categories');
            if (res.success) {
                const container = document.getElementById('categories-list');
                container.innerHTML = res.data.map(cat => `
                    <button onclick="filterByCategory('${cat.id}')" class="p-3 bg-indigo-50 rounded-lg text-right hover:bg-indigo-100 transition">
                        <div class="font-medium">${cat.name_ar}</div>
                        <div class="text-sm text-gray-500">${cat.products_count || 0} منتج</div>
                    </button>
                `).join('');
            }
        }

        async function filterByCategory(categoryId) {
            const res = await api(`/categories/${categoryId}`);
            if (res.success && res.data.products) {
                renderProducts(res.data.products.data || res.data.products);
            }
        }

        // ==================== PRODUCTS ====================
        async function loadProducts() {
            const res = await api('/products');
            if (res.success) {
                renderProducts(res.data.data || res.data);
            }
        }

        async function loadFeatured() {
            const res = await api('/products/featured');
            if (res.success) {
                renderProducts(res.data);
            }
        }

        async function searchProducts() {
            const q = document.getElementById('product-search').value;
            const res = await api(`/products/search?q=${encodeURIComponent(q)}`);
            if (res.success) {
                renderProducts(res.data.data || res.data);
            }
        }

        function renderProducts(products) {
            const container = document.getElementById('products-grid');
            if (!products || products.length === 0) {
                container.innerHTML = '<p class="text-gray-500 col-span-3">لا توجد منتجات</p>';
                return;
            }
            container.innerHTML = products.map(p => `
                <div class="product-card">
                    <div class="h-24 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg mb-3 flex items-center justify-center">
                        ${p.thumbnail_url ? `<img src="${p.thumbnail_url}" class="h-full w-full object-cover rounded-lg">` : '📦'}
                    </div>
                    <h4 class="font-medium">${p.name_ar || p.name}</h4>
                    <p class="text-sm text-gray-500">${p.name_en || ''}</p>
                    <div class="flex justify-between items-center mt-2">
                        <span class="font-bold text-indigo-600">${p.price} ر.س</span>
                        <span class="text-xs px-2 py-1 rounded ${p.type === 'interactive' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}">${p.type}</span>
                    </div>
                    <button onclick="addToCart('${p.id}', '${p.name_ar || p.name}', ${p.price})" class="btn btn-secondary w-full mt-3 text-sm">
                        ➕ أضف للسلة
                    </button>
                </div>
            `).join('');
        }

        async function createProduct() {
            const res = await api('/admin/products', 'POST', {
                name_ar: document.getElementById('prod-name-ar').value,
                name_en: document.getElementById('prod-name-en').value,
                slug: document.getElementById('prod-slug').value || undefined,
                price: parseFloat(document.getElementById('prod-price').value),
                type: document.getElementById('prod-type').value,
                category_id: document.getElementById('prod-category').value,
                description_ar: document.getElementById('prod-desc-ar').value,
                description_en: document.getElementById('prod-desc-en').value,
            });
            if (res.success) {
                showToast('تم إنشاء المنتج بنجاح');
                loadProducts();
            }
        }

        async function loadAdminProducts() {
            const res = await api('/admin/products');
            if (res.success) {
                renderProducts(res.data.data || res.data);
            }
        }

        // ==================== CART & ORDERS ====================
        function addToCart(productId, name, price) {
            cart.push({ product_id: productId, name, price });
            updateCartUI();
            showToast(`تمت إضافة "${name}" للسلة`);
        }

        function updateCartUI() {
            const container = document.getElementById('cart-items');
            const total = cart.reduce((sum, item) => sum + item.price, 0);
            
            if (cart.length === 0) {
                container.innerHTML = '<p class="text-gray-500 text-sm">السلة فارغة</p>';
                document.getElementById('create-order-btn').disabled = true;
            } else {
                container.innerHTML = cart.map((item, i) => `
                    <div class="flex justify-between items-center bg-white p-2 rounded">
                        <span>${item.name}</span>
                        <div class="flex items-center gap-2">
                            <span class="font-medium">${item.price} ر.س</span>
                            <button onclick="removeFromCart(${i})" class="text-red-500 text-sm">✕</button>
                        </div>
                    </div>
                `).join('');
                document.getElementById('create-order-btn').disabled = false;
            }
            document.getElementById('cart-total').innerText = total.toFixed(2);
        }

        function removeFromCart(index) {
            cart.splice(index, 1);
            updateCartUI();
        }

        async function createOrder() {
            if (cart.length === 0) return;
            const items = cart.map(item => ({ product_id: item.product_id }));
            const res = await api('/orders', 'POST', { items });
            if (res.success) {
                showToast('تم إنشاء الطلب بنجاح');
                document.getElementById('payment-order-id').value = res.data.id;
                cart = [];
                updateCartUI();
                loadOrders();
            }
        }

        async function loadOrders() {
            const res = await api('/orders');
            if (res.success) {
                const orders = res.data.data || res.data;
                document.getElementById('orders-list').innerHTML = orders.length ? orders.map(o => `
                    <div class="p-3 bg-gray-50 rounded-lg">
                        <div class="flex justify-between">
                            <span class="font-medium">${o.order_number || o.id.slice(0, 8)}</span>
                            <span class="px-2 py-1 rounded text-xs ${o.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}">${o.status}</span>
                        </div>
                        <div class="text-sm text-gray-500 mt-1">${o.total} ر.س</div>
                        <button onclick="document.getElementById('payment-order-id').value='${o.id}'" class="text-indigo-600 text-sm mt-2">استخدام للدفع →</button>
                    </div>
                `).join('') : '<p class="text-gray-500 text-sm">لا توجد طلبات</p>';
            }
        }

        // ==================== PAYMENTS ====================
        async function createPaymentIntent() {
            const orderId = document.getElementById('payment-order-id').value;
            if (!orderId) {
                showToast('أدخل Order ID أولاً', 'error');
                return;
            }
            const res = await api('/payments/create-intent', 'POST', { order_id: orderId });
            if (res.success) {
                document.getElementById('payment-result').classList.remove('hidden');
                document.getElementById('payment-data').innerText = JSON.stringify(res.data, null, 2);
                showToast('تم إنشاء نية الدفع');
            }
        }

        // ==================== RECORDS ====================
        async function loadRecords() {
            const res = await api('/records');
            if (res.success) {
                const records = res.data;
                document.getElementById('records-list').innerHTML = records.length ? records.map(r => `
                    <div class="p-3 bg-gray-50 rounded-lg">
                        <div class="font-medium">${r.id}</div>
                        <div class="text-sm text-gray-500">${r.product?.name_ar || 'منتج'}</div>
                        <button onclick="document.getElementById('record-id').value='${r.id}'" class="text-indigo-600 text-sm mt-2">تحديد للتحديث →</button>
                    </div>
                `).join('') : '<p class="text-gray-500">لا توجد سجلات</p>';
            }
        }

        async function updateRecord() {
            const recordId = document.getElementById('record-id').value;
            let userData;
            try {
                userData = JSON.parse(document.getElementById('record-data').value);
            } catch {
                showToast('البيانات ليست JSON صالح', 'error');
                return;
            }
            const res = await api(`/records/${recordId}`, 'PUT', { user_data: userData });
            if (res.success) {
                showToast('تم تحديث السجل بنجاح');
            }
        }

        // ==================== AI ====================
        async function requestAISuggestion() {
            const res = await api('/ai/suggest', 'POST', {
                record_id: document.getElementById('ai-record-id').value,
                field_name: document.getElementById('ai-field-name').value,
                prompt: document.getElementById('ai-prompt').value,
            });
            if (res.success) {
                lastAIInteractionId = res.data.interaction_id;
                document.getElementById('ai-result').classList.remove('hidden');
                document.getElementById('ai-suggestion').innerText = res.data.suggestion;
                showToast('تم استلام الاقتراح');
            }
        }

        async function acceptAISuggestion() {
            if (!lastAIInteractionId) return;
            await api('/ai/accept', 'POST', { interaction_id: lastAIInteractionId, accepted: true });
            showToast('تم قبول الاقتراح');
        }

        async function rejectAISuggestion() {
            if (!lastAIInteractionId) return;
            await api('/ai/accept', 'POST', { interaction_id: lastAIInteractionId, accepted: false });
            showToast('تم رفض الاقتراح');
            document.getElementById('ai-result').classList.add('hidden');
        }

        // ==================== INIT ====================
        document.addEventListener('DOMContentLoaded', () => {
            if (authToken) {
                loadCurrentUser();
            }
            updateCartUI();
        });
    </script>
</body>
</html>
