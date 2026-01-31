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

// ---------------- 모달 ----------------
window.openModal = (id) => {
    const modal = document.getElementById(id);
    if (!modal) return;
    if (id === 'joinModal') document.getElementById('joinForm').reset();
    modal.style.display = 'block';
    setTimeout(() => modal.classList.add('active'), 10);
};

window.closeModal = (id) => {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.classList.remove('active');
    modal.style.display = 'none';
};

window.closeModalByOutside = (event, id) => {
    if (event.target.id === id) closeModal(id);
};

// ---------------- 로그인 ----------------
window.handleJoin = async (e) => {
    e.preventDefault();
    const empId = document.getElementById('joinEmpId').value;
    const userData = {
        name: document.getElementById('joinName').value,
        empId,
        rank: document.getElementById('joinRank').value,
        pw: document.getElementById('joinPw').value,
        position: document.getElementById('joinPosition').value
    };
    await set(ref(db, 'users/' + empId), userData);
    alert("회원가입 완료!");
    closeModal('joinModal');
};

window.handleLogin = async () => {
    const empId = document.getElementById('loginEmpId').value;
    const pw = document.getElementById('loginPw').value;

    if (empId === "1" && pw === "1") {
        successLogin({ empId: "1", position: "관리자", name: "관리자" });
        return;
    }

    const snapshot = await get(child(ref(db), `users/${empId}`));
    if (snapshot.exists() && snapshot.val().pw === pw) {
        successLogin(snapshot.val());
    } else {
        alert("정보를 확인해주세요");
    }
};

function successLogin(user) {
    const userNum = user.empId.slice(-2).padStart(2, '0');
    user.nickname = user.position === "관리자" ? "관리자" : `익명 ${userNum}`;
    window.currentUser = user;
    window.isLoggedIn = true;
    document.getElementById('loginIcons').style.display = 'none';
    document.getElementById('userInfoIcon').style.display = 'flex';
    closeModal('loginModal');
}

window.handleLogout = () => {
    window.currentUser = null;
    window.isLoggedIn = false;
    document.getElementById('loginIcons').style.display = 'inline';
    document.getElementById('userInfoIcon').style.display = 'none';
    goHome();
};

// ---------------- 게시글 작성 ----------------
window.savePost = async () => {
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

    await push(ref(db, 'posts'), postData);
    closeModal('postModal');
};

// =================================================
// ✅ 여기부터가 누락되어 있던 핵심 기능
// =================================================

// 사이드 메뉴 토글
window.toggleMenu = () => {
    document.getElementById('sideMenu').classList.toggle('active');
};

// 홈 이동
window.goHome = () => {
    document.getElementById('homeView').style.display = 'block';
    document.getElementById('boardView').style.display = 'none';
    document.getElementById('postDetailView').style.display = 'none';
    document.getElementById('sideMenu').classList.remove('active');
};

// 게시판 진입
window.loadBoard = (boardName) => {
    document.getElementById('homeView').style.display = 'none';
    document.getElementById('postDetailView').style.display = 'none';
    document.getElementById('boardView').style.display = 'block';
    document.getElementById('currentBoardTitle').innerText = boardName;
    document.getElementById('sideMenu').classList.remove('active');
};
