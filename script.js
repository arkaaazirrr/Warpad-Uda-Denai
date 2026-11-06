/* =====================================
   POPUP SEMUA PRICELIST
===================================== */

function openAllProducts() {

    const modal =
        document.getElementById("allProductsModal");

    modal.style.display = "block";

    syncBodyLock();
}


function closeAllProducts(event) {

    const modal =
        document.getElementById("allProductsModal");


    /*
        Tutup jika:
        - tombol X ditekan
        - background popup ditekan
    */

    if (
        !event ||
        event.target === modal
    ) {

        modal.style.display = "none";

        syncBodyLock();
    }
}


/* =====================================
   DETAIL PRODUK
===================================== */

function openDetail(
    title,
    category,
    description,
    price,
    image
) {

    /*
        Masukkan informasi produk
        ke dalam popup detail
    */

    document.getElementById(
        "detailTitle"
    ).textContent = title;


    document.getElementById(
        "detailCategory"
    ).textContent = category;


    document.getElementById(
        "detailDescription"
    ).textContent = description;


    document.getElementById(
        "detailPrice"
    ).textContent = price;


    document.getElementById(
        "detailImage"
    ).src = image;


    /*
        Simpan produk yang sedang dibuka
        agar bisa ditambahkan ke keranjang.
    */

    currentDetailProduct = findProduct(title);

    const detailAddBtn =
        document.getElementById("detailAddBtn");

    if (detailAddBtn) {
        detailAddBtn.disabled = !currentDetailProduct;
    }


    /*
        Tutup popup pricelist
        terlebih dahulu
    */

    document.getElementById(
        "allProductsModal"
    ).style.display = "none";


    /*
        Buka detail produk
    */

    document.getElementById(
        "productDetailModal"
    ).style.display = "flex";


    syncBodyLock();
}


/* =====================================
   TUTUP DETAIL
===================================== */

function closeDetail(event) {

    const modal =
        document.getElementById(
            "productDetailModal"
        );


    if (
        !event ||
        event.target === modal
    ) {

        modal.style.display = "none";

        syncBodyLock();
    }
}


/* =====================================
   TOMBOL ESC
===================================== */

document.addEventListener(
    "keydown",
    function(event) {

        if (event.key !== "Escape") {
            return;
        }


        /*
            Kalau detail produk terbuka,
            tutup detail terlebih dahulu.
        */

        const detail =
            document.getElementById(
                "productDetailModal"
            );


        if (detail.style.display === "flex") {

            detail.style.display = "none";

            syncBodyLock();

            return;
        }


        /*
            Kalau popup semua pricelist terbuka,
            tutup popup tersebut.
        */

        const allProducts =
            document.getElementById(
                "allProductsModal"
            );


        if (allProducts.style.display === "block") {

            allProducts.style.display = "none";

            syncBodyLock();
        }

    }
);

/* =====================================
   TRANSAKSI UDA DENAI
   Keranjang, checkout cash, admin,
   dan riwayat transaksi (LocalStorage)
===================================== */

const PRODUCTS = [
    { id: "nasi-rendang", name: "Nasi Rendang", price: 13000, image: "rendang.jpg" },
    { id: "nasi-ayam-gulai", name: "Nasi Ayam Gulai", price: 10000, image: "ayamgulai.jpg" },
    { id: "nasi-ayam-bakar", name: "Nasi Ayam Bakar", price: 10000, image: "ayam bakar.jpg" },
    { id: "nasi-ayam-cabe-ijo", name: "Nasi Ayam Cabe Ijo", price: 10000, image: "ayamcabeijo.jpg" },
    { id: "nasi-ayam-cabe-merah", name: "Nasi Ayam Cabe Merah", price: 10000, image: "ayamcabemerah.jpeg" },
    { id: "nasi-bawal", name: "Nasi Bawal", price: 10000, image: "bawal.jpg" },
    { id: "nasi-mujair", name: "Nasi Mujair", price: 10000, image: "mujaer.jpg" },
    { id: "nasi-tongkol", name: "Nasi Tongkol", price: 10000, image: "tongkol.jpg" },
    { id: "nasi-gembung", name: "Nasi Gembung", price: 10000, image: "gembung.jpg" },
    { id: "nasi-lele", name: "Nasi Lele", price: 10000, image: "lele.jpg" },
    { id: "nasi-kikil", name: "Nasi Kikil", price: 10000, image: "kikil.jpeg" },
    { id: "nasi-telur-dadar", name: "Nasi Telur Dadar", price: 10000, image: "telurdadar.jpg" },
    { id: "nasi-telur-bulat", name: "Nasi Telur Bulat", price: 10000, image: "telurbulet.jpg" },
    { id: "nasi-ati-ampela", name: "Nasi Ati Ampela", price: 10000, image: "atiampela.jpg" }
];

const CART_KEY = "udadenai_cart_v1";
const ORDERS_KEY = "udadenai_orders_v1";
const SEQUENCE_KEY = "udadenai_order_sequence_v1";
const CLOUD_MIGRATION_KEY = "udadenai_cloud_migration_v1";

/* Nomor WhatsApp Warung Uda Denai (format internasional tanpa +).
   Ganti angka ini jika nomor warung berubah. */
const WHATSAPP_WARUNG = "6285880819798";

const ORDER_STATUSES = [
    "Menunggu",
    "Diproses",
    "Siap Diambil",
    "Selesai",
    "Dibatalkan"
];

const ACTIVE_STATUSES = [
    "Menunggu",
    "Diproses",
    "Siap Diambil"
];

let cart = normalizeCart(readStorage(CART_KEY, []));
let orders = normalizeOrders(readStorage(ORDERS_KEY, []));
let currentDetailProduct = null;
let activeAdminTab = "incoming";
let pendingAdminTab = "incoming";
let pendingAdminAccess = false;
let currentAdminUser = null;
let adminAuthResolved = false;
let cloudOrdersUnsubscribe = null;
let cloudOrdersActive = false;
let isSubmittingOrder = false;


/* =====================================
   UTILITAS PENYIMPANAN
===================================== */

function readStorage(key, fallback) {

    try {

        const raw = localStorage.getItem(key);

        if (raw === null) {
            return fallback;
        }

        return JSON.parse(raw);

    } catch (error) {

        return fallback;
    }
}

function writeStorage(key, value) {

    try {

        localStorage.setItem(key, JSON.stringify(value));

    } catch (error) {

        showToast("Data tidak dapat disimpan di browser ini.");
    }
}

function normalizeCart(items) {

    if (!Array.isArray(items)) {
        return [];
    }

    const result = [];

    items.forEach(function(item) {

        if (!item) {
            return;
        }

        const product = findProduct(item.id);

        if (!product) {
            return;
        }

        const qty = Math.max(1, parseInt(item.qty, 10) || 1);
        const existing = result.find(function(entry) {
            return entry.id === product.id;
        });

        if (existing) {
            existing.qty += qty;
        } else {
            result.push({
                id: product.id,
                qty: qty
            });
        }
    });

    return result;
}

function normalizeOrders(value) {

    if (!Array.isArray(value)) {
        return [];
    }

    return value
        .filter(function(order) {
            return order && typeof order === "object" && order.id;
        })
        .map(function(order) {

            const customer =
                order.customer && typeof order.customer === "object"
                    ? order.customer
                    : {};

            return {
                id: order.id,
                createdAt: order.createdAt || "",
                items: Array.isArray(order.items) ? order.items : [],
                total: Number(order.total) || 0,
                paymentMethod: order.paymentMethod || "Cash di Tempat",
                fulfillment: order.fulfillment || "Ambil di Warung",
                status: ORDER_STATUSES.includes(order.status)
                    ? order.status
                    : "Menunggu",
                updatedAt: order.updatedAt || "",
                customer: {
                    name: customer.name || "-",
                    notes: customer.notes || ""
                }
            };
        });
}


/* =====================================
   UTILITAS UMUM
===================================== */

function findProduct(identifier) {

    return PRODUCTS.find(function(product) {

        return product.id === identifier ||
            product.name === identifier;
    }) || null;
}

function formatRupiah(value) {

    return "Rp" + (Number(value) || 0).toLocaleString("id-ID");
}

function formatDateTime(iso) {

    const date = new Date(iso);

    if (isNaN(date.getTime())) {
        return "-";
    }

    return date.toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
}

function escapeHtml(value) {

    return String(value === undefined || value === null ? "" : value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

function showToast(message) {

    const container = document.getElementById("toastContainer");

    if (!container) {
        return;
    }

    const toast = document.createElement("div");

    toast.className = "toast";
    toast.textContent = message;

    container.appendChild(toast);

    window.setTimeout(function() {

        toast.classList.add("toast-hide");

        window.setTimeout(function() {
            toast.remove();
        }, 320);

    }, 2200);
}

function syncBodyLock() {

    const ids = [
        "allProductsModal",
        "productDetailModal",
        "cartOverlay",
        "checkoutModal",
        "confirmationModal",
        "adminLoginModal",
        "adminModal"
    ];

    const isOpen = ids.some(function(id) {

        const element = document.getElementById(id);

        if (!element) {
            return false;
        }

        return element.classList.contains("open") ||
            element.style.display === "flex" ||
            element.style.display === "block";
    });

    document.body.style.overflow = isOpen ? "hidden" : "auto";
}

function bumpCartFab() {

    const fab = document.getElementById("cartFab");

    if (!fab) {
        return;
    }

    fab.classList.remove("is-bump");
    void fab.offsetWidth;
    fab.classList.add("is-bump");

    window.setTimeout(function() {
        fab.classList.remove("is-bump");
    }, 450);
}


/* =====================================
   KERANJANG
===================================== */

function getCartDetails() {

    return cart
        .map(function(item) {

            const product = findProduct(item.id);

            if (!product) {
                return null;
            }

            const qty = Math.max(1, parseInt(item.qty, 10) || 1);

            return {
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                qty: qty,
                subtotal: product.price * qty
            };
        })
        .filter(function(item) {
            return item !== null;
        });
}

function getCartTotal() {

    return getCartDetails().reduce(function(total, item) {
        return total + item.subtotal;
    }, 0);
}

function addToCart(productIdentifier, qty) {

    const product = findProduct(productIdentifier);

    if (!product) {
        return;
    }

    const amount = Math.max(1, parseInt(qty, 10) || 1);
    const existing = cart.find(function(item) {
        return item.id === product.id;
    });

    if (existing) {
        existing.qty += amount;
    } else {
        cart.push({
            id: product.id,
            qty: amount
        });
    }

    writeStorage(CART_KEY, cart);
    updateCartUI();
    bumpCartFab();
    showToast(product.name + " ditambahkan ke keranjang.");
}

function addCurrentDetailToCart() {

    let product = currentDetailProduct;

    if (!product) {

        const title = document.getElementById("detailTitle");

        product = title
            ? findProduct(title.textContent.trim())
            : null;
    }

    if (!product) {

        showToast("Produk tidak ditemukan.");

        return;
    }

    addToCart(product.id);

    const button = document.getElementById("detailAddBtn");

    if (button) {

        button.textContent = "Ditambahkan ke Keranjang";

        window.setTimeout(function() {
            button.textContent = "+ Tambah ke Keranjang";
        }, 1400);
    }
}

function changeCartQty(productId, change) {

    const item = cart.find(function(entry) {
        return entry.id === productId;
    });

    if (!item) {
        return;
    }

    item.qty += change;

    if (item.qty <= 0) {

        cart = cart.filter(function(entry) {
            return entry.id !== productId;
        });
    }

    writeStorage(CART_KEY, cart);
    updateCartUI();
}

function removeCartItem(productId) {

    cart = cart.filter(function(item) {
        return item.id !== productId;
    });

    writeStorage(CART_KEY, cart);
    updateCartUI();

    showToast("Produk dihapus dari keranjang.");
}

function renderCartItem(item) {

    return `
        <div class="cart-item">

            <img
                src="${escapeHtml(item.image)}"
                alt="${escapeHtml(item.name)}">

            <div class="cart-item-info">

                <div class="cart-item-top">

                    <h4>${escapeHtml(item.name)}</h4>

                    <button
                        type="button"
                        class="cart-remove"
                        onclick="removeCartItem('${item.id}')">

                        Hapus

                    </button>

                </div>

                <p class="cart-item-price">
                    ${formatRupiah(item.price)} / porsi
                </p>

                <div class="cart-item-bottom">

                    <div class="qty-control">

                        <button
                            type="button"
                            onclick="changeCartQty('${item.id}', -1)"
                            aria-label="Kurangi jumlah ${escapeHtml(item.name)}">

                            &minus;

                        </button>

                        <span>${item.qty}</span>

                        <button
                            type="button"
                            onclick="changeCartQty('${item.id}', 1)"
                            aria-label="Tambah jumlah ${escapeHtml(item.name)}">

                            +

                        </button>

                    </div>

                    <strong class="cart-item-subtotal">
                        ${formatRupiah(item.subtotal)}
                    </strong>

                </div>

            </div>

        </div>
    `;
}

function updateCartUI() {

    const details = getCartDetails();
    const total = details.reduce(function(sum, item) {
        return sum + item.subtotal;
    }, 0);

    const totalQty = details.reduce(function(sum, item) {
        return sum + item.qty;
    }, 0);

    document.querySelectorAll(".cart-badge").forEach(function(badge) {
        badge.textContent = totalQty;
    });

    const itemsContainer = document.getElementById("cartItems");

    if (itemsContainer) {

        if (details.length === 0) {

            itemsContainer.innerHTML = `
                <div class="cart-empty">

                    <div class="cart-empty-icon">&#128722;</div>

                    <h3>Keranjang masih kosong</h3>

                    <p>
                        Tambahkan menu favorit Anda terlebih dahulu,
                        lalu ambil pesanan di warung.
                    </p>

                    <button
                        type="button"
                        class="btn-primary"
                        onclick="closeCart(); document.getElementById('produk').scrollIntoView({ behavior: 'smooth' })">

                        Lihat Menu

                    </button>

                </div>
            `;

        } else {

            itemsContainer.innerHTML = details.map(renderCartItem).join("");
        }
    }

    const subtotalElement = document.getElementById("cartSubtotal");
    const totalElement = document.getElementById("cartTotal");

    if (subtotalElement) {
        subtotalElement.textContent = formatRupiah(total);
    }

    if (totalElement) {
        totalElement.textContent = formatRupiah(total);
    }

    const checkoutButton = document.querySelector(
        "#cartOverlay .cart-footer .btn-primary"
    );

    if (checkoutButton) {
        checkoutButton.disabled = details.length === 0;
    }
}

function openCart() {

    updateCartUI();

    const overlay = document.getElementById("cartOverlay");

    if (!overlay) {
        return;
    }

    overlay.classList.add("open");
    syncBodyLock();
}

function closeCart(event) {

    const overlay = document.getElementById("cartOverlay");

    if (!overlay) {
        return;
    }

    if (!event || event.target === overlay) {

        overlay.classList.remove("open");
        syncBodyLock();
    }
}


/* =====================================
   CHECKOUT
===================================== */

function openCheckout() {

    if (getCartDetails().length === 0) {

        showToast("Keranjang masih kosong.");

        return;
    }

    clearCheckoutErrors();
    renderCheckoutSummary();
    closeCart();

    const modal = document.getElementById("checkoutModal");

    if (!modal) {
        return;
    }

    modal.classList.add("open");
    syncBodyLock();
}

function closeCheckout(event) {

    const modal = document.getElementById("checkoutModal");

    if (!modal) {
        return;
    }

    if (!event || event.target === modal) {

        modal.classList.remove("open");
        syncBodyLock();
    }
}

function backToCart() {

    closeCheckout();
    openCart();
}

function renderCheckoutSummary() {

    const details = getCartDetails();
    const total = details.reduce(function(sum, item) {
        return sum + item.subtotal;
    }, 0);

    const container = document.getElementById("checkoutSummaryItems");

    if (container) {

        container.innerHTML = details.map(function(item) {

            return `
                <div class="checkout-summary-item">

                    <span>
                        ${item.qty}&times; ${escapeHtml(item.name)}
                    </span>

                    <strong>
                        ${formatRupiah(item.subtotal)}
                    </strong>

                </div>
            `;
        }).join("");
    }

    const subtotal = document.getElementById("checkoutSubtotal");
    const totalElement = document.getElementById("checkoutTotal");

    if (subtotal) {
        subtotal.textContent = formatRupiah(total);
    }

    if (totalElement) {
        totalElement.textContent = formatRupiah(total);
    }
}

function setFieldError(inputId, errorId, message) {

    const input = document.getElementById(inputId);
    const error = document.getElementById(errorId);

    if (input) {
        input.classList.toggle("input-error", Boolean(message));
    }

    if (error) {
        error.textContent = message;
    }
}

function clearCheckoutErrors() {

    setFieldError("customerName", "errorCustomerName", "");
}

function validateCheckout() {

    const nameInput = document.getElementById("customerName");

    const name = nameInput ? nameInput.value.trim() : "";

    let valid = true;

    clearCheckoutErrors();

    if (name.length < 2) {

        setFieldError(
            "customerName",
            "errorCustomerName",
            "Nama pelanggan minimal 2 karakter."
        );

        valid = false;
    }

    return valid;
}

function createOrderNumber() {

    const now = new Date();

    const dateKey =
        now.getFullYear() +
        String(now.getMonth() + 1).padStart(2, "0") +
        String(now.getDate()).padStart(2, "0");

    let sequence = readStorage(SEQUENCE_KEY, null);

    if (!sequence || sequence.date !== dateKey) {

        sequence = {
            date: dateKey,
            count: 0
        };
    }

    let number = "";

    do {

        sequence.count += 1;

        number = "UDD-" + dateKey + "-" +
            String(sequence.count).padStart(4, "0");

    } while (
        orders.some(function(order) {
            return order.id === number;
        }) &&
        sequence.count < 10000
    );

    writeStorage(SEQUENCE_KEY, sequence);

    return number;
}

async function submitOrder(event) {

    event.preventDefault();

    if (isSubmittingOrder) {
        return;
    }

    if (!validateCheckout()) {
        return;
    }

    const details = getCartDetails();

    if (details.length === 0) {

        showToast("Keranjang masih kosong.");

        return;
    }

    const nameInput = document.getElementById("customerName");
    const notesInput = document.getElementById("customerNotes");

    const name = nameInput.value.trim();
    const notes = notesInput ? notesInput.value.trim() : "";

    isSubmittingOrder = true;

    const submitButton = document.getElementById("checkoutSubmitBtn");
    const originalButtonText = submitButton
        ? submitButton.textContent.trim()
        : "Pesan Sekarang";

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "Memproses...";
    }

    /* Buka tab WhatsApp lebih awal agar tetap diizinkan browser
       meskipun proses penyimpanan ke Firebase membutuhkan waktu. */
    let whatsappWindow = null;
    let orderCreated = false;

    try {
        whatsappWindow = window.open("", "_blank");

        if (whatsappWindow) {
            whatsappWindow.opener = null;
        }
    } catch (error) {
        whatsappWindow = null;
    }

    try {

        let orderNumber = "";

        if (isFirebaseReady()) {

            try {
                orderNumber = await createCloudOrderNumber();
            } catch (cloudError) {

                console.warn(
                    "Nomor pesanan cloud gagal dibuat, memakai nomor lokal.",
                    cloudError
                );

                orderNumber = createOrderNumber();
            }

        } else {

            orderNumber = createOrderNumber();
        }

        const order = {
            id: orderNumber,
            createdAt: new Date().toISOString(),
            customer: {
                name: name,
                notes: notes
            },
            items: details.map(function(item) {
                return {
                    id: item.id,
                    name: item.name,
                    price: item.price,
                    qty: item.qty,
                    subtotal: item.subtotal
                };
            }),
            total: details.reduce(function(sum, item) {
                return sum + item.subtotal;
            }, 0),
            paymentMethod: "Cash di Tempat",
            fulfillment: "Ambil di Warung",
            status: "Menunggu"
        };

        orders.unshift(order);
        writeStorage(ORDERS_KEY, orders);
        orderCreated = true;

        if (isFirebaseReady()) {

            createCloudOrder(order).catch(function(error) {

                console.error(
                    "Gagal menyimpan pesanan ke Firebase:",
                    error
                );

                showToast(
                    "Pesanan tersimpan, tetapi belum tersinkron ke Firebase."
                );
            });
        }

        cart = [];
        writeStorage(CART_KEY, cart);
        updateCartUI();

        const form = document.getElementById("checkoutForm");

        if (form) {
            form.reset();
        }

        clearCheckoutErrors();

        closeCheckout();
        showConfirmation(order);
        showToast("Pesanan berhasil dibuat.");

        const whatsappLink = buildWhatsAppOrderLink(order);

        if (whatsappWindow && !whatsappWindow.closed) {
            whatsappWindow.location.href = whatsappLink;
        } else {
            window.open(
                whatsappLink,
                "_blank",
                "noopener,noreferrer"
            );
        }

    } catch (error) {

        console.error("Gagal membuat pesanan:", error);
        showToast("Pesanan gagal diproses. Silakan coba lagi.");

    } finally {

        if (!orderCreated && whatsappWindow && !whatsappWindow.closed) {
            whatsappWindow.close();
        }

        isSubmittingOrder = false;

        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    }
}


/* =====================================
   KONFIRMASI TRANSAKSI
===================================== */

function buildWhatsAppOrderLink(order) {

    const lines = [
        "Halo Warung Uda Denai, saya sudah membuat pesanan melalui website:",
        "",
        "No. Transaksi: " + order.id,
        "Nama Pelanggan: " + order.customer.name,
        "",
        "Detail Pesanan:"
    ];

    order.items.forEach(function(item) {

        lines.push(
            "- " + item.qty + "x " + item.name +
            " = " + formatRupiah(item.subtotal)
        );
    });

    lines.push("");
    lines.push("Total Pembayaran: " + formatRupiah(order.total));
    lines.push("Metode Pembayaran: Cash di Tempat");
    lines.push("Pengambilan: Ambil di Warung");

    if (order.customer.notes) {
        lines.push("Catatan: " + order.customer.notes);
    }

    lines.push("");
    lines.push("Mohon konfirmasi pesanan saya. Terima kasih.");

    return "https://wa.me/" + WHATSAPP_WARUNG +
        "?text=" + encodeURIComponent(lines.join("\n"));
}

function showConfirmation(order) {

    const content = document.getElementById("confirmationContent");

    if (!content) {
        return;
    }

    const itemsHtml = order.items.map(function(item) {

        return `
            <li>
                <span>${item.qty}&times; ${escapeHtml(item.name)}</span>
                <strong>${formatRupiah(item.subtotal)}</strong>
            </li>
        `;
    }).join("");

    const notesHtml = order.customer.notes
        ? `
            <div class="confirmation-note">
                <strong>Catatan Tambahan:</strong>
                ${escapeHtml(order.customer.notes)}
            </div>
        `
        : "";

    const whatsappOrderLink = buildWhatsAppOrderLink(order);

    content.innerHTML = `
        <div class="success-icon">&#10003;</div>

        <h2 id="confirmationTitle">Pesanan Berhasil Dibuat!</h2>

        <p class="confirmation-subtitle">
            Terima kasih, ${escapeHtml(order.customer.name)}.
            Pesanan Anda sudah kami terima.
        </p>

        <div class="confirmation-number">

            <span>Nomor Transaksi</span>
            <strong>${escapeHtml(order.id)}</strong>
            <small>${formatDateTime(order.createdAt)}</small>

        </div>

        <div class="confirmation-section">

            <h3>Detail Pesanan</h3>

            <ul class="confirmation-items">
                ${itemsHtml}
            </ul>

            <div class="summary-row total">
                <span>Total Pembayaran</span>
                <strong>${formatRupiah(order.total)}</strong>
            </div>

        </div>

        <div class="confirmation-section confirmation-meta">

            <div>
                <span>Nama Pelanggan</span>
                <strong>${escapeHtml(order.customer.name)}</strong>
            </div>

            <div>
                <span>Metode Pembayaran</span>
                <strong class="cash-label">Cash di Tempat</strong>
            </div>

            <div>
                <span>Pengambilan</span>
                <strong>Ambil di Warung</strong>
            </div>

        </div>

        ${notesHtml}

        <div class="pickup-alert">

            <strong>
                Silakan datang ke Warung Uda Denai untuk mengambil pesanan
                dan melakukan pembayaran.
            </strong>

            <p>
                Pesanan akan disiapkan setelah dikonfirmasi oleh admin.
                Pembayaran dilakukan secara tunai di kasir warung.
            </p>

        </div>

        <div class="confirmation-wa">

            <a
                class="btn-wa btn-block"
                href="${whatsappOrderLink}"
                target="_blank"
                rel="noopener">

                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>

                Kirim Pesanan ke WhatsApp

            </a>

            <p class="wa-hint">
                Jika WhatsApp tidak terbuka otomatis, klik tombol di atas.
                Pesanan baru terkirim ke warung setelah Anda menekan tombol
                Kirim di aplikasi WhatsApp.
            </p>

        </div>

        <div class="confirmation-actions">

            <button
                type="button"
                class="btn-primary"
                onclick="closeConfirmation()">

                Selesai

            </button>

        </div>
    `;

    const modal = document.getElementById("confirmationModal");

    if (modal) {

        modal.classList.add("open");
        syncBodyLock();
    }
}

function closeConfirmation(event) {

    const modal = document.getElementById("confirmationModal");

    if (!modal) {
        return;
    }

    if (!event || event.target === modal) {

        modal.classList.remove("open");
        syncBodyLock();
    }
}


/* =====================================
   DASHBOARD ADMIN
===================================== */

function statusSlug(status) {

    return String(status)
        .toLowerCase()
        .replace(/\s+/g, "-");
}

function statusBadge(status) {

    return `
        <span class="status-badge status-${statusSlug(status)}">
            ${escapeHtml(status)}
        </span>
    `;
}

function orderItemsHtml(order) {

    if (!order.items.length) {
        return "<li><span>Tidak ada item</span></li>";
    }

    return order.items.map(function(item) {

        return `
            <li>
                <span>
                    ${item.qty}&times; ${escapeHtml(item.name)}
                </span>
                <strong>
                    ${formatRupiah(item.subtotal)}
                </strong>
            </li>
        `;
    }).join("");
}

function renderAdminStats() {

    const container = document.getElementById("adminStats");

    if (!container) {
        return;
    }

    const activeCount = orders.filter(function(order) {
        return ACTIVE_STATUSES.includes(order.status);
    }).length;

    const finishedCount = orders.filter(function(order) {
        return order.status === "Selesai";
    }).length;

    const revenue = orders
        .filter(function(order) {
            return order.status !== "Dibatalkan";
        })
        .reduce(function(sum, order) {
            return sum + (Number(order.total) || 0);
        }, 0);

    container.innerHTML = `
        <div class="admin-stat">
            <span>Total Pesanan</span>
            <strong>${orders.length}</strong>
        </div>

        <div class="admin-stat">
            <span>Pesanan Aktif</span>
            <strong>${activeCount}</strong>
        </div>

        <div class="admin-stat">
            <span>Selesai</span>
            <strong>${finishedCount}</strong>
        </div>

        <div class="admin-stat stat-revenue">
            <span>Pendapatan</span>
            <strong>${formatRupiah(revenue)}</strong>
        </div>
    `;
}

function renderAdminOrderCard(order) {

    const customer = order.customer;

    const notesHtml = customer.notes
        ? `
            <div class="order-notes">
                <strong>Catatan:</strong> ${escapeHtml(customer.notes)}
            </div>
        `
        : "";

    return `
        <article class="order-card">

            <div class="order-card-head">

                <div>
                    <span class="order-id">${escapeHtml(order.id)}</span>
                    <span class="order-date">
                        ${formatDateTime(order.createdAt)}
                    </span>
                </div>

                ${statusBadge(order.status)}

            </div>

            <div class="order-customer">

                <div>
                    <span>Nama Pelanggan</span>
                    <strong>${escapeHtml(customer.name)}</strong>
                </div>

            </div>

            <ul class="order-items">
                ${orderItemsHtml(order)}
            </ul>

            ${notesHtml}

            <div class="order-total">

                <span>Total Pembayaran</span>
                <span class="pay-tag">Cash di Tempat</span>
                <strong>${formatRupiah(order.total)}</strong>

            </div>

            <div class="order-actions">

                <label for="status-${order.id}">
                    Ubah status
                </label>

                <select
                    id="status-${order.id}"
                    class="status-select"
                    onchange="updateOrderStatus('${order.id}', this.value)">

                    ${ORDER_STATUSES.map(function(status) {

                        const selected = status === order.status
                            ? " selected"
                            : "";

                        return `
                            <option value="${status}"${selected}>
                                ${status}
                            </option>
                        `;
                    }).join("")}

                </select>

            </div>

        </article>
    `;
}

function renderHistoryTable() {

    const rows = orders.map(function(order) {

        const customer = order.customer;
        const detailId = "history-detail-" + order.id;

        const notesHtml = customer.notes
            ? `
                <div class="detail-note">
                    <strong>Catatan:</strong>
                    ${escapeHtml(customer.notes)}
                </div>
            `
            : "";

        return `
            <tr>

                <td>
                    <span class="order-number">
                        ${escapeHtml(order.id)}
                    </span>
                </td>

                <td>${formatDateTime(order.createdAt)}</td>

                <td>${escapeHtml(customer.name)}</td>

                <td>${formatRupiah(order.total)}</td>

                <td>${statusBadge(order.status)}</td>

                <td class="history-actions">
                    <button
                        type="button"
                        class="link-btn"
                        onclick="toggleHistoryDetail('${order.id}')">

                        Detail

                    </button>
                </td>

            </tr>

            <tr
                class="history-detail-row"
                id="${detailId}"
                hidden>

                <td colspan="6">

                    <div class="history-detail-inner">

                        <div class="history-meta">

                            <div>
                                <span>Metode Pembayaran:</span>
                                Cash di Tempat
                            </div>

                            <div>
                                <span>Pengambilan:</span>
                                Ambil di Warung
                            </div>

                            <div>
                                <span>Nama Pelanggan:</span>
                                ${escapeHtml(customer.name)}
                            </div>

                        </div>

                        <h4>Detail Produk</h4>

                        <ul>
                            ${orderItemsHtml(order)}
                        </ul>

                        ${notesHtml}

                    </div>

                </td>

            </tr>
        `;
    }).join("");

    return `
        <div class="history-table-wrap">

            <table class="history-table">

                <thead>
                    <tr>
                        <th>No. Transaksi</th>
                        <th>Tanggal</th>
                        <th>Pelanggan</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th></th>
                    </tr>
                </thead>

                <tbody>
                    ${rows}
                </tbody>

            </table>

        </div>
    `;
}

function renderAdmin() {

    const incoming = orders.filter(function(order) {
        return ACTIVE_STATUSES.includes(order.status);
    });

    const incomingCount = document.getElementById("incomingCount");
    const historyCount = document.getElementById("historyCount");

    if (incomingCount) {
        incomingCount.textContent = incoming.length;
    }

    if (historyCount) {
        historyCount.textContent = orders.length;
    }

    const incomingContainer = document.getElementById("adminIncoming");
    const historyContainer = document.getElementById("adminHistory");

    if (incomingContainer) {

        incomingContainer.innerHTML = incoming.length
            ? incoming.map(renderAdminOrderCard).join("")
            : '<div class="admin-empty">Belum ada pesanan masuk.</div>';
    }

    if (historyContainer) {

        historyContainer.innerHTML = orders.length
            ? renderHistoryTable()
            : '<div class="admin-empty">Belum ada riwayat transaksi.</div>';
    }

    renderAdminStats();

    if (incomingContainer) {
        incomingContainer.hidden = activeAdminTab !== "incoming";
    }

    if (historyContainer) {
        historyContainer.hidden = activeAdminTab !== "history";
    }

    const tabIncoming = document.getElementById("tabIncoming");
    const tabHistory = document.getElementById("tabHistory");

    if (tabIncoming) {
        tabIncoming.classList.toggle(
            "active",
            activeAdminTab === "incoming"
        );
    }

    if (tabHistory) {
        tabHistory.classList.toggle(
            "active",
            activeAdminTab === "history"
        );
    }
}

function isAdminAuthenticated() {
    return Boolean(currentAdminUser);
}

function startCloudOrders() {

    if (cloudOrdersActive || !isFirebaseReady()) {
        return;
    }

    cloudOrdersActive = true;

    cloudOrdersUnsubscribe = watchCloudOrders(
        function(list) {

            orders = normalizeOrders(list);
            writeStorage(ORDERS_KEY, orders);

            const adminModal = document.getElementById("adminModal");

            if (adminModal && adminModal.classList.contains("open")) {
                renderAdmin();
            }
        },
        function(error) {

            cloudOrdersActive = false;

            if (cloudOrdersUnsubscribe) {
                cloudOrdersUnsubscribe();
                cloudOrdersUnsubscribe = null;
            }

            console.error("Gagal memuat pesanan dari Firebase:", error);

            showToast(
                "Gagal memuat pesanan dari Firebase: " +
                cloudErrorMessage(error)
            );
        }
    );
}

function stopCloudOrders() {

    if (cloudOrdersUnsubscribe) {
        cloudOrdersUnsubscribe();
        cloudOrdersUnsubscribe = null;
    }

    cloudOrdersActive = false;
}

function initAdminAuth() {

    if (!isFirebaseReady()) {
        console.warn("Firebase:", getFirebaseInitError());
        return;
    }

    onCloudAuthState(function(user) {

        currentAdminUser = user || null;
        adminAuthResolved = true;

        if (currentAdminUser) {

            startCloudOrders();

            if (pendingAdminAccess) {

                pendingAdminAccess = false;
                closeAdminLogin();
                openAdminDashboard(pendingAdminTab);
            }

        } else {

            stopCloudOrders();

            const adminModal = document.getElementById("adminModal");

            if (adminModal && adminModal.classList.contains("open")) {
                closeAdmin();
            }
        }
    });
}

function requestAdmin(tab) {

    const targetTab = tab === "history"
        ? "history"
        : "incoming";

    pendingAdminTab = targetTab;

    if (isAdminAuthenticated()) {
        openAdminDashboard(targetTab);
        return;
    }

    if (!isFirebaseReady()) {
        showToast(getFirebaseInitError() || "Firebase belum siap.");
        return;
    }

    pendingAdminAccess = true;
    openAdminLogin();
}

function openAdminLogin() {

    const modal = document.getElementById("adminLoginModal");

    if (!modal) {
        return;
    }

    const error = document.getElementById("adminLoginError");
    const password = document.getElementById("adminPassword");

    if (error) {
        error.textContent = "";
    }

    if (password) {
        password.value = "";
    }

    modal.classList.add("open");
    syncBodyLock();

    const email = document.getElementById("adminEmail");

    window.setTimeout(function() {

        if (email && !email.value) {
            email.focus();
        } else if (password) {
            password.focus();
        }
    }, 50);
}

function closeAdminLogin(event) {

    const modal = document.getElementById("adminLoginModal");

    if (!modal) {
        return;
    }

    if (!event || event.target === modal) {

        modal.classList.remove("open");

        const error = document.getElementById("adminLoginError");
        const password = document.getElementById("adminPassword");

        if (error) {
            error.textContent = "";
        }

        if (password) {
            password.value = "";
        }

        pendingAdminAccess = false;
        syncBodyLock();
    }
}

function setAdminLoginLoading(isLoading) {

    const button = document.getElementById("adminLoginSubmit");

    if (!button) {
        return;
    }

    button.disabled = isLoading;
    button.textContent = isLoading ? "Memeriksa..." : "Masuk";
}

async function submitAdminLogin(event) {

    event.preventDefault();

    const emailInput = document.getElementById("adminEmail");
    const passwordInput = document.getElementById("adminPassword");
    const loginError = document.getElementById("adminLoginError");

    const email = emailInput ? emailInput.value.trim() : "";
    const password = passwordInput ? passwordInput.value : "";

    if (!email || !password) {

        if (loginError) {
            loginError.textContent = "Email dan password wajib diisi.";
        }

        return;
    }

    if (!isFirebaseReady()) {

        if (loginError) {
            loginError.textContent =
                getFirebaseInitError() || "Firebase belum siap.";
        }

        return;
    }

    if (loginError) {
        loginError.textContent = "";
    }

    setAdminLoginLoading(true);

    try {

        const credential = await cloudSignIn(email, password);

        currentAdminUser = credential && credential.user
            ? credential.user
            : getCloudCurrentUser();

        adminAuthResolved = true;

        startCloudOrders();

        pendingAdminAccess = false;

        closeAdminLogin();
        openAdminDashboard(pendingAdminTab);
        showToast("Login admin berhasil.");

    } catch (error) {

        if (loginError) {
            loginError.textContent = cloudErrorMessage(error);
        }

        if (passwordInput) {
            passwordInput.value = "";
            passwordInput.focus();
        }

    } finally {

        setAdminLoginLoading(false);
    }
}

async function logoutAdmin() {

    try {
        await cloudSignOut();
    } catch (error) {
        console.error("Gagal logout dari Firebase:", error);
    }

    currentAdminUser = null;
    stopCloudOrders();
    closeAdmin();
    showToast("Anda telah keluar dari admin.");
}

function openAdminDashboard(tab) {

    if (!isAdminAuthenticated()) {
        requestAdmin(tab);
        return;
    }

    orders = normalizeOrders(readStorage(ORDERS_KEY, orders));

    activeAdminTab = tab === "history"
        ? "history"
        : "incoming";

    const modal = document.getElementById("adminModal");

    if (!modal) {
        return;
    }

    modal.classList.add("open");
    renderAdmin();
    startCloudOrders();
    syncBodyLock();
}

function closeAdmin(event) {

    const modal = document.getElementById("adminModal");

    if (!modal) {
        return;
    }

    if (!event || event.target === modal) {

        modal.classList.remove("open");
        syncBodyLock();
    }
}

function switchAdminTab(tab) {

    activeAdminTab = tab === "history"
        ? "history"
        : "incoming";

    renderAdmin();
}

function updateOrderStatus(orderId, status) {

    if (!ORDER_STATUSES.includes(status)) {
        return;
    }

    const order = orders.find(function(entry) {
        return entry.id === orderId;
    });

    if (!order) {
        return;
    }

    const previousStatus = order.status;
    const previousUpdatedAt = order.updatedAt;

    order.status = status;
    order.updatedAt = new Date().toISOString();

    writeStorage(ORDERS_KEY, orders);
    renderAdmin();

    showToast("Status " + orderId + " diubah menjadi " + status + ".");

    if (isFirebaseReady() && currentAdminUser) {

        updateCloudOrderStatus(
            orderId,
            status,
            order.updatedAt
        ).catch(function(error) {

            console.error(
                "Gagal menyimpan status ke Firebase:",
                error
            );

            const currentOrder = orders.find(function(entry) {
                return entry.id === orderId;
            });

            if (currentOrder) {
                currentOrder.status = previousStatus;
                currentOrder.updatedAt = previousUpdatedAt;
            }

            writeStorage(ORDERS_KEY, orders);
            renderAdmin();

            showToast(
                "Gagal menyimpan status ke Firebase: " +
                cloudErrorMessage(error)
            );
        });
    }
}

function toggleHistoryDetail(orderId) {

    const row = document.getElementById("history-detail-" + orderId);

    if (row) {
        row.hidden = !row.hidden;
    }
}


/* =====================================
   INISIALISASI
===================================== */

function createAddToCartButton(product, className, label) {

    const button = document.createElement("button");

    button.type = "button";
    button.className = className;
    button.textContent = label;
    button.setAttribute(
        "aria-label",
        "Tambah " + product.name + " ke keranjang"
    );

    button.addEventListener("click", function(event) {

        event.stopPropagation();
        addToCart(product.id);
    });

    return button;
}

function initProductButtons() {

    document.querySelectorAll(".product").forEach(function(card) {

        const nameElement = card.querySelector(".product-info h3");
        const info = card.querySelector(".product-info");

        if (!nameElement || !info) {
            return;
        }

        const product = findProduct(nameElement.textContent.trim());

        if (!product) {
            return;
        }

        const wrapper = document.createElement("div");
        wrapper.className = "product-add-wrapper";

        wrapper.appendChild(
            createAddToCartButton(
                product,
                "product-add-btn",
                "+ Keranjang"
            )
        );

        info.appendChild(wrapper);
    });

    document.querySelectorAll(".mini-product").forEach(function(card) {

        const nameElement = card.querySelector("h3");

        if (!nameElement) {
            return;
        }

        const product = findProduct(nameElement.textContent.trim());

        if (!product) {
            return;
        }

        card.appendChild(
            createAddToCartButton(
                product,
                "mini-add-btn",
                "+ Keranjang"
            )
        );
    });
}

function initCheckoutFieldListeners() {

    const nameInput = document.getElementById("customerName");

    if (nameInput) {
        nameInput.addEventListener("input", function() {
            setFieldError("customerName", "errorCustomerName", "");
        });
    }
}

function getTodayDateKey() {

    const now = new Date();

    return now.getFullYear() +
        String(now.getMonth() + 1).padStart(2, "0") +
        String(now.getDate()).padStart(2, "0");
}

function getLocalOrderSequenceMaxForToday() {

    const dateKey = getTodayDateKey();

    return orders.reduce(function(max, order) {

        const match = /^UDD-([0-9]{8})-([0-9]{4})$/.exec(order.id || "");

        if (match && match[1] === dateKey) {
            return Math.max(max, parseInt(match[2], 10) || 0);
        }

        return max;
    }, 0);
}

async function alignCloudOrderSequence() {

    const maxSequence = getLocalOrderSequenceMaxForToday();

    if (!maxSequence || typeof getCloudOrderSequence !== "function") {
        return;
    }

    try {

        const sequence = await getCloudOrderSequence();
        const dateKey = getTodayDateKey();
        const currentCount =
            sequence.date === dateKey
                ? (Number(sequence.count) || 0)
                : 0;

        for (let count = currentCount; count < maxSequence; count++) {
            await createCloudOrderNumber();
        }

    } catch (error) {

        console.warn(
            "Gagal menyelaraskan nomor pesanan cloud:",
            error
        );
    }
}

async function migrateLocalOrdersToCloud() {

    if (!isFirebaseReady()) {
        return;
    }

    if (readStorage(CLOUD_MIGRATION_KEY, false)) {
        return;
    }

    if (!orders.length) {

        writeStorage(CLOUD_MIGRATION_KEY, true);
        return;
    }

    /* Selaraskan counter cloud dengan nomor pesanan lokal hari ini
       supaya pesanan baru tidak bertabrakan dengan pesanan lama. */
    await alignCloudOrderSequence();

    const results = await Promise.all(
        orders.map(function(order) {

            return createCloudOrder(order)
                .then(function() {
                    return { ok: true, code: "" };
                })
                .catch(function(error) {

                    console.warn(
                        "Migrasi pesanan lokal dilewati:",
                        order.id,
                        error
                    );

                    return {
                        ok: false,
                        code: error && error.code ? error.code : ""
                    };
                });
        })
    );

    const allUploaded = results.every(function(result) {
        return result.ok;
    });

    const allAlreadyExist = results.every(function(result) {
        return !result.ok && result.code === "permission-denied";
    });

    if (allUploaded || allAlreadyExist) {
        writeStorage(CLOUD_MIGRATION_KEY, true);
    }
}

function handleAdminAccessLink() {

    const params = new URLSearchParams(window.location.search);

    if (
        window.location.hash === "#admin" ||
        params.get("admin") === "1"
    ) {
        requestAdmin();
    }
}

function initTransactionFeatures() {

    cart = normalizeCart(cart);
    orders = normalizeOrders(orders);

    initProductButtons();
    initCheckoutFieldListeners();
    updateCartUI();
    initAdminAuth();
    migrateLocalOrdersToCloud();
    handleAdminAccessLink();
}

if (document.readyState === "loading") {

    document.addEventListener("DOMContentLoaded", initTransactionFeatures);

} else {

    initTransactionFeatures();
}


/* =====================================
   TOMBOL ESC UNTUK POPUP TRANSAKSI
===================================== */

document.addEventListener("keydown", function(event) {

    if (event.key !== "Escape") {
        return;
    }

    const adminLogin = document.getElementById("adminLoginModal");

    if (adminLogin && adminLogin.classList.contains("open")) {

        closeAdminLogin();

        return;
    }

    const admin = document.getElementById("adminModal");

    if (admin && admin.classList.contains("open")) {

        closeAdmin();

        return;
    }

    const confirmation = document.getElementById("confirmationModal");

    if (confirmation && confirmation.classList.contains("open")) {

        closeConfirmation();

        return;
    }

    const checkout = document.getElementById("checkoutModal");

    if (checkout && checkout.classList.contains("open")) {

        closeCheckout();

        return;
    }

    const cartOverlay = document.getElementById("cartOverlay");

    if (cartOverlay && cartOverlay.classList.contains("open")) {

        closeCart();
    }
});


/* =====================================
   SINKRONISASI ANTAR TAB
===================================== */

window.addEventListener("hashchange", handleAdminAccessLink);

window.addEventListener("storage", function(event) {

    if (event.key === ORDERS_KEY) {

        orders = normalizeOrders(readStorage(ORDERS_KEY, []));

        const admin = document.getElementById("adminModal");

        if (admin && admin.classList.contains("open")) {
            renderAdmin();
        }
    }

    if (event.key === CART_KEY) {

        cart = normalizeCart(readStorage(CART_KEY, []));
        updateCartUI();
    }
});
