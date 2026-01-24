// 1. 초기 설정 및 데이터
let currentUser = null; 
let isLoggedIn = false;
let users = []; 
let allPosts = []; 

// 모달 제어
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = 'block';
        // 애니메이션을 위해 active 클래스 추가
        setTimeout(() => {
            modal.classList.add('active');
            // [개선 1] 이름 입력창 포커스 및 입력 방해 요소 제거
            if (id === 'joinModal') {
                const nameInput = document.getElementById('joinName');
                nameInput.focus();
                nameInput.click(); // 모바일 자판 유도
            }
        }, 100);
        history.pushState({ modalOpen: id }, ''); 
    }
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => { modal.style.display = 'none'; }, 200);
        if (history.state && history.state.modalOpen === id) history.back();
    }
}

// 회원가입 및 로그인 (기본 로직 유지)
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

// [개선 2] 하트 토글 로직 (계정별 고유 값 1 or 0)
function toggleLike(postId) {
    if (!isLoggedIn) return;
    const post = allPosts.find(p => p.id === postId);
    if (!post) return;

    // 본인 계정 ID가 이미 있다면 제거(0), 없다면 추가(1) -> 홀/짝 로직 구현
    const userIdx = post.likedBy.indexOf(currentUser.empId);
    if (userIdx === -1) {
        post.likedBy.push(currentUser.empId);
    } else {
        post.likedBy.splice(userIdx, 1);
    }
    
    renderPosts(post.board); // 현재 게시판 다시 그리기
}

// [개선 3] 게시글 목록 요약 (첫 줄 10자 제한)
function getSummary(content) {
    if (!content) return "";
    // 첫 번째 줄만 추출
    let firstLine = content.split('\n')[0];
    // 10자가 넘어가면 자르고 ... 추가
    if (firstLine.length > 10) {
        return firstLine.substring(0, 10) + "...";
    }
    return firstLine;
}

function savePost() {
    const title = document.getElementById('postTitle').value.trim();
    const content = document.getElementById('postContent').value.trim();
    const board = document.getElementById('currentBoardTitle').innerText;

    if (!title || !content) return alert("내용을 입력해주세요");

    const newPost = {
        id: Date.now(),
        board: board,
        title: title,
        content: content,
        author: currentUser.nickname,
        timestamp: new Date(),
        likedBy: [], // 좋아요 누른 유저의 empId 저장
        comments: 0,
        views: 1
    };

    allPosts.unshift(newPost);
    renderPosts(board);
    closeModal('postModal');
}

function renderPosts(boardName) {
    const listDiv = document.getElementById('postList');
    const filtered = allPosts.filter(p => p.board === boardName);
    
    listDiv.innerHTML = filtered.map(p => {
        // [개선 2] 본인이 눌렀는지 확인하여 하트 색상 결정
        const isLikedByMe = p.likedBy.includes(currentUser.empId);
        const heartClass = isLikedByMe ? 'fas fa-heart liked' : 'far fa-heart';

        return `
            <div class="post-item">
                <div class="post-user-info">
                    <span class="nickname">${p.author}</span>
                    <span class="post-date">${timeSince(p.timestamp)}</span>
                </div>
                <h4 class="post-title">${p.title}</h4>
                <p class="post-summary">${getSummary(p.content)}</p>
                <div class="post-stats">
                    <span onclick="toggleLike(${p.id})">
                        <i class="${heartClass}"></i> 
                        <small>${p.likedBy.length}</small>
                    </span>
                    <span><i class="far fa-comment"></i> <small>${p.comments}</small></span>
                    <span><i class="far fa-eye"></i> <small>${p.views}</small></span>
                </div>
            </div>
        `;
    }).join('');
}

// 시간 계산 함수
function timeSince(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return "방금 전";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return minutes + "분";
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + "시간";
    return Math.floor(hours / 24) + "일";
}

// 공통 네비게이션 로직
function toggleMenu() { document.getElementById('sideMenu').classList.toggle('active'); }
function goHome() {
    document.getElementById('homeView').style.display = 'block';
    document.getElementById('boardView').style.display = 'none';
}
function loadBoard(name) {
    if (!isLoggedIn) return alert("로그인 필요");
    document.getElementById('homeView').style.display = 'none';
    document.getElementById('boardView').style.display = 'block';
    document.getElementById('currentBoardTitle').innerText = name;
    renderPosts(name);
}
