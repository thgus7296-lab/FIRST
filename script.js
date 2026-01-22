// 유저 기본 정보 (나중에 회원가입 데이터와 연결)
let currentUser = { nickname: "익명 " + Math.floor(Math.random() * 90 + 10) };
let allPosts = []; // 모든 게시글 저장 배열

function toggleMenu() {
    document.getElementById('sideMenu').classList.toggle('active');
}

function goHome() {
    document.getElementById('homeView').style.display = 'block';
    document.getElementById('boardView').style.display = 'none';
}

// 모달 제어 통합
function openJoinModal() { document.getElementById('joinModal').style.display = 'block'; }
function openPostModal() { document.getElementById('postModal').style.display = 'block'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

// 게시판 로드
function loadBoard(name) {
    toggleMenu();
    document.getElementById('homeView').style.display = 'none';
    document.getElementById('boardView').style.display = 'block';
    document.getElementById('currentBoardTitle').innerText = name;
    
    // 대나무 라운지는 글쓰기 불가 (이미지 요구사항 반영)
    document.getElementById('writeBtn').style.display = (name === '대나무 라운지') ? 'none' : 'block';
    
    renderPosts(name);
}

// 글 저장
function savePost() {
    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('postContent').value;
    const board = document.getElementById('currentBoardTitle').innerText;

    if(!title || !content) return alert("내용을 입력하세요");

    const newPost = { board, title, content, author: currentUser.nickname, date: new Date().toLocaleDateString() };
    allPosts.unshift(newPost);
    
    closeModal('postModal');
    renderPosts(board);
    
    // 입력창 초기화
    document.getElementById('postTitle').value = "";
    document.getElementById('postContent').value = "";
}

// 글 목록 화면에 그리기
function renderPosts(boardName) {
    const listDiv = document.getElementById('postList');
    const filtered = allPosts.filter(p => p.board === boardName);
    
    listDiv.innerHTML = filtered.length ? filtered.map(p => `
        <div class="post-item">
            <h4>${p.title}</h4>
            <small>${p.author} | ${p.date}</small>
        </div>
    `).join('') : '<p style="padding:20px; color:#888;">첫 게시글을 작성해보세요!</p>';
}

// 모달 바깥 클릭 시 닫기
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = "none";
    }
}
