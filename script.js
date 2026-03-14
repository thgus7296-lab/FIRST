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

const loungeSettings = {
    '칭찬 라운지': { bg: 'https://via.placeholder.com/800x200', profile: 'https://via.placeholder.com/100x100' },
    '1공장 라운지': { bg: 'https://via.placeholder.com/800x200', profile: 'https://via.placeholder.com/100x100' },
    '신문고': { bg: 'https://via.placeholder.com/800x200', profile: 'https://via.placeholder.com/100x100' },
    '퀴즈': { bg: 'https://via.placeholder.com/800x200', profile: 'https://via.placeholder.com/100x100' }
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
window.toggleMenu = () => document.getElementById('sideMenu').classList.toggle('active');

window.goHome = () => {
    document.getElementById('homeView').style.display = 'block';
    document.getElementById('boardView').style.display = 'none';
    document.getElementById('postDetailView').style.display = 'none';
    document.getElementById('sideMenu').classList.remove('active');
};

// [수정 위치 1] 게시판 로드 시 권한 체크
window.loadBoard = (name) => {
    if (name === '신문고') {
        if (!window.isLoggedIn || window.currentUser.role !== '공장장') {
            alert("신문고는 공장장만 열람할 수 있는 비공개 공간입니다.");
            document.getElementById('sideMenu').classList.remove('active');
            return;
        }
    }
    
    document.getElementById('homeView').style.display = 'none';
    document.getElementById('boardView').style.display = 'block';
    document.getElementById('postDetailView').style.display = 'none';
    document.getElementById('currentBoardTitle').innerText = name;
    const setting = loungeSettings[name] || loungeSettings['칭찬 라운지'];
    document.getElementById('bgDisplay').src = setting.bg;
    document.getElementById('profileDisplay').src = setting.profile;
    document.getElementById('sideMenu').classList.remove('active');
    renderPosts(name);
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

// [수정 위치 2] 렌더링 시 이중 보안 필터링
function renderPosts(boardName) {
    const listDiv = document.getElementById('postList');
    
    // 신문고 게시판일 때 공장장이 아니면 리스트를 비워버림
    if (boardName === '신문고' && (!window.isLoggedIn || window.currentUser.role !== '공장장')) {
        listDiv.innerHTML = '<p style="padding:40px; text-align:center; color:#888;">권한이 없습니다.</p>';
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
    
    // 상세보기 시에도 신문고 글이라면 권한 체크
    if (post.board === '신문고' && (!window.isLoggedIn || window.currentUser.role !== '공장장')) {
        alert("이 글을 볼 권한이 없습니다.");
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
    const likeCount = post.likedBy ? Object.keys(post.likedBy).length : 0;
    document.getElementById('dtLikeCount').innerText = likeCount;
    const isLiked = window.isLoggedIn && post.likedBy && post.likedBy[window.currentUser.empId];
    const likeIcon = document.getElementById('dtLikeIcon');
    likeIcon.className = isLiked ? 'fas fa-heart' : 'far fa-heart';
    likeIcon.style.color = isLiked ? '#ff4d4d' : '#888';
    const canDelete = window.isLoggedIn && (post.authorId === window.currentUser.empId || window.currentUser.role === "관리자");
    document.getElementById('deletePostBtn').style.display = canDelete ? 'block' : 'none';
    renderComments(post.comments);
};

window.handleLikeInDetail = async () => {
    if (!window.isLoggedIn) return alert("로그인이 필요합니다.");
    const postRef = ref(db, `posts/${window.currentViewingPostId}/likedBy/${window.currentUser.empId}`);
    const post = window.allPosts.find(p => p.id === window.currentViewingPostId);
    if (post.likedBy && post.likedBy[window.currentUser.empId]) await remove(postRef);
    else await set(postRef, true);
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

window.closePostDetail = () => { window.currentViewingPostId = null; window.loadBoard(document.getElementById('currentBoardTitle').innerText); };

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
            renderComments(p.comments);
        }
    }
    if (document.getElementById('boardView').style.display === 'block') renderPosts(document.getElementById('currentBoardTitle').innerText);
});
