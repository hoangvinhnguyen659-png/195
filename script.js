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
    hasError: false
};

const dom = {
    home: document.getElementById('home-screen'),
    quiz: document.getElementById('quiz-screen'),
    result: document.getElementById('result-screen'),
    btnStart: document.getElementById('btn-start'),
    btnNext: document.getElementById('btn-next'),
    qText: document.getElementById('question-text'),
    oBox: document.getElementById('options-container'),
    progress: document.getElementById('progress-fill'),
    liveScore: document.getElementById('live-score'),
    currentIdx: document.getElementById('current-idx'),
    totalIdx: document.getElementById('total-idx'),
    feedback: document.getElementById('feedback-msg')
};

// Khởi tạo chế độ chơi
document.querySelectorAll('.mode-item').forEach(el => {
    el.onclick = () => {
        document.querySelectorAll('.mode-item').forEach(i => i.classList.remove('active'));
        el.classList.add('active');
        state.mode = el.dataset.mode;
    };
});

// Bắt đầu thi
dom.btnStart.onclick = async () => {
    try {
        const res = await fetch(CONFIG[state.mode].url);
        state.data = await res.json();
        if (document.getElementById('shuffle-check').checked) {
            state.data.sort(() => Math.random() - 0.5);
        }
        state.index = 0;
        state.score = 0;
        dom.home.classList.add('hidden');
        dom.quiz.classList.remove('hidden');
        renderQuestion();
    } catch (e) {
        alert("Lỗi tải dữ liệu. Vui lòng kiểm tra file JSON.");
    }
};

function renderQuestion() {
    state.isAnswered = false;
    state.hasError = false;
    dom.btnNext.disabled = true;
    dom.feedback.classList.add('hidden');
    
    const q = state.data[state.index];
    dom.currentIdx.innerText = state.index + 1;
    dom.totalIdx.innerText = state.data.length;
    dom.liveScore.innerText = state.score;
    dom.progress.style.width = `${(state.index / state.data.length) * 100}%`;
    
    dom.qText.innerText = q.question;
    dom.oBox.innerHTML = '';
    
    if (state.mode === 'mcq') {
        dom.oBox.className = '';
        ['a', 'b', 'c', 'd'].forEach(key => {
            if(q.options[key]) createOption(q.options[key], key, q.answer);
        });
    } else {
        dom.oBox.className = 'tf-mode';
        createOption("ĐÚNG", true, q.answer);
        createOption("SAI", false, q.answer);
    }
}

function createOption(text, val, correct) {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.innerText = text;
    btn.onclick = () => checkAnswer(val, correct, btn);
    dom.oBox.appendChild(btn);
}

// HÀM KIỂM TRA QUAN TRỌNG NHẤT
function checkAnswer(userVal, correctVal, btn) {
    if (state.isAnswered) return;

    // ÉP KIỂU VỀ STRING ĐỂ SO SÁNH (Khắc phục lỗi Boolean vs String)
    const u = String(userVal).toLowerCase().trim();
    const c = String(correctVal).toLowerCase().trim();

    if (u === c) {
        btn.classList.add('correct');
        state.isAnswered = true;
        if (!state.hasError) state.score++;
        
        // Khóa tất cả các nút
        Array.from(dom.oBox.children).forEach(b => b.disabled = true);
        dom.btnNext.disabled = false;
        
        showFeedback("CHÍNH XÁC!", "var(--success)");
    } else {
        btn.classList.add('wrong');
        btn.disabled = true;
        state.hasError = true;
        showFeedback("THỬ LẠI!", "var(--error)");
    }
}

function showFeedback(txt, color) {
    dom.feedback.innerText = txt;
    dom.feedback.style.color = color;
    dom.feedback.classList.remove('hidden');
}

dom.btnNext.onclick = () => {
    state.index++;
    if (state.index < state.data.length) renderQuestion();
    else showResult();
};

function showResult() {
    dom.quiz.classList.add('hidden');
    dom.result.classList.remove('hidden');
    document.getElementById('final-score').innerText = `${state.score}/${state.data.length}`;
    if (state.score / state.data.length >= 0.8) confetti({ particleCount: 150, spread: 70 });
}

document.getElementById('btn-home').onclick = () => confirm("Thoát?") && location.reload();
