import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, push, onValue, update, remove } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

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

if (!localStorage.getItem('anonymousId')) {
    localStorage.setItem('anonymousId', 'anon_' + Math.random().toString(36).substr(2, 9));
}
const getVisitorId = () => window.isLoggedIn ? window.currentUser.empId : localStorage.getItem('anonymousId');

// [수정] 게시판별 문구 설정 (프로필은 요청에 따라 사용하지 않음)
const loungeSettings = {
    '칭찬 라운지': { text: '칭찬하고 싶은 구성원을 칭찬해 주세요!', color: '#ff9a9e' },
    '1공장 라운지': { text: '모든 주제에 대해 자유롭게 익명으로 말해주세요!', color: '#a1c4fd' },
    '신문고': { text: '공장장님께 건의사항이 있으면 말씀해주세요! 완벽한 익명입니다!', color: '#4facfe' },
    '퀴즈': { text: '이번 퀴즈의 행운의 당첨자가 되어보세요!', color: '#f093fb' }
};

window.onpopstate = (event) => {
    const sideMenu = document.getElementById('sideMenu');
    if (sideMenu.classList.contains('active')) {
        closeMenuInternal();
        return;
    }
    const state = event.state;
    if (!state || state.view === 'home') {
        window.goHome(true);
    } else if (state.view === 'board') {
        window.loadBoard(state.boardName, true);
    }
};

const pushHistory = (state) => {
    if (!history.state || history.state.view !== state.view || history.state.boardName !== state.boardName) {
        history.pushState(state, "");
    }
};

window.openModal = (id) => {
    const modal = document.getElementById(id);
    if (modal) { modal.style.display = 'block'; setTimeout(() => modal.classList.add('active'), 10); }
};

window.closeModal = (id) => {
    const modal = document.getElementById(id);
    if (modal) { modal.classList.remove('active'); setTimeout(() => modal.style.display = 'none', 300); }
};

window.closeModalByOutside = (e, id) => { if (e.target.id === id) window.closeModal(id); };

window.toggleMenu = () => {
    const sideMenu = document.getElementById('sideMenu');
    const overlay = document.getElementById('menuOverlay');
    const isActive = sideMenu.classList.contains('active');
    if (!isActive) {
        sideMenu.classList.add('active');
        overlay.classList.add('active');
        history.pushState({ menu: 'open' }, "");
    } else {
        history.back();
    }
};

function closeMenuInternal() {
    document.getElementById('sideMenu').classList.remove('active');
    document.getElementById('menuOverlay').classList.remove('active');
}

window.goHome = (isBack = false) => {
    document.getElementById('homeView').style.display = 'block';
    document.getElementById('boardView').style.display = 'none';
    document.getElementById('postDetailView').style.display = 'none';
    closeMenuInternal();
    if (!isBack) pushHistory({ view: 'home' });
};

window.loadBoard = (name, isBack = false) => {
    document.getElementById('homeView').style.display = 'none';
    document.getElementById('boardView').style.display = 'block';
    document.getElementById('postDetailView').style.display = 'none';
    document.getElementById('currentBoardTitle').innerText = name;
    
    // [수정] 배경 문구 및 프로필 삭제 로직
    const setting = loungeSettings[name] || { text: '함께 소통하는 공간입니다.', color: '#065d7a' };
    document.getElementById('bgText').innerText = setting.text;
    document.getElementById('bgBanner').style.background = setting.color; // 게시판별 포인트 컬러
    document.getElementById('profileArea').style.display = 'none'; // 프로필 삭제 요청 반영

    closeMenuInternal();
    renderPosts(name);
    if (!isBack) pushHistory({ view: 'board', boardName: name });
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
    if (!title || !content) return alert("제목과 내용을 모두 입력해주세요.");
    const postData = {
        board: board,
        title: title,
        content: content,
        author: window.isLoggedIn ? window.currentUser.nickname : `익명${Math.floor(Math.random() * 90 + 10)}`,
        authorId: window.isLoggedIn ? window.currentUser.empId : "anonymous",
        timestamp: Date.now(),
        views: 0
    };
    try {
        await push(ref(db, 'posts'), postData);
        window.closeModal('postModal');
        renderPosts(board);
    } catch (e) {
        alert("글 등록 실패: " + e.message);
    }
};

window.handleLogin = () => {
    const empId = document.getElementById('loginEmpId').value.trim();
    const pw = document.getElementById('loginPw').value.trim();
    if (!empId || !pw) return alert("사번과 비밀번호를 입력하세요.");
    let role = "일반", nickname = `익명${empId.slice(-2)}`;
    if (empId === "724" && pw === "724") { role = "관리자"; nickname = "관리자"; }
    else if (empId === "1" && pw === "whalsdud") { role = "공장장"; nickname = "공장장"; }
    window.currentUser = { empId, role, nickname };
    window.isLoggedIn = true;
    document.getElementById('loginIcons').style.display = 'none';
    document.getElementById('userInfoIcon').style.display = 'flex';
    window.closeModal('loginModal');
};

window.handleLogout = () => { location.reload(); };
window.showUserInfo = () => alert(`내 정보\n닉네임: ${window.currentUser.nickname}\n권한: ${window.currentUser.role}`);

function renderPosts(boardName) {
    const listDiv = document.getElementById('postList');
    if (boardName === '신문고' && (!window.isLoggedIn || window.currentUser.role !== '공장장')) {
        listDiv.innerHTML = `
            <div style="padding:60px 20px; text-align:center; color:#888;">
                <i class="fas fa-lock" style="font-size:30px; margin-bottom:15px; color:#ccc;"></i>
                <p>신문고는 공장장 전용 열람 공간입니다.<br>작성하신 글은 공장장님께만 안전하게 전달됩니다.</p>
            </div>`;
        return;
    }
    const filtered = window.allPosts.filter(p => p.board === boardName);
    if (filtered.length === 0) {
        listDiv.innerHTML = '<p style="padding:40px; text-align:center; color:#888;">작성된 글이 없습니다.</p>';
        return;
    }
    listDiv.innerHTML = filtered.map(p => `
        <div class="post-item" onclick="openPostDetail('${p.id}')">
            <div class="post-user-info">
                <span class="nickname">${p.author}</span>
                <span class="post-date">${timeSince(p.timestamp)}</span>
            </div>
            <h4 class="post-title">${p.title}</h4>
            <p class="post-summary">${p.content.substring(0, 50)}...</p>
            <div class="post-stats">
                <span><i class="far fa-heart"></i> ${p.likedBy ? Object.keys(p.likedBy).length : 0}</span>
                <span><i class="far fa-comment"></i> ${p.comments ? Object.keys(p.comments).length : 0}</span>
                <span><i class="far fa-eye"></i> ${p.views || 0}</span>
            </div>
        </div>
    `).join('');
}

window.openPostDetail = (id) => {
    const post = window.allPosts.find(p => p.id === id);
    if (!post) return;
    if (post.board === '신문고' && (!window.isLoggedIn || window.currentUser.role !== '공장장')) {
        alert("이 글을 열람할 수 있는 권한이 없습니다.");
        return;
    }
    window.currentViewingPostId = id;
    update(ref(db, `posts/${id}`), { views: (post.views || 0) + 1 });
    document.getElementById('boardView').style.display = 'none';
    document.getElementById('postDetailView').style.display = 'flex';
    document.getElementById('dtNickname').innerText = post.author;
    document.getElementById('dtTime').innerText = timeSince(post.timestamp);
    document.getElementById('dtTitle').innerText = post.title;
    document.getElementById('dtContent').innerText = post.content;
    const visitorId = getVisitorId();
    const likeCount = post.likedBy ? Object.keys(post.likedBy).length : 0;
    document.getElementById('dtLikeCount').innerText = likeCount;
    const isLiked = post.likedBy && post.likedBy[visitorId];
    const likeIcon = document.getElementById('dtLikeIcon');
    likeIcon.className = isLiked ? 'fas fa-heart' : 'far fa-heart';
    likeIcon.style.color = isLiked ? '#ff4d4d' : '#888';
    const canDelete = window.isLoggedIn && (post.authorId === window.currentUser.empId || window.currentUser.role === "관리자");
    document.getElementById('deletePostBtn').style.display = canDelete ? 'block' : 'none';
    renderComments(post.comments);
    pushHistory({ view: 'detail', postId: id, boardName: post.board });
};

window.handleLikeInDetail = async () => {
    const visitorId = getVisitorId(); 
    const postRef = ref(db, `posts/${window.currentViewingPostId}/likedBy/${visitorId}`);
    const post = window.allPosts.find(p => p.id === window.currentViewingPostId);
    if (post.likedBy && post.likedBy[visitorId]) {
        await remove(postRef);
    } else {
        await set(postRef, true);
    }
};

window.submitComment = async () => {
    const input = document.getElementById('dtCommentInput');
    if (!input.value.trim()) return;
    await push(ref(db, `posts/${window.currentViewingPostId}/comments`), {
        author: window.isLoggedIn ? window.currentUser.nickname : `익명${Math.floor(Math.random() * 90 + 10)}`,
        text: input.value.trim(),
        timestamp: Date.now()
    });
    input.value = "";
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

window.closePostDetail = () => {
    if (history.state && history.state.view === 'detail') {
        history.back();
    } else {
        const boardName = document.getElementById('currentBoardTitle').innerText;
        window.loadBoard(boardName, true);
    }
};

window.deletePost = async () => {
    if (confirm("정말 삭제하시겠습니까?")) {
        await remove(ref(db, `posts/${window.currentViewingPostId}`));
        window.closePostDetail();
    }
};

function timeSince(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return "방금 전";
    if (seconds < 3600) return Math.floor(seconds / 60) + "분 전";
    if (seconds < 86400) return Math.floor(seconds / 3600) + "시간 전";
    return Math.floor(seconds / 86400) + "일 전";
}

onValue(ref(db, 'posts'), (snapshot) => {
    const data = snapshot.val();
    window.allPosts = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
    window.allPosts.sort((a, b) => b.timestamp - a.timestamp);
    if (window.currentViewingPostId) {
        const p = window.allPosts.find(x => x.id === window.currentViewingPostId);
        if (p) {
            document.getElementById('dtLikeCount').innerText = p.likedBy ? Object.keys(p.likedBy).length : 0;
            const visitorId = getVisitorId();
            const isLiked = p.likedBy && p.likedBy[visitorId];
            const likeIcon = document.getElementById('dtLikeIcon');
            if(likeIcon) {
                likeIcon.className = isLiked ? 'fas fa-heart' : 'far fa-heart';
                likeIcon.style.color = isLiked ? '#ff4d4d' : '#888';
            }
            renderComments(p.comments);
        }
    }
    if (document.getElementById('boardView').style.display === 'block') renderPosts(document.getElementById('currentBoardTitle').innerText);
});

window.addEventListener('load', () => {
    if (!history.state) {
        history.replaceState({ view: 'home' }, "");
    }
});
