/* =====================================
   FIREBASE CLOUD
   Sinkronisasi pesanan dan login admin.
===================================== */

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyCj_6mNHWAR5EblszANViz_D4G8WOvdhNU",
    authDomain: "warung-uda-denai.firebaseapp.com",
    projectId: "warung-uda-denai",
    storageBucket: "warung-uda-denai.firebasestorage.app",
    messagingSenderId: "817924293743",
    appId: "1:817924293743:web:2384d9a8ff87905584f99a",
    measurementId: "G-R9NYJ18JH9"
};

let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;
let firebaseReady = false;
let firebaseInitError = "";

(function initFirebaseCloud() {

    if (typeof firebase === "undefined") {
        firebaseInitError = "SDK Firebase tidak termuat.";
        return;
    }

    if (
        !FIREBASE_CONFIG.apiKey ||
        FIREBASE_CONFIG.apiKey.indexOf("PASTE_") === 0
    ) {
        firebaseInitError = "Konfigurasi Firebase belum diisi.";
        return;
    }

    try {
        firebaseApp = firebase.initializeApp(FIREBASE_CONFIG);
        firebaseAuth = firebase.auth();
        firebaseDb = firebase.firestore();
        firebaseReady = true;
    } catch (error) {
        firebaseInitError =
            error && error.message
                ? error.message
                : "Gagal menginisialisasi Firebase.";
        console.error("Firebase init error:", error);
    }
})();

function isFirebaseReady() {
    return firebaseReady;
}

function getFirebaseInitError() {
    return firebaseInitError;
}

function cloudSignIn(email, password) {

    if (!firebaseReady) {
        return Promise.reject(
            new Error(firebaseInitError || "Firebase belum siap.")
        );
    }

    return firebaseAuth.signInWithEmailAndPassword(email, password);
}

function cloudSignOut() {

    if (!firebaseReady) {
        return Promise.resolve();
    }

    return firebaseAuth.signOut();
}

function onCloudAuthState(callback) {

    if (!firebaseReady) {
        callback(null);
        return function() {};
    }

    return firebaseAuth.onAuthStateChanged(callback);
}

function getCloudCurrentUser() {

    if (!firebaseReady) {
        return null;
    }

    return firebaseAuth.currentUser;
}

function createCloudOrder(order) {

    if (!firebaseReady) {
        return Promise.reject(
            new Error(firebaseInitError || "Firebase belum siap.")
        );
    }

    return firebaseDb
        .collection("orders")
        .doc(order.id)
        .set(order);
}

function createCloudOrderNumber() {

    if (!firebaseReady) {
        return Promise.reject(
            new Error(firebaseInitError || "Firebase belum siap.")
        );
    }

    const now = new Date();

    const dateKey =
        now.getFullYear() +
        String(now.getMonth() + 1).padStart(2, "0") +
        String(now.getDate()).padStart(2, "0");

    const counterRef = firebaseDb
        .collection("meta")
        .doc("orderSequence");

    return firebaseDb.runTransaction(function(transaction) {

        return transaction.get(counterRef).then(function(snapshot) {

            const data = snapshot.exists ? snapshot.data() : {};

            const count =
                data.date === dateKey
                    ? (Number(data.count) || 0) + 1
                    : 1;

            transaction.set(
                counterRef,
                {
                    date: dateKey,
                    count: count
                },
                { merge: true }
            );

            return "UDD-" + dateKey + "-" +
                String(count).padStart(4, "0");
        });
    });
}

function watchCloudOrders(callback, onError) {

    if (!firebaseReady) {
        return function() {};
    }

    return firebaseDb
        .collection("orders")
        .orderBy("createdAt", "desc")
        .onSnapshot(
            function(snapshot) {

                const list = snapshot.docs.map(function(document) {

                    const data = document.data() || {};
                    data.id = document.id;

                    return data;
                });

                callback(list);
            },
            function(error) {
                if (onError) {
                    onError(error);
                }
            }
        );
}

function updateCloudOrderStatus(orderId, status, updatedAt) {

    if (!firebaseReady) {
        return Promise.reject(
            new Error(firebaseInitError || "Firebase belum siap.")
        );
    }

    return firebaseDb
        .collection("orders")
        .doc(orderId)
        .update({
            status: status,
            updatedAt: updatedAt
        });
}

function cloudErrorMessage(error) {

    const code = error && error.code ? error.code : "";

    if (code === "auth/invalid-email") {
        return "Format email tidak valid.";
    }

    if (
        code === "auth/user-not-found" ||
        code === "auth/wrong-password" ||
        code === "auth/invalid-credential"
    ) {
        return "Email atau password salah.";
    }

    if (code === "auth/too-many-requests") {
        return "Terlalu banyak percobaan login. Coba lagi nanti.";
    }

    if (code === "auth/network-request-failed") {
        return "Tidak ada koneksi internet.";
    }

    if (code === "permission-denied") {
        return "Akses ditolak. Pastikan akun ini terdaftar sebagai admin.";
    }

    if (code === "unavailable") {
        return "Firebase sedang tidak dapat dihubungi. Coba lagi.";
    }

    return "Terjadi kesalahan. Silakan coba lagi.";
}
