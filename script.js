import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, push, onValue, get, child } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyDcrP_W-Kib7SZjWCwo319k_hCsA4pznmI",
    databaseURL: "https://blind-cfc23-default-rtdb.firebaseio.com"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

window.currentUser = null;
window.isLoggedIn = false;
window.allPosts = [];

window.openModal = (id) => {
    const modal = document.getElementById(id);
    modal.style.display = 'block';
};

window.closeModal = (id) => {
    const modal = document.getElementById(id);
    modal.style.display = 'none';
};

window.closeModalByOutside = (e, id) => {
    if (e.target.id === id) closeModal(id);
};

window.handleLogin = async () => {
    const empId = document.getElementById('loginEmpId').value;
    const pw = document.getElementById('loginPw').value;

    if (empId === "1" && pw === "1") {
        window.currentUser = { empId: "1", nickname: "관리자" };
        window.isLoggedIn = true;
        closeModal('loginModal');
    } else {
        alert("로그인 실패");
    }
};

window.openPostModal = () => {
    document.getElementById('postTitle').value = "";
    document.getElementById('postContent').value = "";
    openModal('postModal');
};

/* ✅ 수정된 핵심 함수 */
window.savePost = async () => {

    /* 🔒 로그인 상태 검증 추가 (기존 기능 영향 없음) */
    if (!window.isLoggedIn || !window.currentUser) {
        alert("로그인이 필요합니다");
        return;
    }

    const title = document.getElementById('postTitle').value.trim();
    const content = document.getElementById('postContent').value.trim();
    const board = document.getElementById('currentBoardTitle').innerText;

    if (!title || !content) {
        alert("제목 혹은 내용을 입력해주세요");
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
        closeModal('postModal');   // ✅ 정상 등록 후 모달 닫힘
    } catch (err) {
        alert("저장 실패: " + err.message);
    }
};

onValue(ref(db, 'posts'), (snapshot) => {
    const data = snapshot.val();
    window.allPosts = data ? Object.values(data) : [];
});
