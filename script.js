import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, push, onValue, get, child, update, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDcrP_W-Kib7SZjWCwo319k_hCsA4pznmI",
    authDomain: "blind-cfc23.firebaseapp.com",
    projectId: "blind-cfc23",
    storageBucket: "blind-cfc23.firebasestorage.app",
    messagingSenderId: "886741832017",
    appId: "1:886741832017:web:43056d5336da52e5348370",
    measurementId: "G-4LX1Z4QGYK",
    databaseURL: "https://blind-cfc23-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

window.currentUser = null;
window.isLoggedIn = false;
window.allPosts = [];
window.currentViewingPostId = null;

let loungeSettings = {
    '1공장 라운지': { bg: 'https://via.placeholder.com/800x200', profile: 'https://via.placeholder.com/100x100' },
    '경제 라운지': { bg: 'https://via.placeholder.com/800x200', profile: 'https://via.placeholder.com/100x100' },
    '책임 라운지': { bg: 'https://via.placeholder.com/800x200', profile: 'https://via.placeholder.com/100x100' },
    '매니저 라운지': { bg: 'https://via.placeholder.com/800x200', profile: 'https://via.placeholder.com/100x100' },
    '취미 라운지': { bg: 'https://via.placeholder.com/800x200', profile: 'https://via.placeholder.com/100x100' },
    '대나무 라운지': { bg: 'https://via.placeholder.com/800x200', profile: 'https://via.placeholder.com/100x100' }
};

// --- 모달 제어 ---
window.openModal = (id) => {
    const modal = document.getElementById(id);
    if (!modal) return;
    if (id === 'joinModal') document.getElementById('joinForm').reset();
    modal.style.display = 'block';
    setTimeout(() => modal.classList.add('active'), 10);
    history.pushState({ modalOpen: id }, '');
};

window.closeModal = (id) => {
    const modal = document.getElementById(id);
    if (modal && (modal.style.display === 'block' || modal.classList.contains('active'))) {
        modal.style.display = 'none';
        modal.classList.remove('active');
        if (history.state && history.state.modalOpen === id) history.back();
    }
};

window.closeModalByOutside = (event, id) => {
    if (event.target.id === id) window.closeModal(id);
};

// --- 로그인 / 회원가입 ---
window.handleJoin = async (e) => {
    e.preventDefault();
    const empId = document.getElementById('joinEmpId').value;
    const userData = {
        name: document.getElementById('joinName').value,
        empId: empId,
        rank: document.getElementById('joinRank').value,
        pw: document.getElementById('joinPw').value,
        position: document.getElementById('joinPosition').value
    };
    await set(ref(db, 'users/' + empId), userData);
    alert("회원가입 완료!");
    window.closeModal('joinModal');
};

window.handleLogin = async () => {
    const empId = document.getElementById('loginEmpId').value;
    const pw = document.getElementById('loginPw').value;
    if (empId === "1" && pw === "1") {
        successLogin({ empId: "1", position: "관리자", name: "관리자" });
    } else {
        const snapshot = await get(child(ref(db), `users/${empId}`));
        if (snapshot.exists() && snapshot.val().pw === pw) {
            successLogin(snapshot.val());
        } else {
            alert("정보를 확인해주세요");
        }
    }
};

function successLogin(user) {
    const userNum = user.empId.slice(-2).padStart(2, '0');
    user.nickname = user.position === "관리자" ? "관리자" : `익명 ${userNum}`;
    window.currentUser = user;
    window.isLoggedIn = true;
    document.getElementById('loginIcons').style.display = 'none';
    document.getElementById('userInfoIcon').style.display = 'flex';
    window.closeModal('loginModal');
}

window.handleLogout = () => {
    window.currentUser = null;
    window.isLoggedIn = false;
    document.getElementById('loginIcons').style.display = 'inline';
    document.getElementById('userInfoIcon').style.display = 'none';
    window.goHome();
};

// --- 게시글 작성 (✅ 수정된 부분) ---
window.savePost = async (e) => {
    if (e) e.preventDefault();   // 🔥 핵심 수정

    const title = document.getElementById('postTitle').value.trim();
    const content = document.getElementById('postContent').value.trim();
    const board = document.getElementById('currentBoardTitle').innerText;

    if (!title || !content) {
        alert("제목 혹은 글을 입력해주세요");
        return;
    }

    const postData = {
        board,
        title,
        content,
        author: window.currentUser.nickname,
        authorId: window.currentUser.empId,
        timestamp: Date.now(),
        views: 0,
        likedBy: {},
        comments: {}
    };

    try {
        await push(ref(db, 'posts'), postData);
        window.closeModal('postModal');   // 이제 정상 실행됨
    } catch (err) {
        alert("저장에 실패했습니다: " + err.message);
    }
};
