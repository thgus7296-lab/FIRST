// 1. 초기 설정 및 데이터
let currentUser = null; 
let isLoggedIn = false;
let users = []; 
let allPosts = []; // 게시글 저장 배열

// 모달 열기
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = 'block';
        setTimeout(() => {
            modal.classList.add('active');
            if (id === 'joinModal') {
                const firstInput = document.getElementById('joinName');
                if (firstInput) firstInput.focus();
            }
        }, 100);
        history.pushState({ modalOpen: id }, ''); 
    }
}

// 모달 닫기
function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
        if (history.state && history.state.modalOpen === id) {
            history.back();
        }
    }
}

function handleJoin(event) {
    event.preventDefault();
    users.push({
        name: document.getElementById('joinName').value,
        empId: document.getElementById('joinEmpId').value,
        pw: document.getElementById('joinPw').value,
        position: document.getElementById('joinPosition').value
    });
    alert("회원가입이 완료되었습니다.");
    closeModal('joinModal');
}

function handleLogin() {
    const empId = document.getElementById('loginEmpId').value;
    const pw = document.getElementById('loginPw').value;

    if (empId === "1" && pw === "1") {
        successLogin({ empId: "1", position: "관리자", name: "관리자" });
    } else if (empId === "2" && pw === "2") {
        successLogin({ empId: "2", position: "책임 매니저", name: "책임" });
    } else if (empId === "3" && pw === "3") {
        successLogin({ empId: "3", position: "매니저", name: "매니저" });
    } else {
        const user = users.find(u => u.empId === empId && u.pw === pw);
        if (user) successLogin(user);
        else alert("정보를 확인해주세요");
    }
}

function successLogin(user) {
    // [개선] 사번 끝자리를 활용하거나 사번 자체를 고유 숫자로 부여
    const userNum = user.empId.slice(-2).padStart(2, '0');
    user.nickname = `익명 ${userNum}`;
    
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
    if (document.getElementById('boardView').style.display === 'block') {
        if (history.state && history.state.view === 'board') history.back();
    }
    document.getElementById('homeView').style.display = 'block';
    document.getElementById('boardView').style.display = 'none';
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
        document.getElementById('currentBoardTitle').innerText = name;
        document.getElementById('writeBtn').style.display = (name === '대나무 라운지') ? 'none' : 'block';
        renderPosts(name);
    }, 10);
}

function openPostModal() {
    // [개선] 열 때마다 필드 강제 초기화
    document.getElementById('postTitle').value = "";
    document.getElementById('postContent').value = "";
    openModal('postModal');
}

// [개선] 게시글 저장 기능
function savePost() {
    const title = document.getElementById('postTitle').value.trim();
    const content = document.getElementById('postContent').value.trim();
    const board = document.getElementById('currentBoardTitle').innerText;

    if (!title || !content) {
        alert("제목 혹은 글을 입력해주세요");
        return;
    }

    const newPost = {
        id: Date.now(),
        board: board,
        title: title,
        content: content,
        author: currentUser.nickname,
        timestamp: new Date(),
        likes: 0,
        comments: 0,
        views: 1 // 작성 직후 본인 조회 포함
    };

    allPosts.unshift(newPost);
    renderPosts(board);
    closeModal('postModal');
}

// [개선] 경과 시간 계산 함수
function timeSince(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + "일";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + "일";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + "시간";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + "분";
    return "방금 전";
}

// [개선] 이미지 레이아웃과 동일하게 렌더링
function renderPosts(boardName) {
    const listDiv = document.getElementById('postList');
    const filtered = allPosts.filter(p => p.board === boardName);
    
    if(filtered.length === 0) {
        listDiv.innerHTML = '<p style="padding:20px; text-align:center; color:#888;">작성된 글이 없습니다.</p>';
        return;
    }

    listDiv.innerHTML = filtered.map(p => `
        <div class="post-item" onclick="incrementView(${p.id})">
            <div class="post-user-info">
                <div class="user-thumb"><i class="fas fa-user-circle"></i></div>
                <div class="user-details">
                    <span class="nickname">${p.author}</span>
                    <span class="post-date">${timeSince(p.timestamp)}</span>
                </div>
            </div>
            <h4 class="post-title">${p.title}</h4>
            <p class="post-summary">${p.content.substring(0, 50)}...</p>
            <div class="post-stats">
                <span><i class="far fa-heart" onclick="event.stopPropagation(); toggleLike(${p.id})"></i> <small id="like-${p.id}">${p.likes}</small></span>
                <span><i class="far fa-comment"></i> <small>${p.comments}</small></span>
                <span><i class="far fa-eye"></i> <small>${p.views}</small></span>
            </div>
        </div>
    `).join('');
}

function toggleLike(id) {
    const post = allPosts.find(p => p.id === id);
    if(post) {
        post.likes++;
        document.getElementById(`like-${id}`).innerText = post.likes;
    }
}

function incrementView(id) {
    const post = allPosts.find(p => p.id === id);
    if(post) { post.views++; renderPosts(post.board); }
}

window.addEventListener('click', function(event) {
    if (event.target.closest('.modal-content')) return; 
    if (event.target.classList.contains('modal')) {
        closeModal(event.target.id);
        return;
    }
    const sideMenu = document.getElementById('sideMenu');
    const menuBtn = document.querySelector('.header-left');
    if (sideMenu && sideMenu.classList.contains('active') && 
        !sideMenu.contains(event.target) && !menuBtn.contains(event.target)) {
        history.back();
    }
}, true);

window.onpopstate = function(event) {
    document.querySelectorAll('.modal').forEach(m => {
        m.classList.remove('active');
        m.style.display = 'none';
    });
    const menu = document.getElementById('sideMenu');
    if (menu && menu.classList.contains('active')) menu.classList.remove('active');
    
    if (!event.state || event.state.view !== 'board') {
        document.getElementById('homeView').style.display = 'block';
        document.getElementById('boardView').style.display = 'none';
    }
};
