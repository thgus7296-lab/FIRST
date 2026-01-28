// [데이터 영구 유지]
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

function saveData() {
    localStorage.setItem('h1_users', JSON.stringify(users));
    localStorage.setItem('h1_posts', JSON.stringify(allPosts));
    localStorage.setItem('h1_lounges', JSON.stringify(loungeSettings));
}

// [모달/메뉴 제어 기능 개선]
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = 'block';
        setTimeout(() => modal.classList.add('active'), 10);
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

// 외곽 영역 터치 시 닫기
function closeModalOnOverlay(event, modalId) {
    if (event.target.id === modalId) closeModal(modalId);
}

function toggleMenu() {
    const menu = document.getElementById('sideMenu');
    const overlay = document.getElementById('menuOverlay');
    const isActive = menu.classList.toggle('active');
    overlay.style.display = isActive ? 'block' : 'none';
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
    } else alert("정보를 확인해주세요.");
}

function handleJoin(event) {
    event.preventDefault();
    const empId = document.getElementById('joinEmpId').value;
    if(users.find(u => u.empId === empId)) return alert("이미 가입된 사번입니다.");
    users.push({
        name: document.getElementById('joinName').value,
        empId: empId, rank: document.getElementById('joinRank').value, 
        pw: document.getElementById('joinPw').value, position: document.getElementById('joinPosition').value
    });
    saveData();
    alert("회원가입 완료!");
    closeModal('joinModal');
}

// [이미지 저장 기능 - 상호작용 수정]
async function saveLoungeImages() {
    const boardName = document.getElementById('currentBoardTitle').innerText;
    const bgFile = document.getElementById('bgInput').files[0];
    const profileFile = document.getElementById('profileInput').files[0];

    try {
        if (bgFile) loungeSettings[boardName].bg = await toBase64(bgFile);
        if (profileFile) loungeSettings[boardName].profile = await toBase64(profileFile);

        saveData();
        document.getElementById('bgDisplay').src = loungeSettings[boardName].bg;
        document.getElementById('profileDisplay').src = loungeSettings[boardName].profile;
        alert("저장되었습니다.");
        closeModal('imgEditModal');
    } catch (e) {
        alert("이미지 용량이 너무 큽니다. 다른 이미지를 선택해주세요.");
    }
}

const toBase64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
});

// [게시판 및 게시글 로직]
function loadBoard(name) {
    if (!isLoggedIn) return alert("로그인 후 이용 가능합니다.");
    if (currentUser.position !== "관리자") {
        if (name === "매니저 라운지" && currentUser.position !== "매니저") return alert("권한이 없습니다.");
        if (name === "책임 라운지" && currentUser.position !== "책임 매니저") return alert("권한이 없습니다.");
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

function openPostModal() {
    document.getElementById('postTitle').value = "";
    document.getElementById('postContent').value = "";
    openModal('postModal');
}

function savePost() {
    const title = document.getElementById('postTitle').value.trim();
    const content = document.getElementById('postContent').value.trim();
    const board = document.getElementById('currentBoardTitle').innerText;
    if (!title || !content) return alert("내용을 입력하세요.");

    allPosts.unshift({
        id: Date.now(), board: board, title: title, content: content,
        author: currentUser.nickname, authorId: currentUser.empId,
        timestamp: new Date().toISOString(),
        likedBy: [], comments: [], views: 0
    });
    saveData();
    renderPosts(board); 
    closeModal('postModal'); // 저장 후 닫기 기능 수정
}

function renderPosts(boardName) {
    const listDiv = document.getElementById('postList');
    const filtered = allPosts.filter(p => p.board === boardName);
    listDiv.innerHTML = filtered.length ? filtered.map(p => `
        <div class="post-item" onclick="openPostDetail(${p.id})">
            <div class="post-user-info">
                <span class="nickname">${p.author}</span>
                <span class="post-date">방금 전</span>
            </div>
            <h4 class="post-title">${p.title}</h4>
            <p class="post-summary">${p.content.substring(0,30)}...</p>
        </div>
    `).join('') : '<p style="padding:40px; text-align:center; color:#888;">글이 없습니다.</p>';
}

function openPostDetail(id) {
    const post = allPosts.find(p => p.id === id);
    if(!post) return;
    currentViewingPostId = id;
    document.getElementById('boardView').style.display = 'none';
    document.getElementById('postDetailView').style.display = 'block';
    document.getElementById('dtNickname').innerText = post.author;
    document.getElementById('dtTitle').innerText = post.title;
    document.getElementById('dtContent').innerText = post.content;
    document.getElementById('dtLikeCount').innerText = post.likedBy.length;
    document.getElementById('dtCommentCount').innerText = post.comments.length;
    renderComments(post.comments);
    history.pushState({ view: 'detail', postId: id }, '');
}

function submitComment() {
    const input = document.getElementById('dtCommentInput');
    const text = input.value.trim();
    if(!text) return;
    const post = allPosts.find(p => p.id === currentViewingPostId);
    post.comments.push({ author: currentUser.nickname, text: text });
    input.value = "";
    saveData();
    renderComments(post.comments);
    document.getElementById('dtCommentCount').innerText = post.comments.length;
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
}

// [뒤로가기 처리]
window.onpopstate = function(event) {
    // 모든 모달 닫기
    document.querySelectorAll('.modal').forEach(m => { m.classList.remove('active'); m.style.display = 'none'; });
    // 메뉴 닫기
    const menu = document.getElementById('sideMenu');
    if(menu.classList.contains('active')) {
        menu.classList.remove('active');
        document.getElementById('menuOverlay').style.display = 'none';
    }
    
    if (!(event.state && event.state.view === 'detail')) {
        document.getElementById('postDetailView').style.display = 'none';
        if (event.state && event.state.view === 'board') {
            document.getElementById('boardView').style.display = 'block';
            document.getElementById('homeView').style.display = 'none';
        } else {
            document.getElementById('homeView').style.display = 'block';
            document.getElementById('boardView').style.display = 'none';
        }
    }
};
