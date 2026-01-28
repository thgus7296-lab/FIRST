// [데이터 영구 유지] 초기값 설정 및 로컬스토리지 로드
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

// [저장 공통 함수]
function saveData() {
    localStorage.setItem('h1_users', JSON.stringify(users));
    localStorage.setItem('h1_posts', JSON.stringify(allPosts));
    localStorage.setItem('h1_lounges', JSON.stringify(loungeSettings));
}

// [모달 제어]
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = 'block';
        setTimeout(() => modal.classList.add('active'), 150);
        history.pushState({ modalOpen: id }, '');
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
        if (history.state && history.state.modalOpen === id) history.back();
    }
}

// [로그인 및 회원가입]
function handleJoin(event) {
    event.preventDefault();
    const empId = document.getElementById('joinEmpId').value;
    if(users.find(u => u.empId === empId)) return alert("이미 가입된 사번입니다.");
    users.push({
        name: document.getElementById('joinName').value,
        empId: empId,
        rank: document.getElementById('joinRank').value, 
        pw: document.getElementById('joinPw').value,
        position: document.getElementById('joinPosition').value
    });
    saveData();
    alert("회원가입이 완료되었습니다.");
    closeModal('joinModal');
}

function handleLogin() {
    const empId = document.getElementById('loginEmpId').value;
    const pw = document.getElementById('loginPw').value;
    let found = null;
    
    // 요청하신 ID: 1, 2, 3 고정 계정 포함 확인
    if (empId === "1" && pw === "1") found = { empId: "1", position: "관리자", name: "관리자" };
    else if (empId === "2" && pw === "2") found = { empId: "2", position: "책임 매니저", name: "책임" };
    else if (empId === "3" && pw === "3") found = { empId: "3", position: "매니저", name: "매니저" };
    else found = users.find(u => u.empId === empId && u.pw === pw);

    if (found) successLogin(found);
    else alert("사번 혹은 비밀번호를 확인해주세요.");
}

function successLogin(user) {
    // [계정별 고정 닉네임 부여] 사번 뒤 2자리 활용
    const userNum = user.empId.length >= 2 ? user.empId.slice(-2) : user.empId.padStart(2, '0');
    user.nickname = user.position === "관리자" ? "관리자" : `익명 ${userNum}`;
    
    currentUser = user;
    isLoggedIn = true;
    document.getElementById('loginIcons').style.display = 'none';
    document.getElementById('userInfoIcon').style.display = 'inline';
    closeModal('loginModal');
    alert(`${user.nickname}님 환영합니다!`);
}

function showUserInfo() {
    alert(`내 정보\n닉네임: ${currentUser.nickname}\n사번: ${currentUser.empId}\n직급: ${currentUser.position}`);
}

function toggleMenu() { document.getElementById('sideMenu').classList.toggle('active'); }
function goHome() {
    document.getElementById('homeView').style.display = 'block';
    document.getElementById('boardView').style.display = 'none';
    document.getElementById('postDetailView').style.display = 'none';
    document.getElementById('sideMenu').classList.remove('active');
}

// [게시판 로드] 권한 및 이미지 적용
function loadBoard(name) {
    if (!isLoggedIn) return alert("로그인을 해주세요");
    if (currentUser.position !== "관리자") {
        if (name === "매니저 라운지" && currentUser.position !== "매니저") return alert("매니저 전용입니다.");
        if (name === "책임 라운지" && currentUser.position !== "책임 매니저") return alert("책임 매니저 전용입니다.");
    }
    
    document.getElementById('sideMenu').classList.remove('active');
    history.pushState({ view: 'board', boardName: name }, '');
    
    document.getElementById('homeView').style.display = 'none';
    document.getElementById('boardView').style.display = 'block';
    document.getElementById('postDetailView').style.display = 'none';
    document.getElementById('currentBoardTitle').innerText = name;
    
    // 관리자 이미지 수정 버튼 제어
    document.getElementById('adminImgEditBtn').style.display = (currentUser.position === "관리자") ? "block" : "none";
    
    // 이미지 로드
    const settings = loungeSettings[name];
    document.getElementById('bgDisplay').src = settings.bg;
    document.getElementById('profileDisplay').src = settings.profile;
    
    document.getElementById('writeBtn').style.display = (name === '대나무 라운지') ? 'none' : 'block';
    renderPosts(name);
}

// [이미지 영구 저장]
async function saveLoungeImages() {
    const boardName = document.getElementById('currentBoardTitle').innerText;
    const bgFile = document.getElementById('bgInput').files[0];
    const profileFile = document.getElementById('profileInput').files[0];

    if (bgFile) loungeSettings[boardName].bg = await toBase64(bgFile);
    if (profileFile) loungeSettings[boardName].profile = await toBase64(profileFile);

    saveData();
    document.getElementById('bgDisplay').src = loungeSettings[boardName].bg;
    document.getElementById('profileDisplay').src = loungeSettings[boardName].profile;
    alert("이미지가 영구적으로 저장되었습니다.");
    closeModal('imgEditModal');
}

const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

// [게시글 기능]
function openPostModal() {
    document.getElementById('postTitle').value = "";
    document.getElementById('postContent').value = "";
    openModal('postModal');
}

function savePost() {
    const title = document.getElementById('postTitle').value.trim();
    const content = document.getElementById('postContent').value.trim();
    const board = document.getElementById('currentBoardTitle').innerText;
    if (!title || !content) return alert("내용을 입력해주세요");

    allPosts.unshift({
        id: Date.now(),
        board: board, title: title, content: content,
        author: currentUser.nickname,
        timestamp: new Date().toISOString(),
        likedBy: [], comments: [], views: 0
    });
    saveData();
    renderPosts(board); 
    closeModal('postModal'); 
}

function timeSince(dateStr) {
    const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (seconds < 60) return "방금 전";
    let interval = seconds / 3600;
    if (interval >= 1) return Math.floor(interval) + "시간 전";
    interval = seconds / 60;
    if (interval >= 1) return Math.floor(interval) + "분 전";
    return Math.floor(seconds / 86400) + "일 전";
}

function renderPosts(boardName) {
    const listDiv = document.getElementById('postList');
    const filtered = allPosts.filter(p => p.board === boardName);
    listDiv.innerHTML = filtered.length ? filtered.map(p => {
        const isLiked = currentUser && p.likedBy.includes(currentUser.empId);
        return `
            <div class="post-item" onclick="openPostDetail(${p.id})">
                <div class="post-user-info">
                    <span class="nickname">${p.author}</span>
                    <span class="post-date">${timeSince(p.timestamp)}</span>
                </div>
                <h4 class="post-title">${p.title}</h4>
                <p class="post-summary">${p.content.substring(0,35)}...</p>
                <div class="post-stats">
                    <span onclick="event.stopPropagation(); toggleLike(${p.id})">
                        <i class="${isLiked ? 'fas fa-heart liked' : 'far fa-heart'}"></i> <small>${p.likedBy.length}</small>
                    </span>
                    <span><i class="far fa-comment"></i> <small>${p.comments.length}</small></span>
                    <span><i class="far fa-eye"></i> <small>${p.views}</small></span>
                </div>
            </div>
        `;
    }).join('') : '<p style="padding:40px; text-align:center; color:#888;">작성된 글이 없습니다.</p>';
}

function openPostDetail(id) {
    const post = allPosts.find(p => p.id === id);
    if(!post) return;
    post.views++;
    currentViewingPostId = id;
    saveData();
    
    document.getElementById('boardView').style.display = 'none';
    document.getElementById('postDetailView').style.display = 'block';
    document.getElementById('dtNickname').innerText = post.author;
    document.getElementById('dtTime').innerText = timeSince(post.timestamp);
    document.getElementById('dtTitle').innerText = post.title;
    document.getElementById('dtContent').innerText = post.content;
    
    updateDetailStats(post);
    renderComments(post.comments);
    history.pushState({ view: 'detail', postId: id }, '');
}

function toggleLike(id) {
    if (!currentUser) return;
    const post = allPosts.find(p => p.id === id);
    const idx = post.likedBy.indexOf(currentUser.empId);
    if (idx === -1) post.likedBy.push(currentUser.empId);
    else post.likedBy.splice(idx, 1);
    saveData();
    if(document.getElementById('postDetailView').style.display === 'block') updateDetailStats(post);
    else renderPosts(post.board);
}

function handleLikeInDetail() { toggleLike(currentViewingPostId); }

function updateDetailStats(post) {
    const isLiked = currentUser && post.likedBy.includes(currentUser.empId);
    document.getElementById('dtLikeIcon').className = isLiked ? 'fas fa-heart liked' : 'far fa-heart';
    document.getElementById('dtLikeCount').innerText = post.likedBy.length;
    document.getElementById('dtCommentCount').innerText = post.comments.length;
}

function submitComment() {
    const input = document.getElementById('dtCommentInput');
    const text = input.value.trim();
    if(!text) return;
    const post = allPosts.find(p => p.id === currentViewingPostId);
    post.comments.push({ author: currentUser.nickname, text: text, timestamp: new Date().toISOString() });
    input.value = "";
    saveData();
    renderComments(post.comments);
    updateDetailStats(post);
}

function renderComments(comments) {
    document.getElementById('dtCommentList').innerHTML = comments.map(c => `
        <div class="dt-comment-item">
            <div class="dt-comment-nick">${c.author}</div>
            <div class="dt-comment-text">${c.text}</div>
        </div>
    `).join('');
}

function closePostDetail() { history.back(); }

window.onpopstate = function(event) {
    document.querySelectorAll('.modal').forEach(m => { m.classList.remove('active'); m.style.display = 'none'; });
    if (!(event.state && event.state.view === 'detail')) {
        document.getElementById('postDetailView').style.display = 'none';
        if (event.state && event.state.view === 'board') {
            document.getElementById('boardView').style.display = 'block';
            document.getElementById('homeView').style.display = 'none';
            renderPosts(event.state.boardName);
        } else {
            document.getElementById('homeView').style.display = 'block';
            document.getElementById('boardView').style.display = 'none';
        }
    }
};
