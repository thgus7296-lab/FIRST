let currentUser = null; 
let isLoggedIn = false;
let users = []; 
let allPosts = []; 
let currentViewingPostId = null;

// --- 기존 기본 함수 유지 ---
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        if (id === 'joinModal') document.getElementById('joinForm')?.reset();
        modal.style.display = 'block';
        setTimeout(() => { modal.classList.add('active'); }, 150);
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
function handleJoin(event) {
    event.preventDefault();
    users.push({
        name: document.getElementById('joinName').value,
        empId: document.getElementById('joinEmpId').value,
        rank: document.getElementById('joinRank').value, 
        pw: document.getElementById('joinPw').value,
        position: document.getElementById('joinPosition').value
    });
    alert("회원가입이 완료되었습니다.");
    closeModal('joinModal');
}
function handleLogin() {
    const empId = document.getElementById('loginEmpId').value;
    const pw = document.getElementById('loginPw').value;
    const user = users.find(u => u.empId === empId && u.pw === pw);
    if (empId === "1" && pw === "1") successLogin({ empId: "1", position: "관리자", name: "관리자" });
    else if (user) successLogin(user);
    else alert("정보를 확인해주세요");
}
function successLogin(user) {
    const userNum = user.empId.slice(-2).padStart(2, '0');
    user.nickname = `익명 ${userNum}`;
    currentUser = user;
    isLoggedIn = true;
    document.getElementById('loginIcons').style.display = 'none';
    document.getElementById('userInfoIcon').style.display = 'inline';
    closeModal('loginModal');
}
function toggleMenu() {
    const menu = document.getElementById('sideMenu');
    menu.classList.toggle('active');
    if (menu.classList.contains('active')) history.pushState({ state: 'menu' }, '');
}
function goHome() {
    document.getElementById('homeView').style.display = 'block';
    document.getElementById('boardView').style.display = 'none';
    document.getElementById('postDetailView').style.display = 'none';
}
function loadBoard(name) {
    if (!isLoggedIn) { alert("로그인을 해주세요"); return; }
    history.pushState({ view: 'board' }, '');
    document.getElementById('homeView').style.display = 'none';
    document.getElementById('boardView').style.display = 'block';
    document.getElementById('postDetailView').style.display = 'none';
    document.getElementById('currentBoardTitle').innerText = name;
    renderPosts(name);
}

// --- 게시글 저장 ---
function savePost() {
    const title = document.getElementById('postTitle').value.trim();
    const content = document.getElementById('postContent').value.trim();
    const board = document.getElementById('currentBoardTitle').innerText;
    if (!title || !content) return;

    allPosts.unshift({
        id: Date.now(),
        board: board,
        title: title,
        content: content,
        author: currentUser.nickname,
        timestamp: new Date(),
        likedBy: [], 
        comments: [],
        views: 0
    });
    renderPosts(board); 
    closeModal('postModal'); 
}

// --- [수정] 상세 보기 (조회수 즉시 반영) ---
function openPostDetail(id) {
    const post = allPosts.find(p => p.id === id);
    if(!post) return;
    currentViewingPostId = id;

    // 1. 조회수 즉시 상승
    post.views++;
    
    // 2. 목록 화면 미리 갱신 (나중에 돌아왔을 때 보임)
    renderPosts(post.board);

    // 3. UI 전환
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

function closePostDetail() {
    history.back();
}

// --- [수정] 댓글 등록 (목록 개수 즉시 반영) ---
function submitComment() {
    const input = document.getElementById('dtCommentInput');
    const text = input.value.trim();
    if(!text) return;

    const post = allPosts.find(p => p.id === currentViewingPostId);
    post.comments.push({
        author: currentUser.nickname,
        text: text,
        timestamp: new Date()
    });
    
    input.value = "";
    renderComments(post.comments);
    updateDetailStats(post);
    
    // 게시글 목록의 댓글 카운트도 즉시 갱신
    renderPosts(post.board);
}

function updateDetailStats(post) {
    const isLiked = currentUser && post.likedBy.includes(currentUser.empId);
    document.getElementById('dtLikeIcon').className = isLiked ? 'fas fa-heart liked' : 'far fa-heart';
    document.getElementById('dtLikeCount').innerText = post.likedBy.length;
    document.getElementById('dtCommentCount').innerText = post.comments.length;
}

function handleLikeInDetail() {
    toggleLike(currentViewingPostId);
    const post = allPosts.find(p => p.id === currentViewingPostId);
    updateDetailStats(post);
}

function toggleLike(id) {
    if (!currentUser) return;
    const post = allPosts.find(p => p.id === id);
    const idx = post.likedBy.indexOf(currentUser.empId);
    if (idx === -1) post.likedBy.push(currentUser.empId);
    else post.likedBy.splice(idx, 1);
    renderPosts(post.board);
}

function renderPosts(boardName) {
    const listDiv = document.getElementById('postList');
    const filtered = allPosts.filter(p => p.board === boardName);
    listDiv.innerHTML = filtered.map(p => {
        const isLiked = currentUser && p.likedBy.includes(currentUser.empId);
        return `
            <div class="post-item" onclick="openPostDetail(${p.id})">
                <div class="post-user-info">
                    <span class="nickname">${p.author}</span>
                    <span class="post-date">${timeSince(p.timestamp)}</span>
                </div>
                <h4 class="post-title">${p.title}</h4>
                <p class="post-summary">${p.content.substring(0, 20)}</p>
                <div class="post-stats">
                    <span onclick="event.stopPropagation(); toggleLike(${p.id})">
                        <i class="${isLiked ? 'fas fa-heart liked' : 'far fa-heart'}"></i> <small>${p.likedBy.length}</small>
                    </span>
                    <span><i class="far fa-comment"></i> <small>${p.comments.length}</small></span>
                    <span><i class="far fa-eye"></i> <small>${p.views}</small></span>
                </div>
            </div>
        `;
    }).join('');
}

function timeSince(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 86400;
    if (interval >= 1) return Math.floor(interval) + "일";
    interval = seconds / 3600;
    if (interval >= 1) return Math.floor(interval) + "시간";
    interval = seconds / 60;
    if (interval >= 1) return Math.floor(interval) + "분";
    return "방금 전";
}

function renderComments(comments) {
    const list = document.getElementById('dtCommentList');
    list.innerHTML = comments.map(c => `
        <div class="dt-comment-item">
            <div class="dt-comment-nick">${c.author}</div>
            <div class="dt-comment-text">${c.text}</div>
        </div>
    `).join('');
}

window.onpopstate = function(event) {
    if (!event.state || event.state.view !== 'detail') {
        document.getElementById('postDetailView').style.display = 'none';
        if (event.state?.view === 'board') {
            document.getElementById('boardView').style.display = 'block';
        } else {
            document.getElementById('homeView').style.display = 'block';
            document.getElementById('boardView').style.display = 'none';
        }
    }
};
