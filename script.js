// [데이터 영구 유지 및 초기화]
let users = JSON.parse(localStorage.getItem('h1_users')) || [];
let allPosts = JSON.parse(localStorage.getItem('h1_posts')) || [];
let loungeSettings = JSON.parse(localStorage.getItem('h1_lounges')) || {
    '1공장 라운지': { bg: 'https://via.placeholder.com/800x200', profile: 'https://via.placeholder.com/100x100' },
    '경제 라운지': { bg: 'https://via.placeholder.com/800x200', profile: 'https://via.placeholder.com/100x100' },
    '책임 라운지': { bg: 'https://via.placeholder.com/800x200', profile: 'https://via.placeholder.com/100x100' },
    '매니저 라운지': { bg: 'https://via.placeholder.com/800x200', profile: 'https://via.placeholder.com/100x100' },
    '취미 라운지': { bg: 'https://via.placeholder.com/800x200', profile: 'https://via.placeholder.com/100x100' },
    '대나무 라운지': { bg: 'https://via.placeholder.com/800x200', profile: 'https://via.placeholder.com/100x100' }
};

let currentUser = null; 
let isLoggedIn = false;
let currentViewingPostId = null;

// 초기 히스토리 상태 설정 (무한 루프 방지)
window.onload = () => { if(!history.state) history.replaceState({ view: 'home' }, ''); };

function saveData() {
    localStorage.setItem('h1_users', JSON.stringify(users));
    localStorage.setItem('h1_posts', JSON.stringify(allPosts));
    localStorage.setItem('h1_lounges', JSON.stringify(loungeSettings));
}

// [모달 및 메뉴 제어 - 스크롤 잠금 기능 추가]
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        if(id === 'joinModal') document.getElementById('joinForm').reset();
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // 배경 스크롤 방지
        setTimeout(() => modal.classList.add('active'), 10);
        history.pushState({ modalOpen: id }, '');
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
        document.body.style.overflow = 'auto'; // 스크롤 복구
        if (history.state && history.state.modalOpen === id) history.back();
    }
}

function closeModalOnOverlay(event, modalId) {
    if (event.target.id === modalId) closeModal(modalId);
}

function toggleMenu() {
    const menu = document.getElementById('sideMenu');
    const overlay = document.getElementById('menuOverlay');
    const isActive = menu.classList.toggle('active');
    overlay.style.display = isActive ? 'block' : 'none';
    document.body.style.overflow = isActive ? 'hidden' : 'auto';
    if(isActive) history.pushState({ state: 'menu' }, '');
}

// [로그인 로직]
function handleLogin() {
    const empId = document.getElementById('loginEmpId').value;
    const pw = document.getElementById('loginPw').value;
    let found = null;
    if (empId === "1" && pw === "1") found = { empId: "1", position: "관리자", name: "관리자" };
    else if (empId === "2" && pw === "2") found = { empId: "2", position: "책임 매니저", name: "책임" };
    else if (empId === "3" && pw === "3") found = { empId: "3", position: "매니저", name: "매니저" };
    else found = users.find(u => u.empId === empId && u.pw === pw);

    if (found) {
        const userNum = found.empId.slice(-2).padStart(2, '0');
        found.nickname = found.position === "관리자" ? "관리자" : `익명 ${userNum}`;
        currentUser = found;
        isLoggedIn = true;
        document.getElementById('loginIcons').style.display = 'none';
        document.getElementById('userInfoIcon').style.display = 'inline';
        closeModal('loginModal');
        alert(`${currentUser.nickname}님 환영합니다!`);
    } else alert("계정 정보를 다시 확인해주세요.");
}

function handleJoin(event) {
    event.preventDefault();
    const empId = document.getElementById('joinEmpId').value;
    if(users.find(u => u.empId === empId)) return alert("이미 등록된 사번입니다.");
    users.push({
        name: document.getElementById('joinName').value,
        empId: empId, pw: document.getElementById('joinPw').value,
        position: document.getElementById('joinPosition').value, rank: document.getElementById('joinRank').value
    });
    saveData();
    alert("회원가입이 완료되었습니다.");
    closeModal('joinModal');
}

function showUserInfo() {
    alert(`[내 정보]\n닉네임: ${currentUser.nickname}\n사번: ${currentUser.empId}\n권한: ${currentUser.position}`);
}

// [게시판 로직]
function loadBoard(name) {
    if (!isLoggedIn) return alert("로그인이 필요합니다.");
    if (currentUser.position !== "관리자") {
        if (name === "매니저 라운지" && currentUser.position !== "매니저") return alert("해당 라운지 접근 권한이 없습니다.");
        if (name === "책임 라운지" && currentUser.position !== "책임 매니저") return alert("해당 라운지 접근 권한이 없습니다.");
    }
    
    if(document.getElementById('sideMenu').classList.contains('active')) toggleMenu();
    
    document.getElementById('homeView').style.display = 'none';
    document.getElementById('boardView').style.display = 'block';
    document.getElementById('postDetailView').style.display = 'none';
    document.getElementById('currentBoardTitle').innerText = name;
    
    document.getElementById('adminImgEditBtn').style.display = (currentUser.position === "관리자") ? "block" : "none";
    document.getElementById('bgDisplay').src = loungeSettings[name].bg;
    document.getElementById('profileDisplay').src = loungeSettings[name].profile;
    document.getElementById('writeBtn').style.display = (name === '대나무 라운지') ? 'none' : 'block';
    
    renderPosts(name);
    history.pushState({ view: 'board', boardName: name }, '');
}

async function saveLoungeImages() {
    const boardName = document.getElementById('currentBoardTitle').innerText;
    const bgFile = document.getElementById('bgInput').files[0];
    const profileFile = document.getElementById('profileInput').files[0];

    if (bgFile) loungeSettings[boardName].bg = await toBase64(bgFile);
    if (profileFile) loungeSettings[boardName].profile = await toBase64(profileFile);

    saveData();
    document.getElementById('bgDisplay').src = loungeSettings[boardName].bg;
    document.getElementById('profileDisplay').src = loungeSettings[boardName].profile;
    alert("이미지 변경 사항이 저장되었습니다.");
    closeModal('imgEditModal');
}

const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

// [게시글 기능]
function openPostModal() { openModal('postModal'); }

function savePost() {
    const title = document.getElementById('postTitle').value.trim();
    const content = document.getElementById('postContent').value.trim();
    const board = document.getElementById('currentBoardTitle').innerText;
    if (!title || !content) return alert("내용을 입력해주세요.");

    allPosts.unshift({
        id: Date.now(), board: board, title: title, content: content,
        author: currentUser.nickname, authorId: currentUser.empId,
        timestamp: new Date().toISOString(), likedBy: [], comments: [], views: 0
    });
    saveData();
    renderPosts(board); 
    closeModal('postModal');
}

function timeSince(dateStr) {
    const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (seconds < 60) return "방금 전";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}분 전`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}시간 전`;
    return `${Math.floor(hours / 24)}일 전`;
}

function renderPosts(boardName) {
    const listDiv = document.getElementById('postList');
    const filtered = allPosts.filter(p => p.board === boardName);
    listDiv.innerHTML = filtered.length ? filtered.map(p => `
        <div class="post-item" onclick="openPostDetail(${p.id})">
            <div class="post-user-info">
                <span class="nickname">${p.author}</span>
                <span class="post-date">${timeSince(p.timestamp)}</span>
            </div>
            <h4 class="post-title">${p.title}</h4>
            <p class="post-summary">${p.content.substring(0,35)}...</p>
        </div>
    `).join('') : '<p style="padding:40px; text-align:center; color:#888;">작성된 게시글이 없습니다.</p>';
}

function openPostDetail(id) {
    const post = allPosts.find(p => p.id === id);
    if(!post) return;
    currentViewingPostId = id;
    post.views = (post.views || 0) + 1;
    saveData();

    document.getElementById('boardView').style.display = 'none';
    document.getElementById('postDetailView').style.display = 'block';
    document.getElementById('dtNickname').innerText = post.author;
    document.getElementById('dtTime').innerText = timeSince(post.timestamp);
    document.getElementById('dtTitle').innerText = post.title;
    document.getElementById('dtContent').innerText = post.content;
    
    updateDetailView(post);
    history.pushState({ view: 'detail', postId: id }, '');
}

function updateDetailView(post) {
    const isLiked = currentUser && post.likedBy.includes(currentUser.empId);
    document.getElementById('dtLikeIcon').className = isLiked ? 'fas fa-heart liked' : 'far fa-heart';
    document.getElementById('dtLikeCount').innerText = post.likedBy.length;
    document.getElementById('dtCommentCount').innerText = post.comments.length;
    renderComments(post.comments);
}

function handleLikeInDetail() {
    const post = allPosts.find(p => p.id === currentViewingPostId);
    const idx = post.likedBy.indexOf(currentUser.empId);
    if(idx === -1) post.likedBy.push(currentUser.empId);
    else post.likedBy.splice(idx, 1);
    saveData();
    updateDetailView(post);
}

function submitComment() {
    const input = document.getElementById('dtCommentInput');
    const text = input.value.trim();
    if(!text) return;
    const post = allPosts.find(p => p.id === currentViewingPostId);
    post.comments.push({ author: currentUser.nickname, text: text, timestamp: new Date().toISOString() });
    input.value = "";
    saveData();
    updateDetailView(post);
}

function renderComments(comments) {
    document.getElementById('dtCommentList').innerHTML = comments.map(c => `
        <div class="dt-comment-item"><strong>${c.author}</strong><br>${c.text}</div>
    `).join('');
}

function closePostDetail() { history.back(); }

function goHome() {
    document.getElementById('homeView').style.display = 'block';
    document.getElementById('boardView').style.display = 'none';
    document.getElementById('postDetailView').style.display = 'none';
    const menu = document.getElementById('sideMenu');
    if(menu.classList.contains('active')) toggleMenu();
    history.replaceState({ view: 'home' }, '');
}

// [브라우저 뒤로가기 통합 제어]
window.onpopstate = function(event) {
    // 1. 모든 모달 닫기 및 스크롤 복구
    document.querySelectorAll('.modal').forEach(m => { m.classList.remove('active'); m.style.display = 'none'; });
    document.body.style.overflow = 'auto';

    // 2. 사이드 메뉴 닫기
    const menu = document.getElementById('sideMenu');
    if(menu.classList.contains('active')) {
        menu.classList.remove('active');
        document.getElementById('menuOverlay').style.display = 'none';
    }

    // 3. 뷰 전환 제어
    const state = event.state;
    if (state && state.view === 'detail') {
        openPostDetail(state.postId);
    } else if (state && state.view === 'board') {
        document.getElementById('postDetailView').style.display = 'none';
        document.getElementById('boardView').style.display = 'block';
        document.getElementById('homeView').style.display = 'none';
        renderPosts(state.boardName);
    } else {
        document.getElementById('postDetailView').style.display = 'none';
        document.getElementById('boardView').style.display = 'none';
        document.getElementById('homeView').style.display = 'block';
    }
};
