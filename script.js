// 1. 초기 설정 및 데이터
let currentUser = null; 
let isLoggedIn = false;
let users = []; 
let allPosts = []; 

// 모달 제어 함수들
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

// 회원가입 및 로그인
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

    const user = users.find(u => u.empId === empId && u.pw === pw) || 
                 (empId === "1" && pw === "1" ? { empId: "1", position: "관리자", name: "관리자" } : null);
    
    if (user) {
        // 사번 끝자리를 고유 숫자로 부여 (예: 익명 01)
        user.nickname = `익명 ${user.empId.slice(-2).padStart(2, '0')}`;
        currentUser = user;
        isLoggedIn = true;
        document.getElementById('loginIcons').style.display = 'none';
        document.getElementById('userInfoIcon').style.display = 'inline';
        closeModal('loginModal');
        alert(`${user.nickname}님 환영합니다!`);
    } else {
        alert("정보를 확인해주세요");
    }
}

function showUserInfo() {
    alert(`내 정보\n닉네임: ${currentUser.nickname}\n사번: ${currentUser.empId}`);
}

// 화면 전환 로직
function toggleMenu() {
    const menu = document.getElementById('sideMenu');
    menu.classList.toggle('active');
}

function goHome() {
    document.getElementById('homeView').style.display = 'block';
    document.getElementById('boardView').style.display = 'none';
    document.getElementById('sideMenu').classList.remove('active');
}

function loadBoard(name) {
    if (!isLoggedIn) { alert("로그인을 해주세요"); return; }
    
    document.getElementById('homeView').style.display = 'none';
    document.getElementById('boardView').style.display = 'block';
    document.getElementById('currentBoardTitle').innerText = name;
    document.getElementById('sideMenu').classList.remove('active');
    
    renderPosts(name);
}

// 게시글 작성 및 초기화
function openPostModal() {
    document.getElementById('postTitle').value = "";
    document.getElementById('postContent').value = "";
    openModal('postModal');
}

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
        likes: 0, comments: 0, views: 1
    };

    allPosts.unshift(newPost);
    
    // [개선 1] 초기화면으로 이동하지 않고 현재 게시판 리스트 갱신
    renderPosts(board); 
    closeModal('postModal');
}

// [개선 2-2] 시간 표출 형식 변환 함수
function timeSince(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 3600;
    
    if (seconds < 60) return "방금 전";
    if (seconds < 3600) return Math.floor(seconds / 60) + "분";
    if (interval < 24) return Math.floor(interval) + "시간";
    return Math.floor(interval / 24) + "일";
}

// [개선 2-1] 게시글 목록 표출 변경
function renderPosts(boardName) {
    const listDiv = document.getElementById('postList');
    const filtered = allPosts.filter(p => p.board === boardName);
    
    if(filtered.length === 0) {
        listDiv.innerHTML = '<p style="padding:20px; text-align:center; color:#888;">작성된 글이 없습니다.</p>';
        return;
    }

    listDiv.innerHTML = filtered.map(p => `
        <div class="post-item">
            <div class="post-header-info">
                <span class="nickname">${p.author}</span>
                <span class="post-time">${timeSince(p.timestamp)}</span>
            </div>
            <h4 class="post-title">${p.title}</h4>
            <p class="post-content-prev">${p.content.substring(0, 40)}...</p>
            <div class="post-footer-stats">
                <span><i class="far fa-heart"></i> ${p.likes}</span>
                <span><i class="far fa-comment"></i> ${p.comments}</span>
                <span><i class="far fa-eye"></i> ${p.views}</span>
            </div>
        </div>
    `).join('');
}

// 창 바깥 클릭 시 닫기
window.addEventListener('click', function(event) {
    if (event.target.classList.contains('modal')) closeModal(event.target.id);
}, true);
