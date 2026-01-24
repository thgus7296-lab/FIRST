// 1. 초기 설정 및 데이터
let currentUser = null; 
let isLoggedIn = false;
let users = []; // 회원가입 데이터 임시 저장용

// 모달 열기: 상태값과 클래스를 동시에 제어하여 터치 문제를 방지합니다.
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        // 1. 먼저 모달을 화면에 표시합니다.
        modal.style.display = 'block';
        
        // 2. 브라우저가 모달의 위치를 계산할 시간을 준 후(0.1초), 실행합니다.
        setTimeout(() => {
            modal.classList.add('active');
            
            // 3. 회원가입 모달일 경우, 첫 번째 입력창에 강제로 포커스를 줍니다.
            if (id === 'joinModal') {
                const firstInput = document.getElementById('joinName');
                if (firstInput) {
                    firstInput.focus(); // 커서를 활성화하여 자판을 호출합니다.
                }
            }
        }, 100);
        
        history.pushState({ modalOpen: id }, ''); 
    }
}

// 모달 닫기: 모든 상태를 초기화하고 뒤로가기 이벤트를 정리합니다.
function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
        // 사용자가 X버튼이나 취소버튼을 직접 눌렀을 때만 히스토리를 한 칸 뒤로 돌림
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
    // 1. 로그인 체크
    if (!isLoggedIn) { 
        alert("로그인을 해주세요");
        return; 
    }

    // 2. 권한 체크 (관리자는 통과, 나머지는 직급 확인)
    if (currentUser.position !== "관리자") {
        if (name === "매니저 라운지" && currentUser.position !== "매니저") {
            alert("매니저 직급만 입장 가능한 게시판입니다.");
            return;
        }
        if (name === "책임 라운지" && currentUser.position !== "책임 매니저") {
            alert("책임 매니저 직급만 입장 가능한 게시판입니다.");
            return;
        }
    }

    // 3. 메뉴가 열려 있으면 닫기
    if (document.getElementById('sideMenu').classList.contains('active')) {
        history.back();
    }

    // 4. 화면 전환
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
function openPostModal() {
    // [중요] 모달을 띄우기 전에 이전 작성 내용을 모두 삭제
    const titleInput = document.getElementById('postTitle');
    const contentInput = document.getElementById('postContent');
    
    if (titleInput) titleInput.value = "";
    if (contentInput) contentInput.value = "";

    // 내용이 비워진 상태에서 모달 오픈
    openModal('postModal');
}

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
    const titleInput = document.getElementById('postTitle');
    const contentInput = document.getElementById('postContent');
    const board = document.getElementById('currentBoardTitle').innerText;

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();

    // 1. 입력 검증: 제목 혹은 내용이 비어있으면 팝업 표출
    if (!title || !content) {
        alert("제목 혹은 글을 입력해주세요");
        return;
    }

    // 2. 게시글 객체 생성 (사용자 닉네임 정보 포함)
    const newPost = {
        board: board,
        title: title,
        content: content,
        author: currentUser ? (currentUser.nickname || currentUser.name) : "익명",
        date: new Date().toLocaleDateString()
    };

    // 3. 전역 게시글 배열에 추가 (배열이 없으면 생성)
    if (typeof allPosts === 'undefined') window.allPosts = [];
    allPosts.unshift(newPost);

    // 4. 화면 업데이트 및 모달 닫기
    renderPosts(board);
    
    // 5. [중요] 성공적으로 등록되었으므로 모달 닫기 실행
    closeModal('postModal');
    
    // 6. 다음 작성을 위해 입력필드 초기화
    titleInput.value = "";
    contentInput.value = "";
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
// window.onclick 대신 더 강력한 이벤트 리스너를 사용합니다.
// 마지막에 붙은 'true'는 이 코드가 다른 어떤 코드보다 먼저 실행되게 보장합니다.
window.addEventListener('click', function(event) {
    // 1. 만약 클릭된 곳이 흰색 모달 박스(.modal-content) 내부라면?
    if (event.target.closest('.modal-content')) {
        // 아무것도 하지 말고 여기서 멈춥니다. 
        // 브라우저가 오직 '입력창 터치'에만 집중하도록 이벤트를 보호합니다.
        return; 
    }

    // 2. 모달의 어두운 배경을 터치했을 때만 닫기 로직을 실행합니다.
    if (event.target.classList.contains('modal')) {
        closeModal(event.target.id);
        return;
    }

    // 3. 사이드 메뉴 바깥 클릭 로직
    const sideMenu = document.getElementById('sideMenu');
    const menuBtn = document.querySelector('.header-left');
    
    if (sideMenu && sideMenu.classList.contains('active') && 
        !sideMenu.contains(event.target) && 
        !menuBtn.contains(event.target)) {
        history.back();
    }
}, true); // 이 true 값이 터치 간섭을 막는 핵심 열쇠입니다.

// 이 코드로 파일의 맨 마지막 부분을 완전히 덮어씌우세요.
window.onpopstate = function(event) {
    const menu = document.getElementById('sideMenu');
    const boardView = document.getElementById('boardView');
    
    // 뒤로가기 시 모든 모달 강제 초기화
    const allModals = document.querySelectorAll('.modal');
    let modalWasOpen = false;
    
    allModals.forEach(modal => {
        if (modal.classList.contains('active') || modal.style.display === 'block') {
            modal.classList.remove('active');
            modal.style.display = 'none';
            modalWasOpen = true;
        }
    });

    if (modalWasOpen) return; 

    if (menu && menu.classList.contains('active')) {
        menu.classList.remove('active');
        return; 
    }

    if (boardView && boardView.style.display === 'block') {
        document.getElementById('homeView').style.display = 'block';
        document.getElementById('boardView').style.display = 'none';
    }
};
