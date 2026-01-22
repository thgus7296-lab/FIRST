/* 게시판 헤더 및 버튼 */
.board-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    background: #f8f9fa;
    border-bottom: 2px solid #065d7a;
}

#writeBtn {
    padding: 8px 16px;
    background: #065d7a;
    color: white;
    border: none;
    border-radius: 20px;
    cursor: pointer;
}

/* 게시글 리스트 스타일 */
.post-list { padding: 10px; }
.post-item {
    padding: 15px;
    border-bottom: 1px solid #eee;
    background: white;
}
.post-item h4 { margin-bottom: 5px; color: #333; }
.post-item .post-info {
    font-size: 0.8rem;
    color: #888;
}

/* 텍스트 영역 스타일 */
textarea {
    width: 100%;
    padding: 10px;
    margin: 10px 0;
    border: 1px solid #ddd;
    border-radius: 5px;
    resize: none;
}
