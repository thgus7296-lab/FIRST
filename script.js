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

// 3. 게시판 로드 (권한 로직 포함)
function loadBoard(name) {
    // 권한 체크 예시
    if (name === "책임 라운지" && currentUser.position !== "책임 매니저") {
        alert("책임 매니저 등급만 입장 가능합니다.");
        return;
    }

    document.getElementById('homeView').style.display = 'none';
    document.getElementById('boardView').style.display = 'block';
    document.getElementById('currentBoardTitle').innerText = name;
    
    // 대나무 라운지는 댓글 전용이므로 글쓰기 버튼 숨김
    document.getElementById('writeBtn').style.display = (name === '대나무 라운지') ? 'none' : 'block';
    
    toggleMenu(); // 메뉴 닫기
    renderPosts(name);
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
