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
    databaseURL: "https://blind-cfc23-default-rtdb.asia-southeast1.firebasedatabase.app"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

window.currentUser = null;
window.isLoggedIn = false;
window.allPosts = [];
window.currentViewingPostId = null;

let loungeSettings = {
    '칭찬 라운지': { bg: 'https://via.placeholder.com/800x200', profile: 'https://via.placeholder.com/100x100' },
    '1공장 라운지': { bg: 'https://via.placeholder.com/800x200', profile: 'https://via.placeholder.com/100x100' },
    '퀴즈': { bg: 'https://via.placeholder.com/800x200', profile: 'https://via.placeholder.com/100x100' },
    '신문고': { bg: 'https://via.placeholder.com/800x200', profile: 'https://via.placeholder.com/100x100' }
};

const getRandomAnon = () => `익명${Math.floor(Math.random() * 90 + 10)}`;

window.openModal = (id) => {
    const modal = document.getElementById(id);
    if (!modal) return;
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

window.closeModalByOutside = (event, id) => { if (event.target.id === id) window.closeModal(id); };

document.addEventListener('click', (e) => {
    const menu = document.getElementById('sideMenu');
    const headerLeft = document.querySelector('.header-left');
    if (menu && menu.classList.contains('active') && !menu.contains(e.target) && !headerLeft.contains(e.target)) {
        menu.classList.remove('active');
        if (history.state && history.state.menuOpen) history.back();
    }
});

window.handleLogin = async () => {
    const empId = document.getElementById('loginEmpId').value.trim();
    const pw = document.getElementById('loginPw').value.trim();
    if (!empId || !pw) { alert("사번과 비밀번호를 입력해주세요."); return; }
    let userRole = "일반";
    let nickname = "";
    if (empId === "724" && pw === "724") {
        userRole = "관리자"; nickname = "관리자";
    } else if (empId === "1" && pw === "whalsdud") {
        userRole = "공장장"; nickname = "공장장";
    } else {
        const userNum = empId.slice(-2).padStart(2, '0');
        nickname = `익명${userNum}`;
    }
    successLogin({ empId, role: userRole, nickname });
};

function successLogin(user) {
    window.currentUser = user;
    window.isLoggedIn = true;
    document.getElementById('loginIcons').style.display = 'none';
    document.getElementById('userInfoIcon').style.display = 'flex';
    document.getElementById('adminImgEditBtn').style.display = (user.role === "관리자") ? 'block' : 'none';
    window.closeModal('loginModal');
}

window.handleLogout = () => {
    window.currentUser = null;
    window.isLoggedIn = false;
    document.getElementById('loginIcons').style.display = 'inline';
    document.getElementById('userInfoIcon').style.display = 'none';
    window.goHome();
};

window.showUserInfo = () => {
    alert(`내 정보\n닉네임: ${window.currentUser.nickname}\n권한: ${window.currentUser.role}`);
};

window.toggleMenu = () => {
    const menu = document.getElementById('sideMenu');
    if (menu.classList.toggle('active')) history.pushState({ menuOpen: true }, '');
};

window.goHome = () => {
    document.getElementById('homeView').style.display = 'block';
    document.getElementById('boardView').style.display = 'none';
    document.getElementById('postDetailView').style.display = 'none';
    document.getElementById('sideMenu').classList.remove('active');
    if (!history.state || history.state.view !== 'home') {
        history.replaceState({ view: 'home' }, '');
    }
};

window.loadBoard = (name) => {
    document.getElementById('homeView').style.display = 'none';
    document.getElementById('boardView').style.display = 'block';
    document.getElementById('postDetailView').style.display = 'none';
    
    document.getElementById('currentBoardTitle').innerText = name;
    const setting = loungeSettings[name] || { bg: 'https://via.placeholder.com/800x200', profile: 'https://via.placeholder.com/100x100' };
    document.getElementById('bgDisplay').src = setting.bg;
    document.getElementById('profileDisplay').src = setting.profile;
    
    document.getElementById('sideMenu').classList.remove('active');
    renderPosts(name);
    history.pushState({ view: 'board', boardName: name }, '');
};

onValue(ref(db, 'posts'), (snapshot) => {
    const data = snapshot.val();
    window.allPosts = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
    window.allPosts.sort((a, b) => b.timestamp - a.timestamp); 

    if (window.currentViewingPostId) {
        const post = window.allPosts.find(p => p.id === window.currentViewingPostId);
        if (post) renderComments(post.comments); 
    } else {
        const boardView = document.getElementById('boardView');
        if (boardView && boardView.style.display === 'block') {
            const currentTitle = document.getElementById('currentBoardTitle').innerText;
            renderPosts(currentTitle);
        }
    }
});

window.openPostModal = () => {
    document.getElementById('postTitle').value = "";
    document.getElementById('postContent').value = "";
    window.openModal('postModal');
};

window.savePost = async () => {
    const title = document.getElementById('postTitle').value.trim();
    const content = document.getElementById('postContent').value.trim();
    const board = document.getElementById('currentBoardTitle').innerText;

    if (!title || !content) { alert("내용을 입력해주세요"); return; }

    const authorNick = window.isLoggedIn ? window.currentUser.nickname : getRandomAnon();
    const authorId = window.isLoggedIn ? window.currentUser.empId : "anonymous";

    const postData = {
        board, title, content,
        author: authorNick,
        authorId: authorId,
        timestamp: Date.now(),
        views: 0,
        likedBy: {},
        comments: {}
    };

    try {
        await push(ref(db, 'posts'), postData);
        window.closeModal('postModal');
        renderPosts(board);
    } catch (e) {
        console.error(e);
        alert("저장에 실패했습니다. Firebase 규칙을 확인하세요.");
    }
};

function renderPosts(boardName) {
    const listDiv = document.getElementById('postList');
    const filtered = window.allPosts.filter(p => p.board === boardName);
    
    let deviceId = localStorage.getItem('h1_device_id') || 'anon_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('h1_device_id', deviceId);
    const myId = window.isLoggedIn ? window.currentUser.empId : deviceId;

    if(filtered.length === 0) {
        listDiv.innerHTML = '<p style="padding:20px; text-align:center; color:#888;">작성된 글이 없습니다.</p>';
        return;
    }

    listDiv.innerHTML = filtered.map(p => {
        const isLiked = p.likedBy && p.likedBy[myId];
        return `
            <div class="post-item" onclick="openPostDetail('${p.id}')">
                <div class="post-user-info">
                    <span class="nickname">${p.author}</span>
                    <span class="post-date">${timeSince(p.timestamp)}</span>
                </div>
                <h4 class="post-title">${p.title}</h4>
                <div class="post-stats">
                    <span onclick="event.stopPropagation(); window.toggleLike('${p.id}')">
                        <i class="${isLiked ? 'fas fa-heart liked' : 'far fa-heart'}"></i> 
                        <small>${p.likedBy ? Object.keys(p.likedBy).length : 0}</small>
                    </span>
                    <span><i class="far fa-comment"></i> <small>${p.comments ? Object.keys(p.comments).length : 0}</small></span>
                </div>
            </div>`;
    }).join('');
}

window.openPostDetail = (id) => {
    const post = window.allPosts.find(p => p.id === id);
    if(!post) return;
    if (post.board === "신문고" && !(window.isLoggedIn && ["관리자", "공장장"].includes(window.currentUser.role))) {
        alert("권한이 없습니다."); return;
    }
    window.currentViewingPostId = id;
    document.getElementById('boardView').style.display = 'none';
    document.getElementById('postDetailView').style.display = 'block';
    document.getElementById('dtNickname').innerText = post.author;
    document.getElementById('dtTime').innerText = timeSince(post.timestamp);
    document.getElementById('dtTitle').innerText = post.title;
    document.getElementById('dtContent').innerText = post.content;
    updateDetailStats(post);
    renderComments(post.comments);
    history.pushState({ view: 'detail', postId: id }, '');
};

window.closePostDetail = () => {
    window.currentViewingPostId = null;
    history.back();
};

function renderComments(commentsObj) {
    const list = document.getElementById('dtCommentList');
    const comments = commentsObj ? Object.values(commentsObj) : [];
    document.getElementById('dtCommentCount').innerText = comments.length;
    list.innerHTML = comments.map(c => `<div class="dt-comment-item"><b>${c.author}</b>: ${c.text}</div>`).join('');
}

window.submitComment = async () => {
    const input = document.getElementById('dtCommentInput');
    const text = input.value.trim();
    if (!text || !window.currentViewingPostId) return;
    const authorNick = window.isLoggedIn ? window.currentUser.nickname : getRandomAnon();
    await push(ref(db, `posts/${window.currentViewingPostId}/comments`), { author: authorNick, text: text, timestamp: Date.now() });
    input.value = "";
};

window.toggleLike = async (id) => {
    const post = window.allPosts.find(p => p.id === id);
    if (!post) return;
    const myId = window.isLoggedIn ? window.currentUser.empId : localStorage.getItem('h1_device_id');
    const likedBy = post.likedBy || {};
    likedBy[myId] ? delete likedBy[myId] : likedBy[myId] = true;
    await set(ref(db, `posts/${id}/likedBy`), likedBy);
};

window.handleLikeInDetail = () => window.toggleLike(window.currentViewingPostId);

function updateDetailStats(post) {
    const likedBy = post.likedBy || {};
    const myId = window.isLoggedIn ? window.currentUser.empId : localStorage.getItem('h1_device_id');
    const isLiked = likedBy[myId];
    const icon = document.getElementById('dtLikeIcon');
    icon.className = isLiked ? 'fas fa-heart liked' : 'far fa-heart';
    document.getElementById('dtLikeCount').innerText = Object.keys(likedBy).length;
}

function timeSince(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return "방금 전";
    if (seconds < 3600) return Math.floor(seconds / 60) + "분 전";
    return Math.floor(seconds / 86400) + "일 전";
}

window.onpopstate = (event) => {
    const state = event.state;
    if (state && state.view === 'board') {
        document.getElementById('homeView').style.display = 'none';
        document.getElementById('boardView').style.display = 'block';
        document.getElementById('postDetailView').style.display = 'none';
        renderPosts(state.boardName);
    } else if (state && state.view === 'detail') {
        window.openPostDetail(state.postId);
    } else {
        window.goHome();
    }
};

window.onload = () => history.replaceState({ view: 'home' }, '');
