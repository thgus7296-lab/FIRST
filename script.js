import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, push, onValue, get, child, update, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

console.log("🔥 script.js 로드됨");

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
    '1공장 라운지': { bg: 'https://via.placeholder.com/800x200', profile: 'https://via.placeholder.com/100x100' },
    '경제 라운지': { bg: 'https://via.placeholder.com/800x200', profile: 'https://via.placeholder.com/100x100' },
    '책임 라운지': { bg: 'https://via.placeholder.com/800x200', profile: 'https://via.placeholder.com/100x100' },
    '매니저 라운지': { bg: 'https://via.placeholder.com/800x200', profile: 'https://via.placeholder.com/100x100' },
    '취미 라운지': { bg: 'https://via.placeholder.com/800x200', profile: 'https://via.placeholder.com/100x100' },
    '대나무 라운지': { bg: 'https://via.placeholder.com/800x200', profile: 'https://via.placeholder.com/100x100' }
};

// --- 모달 제어 및 외부 클릭 닫기 ---
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

// 외부 클릭 시 모달 닫기
window.closeModalByOutside = (event, id) => {
    if (event.target.id === id) window.closeModal(id);
};

// 사이드 메뉴 외부 클릭 닫기
document.addEventListener('click', (e) => {
    const menu = document.getElementById('sideMenu');
    const headerLeft = document.querySelector('.header-left');
    if (menu.classList.contains('active') && !menu.contains(e.target) && !headerLeft.contains(e.target)) {
        menu.classList.remove('active');
    }
});

// --- 로그인/회원가입 ---
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

window.showUserInfo = () => {
    alert(`내 정보\n닉네임: ${window.currentUser.nickname}\n사번: ${window.currentUser.empId}\n직급: ${window.currentUser.position}`);
};

// --- 화면 전환 ---
window.toggleMenu = () => document.getElementById('sideMenu').classList.toggle('active');

window.goHome = () => {
    document.getElementById('homeView').style.display = 'block';
    document.getElementById('boardView').style.display = 'none';
    document.getElementById('postDetailView').style.display = 'none';
    document.getElementById('sideMenu').classList.remove('active');
    history.pushState({ view: 'home' }, '');
};

window.loadBoard = (name) => {
    if (!window.isLoggedIn) { alert("로그인을 해주세요"); return; }
    if (window.currentUser.position !== "관리자") {
        if (name === "매니저 라운지" && window.currentUser.position !== "매니저") { alert("매니저 전용"); return; }
        if (name === "책임 라운지" && window.currentUser.position !== "책임 매니저") { alert("책임 전용"); return; }
    }
    document.getElementById('homeView').style.display = 'none';
    document.getElementById('boardView').style.display = 'block';
    document.getElementById('postDetailView').style.display = 'none';
    document.getElementById('currentBoardTitle').innerText = name;
    document.getElementById('bgDisplay').src = loungeSettings[name].bg;
    document.getElementById('profileDisplay').src = loungeSettings[name].profile;
    document.getElementById('writeBtn').style.display = (name === '대나무 라운지') ? 'none' : 'block';
    document.getElementById('sideMenu').classList.remove('active');
    renderPosts(name);
    history.pushState({ view: 'board', boardName: name }, '');
};

// --- 게시글 로직 (실시간 연동) ---
onValue(ref(db, 'posts'), (snapshot) => {
    const data = snapshot.val();
    window.allPosts = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
    window.allPosts.sort((a, b) => b.timestamp - a.timestamp);
    
    // 현재 상세페이지를 보고 있다면 상세 데이터도 즉시 갱신
    if (window.currentViewingPostId) {
        const updatedPost = window.allPosts.find(p => p.id === window.currentViewingPostId);
        if (updatedPost) {
            updateDetailStats(updatedPost);
            renderComments(updatedPost.comments);
        }
    }

    const currentTitle = document.getElementById('currentBoardTitle').innerText;
    if (document.getElementById('boardView').style.display === 'block') renderPosts(currentTitle);
});

window.openPostModal = () => {
    document.getElementById('postTitle').value = "";
    document.getElementById('postContent').value = "";
    window.openModal('postModal');
};

window.savePost = async () => {
    console.log("🔥 등록 버튼 눌림");
        // 로그인 검증
    if (!window.isLoggedIn || !window.currentUser) {
        alert("로그인 후 작성 가능합니다");
        return;
    }
    
    const title = document.getElementById('postTitle').value.trim();
    const content = document.getElementById('postContent').value.trim();
    const board = document.getElementById('currentBoardTitle').innerText;

    if (!title || !content) {
        alert("제목 혹은 글을 입력해주세요");
        return;
    }

    const postData = {
        board, title, content,
        author: window.currentUser.nickname,
        authorId: window.currentUser.empId,
        timestamp: Date.now(),
        views: 0,
        likedBy: {},
        comments: {}
    };

    try {
        await push(ref(db, 'posts'), postData);
        window.closeModal('postModal');
    } catch (err) {
        alert("저장에 실패했습니다: " + err.message);
    }
};

function renderPosts(boardName) {
    const listDiv = document.getElementById('postList');
    const filtered = window.allPosts.filter(p => p.board === boardName);
    if(filtered.length === 0) {
        listDiv.innerHTML = '<p style="padding:20px; text-align:center; color:#888;">작성된 글이 없습니다.</p>';
        return;
    }
    listDiv.innerHTML = filtered.map(p => `
        <div class="post-item" onclick="openPostDetail('${p.id}')">
            <div class="post-user-info">
                <span class="nickname">${p.author}</span>
                <span class="post-date">${timeSince(p.timestamp)}</span>
            </div>
            <h4 class="post-title">${p.title}</h4>
            <p class="post-summary">${p.content.substring(0, 30)}...</p>
            <div class="post-stats">
                <span onclick="event.stopPropagation(); window.toggleLike('${p.id}')">
                    <i class="${(p.likedBy && p.likedBy[window.currentUser.empId]) ? 'fas fa-heart liked' : 'far fa-heart'}"></i> 
                    <small>${p.likedBy ? Object.keys(p.likedBy).length : 0}</small>
                </span>
                <span><i class="far fa-comment"></i> <small>${p.comments ? Object.keys(p.comments).length : 0}</small></span>
                <span><i class="far fa-eye"></i> <small>${p.views || 0}</small></span>
            </div>
        </div>
    `).join('');
}

window.openPostDetail = (id) => {
    const post = window.allPosts.find(p => p.id === id);
    if(!post) return;
    window.currentViewingPostId = id;
    
    // 조회수 증가
    update(ref(db, `posts/${id}`), { views: (post.views || 0) + 1 });
    
    document.getElementById('boardView').style.display = 'none';
    document.getElementById('postDetailView').style.display = 'block';
    document.getElementById('dtNickname').innerText = post.author;
    document.getElementById('dtTime').innerText = timeSince(post.timestamp);
    document.getElementById('dtTitle').innerText = post.title;
    document.getElementById('dtContent').innerText = post.content;
    
    const canDelete = window.currentUser && (post.authorId === window.currentUser.empId || window.currentUser.position === "관리자");
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

function renderComments(commentsObj) {
    const list = document.getElementById('dtCommentList');
    const comments = commentsObj ? Object.values(commentsObj) : [];
    document.getElementById('dtCommentCount').innerText = comments.length;
    list.innerHTML = comments.map(c => `
        <div class="dt-comment-item">
            <div class="dt-comment-nick">${c.author}</div>
            <div class="dt-comment-text">${c.text}</div>
        </div>
    `).join('');
}

window.submitComment = async () => {
    const input = document.getElementById('dtCommentInput');
    if(!input.value.trim()) return;
    await push(ref(db, `posts/${window.currentViewingPostId}/comments`), {
        author: window.currentUser.nickname,
        text: input.value.trim(),
        timestamp: Date.now()
    });
    input.value = "";
};

window.toggleLike = async (id) => {
    const postRef = ref(db, `posts/${id}/likedBy`);
    const snapshot = await get(postRef);
    let likedBy = snapshot.val() || {};
    if (likedBy[window.currentUser.empId]) delete likedBy[window.currentUser.empId];
    else likedBy[window.currentUser.empId] = true;
    await set(postRef, likedBy);
};

window.handleLikeInDetail = () => window.toggleLike(window.currentViewingPostId);

function updateDetailStats(post) {
    const likedBy = post.likedBy || {};
    document.getElementById('dtLikeIcon').className = (window.currentUser && likedBy[window.currentUser.empId]) ? 'fas fa-heart liked' : 'far fa-heart';
    document.getElementById('dtLikeCount').innerText = Object.keys(likedBy).length;
    document.getElementById('dtCommentCount').innerText = post.comments ? Object.keys(post.comments).length : 0;
}

function timeSince(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return "방금 전";
    if (seconds < 3600) return Math.floor(seconds / 60) + "분 전";
    if (seconds < 86400) return Math.floor(seconds / 3600) + "시간 전";
    return Math.floor(seconds / 86400) + "일 전";
}

// --- 브라우저 뒤로가기 통합 관리 ---
window.onpopstate = (event) => {
    document.querySelectorAll('.modal').forEach(m => {
        m.style.display = 'none';
        m.classList.remove('active');
    });

    const state = event.state;
    if (!state || state.view === 'home') {
        document.getElementById('homeView').style.display = 'block';
        document.getElementById('boardView').style.display = 'none';
        document.getElementById('postDetailView').style.display = 'none';
    } else if (state.view === 'board') {
        document.getElementById('homeView').style.display = 'none';
        document.getElementById('boardView').style.display = 'block';
        document.getElementById('postDetailView').style.display = 'none';
        document.getElementById('currentBoardTitle').innerText = state.boardName;
    } else if (state.view === 'detail') {
        document.getElementById('boardView').style.display = 'none';
        document.getElementById('postDetailView').style.display = 'block';
    }
};

window.saveLoungeImages = async () => {
    const boardName = document.getElementById('currentBoardTitle').innerText;
    const bgFile = document.getElementById('bgInput').files[0];
    const profileFile = document.getElementById('profileInput').files[0];
    if (bgFile) loungeSettings[boardName].bg = await toBase64(bgFile);
    if (profileFile) loungeSettings[boardName].profile = await toBase64(profileFile);
    document.getElementById('bgDisplay').src = loungeSettings[boardName].bg;
    document.getElementById('profileDisplay').src = loungeSettings[boardName].profile;
    window.closeModal('imgEditModal');
};

const toBase64 = file => new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
});
