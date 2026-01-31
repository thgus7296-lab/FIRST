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
    '리더 라운지': { bg: 'https://via.placeholder.com/800x200', profile: 'https://via.placeholder.com/100x100' },
    '책임 라운지': { bg: 'https://via.placeholder.com/800x200', profile: 'https://via.placeholder.com/100x100' },
    '매니저 라운지': { bg: 'https://via.placeholder.com/800x200', profile: 'https://via.placeholder.com/100x100' },
    '경제 라운지': { bg: 'https://via.placeholder.com/800x200', profile: 'https://via.placeholder.com/100x100' },
    '취미 라운지': { bg: 'https://via.placeholder.com/800x200', profile: 'https://via.placeholder.com/100x100' },
    '신문고': { bg: 'https://via.placeholder.com/800x200', profile: 'https://via.placeholder.com/100x100' }
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
        // 모달 전용 히스토리가 쌓여있을 때만 back()을 실행하여 onpopstate의 홈 이동을 방지합니다.
        if (history.state && history.state.modalOpen === id) {
            history.back();
        }
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
window.toggleMenu = () => {
    const menu = document.getElementById('sideMenu');
    const isActive = menu.classList.toggle('active');
    // 메뉴가 열릴 때만 히스토리에 기록을 남겨서 뒤로가기 대응
    if (isActive) {
        history.pushState({ menuOpen: true }, '');
    }
};

window.goHome = () => {
    document.getElementById('homeView').style.display = 'block';
    document.getElementById('boardView').style.display = 'none';
    document.getElementById('postDetailView').style.display = 'none';
    const menu = document.getElementById('sideMenu');
    if (menu) menu.classList.remove('active');

    // 🔥 [버그 수정] 홈으로 이동할 때 히스토리 상태를 명확히 'home'으로 고정합니다.
    if (!history.state || history.state.view !== 'home') {
        history.pushState({ view: 'home' }, '');
    }
};

window.loadBoard = (name) => {
    if (!window.isLoggedIn) { alert("로그인을 해주세요"); return; }
    
    const user = window.currentUser;
    // 관리자는 무조건 프리패스
    if (user.position !== "관리자") {
        // 리더 라운지: 직위가 '보직과장', '부서장', '팀장'인 계정만
        if (name === "리더 라운지") {
            const leaderRoles = ["보직과장", "부서장", "팀장"];
            if (!leaderRoles.includes(user.duty)) { 
                alert("리더 라운지는 보직과장, 부서장, 팀장만 입장 가능합니다.");
                return;
            }
        }
        // 책임 라운지: 직급이 '책임 매니저'이면서 직위가 '해당 없음'인 계정만
        else if (name === "책임 라운지") {
            if (!(user.position === "책임 매니저" && user.duty === "해당 없음")) {
                alert("책임 라운지는 직위가 없는 책임 매니저만 입장 가능합니다.");
                return;
            }
        }
        // 매니저 라운지: 직급이 '매니저'인 계정만
        else if (name === "매니저 라운지") {
            if (user.position !== "매니저") {
                alert("매니저 라운지는 매니저 직급만 입장 가능합니다.");
                return;
            }
        }
    }

    document.getElementById('homeView').style.display = 'none';
    document.getElementById('boardView').style.display = 'block';
    document.getElementById('postDetailView').style.display = 'none';
    document.getElementById('currentBoardTitle').innerText = name;
    
    // 설정값 적용 (신규 게시판 대응)
    const setting = loungeSettings[name] || { bg: 'https://via.placeholder.com/800x200', profile: 'https://via.placeholder.com/100x100' };
    document.getElementById('bgDisplay').src = setting.bg;
    document.getElementById('profileDisplay').src = setting.profile;
    
    document.getElementById('writeBtn').style.display = (name === '대나무 라운지') ? 'none' : 'block';
    
    // 메뉴가 열려있는 상태에서 클릭했다면 히스토리를 뒤로 돌려 menuOpen 상태 제거
    const menu = document.getElementById('sideMenu');
    if (menu.classList.contains('active')) {
        history.back();
    }
    
    renderPosts(name);
    history.pushState({ view: 'board', boardName: name }, '');
};

// --- 게시글 로직 (실시간 연동) ---
onValue(ref(db, 'posts'), (snapshot) => {
    const data = snapshot.val();
    // 1. 전체 게시글 데이터를 최신화하고 정렬합니다.
    window.allPosts = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
    window.allPosts.sort((a, b) => b.timestamp - a.timestamp); 
    // 2. 현재 사용자가 게시글 상세보기를 하고 있는 경우
    if (window.currentViewingPostId) {
        const updatedPost = window.allPosts.find(p => p.id === window.currentViewingPostId);
        if (updatedPost) {
            updateDetailStats(updatedPost); // 좋아요 수 등 갱신
            renderComments(updatedPost.comments); // 댓글 목록 갱신
        }
    }
    // 3. 현재 사용자가 게시판 목록을 보고 있는 경우에도 즉시 리스트를 다시 그립니다.
    const currentTitle = document.getElementById('currentBoardTitle').innerText;
    const boardView = document.getElementById('boardView');
        // 게시판 뷰가 열려있을 때만 렌더링하여 성능 저하를 방지합니다.
    if (boardView && boardView.style.display !== 'none') {
        renderPosts(currentTitle);
    }
});

window.openPostModal = () => {
    document.getElementById('postTitle').value = "";
    document.getElementById('postContent').value = "";
    window.openModal('postModal');
};

window.savePost = async () => {
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
        // 🔥 저장 후 목록 강제 갱신
        renderPosts(board); 
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

    listDiv.innerHTML = filtered.map(p => {
        // 🔥 [사장님 요청사항: 내용 표출 로직 적용]
        const firstLine = p.content.split('\n')[0]; // 첫 번째 줄만 추출
        let displayContent = "";

        // 1. 첫 줄이 10글자 이하이고 전체 내용에 줄 바꿈이 없을 때
        if (p.content.length <= 10 && !p.content.includes('\n')) {
            displayContent = p.content;
        } 
        // 2~4. 그 외 (10글자 초과 혹은 줄 바꿈이 있는 모든 경우)
        else {
            displayContent = firstLine.substring(0, 10) + "...";
        }

        return `
            <div class="post-item" onclick="openPostDetail('${p.id}')">
                <div class="post-user-info">
                    <span class="nickname" style="font-weight: bold;">${p.author}</span>
                    <span class="post-date">${timeSince(p.timestamp)}</span>
                </div>
                <h4 class="post-title" style="font-weight: bold;">${p.title}</h4>
                <p class="post-summary">${displayContent}</p>
                <div class="post-stats">
                    <span onclick="event.stopPropagation(); window.toggleLike('${p.id}')">
                        <i class="${(p.likedBy && p.likedBy[window.currentUser.empId]) ? 'fas fa-heart liked' : 'far fa-heart'}"></i> 
                        <small>${p.likedBy ? Object.keys(p.likedBy).length : 0}</small>
                    </span>
                    <span><i class="far fa-comment"></i> <small>${p.comments ? Object.keys(p.comments).length : 0}</small></span>
                    <span><i class="far fa-eye"></i> <small>${p.views || 0}</small></span>
                </div>
            </div>
        `;
    }).join('');
}

window.openPostDetail = (id) => {
    const post = window.allPosts.find(p => p.id === id);
    if(!post) return;

    // 🔥 [신문고] 열람 권한 체크: 공장장 및 관리자만 가능
    if (post.board === "신문고" && window.currentUser.position !== "관리자") {
        if (window.currentUser.duty !== "공장장") {
            alert("신문고 게시글은 공장장님만 열람할 수 있습니다.");
            return;
        }
    }

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
    // 1. 현재 보고 있는 게시판 이름을 가져옵니다.
    const boardName = document.getElementById('currentBoardTitle').innerText;
        // 2. 상세보기 ID 초기화
    window.currentViewingPostId = null;
        // 3. 목록 화면으로 전환하기 전에 리스트를 최신 데이터(window.allPosts)로 다시 그립니다.
    renderPosts(boardName);
        // 4. 뒤로가기 실행 (화면 전환)
    history.back();
};


window.deletePost = async () => {
    if (!confirm("삭제하시겠습니까?")) return;
    
    const boardName = document.getElementById('currentBoardTitle').innerText;
    const postId = window.currentViewingPostId;

    try {
        await remove(ref(db, `posts/${postId}`));
        
        // 🔥 history.back() 대신 직접 화면 전환을 처리하여 홈으로 튕기는 현상 방지
        window.currentViewingPostId = null;
        document.getElementById('postDetailView').style.display = 'none';
        document.getElementById('boardView').style.display = 'block';
        renderPosts(boardName);
        
        // 히스토리 상태를 게시판 목록으로 강제 변경
        history.replaceState({ view: 'board', boardName: boardName }, '');
        
        alert("삭제되었습니다.");
    } catch (err) {
        alert("삭제 중 오류 발생: " + err.message);
    }
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
    if (!input.value.trim()) return;
    // 1️⃣ 현재 보고 있는 게시글 찾기
    const post = window.allPosts.find(
        p => p.id === window.currentViewingPostId
    );
    if (!post) return;
    // 2️⃣ comments 없으면 생성
    post.comments = post.comments || {};
    // 3️⃣ 임시 ID 생성 (화면용)
    const tempId = Date.now();
    // 4️⃣ JS 메모리에 먼저 댓글 추가 (🔥 핵심)
    post.comments[tempId] = {
        author: window.currentUser.nickname,
        text: input.value.trim(),
        timestamp: Date.now()
    };
// 5️⃣ UI 즉시 반영
    renderComments(post.comments);
    updateDetailStats(post);
    // 🔥 [사장님 지시사항 수정] 목록 화면의 댓글 수도 즉시 갱신
    const boardName = document.getElementById('currentBoardTitle').innerText;
    renderPosts(boardName);
    // 6️⃣ Firebase 저장 (백엔드용)
    await push(
        ref(db, `posts/${post.id}/comments`),
        post.comments[tempId]
    );
    // 7️⃣ 입력창 초기화
    input.value = "";
};


window.toggleLike = async (id) => {
    const post = window.allPosts.find(p => p.id === id);
    if (!post) return;
    // 1️⃣ UI용 likedBy 먼저 수정
    post.likedBy = post.likedBy || {};
    if (post.likedBy[window.currentUser.empId]) {
        delete post.likedBy[window.currentUser.empId];
    } else {
        post.likedBy[window.currentUser.empId] = true;
    }
    // 2️⃣ 즉시 UI 반영
    updateDetailStats(post);
    const boardName = document.getElementById('currentBoardTitle').innerText;
    renderPosts(boardName);
    // 3️⃣ Firebase에 반영
    await set(ref(db, `posts/${id}/likedBy`), post.likedBy);
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
window.savePost = async () => {
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
        
        // 🔥 [수정] 모달을 닫기 전에 목록을 먼저 확실히 갱신
        renderPosts(board); 
        
        // closeModal 내부의 history.back()이 onpopstate를 트리거해도 
        // 1번 로직에서 'modalOpen' 상태를 체크하므로 홈으로 튕기지 않습니다.
        window.closeModal('postModal');
        
        alert("등록되었습니다.");
    } catch (err) {
        alert("저장에 실패했습니다: " + err.message);
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

// --- 브라우저 뒤로가기 통합 관리 (사장님 지시사항 반영) ---
window.onpopstate = (event) => {
    const state = event.state;
    const menu = document.getElementById('sideMenu');
    const detailView = document.getElementById('postDetailView');
    const boardView = document.getElementById('boardView');

    // 1순위: 메뉴가 열려있으면 메뉴부터 닫고 중단
    if (menu.classList.contains('active')) {
        menu.classList.remove('active');
        return;
    }

    // 2순위: 모달 닫기
    if (state && state.modalOpen) {
        document.querySelectorAll('.modal').forEach(m => {
            m.style.display = 'none';
            m.classList.remove('active');
        });
        return; 
    }

    // 3순위: 상세보기 화면에서 뒤로가기 -> 목록으로
    if (detailView.style.display === 'block') {
        detailView.style.display = 'none';
        boardView.style.display = 'block';
        window.currentViewingPostId = null;
        renderPosts(document.getElementById('currentBoardTitle').innerText);
        return;
    }

    // 4순위: 게시판 목록에서 뒤로가기 -> 홈으로
    if (boardView.style.display === 'block') {
        window.goHome();
        return;
    }

    // 기본: 홈 화면 표시
    document.getElementById('homeView').style.display = 'block';
    document.getElementById('boardView').style.display = 'none';
    document.getElementById('postDetailView').style.display = 'none';
};
