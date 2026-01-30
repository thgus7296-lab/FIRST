let currentUser = null; 
let isLoggedIn = false;
let users = []; 
let allPosts = []; 
let currentViewingPostId = null;

let loungeSettings = {
    '1공장 라운지': { bg: 'https://via.placeholder.com/800x200', profile: 'https://via.placeholder.com/100x100' },
    '경제 라운지': { bg: 'https://via.placeholder.com/800x200', profile: 'https://via.placeholder.com/100x100' },
    '책임 라운지': { bg: 'https://via.placeholder.com/800x200', profile: 'https://via.placeholder.com/100x100' },
    '매니저 라운지': { bg: 'https://via.placeholder.com/800x200', profile: 'https://via.placeholder.com/100x100' },
    '취미 라운지': { bg: 'https://via.placeholder.com/800x200', profile: 'https://via.placeholder.com/100x100' },
    '대나무 라운지': { bg: 'https://via.placeholder.com/800x200', profile: 'https://via.placeholder.com/100x100' }
};

function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        if (id === 'joinModal') document.getElementById('joinForm').reset();
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
    if (empId === "1" && pw === "1") successLogin({ empId: "1", position: "관리자", name: "관리자" });
    else {
        const user = users.find(u => u.empId === empId && u.pw === pw);
        if (user) successLogin(user);
        else alert("정보를 확인해주세요");
    }
}

function successLogin(user) {
    const userNum = user.empId.slice(-2).padStart(2, '0');
    user.nickname = user.position === "관리자" ? "관리자" : `익명 ${userNum}`;
    currentUser = user;
    isLoggedIn = true;
    document.getElementById('loginIcons').style.display = 'none';
    document.getElementById('userInfoIcon').style.display = 'flex'; // 아이콘 두 개라 flex 권장
    closeModal('loginModal');
    alert(`${user.nickname}님 환영합니다!`);
}

// 로그아웃 기능 추가
function handleLogout() {
    if (!confirm("로그아웃 하시겠습니까?")) return;
    currentUser = null;
    isLoggedIn = false;
    document.getElementById('loginIcons').style.display = 'inline';
    document.getElementById('userInfoIcon').style.display = 'none';
    goHome(); // 로그아웃 시 홈으로 이동
    alert("로그아웃 되었습니다.");
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
    document.getElementById('sideMenu').classList.remove('active');
}

function loadBoard(name) {
    if (!isLoggedIn) { alert("로그인을 해주세요"); return; }
    if (currentUser.position !== "관리자") {
        if (name === "매니저 라운지" && currentUser.position !== "매니저") { alert("매니저 전용입니다."); return; }
        if (name === "책임 라운지" && currentUser.position !== "책임 매니저") { alert("책임 매니저 전용입니다."); return; }
    }
    
    if (document.getElementById('sideMenu').classList.contains('active')) history.back();
    
    setTimeout(() => {
        history.pushState({ view: 'board' }, '');
        document.getElementById('homeView').style.display = 'none';
        document.getElementById('boardView').style.display = 'block';
        document.getElementById('postDetailView').style.display = 'none';
        document.getElementById('currentBoardTitle').innerText = name;
        
        document.getElementById('adminImgEditBtn').style.display = (currentUser.position === "관리자") ? "block" : "none";
        
        document.getElementById('bgDisplay').src = loungeSettings[name].bg;
        document.getElementById('profileDisplay').src = loungeSettings[name].profile;

        document.getElementById('writeBtn').style.display = (name === '대나무 라운지') ? 'none' : 'block';
        renderPosts(name);
    }, 10);
}

async function saveLoungeImages() {
    const boardName = document.getElementById('currentBoardTitle').innerText;
    const bgFile = document.getElementById('bgInput').files[0];
    const profileFile = document.getElementById('profileInput').files[0];

    if (bgFile) loungeSettings[boardName].bg = await toBase64(bgFile);
    if (profileFile) loungeSettings[boardName].profile = await toBase64(profileFile);

    document.getElementById('bgDisplay').src = loungeSettings[boardName].bg;
    document.getElementById('profileDisplay').src = loungeSettings[boardName].profile;
    
    alert("이미지가 변경되었습니다.");
    closeModal('imgEditModal');
}

const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

function openPostModal() {
    document.getElementById('postTitle').value = "";
    document.getElementById('postContent').value = "";
    openModal('postModal');
}

function savePost() {
    const title = document.getElementById('postTitle').value.trim();
    const content = document.getElementById('postContent').value.trim();
    const board = document.getElementById('currentBoardTitle').innerText;
    if (!title || !content) { alert("제목 혹은 글을 입력해주세요"); return; }

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

function timeSince(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return "방금 전";
    let interval = seconds / 3600;
    if (interval >= 1) return Math.floor(interval) + "시간";
    interval = seconds / 60;
    if (interval >= 1) return Math.floor(interval) + "분";
    return Math.floor(seconds / 86400) + "일";
}

function renderPosts(boardName) {
    const listDiv = document.getElementById('postList');
    const filtered = allPosts.filter(p => p.board === boardName);
    if(filtered.length === 0) {
        listDiv.innerHTML = '<p style="padding:20px; text-align:center; color:#888;">작성된 글이 없습니다.</p>';
        return;
    }
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

function openPostDetail(id) {
    const post = allPosts.find(p => p.id === id);
    if(!post) return;
    currentViewingPostId = id;
    post.views++;
    renderPosts(post.board);
    document.getElementById('boardView').style.display = 'none';
    document.getElementById('postDetailView').style.display = 'block';
    document.getElementById('dtNickname').innerText = post.author;
    document.getElementById('dtTime').innerText = timeSince(post.timestamp);
    document.getElementById('dtTitle').innerText = post.title;
    document.getElementById('dtContent').innerText = post.content;
    
    const canDelete = currentUser && (post.author === currentUser.nickname || currentUser.position === "관리자");
    document.getElementById('deletePostBtn').style.display = canDelete ? 'block' : 'none';

    updateDetailStats(post);
    renderComments(post.comments);
    history.pushState({ view: 'detail', postId: id }, '');
}

function deletePost() {
    if (!confirm("정말 이 게시글을 삭제하시겠습니까?")) return;
    
    const postIdx = allPosts.findIndex(p => p.id === currentViewingPostId);
    if (postIdx > -1) {
        const boardName = allPosts[postIdx].board;
        allPosts.splice(postIdx, 1);
        alert("게시글이 삭제되었습니다.");
        renderPosts(boardName);
        closePostDetail();
    }
}

function closePostDetail() { history.back(); }

function renderComments(comments) {
    const list = document.getElementById('dtCommentList');
    list.innerHTML = comments.map(c => `
        <div class="dt-comment-item">
            <div class="dt-comment-nick">${c.author}</div>
            <div class="dt-comment-text">${c.text}</div>
        </div>
    `).join('');
}

function submitComment() {
    const input = document.getElementById('dtCommentInput');
    const text = input.value.trim();
    if(!text) return;
    const post = allPosts.find(p => p.id === currentViewingPostId);
    post.comments.push({ author: currentUser.nickname, text: text, timestamp: new Date() });
    input.value = "";
    renderComments(post.comments);
    updateDetailStats(post);
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

window.addEventListener('click', function(event) {
    if (event.target.closest('.modal-content')) return; 
    if (event.target.classList.contains('modal')) { closeModal(event.target.id); return; }
    const sideMenu = document.getElementById('sideMenu');
    const menuBtn = document.querySelector('.header-left');
    if (sideMenu && sideMenu.classList.contains('active') && !sideMenu.contains(event.target) && !menuBtn.contains(event.target)) {
        history.back();
    }
}, true);

window.onpopstate = function(event) {
    document.querySelectorAll('.modal').forEach(m => { m.classList.remove('active'); m.style.display = 'none'; });
    const menu = document.getElementById('sideMenu');
    if (menu && menu.classList.contains('active')) menu.classList.remove('active');
    if (!(event.state && event.state.view === 'detail')) {
        document.getElementById('postDetailView').style.display = 'none';
        if (!event.state || event.state.view !== 'board') {
            document.getElementById('homeView').style.display = 'block';
            document.getElementById('boardView').style.display = 'none';
        } else {
            document.getElementById('boardView').style.display = 'block';
        }
    }
};
