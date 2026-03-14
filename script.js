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

// 전역 상태
window.currentUser = null;
window.isLoggedIn = false;
window.allPosts = [];
window.currentViewingPostId = null;

const loungeSettings = {
    '칭찬 라운지': { bg: 'https://via.placeholder.com/800x200', profile: 'https://via.placeholder.com/100x100' },
    '1공장 라운지': { bg: 'https://via.placeholder.com/800x200', profile: 'https://via.placeholder.com/100x100' },
    '신문고': { bg: 'https://via.placeholder.com/800x200', profile: 'https://via.placeholder.com/100x100' },
    '퀴즈': { bg: 'https://via.placeholder.com/800x200', profile: 'https://via.placeholder.com/100x100' }
};

const getRandomAnon = () => `익명${Math.floor(Math.random() * 90 + 10)}`;

// --- 전역 함수 할당 (HTML 클릭용) ---
window.openModal = (id) => {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.style.display = 'block';
    setTimeout(() => modal.classList.add('active'), 10);
    history.pushState({ modalOpen: id }, '');
};

window.closeModal = (id) => {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
        if (history.state && history.state.modalOpen === id) history.back();
    }
};

window.closeModalByOutside = (event, id) => { if (event.target.id === id) window.closeModal(id); };

window.toggleMenu = () => {
    const menu = document.getElementById('sideMenu');
    if (menu.classList.toggle('active')) history.pushState({ menuOpen: true }, '');
};

window.goHome = () => {
    document.getElementById('homeView').style.display = 'block';
    document.getElementById('boardView').style.display = 'none';
    document.getElementById('postDetailView').style.display = 'none';
    document.getElementById('sideMenu').classList.remove('active');
    history.replaceState({ view: 'home' }, '');
};

window.loadBoard = (name) => {
    document.getElementById('homeView').style.display = 'none';
    document.getElementById('boardView').style.display = 'block';
    document.getElementById('postDetailView').style.display = 'none';
    document.getElementById('currentBoardTitle').innerText = name;
    
    const setting = loungeSettings[name] || loungeSettings['칭찬 라운지'];
    document.getElementById('bgDisplay').src = setting.bg;
    document.getElementById('profileDisplay').src = setting.profile;
    
    document.getElementById('sideMenu').classList.remove('active');
    renderPosts(name);
    history.pushState({ view: 'board', boardName: name }, '');
};

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
        nickname = `익명${empId.slice(-2).padStart(2, '0')}`;
    }

    window.currentUser = { empId, role: userRole, nickname };
    window.isLoggedIn = true;
    document.getElementById('loginIcons').style.display = 'none';
    document.getElementById('userInfoIcon').style.display = 'flex';
    document.getElementById('adminImgEditBtn').style.display = (userRole === "관리자") ? 'block' : 'none';
    window.closeModal('loginModal');
};

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

    const postData = {
        board, title, content,
        author: window.isLoggedIn ? window.currentUser.nickname : getRandomAnon(),
        authorId: window.isLoggedIn ? window.currentUser.empId : "anonymous",
        timestamp: Date.now(),
        views: 0,
        likedBy: {},
        comments: {}
    };

    await push(ref(db, 'posts'), postData);
    window.closeModal('postModal');
};

window.openPostDetail = (id) => {
    const post = window.allPosts.find(p => p.id === id);
    if(!post) return;

    if (post.board === "신문고" && !(window.isLoggedIn && ["관리자", "공장장"].includes(window.currentUser.role))) {
        alert("신문고 게시글 열람은 공장장만 가능합니다.");
        return;
    }

    window.currentViewingPostId = id;
    update(ref(db, `posts/${id}`), { views: (post.views || 0) + 1 });
    
    document.getElementById('boardView').style.display = 'none';
    document.getElementById('postDetailView').style.display = 'block';
    document.getElementById('dtNickname').innerText = post.author;
    document.getElementById('dtTime').innerText = timeSince(post.timestamp);
    document.getElementById('dtTitle').innerText = post.title;
    document.getElementById('dtContent').innerText = post.content;
    
    const canDelete = window.isLoggedIn && (post.authorId === window.currentUser.empId || window.currentUser.role === "관리자");
    document.getElementById('deletePostBtn').style.display = canDelete ? 'block' : 'none';
    
    updateDetailStats(post);
    renderComments(post.comments);
    history.pushState({ view: 'detail', postId: id }, '');
};

window.closePostDetail = () => {
    window.currentViewingPostId = null;
    history.back();
};

window.deletePost = async () => {
    if (!confirm("삭제하시겠습니까?")) return;
    await remove(ref(db, `posts/${window.currentViewingPostId}`));
    window.closePostDetail();
};

window.submitComment = async () => {
    const input = document.getElementById('dtCommentInput');
    const text = input.value.trim();
    if (!text || !window.currentViewingPostId) return;

    const authorNick = window.isLoggedIn ? window.currentUser.nickname : getRandomAnon();
    await push(ref(db, `posts/${window.currentViewingPostId}/comments`), {
        author: authorNick,
        text: text,
        timestamp: Date.now()
    });
    input.value = "";
    input.focus();
};

window.toggleLike = async (id) => {
    const post = window.allPosts.find(p => p.id === id);
    if (!post) return;

    let deviceId = localStorage.getItem('h1_device_id') || 'anon_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('h1_device_id', deviceId);
    const myId = window.isLoggedIn ? window.currentUser.empId : deviceId;
    
    const likedBy = post.likedBy || {};
    if (likedBy[myId]) delete likedBy[myId];
    else likedBy[myId] = true;
    
    await set(ref(db, `posts/${id}/likedBy`), likedBy);
};

window.handleLikeInDetail = () => window.toggleLike(window.currentViewingPostId);

// --- 내부 유틸리티 ---
function renderPosts(boardName) {
    const listDiv = document.getElementById('postList');
    const filtered = window.allPosts.filter(p => p.board === boardName);
    
    if(filtered.length === 0) {
        listDiv.innerHTML = '<p style="padding:20px; text-align:center; color:#888;">작성된 글이 없습니다.</p>';
        return;
    }

    let deviceId = localStorage.getItem('h1_device_id');
    const myId = window.isLoggedIn ? window.currentUser.empId : deviceId;

    listDiv.innerHTML = filtered.map(p => {
        const isLiked = p.likedBy && p.likedBy[myId];
        return `
            <div class="post-item" onclick="openPostDetail('${p.id}')">
                <div class="post-user-info">
                    <span class="nickname">${p.author}</span>
                    <span class="post-date">${timeSince(p.timestamp)}</span>
                </div>
                <h4 class="post-title">${p.title}</h4>
                <p class="post-summary">${p.content.substring(0, 20)}...</p>
                <div class="post-stats">
                    <span onclick="event.stopPropagation(); window.toggleLike('${p.id}')">
                        <i class="${isLiked ? 'fas fa-heart liked' : 'far fa-heart'}"></i> 
                        <small>${p.likedBy ? Object.keys(p.likedBy).length : 0}</small>
                    </span>
                    <span><i class="far fa-comment"></i> <small>${p.comments ? Object.keys(p.comments).length : 0}</small></span>
                    <span><i class="far fa-eye"></i> <small>${p.views || 0}</small></span>
                </div>
            </div>`;
    }).join('');
}

function renderComments(commentsObj) {
    const list = document.getElementById('dtCommentList');
    const comments = commentsObj ? Object.values(commentsObj) : [];
    document.getElementById('dtCommentCount').innerText = comments.length;
    list.innerHTML = comments.map(c => `
        <div class="dt-comment-item">
            <div class="dt-comment-nick">${c.author}</div>
            <div class="dt-comment-text">${c.text}</div>
        </div>`).join('');
}

function updateDetailStats(post) {
    const deviceId = localStorage.getItem('h1_device_id');
    const myId = window.isLoggedIn ? window.currentUser.empId : deviceId;
    const isLiked = post.likedBy && post.likedBy[myId];
    
    const likeIcon = document.getElementById('dtLikeIcon');
    if (likeIcon) {
        likeIcon.className = isLiked ? 'fas fa-heart liked' : 'far fa-heart';
    }
    document.getElementById('dtLikeCount').innerText = post.likedBy ? Object.keys(post.likedBy).length : 0;
}

function timeSince(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return "방금 전";
    if (seconds < 3600) return Math.floor(seconds / 60) + "분 전";
    return Math.floor(seconds / 3600) + "시간 전";
}

onValue(ref(db, 'posts'), (snapshot) => {
    const data = snapshot.val();
    window.allPosts = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
    window.allPosts.sort((a, b) => b.timestamp - a.timestamp);

    const activeView = document.getElementById('boardView').style.display === 'block';
    if (activeView && !document.querySelector('.modal.active')) {
        renderPosts(document.getElementById('currentBoardTitle').innerText);
    }
    if (window.currentViewingPostId) {
        const post = window.allPosts.find(p => p.id === window.currentViewingPostId);
        if (post) {
            updateDetailStats(post);
            renderComments(post.comments);
        }
    }
});

window.onpopstate = (event) => {
    const state = event.state;
    if (state && state.view === 'board') window.loadBoard(state.boardName);
    else if (state && state.view === 'detail') window.openPostDetail(state.postId);
    else window.goHome();
};

window.onload = () => { history.replaceState({ view: 'home' }, ''); };
