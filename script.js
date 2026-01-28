let currentUser = null; 
let isLoggedIn = false;
let users = []; 
let allPosts = []; 
let currentPostId = null; // 현재 상세 보기 중인 게시글 ID

function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        if (id === 'joinModal') document.getElementById('joinForm').reset();
        modal.style.display = 'block';
        setTimeout(() => {
            modal.classList.add('active');
            if (id === 'joinModal') document.getElementById('joinEmpId').focus();
        }, 150); 
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
    user.nickname = `익명 ${user.empId.slice(-2).padStart(2, '0')}`;
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

function toggleMenu() {
    const menu = document.getElementById('sideMenu');
    menu.classList.toggle('active');
    if (menu.classList.contains('active')) history.pushState({ state: 'menu' }, '');
}

function goHome() {
    document.getElementById('homeView').style.display = 'block';
    document.getElementById('boardView').style.display = 'none';
    document.getElementById('postDetailView').style.display = 'none';
    document.getElementById('mainHeader').style.display = 'flex';
}

function loadBoard(name) {
    if (!isLoggedIn) { alert("로그인을 해주세요"); return; }
    document.getElementById('homeView').style.display = 'none';
    document.getElementById('boardView').style.display = 'block';
    document.getElementById('postDetailView').style.display = 'none';
    document.getElementById('mainHeader').style.display = 'flex';
    document.getElementById('currentBoardTitle').innerText = name;
    renderPosts(name);
}

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
        comments: [] // 댓글 객체 배열로 변경
    });
    renderPosts(board); 
    closeModal('postModal'); 
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

// 상세 페이지 열기
function openPostDetail(id) {
    const post = allPosts.find(p => p.id === id);
    if(!post) return;
    currentPostId = id;

    document.getElementById('mainHeader').style.display = 'none';
    document.getElementById('boardView').style.display = 'none';
    document.getElementById('postDetailView').style.display = 'block';

    document.getElementById('detailNickname').innerText = post.author;
    document.getElementById('detailTime').innerText = timeSince(post.timestamp);
    document.getElementById('detailTitle').innerText = post.title;
    document.getElementById('detailContent').innerText = post.content;
    
    updateDetailStats(post);
    renderComments(post.comments);
    history.pushState({ view: 'detail', postId: id }, '');
}

function goBackToBoard() {
    history.back();
}

function updateDetailStats(post) {
    const isLiked = currentUser && post.likedBy.includes(currentUser.empId);
    const likeIcon = document.getElementById('detailLikeIcon');
    likeIcon.className = isLiked ? 'fas fa-heart liked' : 'far fa-heart';
    document.getElementById('detailLikeCount').innerText = post.likedBy.length;
    document.getElementById('detailCommentCount').innerText = post.comments.length;
}

function toggleLikeInDetail() {
    toggleLike(currentPostId);
    const post = allPosts.find(p => p.id === currentPostId);
    updateDetailStats(post);
}

function addComment() {
    const input = document.getElementById('commentInput');
    const text = input.value.trim();
    if(!text) return;

    const post = allPosts.find(p => p.id === currentPostId);
    post.comments.push({
        author: currentUser.nickname,
        text: text,
        timestamp: new Date()
    });
    
    input.value = "";
    renderComments(post.comments);
    updateDetailStats(post);
}

function renderComments(comments) {
    const list = document.getElementById('commentList');
    list.innerHTML = comments.map(c => `
        <div class="comment-item">
            <div class="comment-nick">${c.author}</div>
            <div class="comment-text">${c.text}</div>
        </div>
    `).join('');
}

function renderPosts(boardName) {
    const listDiv = document.getElementById('postList');
    const filtered = allPosts.filter(p => p.board === boardName);
    listDiv.innerHTML = filtered.map(p => {
        const summary = p.content.length > 20 ? p.content.substring(0, 20) + "..." : p.content;
        const isLiked = currentUser && p.likedBy.includes(currentUser.empId);
        return `
            <div class="post-item" onclick="openPostDetail(${p.id})">
                <div class="post-user-info">
                    <span class="nickname">${p.author}</span>
                    <span class="post-date">${timeSince(p.timestamp)}</span>
                </div>
                <h4 class="post-title">${p.title}</h4>
                <p class="post-summary">${summary}</p>
                <div class="post-stats">
                    <span onclick="event.stopPropagation(); toggleLike(${p.id}); renderPosts('${boardName}')">
                        <i class="${isLiked ? 'fas fa-heart liked' : 'far fa-heart'}"></i> <small>${p.likedBy.length}</small>
                    </span>
                    <span><i class="far fa-comment"></i> <small>${p.comments.length}</small></span>
                </div>
            </div>
        `;
    }).join('');
}

function toggleLike(id) {
    if (!currentUser) return;
    const post = allPosts.find(p => p.id === id);
    const idx = post.likedBy.indexOf(currentUser.empId);
    if (idx === -1) post.likedBy.push(currentUser.empId);
    else post.likedBy.splice(idx, 1);
}

window.onpopstate = function(event) {
    if (!event.state || event.state.view !== 'detail') {
        document.getElementById('postDetailView').style.display = 'none';
        if (document.getElementById('homeView').style.display === 'none') {
            document.getElementById('boardView').style.display = 'block';
            document.getElementById('mainHeader').style.display = 'flex';
        }
    }
};
