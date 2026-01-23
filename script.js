// script.js

// 1. 초기 설정 및 데이터
let currentUser = { nickname: "익명 " + Math.floor(Math.random() * 90 + 10), position: "매니저" };
let allPosts = []; 

// 2. 메뉴 및 화면 전환
function toggleMenu() {
    document.getElementById('sideMenu').classList.toggle('active');
}

function goHome() {
    document.getElementById('homeView').style.display = 'block';
    document.getElementById('boardView').style.display = 'none';
    // 사이드바가 열려있다면 닫기
    document.getElementById('sideMenu').classList.remove('active');
}

// 3. 게시판 로드 (직급별 전용 접근 권한 설정)
function loadBoard(name) {
    // [수정] 매니저 라운지: 오직 '매니저'만 접근 가능
    if (name === "매니저 라운지" && currentUser.position !== "매니저") {
        alert("매니저 직급만 입장 가능한 게시판입니다.");
        return;
    }

    // [수정] 책임 라운지: 오직 '책임 매니저'만 접근 가능
    if (name === "책임 라운지" && currentUser.position !== "책임 매니저") {
        alert("책임 매니저 직급만 입장 가능한 게시판입니다.");
    }

    // 화면 전환 및 데이터 로드 (기본 로직 유지)
    document.getElementById('homeView').style.display = 'none';
    document.getElementById('boardView').style.display = 'block';
    document.getElementById('currentBoardTitle').innerText = name;
    
    // 대나무 라운지 글쓰기 제한
    document.getElementById('writeBtn').style.display = (name === '대나무 라운지') ? 'none' : 'block';
    
    // 관리자 이미지 수정 권한 설정
    setAdminPrivileges();
    
    toggleMenu(); 
    renderPosts(name);
}

// 이미지 수정 권한 UI 제어 함수 (HTML 구조와 연결 유지)
function setAdminPrivileges() {
    const rect = document.getElementById('rectContainer');
    const circle = document.getElementById('circleContainer');
    
    // 현재는 '책임 매니저'만 이미지 수정이 가능하도록 설정되어 있습니다.
    if (rect && circle) {
        if (currentUser.position === "책임 매니저") {
            rect.classList.add('is-admin');
            circle.classList.add('is-admin');
        } else {
            rect.classList.remove('is-admin');
            circle.classList.remove('is-admin');
        }
    }
}

// 4. 모달 제어
function openJoinModal() { document.getElementById('joinModal').style.display = 'block'; }
function openPostModal() { document.getElementById('postModal').style.display = 'block'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

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
    
    // 초기화
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

// 창 바깥 클릭 시 모달 닫기
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = "none";
    }
}
// script.js 최하단에 추가
function updateBoardImage(input, targetId) {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById(targetId).src = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
}
