// 1. 초기 설정 및 데이터
let currentUser = { nickname: "익명 " + Math.floor(Math.random() * 90 + 10), position: "매니저" };
let allPosts = []; 

// 2. 메뉴 및 화면 전환
function toggleMenu() {
    const menu = document.getElementById('sideMenu');
    menu.classList.toggle('active');

    // 메뉴가 열렸을 때 뒤로가기 감지를 위한 가상 상태 추가
    if (menu.classList.contains('active')) {
        history.pushState({ menuOpen: true }, '');
    }
}

function goHome() {
    document.getElementById('homeView').style.display = 'block';
    document.getElementById('boardView').style.display = 'none';
    document.getElementById('sideMenu').classList.remove('active');
}

// 3. 게시판 로드
function loadBoard(name) {
    // 직급별 권한 체크
    if (name === "매니저 라운지" && currentUser.position !== "매니저") {
        alert("매니저 직급만 입장 가능한 게시판입니다.");
        return;
    }

    if (name === "책임 라운지" && currentUser.position !== "책임 매니저") {
        alert("책임 매니저 직급만 입장 가능한 게시판입니다.");
        return;
    }

    // 메뉴가 열린 상태에서 이동 시 히스토리 정리
    if (document.getElementById('sideMenu').classList.contains('active')) {
        history.back();
    }

    document.getElementById('homeView').style.display = 'none';
    document.getElementById('boardView').style.display = 'block';
    document.getElementById('currentBoardTitle').innerText = name;
    
    // 대나무 라운지 글쓰기 제한
    document.getElementById('writeBtn').style.display = (name === '대나무 라운지') ? 'none' : 'block';
    
    setAdminPrivileges();
    renderPosts(name);
}

// 이미지 수정 권한 UI 제어 (책임 매니저만 가능)
function setAdminPrivileges() {
    const rect = document.getElementById('rectContainer');
    const circle = document.getElementById('circleContainer');
    
    // HTML에 해당 ID들이 있는지 확인 후 클래스 부여
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
        board: board,
        title: title,
        content: content,
        author: currentUser.nickname,
        date: new Date().toLocaleDateString()
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

// 창 바깥 클릭 시 닫기 (모달 및 사이드바)
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = "none";
    }
    
    const sideMenu = document.getElementById('sideMenu');
    const menuBtn = document.querySelector('.header-left');
    
    if (sideMenu.classList.contains('active') && 
        !sideMenu.contains(event.target) && 
        !menuBtn.contains(event.target)) {
        sideMenu.classList.remove('active');
        if(history.state && history.state.menuOpen) history.back();
    }
}

// 뒤로가기 감지
window.onpopstate = function(event) {
    const menu = document.getElementById('sideMenu');
    if (menu.classList.contains('active')) {
        menu.classList.remove('active');
    }
};
