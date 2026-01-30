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
    databaseURL: "https://blind-cfc23-default-rtdb.firebaseio.com" // 반드시 확인!
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let currentUser = null;
let isLoggedIn = false;
let allPosts = [];
let currentViewingPostId = null;

// 전역 함수로 노출 (HTML onclick에서 사용하기 위함)
window.openModal = (id) => {
    document.getElementById(id).style.display = 'block';
    setTimeout(() => document.getElementById(id).classList.add('active'), 150);
};

window.closeModal = (id) => {
    document.getElementById(id).style.display = 'none';
    document.getElementById(id).classList.remove('active');
};

// 1. 회원가입 (Firebase DB 저장)
window.handleJoin = async (event) => {
    event.preventDefault();
    const empId = document.getElementById('joinEmpId').value;
    const userData = {
        empId: empId,
        pw: document.getElementById('joinPw').value,
        name: document.getElementById('joinName').value,
        position: document.getElementById('joinPosition').value,
        rank: document.getElementById('joinRank').value
    };

    await set(ref(db, 'users/' + empId), userData);
    alert("회원가입이 완료되었습니다!");
    closeModal('joinModal');
};

// 2. 로그인 (DB 조회)
window.handleLogin = async () => {
    const empId = document.getElementById('loginEmpId').value;
    const pw = document.getElementById('loginPw').value;

    const snapshot = await get(child(ref(db), `users/${empId}`));
    if (snapshot.exists()) {
        const user = snapshot.val();
        if (user.pw === pw) {
            const userNum = user.empId.slice(-2).padStart(2, '0');
            user.nickname = `익명 ${userNum}`;
            currentUser = user;
            isLoggedIn = true;
            document.getElementById('loginIcons').style.display = 'none';
            document.getElementById('userInfoIcon').style.display = 'flex';
            closeModal('loginModal');
            alert(`${user.nickname}님 환영합니다!`);
        } else {
            alert("비밀번호가 틀렸습니다.");
        }
    } else {
        alert("가입되지 않은 사번입니다.");
    }
};

window.handleLogout = () => {
    currentUser = null;
    isLoggedIn = false;
    document.getElementById('loginIcons').style.display = 'inline';
    document.getElementById('userInfoIcon').style.display = 'none';
    goHome();
    alert("로그아웃 되었습니다.");
};

// 3. 게시글 저장 (서버로 전송)
window.savePost = async () => {
    const title = document.getElementById('postTitle').value.trim();
    const content = document.getElementById('postContent').value.trim();
    const board = document.getElementById('currentBoardTitle').innerText;

    if (!title || !content) return;

    const postData = {
        board,
        title,
        content,
        author: currentUser.nickname,
        authorId: currentUser.empId,
        timestamp: Date.now(),
        views: 0,
        likedBy: {},
        comments: []
    };

    const newPostRef = push(ref(db, 'posts'));
    await set(newPostRef, postData);
    closeModal('postModal');
};

// 4. 게시글 실시간 리스너
onValue(ref(db, 'posts'), (snapshot) => {
    const data = snapshot.val();
    allPosts = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
    allPosts.sort((a, b) => b.timestamp - a.timestamp);
    
    const currentTitle = document.getElementById('currentBoardTitle').innerText;
    if (document.getElementById('boardView').style.display === 'block') {
        renderPosts(currentTitle);
    }
});

// 게시글 렌더링 함수
function renderPosts(boardName) {
    const listDiv = document.getElementById('postList');
    const filtered = allPosts.filter(p => p.board === boardName);
    
    listDiv.innerHTML = filtered.map(p => `
        <div class="post-item" onclick="openPostDetail('${p.id}')">
            <div class="post-user-info">
                <span class="nickname">${p.author}</span>
                <span class="post-date">방금 전</span>
            </div>
            <h4 class="post-title">${p.title}</h4>
            <div class="post-stats">
                <span><i class="far fa-heart"></i> <small>${p.likedBy ? Object.keys(p.likedBy).length : 0}</small></span>
                <span><i class="far fa-comment"></i> <small>${p.comments ? Object.keys(p.comments).length : 0}</small></span>
                <span><i class="far fa-eye"></i> <small>${p.views}</small></span>
            </div>
        </div>
    `).join('');
}

window.openPostDetail = (id) => {
    const post = allPosts.find(p => p.id === id);
    currentViewingPostId = id;
    
    document.getElementById('boardView').style.display = 'none';
    document.getElementById('postDetailView').style.display = 'block';
    document.getElementById('dtNickname').innerText = post.author;
    document.getElementById('dtTitle').innerText = post.title;
    document.getElementById('dtContent').innerText = post.content;
    
    // 조회수 업데이트
    update(ref(db, `posts/${id}`), { views: post.views + 1 });
};

window.goHome = () => {
    document.getElementById('homeView').style.display = 'block';
    document.getElementById('boardView').style.display = 'none';
    document.getElementById('postDetailView').style.display = 'none';
};

window.loadBoard = (name) => {
    if(!isLoggedIn) { alert("로그인이 필요합니다."); return; }
    document.getElementById('homeView').style.display = 'none';
    document.getElementById('boardView').style.display = 'block';
    document.getElementById('currentBoardTitle').innerText = name;
    renderPosts(name);
};

window.toggleMenu = () => document.getElementById('sideMenu').classList.toggle('active');
window.closePostDetail = () => {
    document.getElementById('postDetailView').style.display = 'none';
    document.getElementById('boardView').style.display = 'block';
};
