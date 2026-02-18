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
    '신문고': { bg: 'https://via.placeholder.com/800x200', profile: 'https://via.placeholder.com/100x100' }
};

// 랜덤 닉네임 생성 함수
const getRandomAnon = () => `익명${Math.floor(Math.random() * 90 + 10)}`;

// --- 모달 제어 ---
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

// --- 게시판 목록 외부 터치 시 닫기 (수정됨) ---
document.addEventListener('click', (e) => {
    const menu = document.getElementById('sideMenu');
    const headerLeft = document.querySelector('.header-left');
    // 메뉴가 활성화되어 있고, 클릭한 대상이 메뉴 내부나 햄버거 버튼이 아닐 때 닫기
    if (menu.classList.contains('active') && !menu.contains(e.target) && !headerLeft.contains(e.target)) {
        menu.classList.remove('active');
        if (history.state && history.state.menuOpen) history.back(); // 히스토리 동기화
    }
});

// --- 로그인 시스템 ---
window.handleLogin = async () => {
    const empId = document.getElementById('loginEmpId').value.trim();
    const pw = document.getElementById('loginPw').value.trim();
    if (!empId || !pw) { alert("사번과 비밀번호를 입력해주세요."); return; }

    let userRole = "일반";
    let nickname = "";

    if (empId === "1" && pw === "1") {
        userRole = "관리자"; nickname = "관리자";
    } else if (empId === "2000" && pw === "2000") {
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

// --- 화면 전환 및 뒤로가기 제어 (수정됨) ---
window.toggleMenu = () => {
    const menu = document.getElementById('sideMenu');
    if (menu.classList.toggle('active')) history.pushState({ menuOpen: true }, '');
};

window.goHome = () => {
    document.getElementById('homeView').style.display = 'block';
    document.getElementById('boardView').style.display = 'none';
    document.getElementById('postDetailView').style.display = 'none';
    document.getElementById('sideMenu').classList.remove('active');
    // 홈으로 이동 시 히스토리 초기화 (메인에서 뒤로가기 시 종료되도록)
    if (!history.state || history.state.view !== 'home') {
        history.replaceState({ view: 'home' }, '');
    }
};

window.loadBoard = (name) => {
    // 로그인을 하지 않아도 접근 가능하도록 수정
    document.getElementById('homeView').style.display = 'none';
    document.getElementById('boardView').style.display = 'block';
    document.getElementById('postDetailView').style.display = 'none';
    document.getElementById('currentBoardTitle').innerText = name;
    
    const setting = loungeSettings[name] || { bg: 'https://via.placeholder.com/800x200', profile: 'https://via.placeholder.com/100x100' };
    document.getElementById('bgDisplay').src = setting.bg;
    document.getElementById('profileDisplay').src = setting.profile;
    
    if (document.getElementById('sideMenu').classList.contains('active')) {
        document.getElementById('sideMenu').classList.remove('active');
        history.back();
    }
    
    renderPosts(name);
    history.pushState({ view: 'board', boardName: name }, '');
};

// --- 게시글 로직 ---
onValue(ref(db, 'posts'), (snapshot) => {
    const data = snapshot.val();
    window.allPosts = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
    window.allPosts.sort((a, b) => b.timestamp - a.timestamp); 

    if (window.currentViewingPostId) {
        const post = window.allPosts.find(p => p.id === window.currentViewingPostId);
        if (post) { updateDetailStats(post); renderComments(post.comments); }
    }
    const currentTitle = document.getElementById('currentBoardTitle').innerText;
    if (document.getElementById('boardView').style.display !== 'none') renderPosts(currentTitle);
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

    // 비로그인 시 랜덤 익명 부여
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

    await push(ref(db, 'posts'), postData);
    window.closeModal('postModal');
};

function renderPosts(boardName) {
    const listDiv = document.getElementById('postList');
    const filtered = window.allPosts.filter(p => p.board === boardName);
    
    if(filtered.length === 0) {
        listDiv.innerHTML = '<p style="padding:20px; text-align:center; color:#888;">작성된 글이 없습니다.</p>';
        return;
    }

    listDiv.innerHTML = filtered.map(p => {
        const displayContent = p.content.length > 10 ? p.content.substring(0, 10) + "..." : p.content;
        return `
            <div class="post-item" onclick="openPostDetail('${p.id}')">
                <div class="post-user-info">
                    <span class="nickname">${p.author}</span>
                    <span class="post-date">${timeSince(p.timestamp)}</span>
                </div>
                <h4 class="post-title">${p.title}</h4>
                <p class="post-summary">${displayContent}</p>
                <div class="post-stats">
                    <span>
                        <i class="${(window.isLoggedIn && p.likedBy && p.likedBy[window.currentUser.empId]) ? 'fas fa-heart liked' : 'far fa-heart'}"></i> 
                        <small>${p.likedBy ? Object.keys(p.likedBy).length : 0}</small>
                    </span>
                    <span><i class="far fa-comment"></i> <small>${p.comments ? Object.keys(p.comments).length : 0}</small></span>
                    <span><i class="far fa-eye"></i> <small>${p.views || 0}</small></span>
                </div>
            </div>`;
    }).join('');
}

window.openPostDetail = (id) => {
    const post = window.allPosts.find(p => p.id === id);
    if(!post) return;

    // 신문고 권한 강화: 관리자/공장장이 아니면 비로그인/일반인 모두 차단
    if (post.board === "신문고") {
        const isAuth = window.isLoggedIn && ["관리자", "공장장"].includes(window.currentUser.role);
        if (!isAuth) {
            alert("신문고 게시글 열람은 공장장 및 관리자만 가능합니다.");
            return;
        }
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

window.submitComment = async () => {
    const input = document.getElementById('dtCommentInput');
    if (!input.value.trim() || !window.currentViewingPostId) return;
    const post = window.allPosts.find(p => p.id === window.currentViewingPostId);
    
    // 비로그인 시 댓글도 랜덤 익명
    const authorNick = window.isLoggedIn ? window.currentUser.nickname : getRandomAnon();

    const commentData = {
        author: authorNick,
        text: input.value.trim(),
        timestamp: Date.now()
    };

    await push(ref(db, `posts/${post.id}/comments`), commentData);
    input.value = "";
};

window.toggleLike = async (id) => {
    if (!window.isLoggedIn) { alert("좋아요는 로그인이 필요합니다."); return; }
    const post = window.allPosts.find(p => p.id === id);
    if (!post) return;
    const likedBy = post.likedBy || {};
    if (likedBy[window.currentUser.empId]) delete likedBy[window.currentUser.empId];
    else likedBy[window.currentUser.empId] = true;
    await set(ref(db, `posts/${id}/likedBy`), likedBy);
};

window.handleLikeInDetail = () => window.toggleLike(window.currentViewingPostId);

function updateDetailStats(post) {
    const likedBy = post.likedBy || {};
    document.getElementById('dtLikeIcon').className = (window.isLoggedIn && likedBy[window.currentUser.empId]) ? 'fas fa-heart liked' : 'far fa-heart';
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

// --- 브라우저 뒤로가기 통합 관리 (수정됨) ---
window.onpopstate = (event) => {
    const state = event.state;
    const menu = document.getElementById('sideMenu');

    // 1. 메뉴 닫기
    if (menu.classList.contains('active')) {
        menu.classList.remove('active');
        return;
    }

    // 2. 모달 닫기
    if (!state || !state.modalOpen) {
        document.querySelectorAll('.modal').forEach(m => {
            m.style.display = 'none';
            m.classList.remove('active');
        });
    }

    // 3. 화면 상태 전환
    if (state && state.view === 'board') {
        document.getElementById('homeView').style.display = 'none';
        document.getElementById('boardView').style.display = 'block';
        document.getElementById('postDetailView').style.display = 'none';
        renderPosts(state.boardName);
    } else if (state && state.view === 'detail') {
        // 상세보기가 이미 열려있지 않은 경우에만 호출 (루프 방지)
        if (window.currentViewingPostId !== state.postId) {
            openPostDetail(state.postId);
        }
    } else {
        // 기본적으로 메인 화면으로 이동 (뒤로가기 시 앱 종료 방지)
        goHome();
    }
};

// 앱 시작 시 메인 상태 주입
window.onload = () => {
    history.replaceState({ view: 'home' }, '');
};
