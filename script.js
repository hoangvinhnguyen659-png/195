const CONFIG = {
    mcq: { url: 'questions.json' },
    tf:  { url: 'dungsai.json' }
};

let state = {
    data: [],
    mode: 'mcq',
    index: 0,
    score: 0,
    isAnswered: false,
    wrongAtThisQuestion: false
};

const dom = {
    home: document.getElementById('home-screen'),
    quiz: document.getElementById('quiz-screen'),
    result: document.getElementById('result-screen'),
    modes: document.querySelectorAll('.mode-item'),
    btnStart: document.getElementById('btn-start'),
    btnNext: document.getElementById('btn-next'),
    btnHome: document.getElementById('btn-home'),
    qBox: document.getElementById('question-box'),
    oBox: document.getElementById('options-box'),
    progress: document.getElementById('progress-fill'),
    idxText: document.getElementById('idx-text'),
    totalText: document.getElementById('total-text'),
    scoreText: document.getElementById('score-text'),
    finalScore: document.getElementById('final-score'),
    shuffle: document.getElementById('shuffle-check')
};

// Chọn chế độ
dom.modes.forEach(m => {
    m.onclick = () => {
        dom.modes.forEach(x => x.classList.remove('active'));
        m.classList.add('active');
        state.mode = m.dataset.mode;
    };
});

// Bắt đầu thi
dom.btnStart.onclick = async () => {
    try {
        const res = await fetch(CONFIG[state.mode].url);
        state.data = await res.json();
        
        if (dom.shuffle.checked) state.data.sort(() => Math.random() - 0.5);

        state.index = 0;
        state.score = 0;
        dom.home.classList.add('hidden');
        dom.quiz.classList.remove('hidden');
        loadQuestion();
    } catch (e) {
        alert("Không tải được dữ liệu!");
    }
};

function loadQuestion() {
    state.isAnswered = false;
    state.wrongAtThisQuestion = false;
    dom.btnNext.disabled = true;
    
    const q = state.data[state.index];
    dom.idxText.innerText = state.index + 1;
    dom.totalText.innerText = state.data.length;
    dom.scoreText.innerText = state.score;
    dom.progress.style.width = `${(state.index / state.data.length) * 100}%`;
    
    dom.qBox.innerText = q.question;
    dom.oBox.innerHTML = '';
    
    if (state.mode === 'mcq') {
        dom.oBox.className = '';
        ['a', 'b', 'c', 'd'].forEach(key => {
            createBtn(q.options[key], key, q.answer);
        });
    } else {
        dom.oBox.className = 'tf-grid';
        createBtn("ĐÚNG", true, q.answer);
        createBtn("SAI", false, q.answer);
    }
}

function createBtn(text, value, correct) {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.innerText = text;
    btn.onclick = () => check(value, correct, btn);
    dom.oBox.appendChild(btn);
}

// HÀM KIỂM TRA ĐÁP ÁN (Đã sửa lỗi Boolean)
function check(userVal, correctVal, btn) {
    if (state.isAnswered) return;

    // Chuẩn hóa dữ liệu về String thường để so sánh chính xác tuyệt đối
    const u = String(userVal).toLowerCase().trim();
    const c = String(correctVal).toLowerCase().trim();

    if (u === c) {
        // ĐÚNG
        btn.classList.add('correct');
        state.isAnswered = true;
        
        // Chỉ cộng điểm nếu chưa bấm sai câu này
        if (!state.wrongAtThisQuestion) {
            state.score++;
        }

        // Khóa các nút khác và mở nút Tiếp tục
        Array.from(dom.oBox.children).forEach(b => b.disabled = true);
        dom.btnNext.disabled = false;
    } else {
        // SAI
        btn.classList.add('wrong');
        btn.disabled = true;
        state.wrongAtThisQuestion = true;
    }
}

dom.btnNext.onclick = () => {
    state.index++;
    if (state.index < state.data.length) loadQuestion();
    else finish();
};

function finish() {
    dom.quiz.classList.add('hidden');
    dom.result.classList.remove('hidden');
    dom.finalScore.innerText = `${state.score}/${state.data.length}`;
    if (state.score / state.data.length >= 0.8) confetti({ particleCount: 100, spread: 70 });
}

dom.btnHome.onclick = () => confirm("Thoát bài làm?") && location.reload();
