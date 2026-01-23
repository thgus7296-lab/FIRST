// 1. 초기 설정 및 데이터
let currentUser = null; 
let isLoggedIn = false;
let users = []; // 회원가입 데이터 임시 저장용

function openModal(id) { document.getElementById(id).style.display = 'block'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

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
        successLogin({ empId: "1", position: "책임 매니저", name: "관리자" });
    } else if (empId === "2" && pw === "2") {
        successLogin({ empId: "2", position: "매니저", name: "사용자" });
    } else {
        const user = users.find(u => u.empId === empId && u.pw === pw);
        if (user) successLogin(user);
        else alert("정보를 확인해주세요");
    }
}

function successLogin(user) {
    currentUser = user;
    isLoggedIn = true;
    document.getElementById('loginIcons').style.display = 'none';
    document.getElementById('userInfoIcon').style.display = 'inline';
    closeModal('loginModal');
    alert(`${user.name}님 환영합니다!`);
}

function showUserInfo() {
    alert(`내 정보\n사번: ${currentUser.empId}\n직급: ${currentUser.position}`);
}

// 2. 메뉴 및 화면 전환
function toggleMenu() {
    const menu = document.getElementById('sideMenu');
    menu.classList.toggle('active');

    if (menu.classList.contains('active')) {
        history.pushState({ state: 'menu' }, '');
    }
}

// [수정] 홈으로 갈 때 쌓여있는 게시판 히스토리를 정리하도록 개선
function goHome() {
    // 만약 게시판 뷰 상태에서 홈버튼을 누른 거라면 히스토리 한 번 뒤로가기
    if (document.getElementById('boardView').style.display === 'block') {
        if (history.state && history.state.view === 'board') {
            history.back();
        }
    }
    
    document.getElementById('homeView').style.display = 'block';
    document.getElementById('boardView').style.display = 'none';
    document.getElementById('sideMenu').classList.remove('active');
}

// 3. 게시판 로드
function loadBoard(name) {

    // [이 위치에 추가] 로그인 여부를 가장 먼저 확인합니다.
    if (!isLoggedIn) { 
        alert("로그인을 해주세요");
        return; // 로그인이 안 되어 있으면 여기서 함수를 강제 종료합니다.
    }
    
    if (name === "매니저 라운지" && currentUser.position !== "매니저") {
        alert("매니저 직급만 입장 가능한 게시판입니다.");
        return;
    }

    if (name === "책임 라운지" && currentUser.position !== "책임 매니저") {
        alert("책임 매니저 직급만 입장 가능한 게시판입니다.");
        return;
    }

    // [수정] 메뉴가 열린 상태에서 게시판을 누르면 메뉴 히스토리만 지우고 진행
    if (document.getElementById('sideMenu').classList.contains('active')) {
        history.back();
    }

    // 게시판 진입 기록 추가 (비동기 처리를 위해 약간의 시간차를 둠)
    setTimeout(() => {
        history.pushState({ view: 'board' }, '');
        document.getElementById('homeView').style.display = 'none';
        document.getElementById('boardView').style.display = 'block';
        document.getElementById('currentBoardTitle').innerText = name;
        
        document.getElementById('writeBtn').style.display = (name === '대나무 라운지') ? 'none' : 'block';
        
        setAdminPrivileges();
        renderPosts(name);
    }, 10);
}

// 이미지 수정 권한 UI 제어
function setAdminPrivileges() {
    const rectTarget = document.querySelector('.rect-banner');
    const circleTarget = document.querySelector('.circle-profile');

    if (rectTarget && circleTarget) {
        if (currentUser.position === "책임 매니저") {
            rectTarget.classList.add('is-admin');
            circleTarget.classList.add('is-admin');
        } else {
            rectTarget.classList.remove('is-admin');
            circleTarget.classList.remove('is-admin');
        }
    }
}

// 4. 모달 및 이미지 제어
function openJoinModal() { document.getElementById('joinModal').style.display = 'block'; }
function openPostModal() { document.getElementById('postModal').style.display = 'block'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

function updateBoardImage(input, targetId) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById(targetId).src = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}

// 5. 게시글 저장 및 출력
function savePost() {
    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('postContent').value;
    const board = document.getElementById('currentBoardTitle').innerText;

    if(!title || !content) return alert("제목과 내용을 모두 입력해주세요.");

    const newPost = {
        board: board, title: title, content: content,
        author: currentUser.nickname, date: new Date().toLocaleDateString()
    };

    allPosts.unshift(newPost);
    renderPosts(board);
    closeModal('postModal');
    
    document.getElementById('postTitle').value = "";
    document.getElementById('postContent').value = "";
}

function renderPosts(boardName) {
    const listDiv = document.getElementById('postList');
    const filtered = allPosts.filter(p => p.board === boardName);
    
    if(filtered.length === 0) {
        listDiv.innerHTML = '<p style="padding:20px; text-align:center; color:#888;">작성된 글이 없습니다.</p>';
        return;
    }

    listDiv.innerHTML = filtered.map(p => `
        <div class="post-item">
            <h4 style="margin-bottom:5px;">${p.title}</h4>
            <small style="color:#888;">${p.author} | ${p.date}</small>
        </div>
    `).join('');
}

// --- 이벤트 리스너 ---

// [수정] 창 바깥 클릭 시 닫기 로직
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = "none";
    }
    
    const sideMenu = document.getElementById('sideMenu');
    const menuBtn = document.querySelector('.header-left');
    
    // 메뉴 바깥 클릭 시
    if (sideMenu.classList.contains('active') && 
        !sideMenu.contains(event.target) && 
        !menuBtn.contains(event.target)) {
        
        // 중요: 이 시점에서 goHome()을 부르는 것이 아니라 메뉴만 닫아야 함
        history.back(); // history.back()이 실행되면서 아래 window.onpopstate가 호출되어 메뉴를 닫음
    }
}

// [수정] 뒤로가기 감지 (상황별 처리)
window.onpopstate = function(event) {
    const menu = document.getElementById('sideMenu');
    const boardView = document.getElementById('boardView');

    // 상황: 메뉴가 열려있으면 메뉴만 닫고 종료
    if (menu.classList.contains('active')) {
        menu.classList.remove('active');
        return; 
    }

    // 상황: 메뉴가 닫혀있고 게시판 뷰라면 홈으로 화면 전환
    if (boardView.style.display === 'block') {
        document.getElementById('homeView').style.display = 'block';
        document.getElementById('boardView').style.display = 'none';
    }
};
