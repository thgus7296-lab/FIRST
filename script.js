// 1. 초기 설정 및 데이터
let currentUser = null; 
let isLoggedIn = false;
let users = []; // 회원가입 데이터 임시 저장용

function openModal(id) {
    document.getElementById(id).style.display = 'block';
    // 모달이 열릴 때 브라우저 기록에 '이 모달이 열림' 상태를 저장합니다.
    history.pushState({ modalOpen: id }, ''); 
}
function closeModal(id) {
    const modal = document.getElementById(id);
    if (!modal) return; // 모달이 없으면 종료

    if (modal.style.display === 'block') {
        modal.style.display = 'none';
        // 직접 닫았을 때만 히스토리를 뒤로 돌림 (중복 실행 방지)
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
    // 사번 1: 관리자 (모든 권한을 가진 특수 직급으로 설정 가능)
    successLogin({ empId: "1", position: "관리자", name: "관리자", role: "" });
} else if (empId === "2" && pw === "2") {
    // 사번 2: 책임 매니저
    successLogin({ empId: "2", position: "책임 매니저", name: "책임", role: "" });
} else if (empId === "3" && pw === "3") {
    // 사번 3: 매니저
    successLogin({ empId: "3", position: "매니저", name: "매니저", role: "" });
} else {
    // 일반 가입자 로직 유지
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

    // 이름 뒤에 직책(role)이 있으면 붙여서 출력하고, 없으면 이름만 출력합니다.
    const displayName = user.role ? `${user.name} ${user.role}` : `${user.name}`;
    alert(`${displayName}님 환영합니다!`);
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

    // [추가] 관리자 직급은 모든 권한 체크를 무시하고 입장
    if (currentUser.position === "관리자") {
        // 권한 체크 패스
    
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
// openModal을 호출해야 뒤로가기 기록이 남습니다.
function openJoinModal() { openModal('joinModal'); } 
function openPostModal() { openModal('postModal'); }
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
    // 1. 모달 바깥 클릭 시 닫기
    if (event.target.classList.contains('modal')) {
        closeModal(event.target.id); // 직접 id를 전달하여 히스토리까지 정리
        return;
    }
    
    const sideMenu = document.getElementById('sideMenu');
    const menuBtn = document.querySelector('.header-left');
    
    // 2. 메뉴 바깥 클릭 시 (메뉴가 활성화된 상태에서만 작동하도록)
    if (sideMenu.classList.contains('active') && 
        !sideMenu.contains(event.target) && 
        !menuBtn.contains(event.target)) {
        
        history.back(); // onpopstate가 호출되면서 메뉴를 닫음
    }
}

// 이 코드로 파일의 맨 마지막 부분을 완전히 덮어씌우세요.
window.onpopstate = function(event) {
    const menu = document.getElementById('sideMenu');
    const boardView = document.getElementById('boardView');
    
    // 1순위: 모든 모달을 "무조건" 닫습니다. (더 확실한 선택자 사용)
    const allModals = document.querySelectorAll('.modal');
    let modalWasOpen = false;
    
    allModals.forEach(modal => {
        if (modal.style.display === 'block') {
            modal.style.display = 'none';
            modalWasOpen = true;
        }
    });

    if (modalWasOpen) return; 

    // 2순위: 사이드 메뉴 닫기
    if (menu && menu.classList.contains('active')) {
        menu.classList.remove('active');
        return; 
    }

    // 3순위: 게시판 화면이라면 홈 화면으로 전환
    if (boardView && boardView.style.display === 'block') {
        document.getElementById('homeView').style.display = 'block';
        document.getElementById('boardView').style.display = 'none';
    }
};
