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

        setTimeout(() => {

            modal.classList.add('active');

            // [개선 1] 포커스 로직을 더 확실하게 처리

            if (id === 'joinModal') {

                const firstInput = document.getElementById('joinName');

                firstInput.focus();

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

        if (history.state && history.state.modalOpen === id) history.back();

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

        user.nickname = `익명 ${user.empId.slice(-2).padStart(2, '0')}`;

        currentUser = user;

        isLoggedIn = true;

        document.getElementById('loginIcons').style.display = 'none';

        document.getElementById('userInfoIcon').style.display = 'inline';

        closeModal('loginModal');

    } else {

        alert("정보를 확인해주세요");

    }

}



// 게시글 저장

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

        authorId: currentUser.empId, // 작성자 식별용

        timestamp: new Date(),

        likedBy: [], // [개선 2] 좋아요 누른 유저 목록 저장

        comments: 0,

        views: 1

    };



    allPosts.unshift(newPost);

    renderPosts(board);

    closeModal('postModal');

}



// 시간 계산

function timeSince(date) {

    const seconds = Math.floor((new Date() - date) / 1000);

    if (seconds < 60) return "방금 전";

    const minutes = Math.floor(seconds / 60);

    if (minutes < 60) return minutes + "분";

    const hours = Math.floor(minutes / 60);

    if (hours < 24) return hours + "시간";

    return Math.floor(hours / 24) + "일";

}



// [개선 2] 하트 토글 로직

function toggleLike(postId) {

    const post = allPosts.find(p => p.id === postId);

    if (!post) return;



    const userIdx = post.likedBy.indexOf(currentUser.empId);

    if (userIdx === -1) {

        post.likedBy.push(currentUser.empId); // 좋아요 추가

    } else {

        post.likedBy.splice(userIdx, 1); // 좋아요 취소

    }

    

    // 현재 게시판 리스트만 다시 그림

    renderPosts(post.board);

}



// [개선 3] 첫 줄 10자 요약 함수

function getSummary(content) {

    const firstLine = content.split('\n')[0]; // 첫 줄만 추출

    if (firstLine.length > 10) {

        return firstLine.substring(0, 10) + '...';

    }

    return firstLine;

}



// 게시글 렌더링

function renderPosts(boardName) {

    const listDiv = document.getElementById('postList');

    const filtered = allPosts.filter(p => p.board === boardName);

    

    listDiv.innerHTML = filtered.map(p => {

        const isLiked = p.likedBy.includes(currentUser.empId);

        const heartIcon = isLiked ? 'fas fa-heart liked' : 'far fa-heart'; // [개선 2] 아이콘 변경



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

                        <i class="${heartIcon}"></i> 

                        <small>${p.likedBy.length}</small>

                    </span>

                    <span><i class="far fa-comment"></i> <small>${p.comments}</small></span>

                    <span><i class="far fa-eye"></i> <small>${p.views}</small></span>

                </div>

            </div>

        `;

    }).join('');

}



// 기타 메뉴 제어 코드는 동일하게 유지...

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
