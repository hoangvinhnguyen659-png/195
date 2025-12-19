const CONFIG = {
    mcq: { url: 'questions.json' },
    tf:  { url: 'dungsai.json' }
};

let state = {
    quizData: [],
    currentMode: 'mcq',
    currentIndex: 0,
    score: 0,
    isSolved: false,      
    hasClickedWrong: false 
};

const els = {
    loadingScreen: document.getElementById('loading-screen'),
    quizScreen: document.getElementById('quiz-screen'),
    resultScreen: document.getElementById('result-screen'),
    startBtn: document.getElementById('start-btn'),
    modeCards: document.querySelectorAll('.mode-card'),
    shuffleCheck: document.getElementById('shuffle-checkbox'),
    questionText: document.getElementById('question-text'),
    optionsContainer: document.getElementById('options-container'),
    submitBtn: document.getElementById('submit-btn'),
    progressBar: document.getElementById('progress-bar'),
    currentCount: document.getElementById('current-count'),
    totalCount: document.getElementById('total-count'),
    liveScore: document.getElementById('live-score'),
    feedbackMsg: document.getElementById('feedback-msg'),
    homeBtnIngame: document.getElementById('home-btn-ingame'),
    homeBtnResult: document.getElementById('home-btn-result'),
    finalScore: document.getElementById('final-score'),
    resultMsg: document.getElementById('result-message')
};

// 1. CHỌN CHẾ ĐỘ
els.modeCards.forEach(card => {
    card.addEventListener('click', () => {
        els.modeCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        state.currentMode = card.dataset.mode;
    });
});

// 2. BẮT ĐẦU
els.startBtn.addEventListener('click', async () => {
    try {
        const res = await fetch(CONFIG[state.currentMode].url);
        state.quizData = await res.json();
        
        if (els.shuffleCheck.checked) {
            state.quizData.sort(() => Math.random() - 0.5);
        }

        state.currentIndex = 0;
        state.score = 0;
        els.loadingScreen.classList.add('hidden');
        els.quizScreen.classList.remove('hidden');
        renderQuiz();
    } catch (err) {
        alert("Lỗi tải file dữ liệu!");
    }
});

// 3. RENDER CÂU HỎI
function renderQuiz() {
    state.isSolved = false;
    state.hasClickedWrong = false;
    els.submitBtn.disabled = true;
    els.feedbackMsg.classList.add('hidden');

    const data = state.quizData[state.currentIndex];
    
    els.currentCount.innerText = state.currentIndex + 1;
    els.totalCount.innerText = state.quizData.length;
    els.liveScore.innerText = state.score;
    els.progressBar.style.width = `${(state.currentIndex / state.quizData.length) * 100}%`;
    
    els.questionText.innerText = data.question;
    els.optionsContainer.innerHTML = '';
    
    if (state.currentMode === 'mcq') {
        els.optionsContainer.classList.remove('tf-mode');
        ['a', 'b', 'c', 'd'].forEach(key => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.innerText = data.options[key];
            btn.onclick = () => handleAction(key, data.answer, btn);
            els.optionsContainer.appendChild(btn);
        });
    } else {
        els.optionsContainer.classList.add('tf-mode');
        [true, false].forEach(val => {
            const btn = document.createElement('button');
            btn.className = 'option-btn tf-btn';
            btn.innerText = val ? "ĐÚNG" : "SAI";
            btn.onclick = () => handleAction(val, data.answer, btn);
            els.optionsContainer.appendChild(btn);
        });
    }
}

// 4. XỬ LÝ CLICK ĐÁP ÁN (Sửa lỗi logic tại đây)
function handleAction(userVal, correctVal, btn) {
    if (state.isSolved) return;

    // Ép kiểu về String để so sánh chính xác tuyệt đối (tránh lỗi true vs "true")
    const isCorrect = String(userVal).toLowerCase() === String(correctVal).toLowerCase();

    if (isCorrect) {
        btn.className = 'option-btn correct' + (state.currentMode === 'tf' ? ' tf-btn' : '');
        state.isSolved = true;
        
        if (!state.hasClickedWrong) {
            state.score++;
            els.liveScore.innerText = state.score;
        }

        Array.from(els.optionsContainer.children).forEach(b => b.disabled = true);
        els.submitBtn.disabled = false;
        els.submitBtn.focus();
        showFeedback("CHÍNH XÁC", "var(--success)");
    } else {
        btn.className = 'option-btn wrong' + (state.currentMode === 'tf' ? ' tf-btn' : '');
        btn.disabled = true; 
        state.hasClickedWrong = true;
        showFeedback("THỬ LẠI", "var(--error)");
    }
}

function showFeedback(text, color) {
    els.feedbackMsg.innerText = text;
    els.feedbackMsg.style.color = color;
    els.feedbackMsg.classList.remove('hidden');
}

// 5. KẾT THÚC & HOME
els.submitBtn.addEventListener('click', () => {
    state.currentIndex++;
    if (state.currentIndex < state.quizData.length) renderQuiz();
    else finishQuiz();
});

function finishQuiz() {
    els.quizScreen.classList.add('hidden');
    els.resultScreen.classList.remove('hidden');
    els.finalScore.innerText = `${state.score}/${state.quizData.length}`;
    
    const p = state.score / state.quizData.length;
    els.resultMsg.innerText = p === 1 ? "TUYỆT ĐỐI!" : (p >= 0.7 ? "RẤT TỐT!" : "CỐ GẮNG HƠN!");
    if(p >= 0.8) confetti({ particleCount: 150, spread: 70 });
}

els.homeBtnIngame.onclick = () => confirm("Thoát bài làm?") && location.reload();
els.homeBtnResult.onclick = () => location.reload();
