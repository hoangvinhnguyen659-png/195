// CONFIG & STATE
const CONFIG = {
    mcq: { url: 'questions.json' },
    tf:  { url: 'dungsai.json' }
};

let state = {
    quizData: [],
    currentMode: 'mcq',
    currentIndex: 0,
    score: 0,
    isSolved: false,      // Đã tìm ra đáp án đúng chưa?
    hasClickedWrong: false // Đã từng bấm sai ở câu này chưa? (để tính điểm)
};

// DOM ELEMENTS
const els = {
    loadingScreen: document.getElementById('loading-screen'),
    quizScreen: document.getElementById('quiz-screen'),
    resultScreen: document.getElementById('result-screen'),
    startBtn: document.getElementById('start-btn'),
    modeCards: document.querySelectorAll('.mode-card'),
    shuffleCheck: document.getElementById('shuffle-checkbox'),
    statusText: document.getElementById('status-text'),
    
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

// --- EVENT LISTENERS ---

// 1. Chọn chế độ (Trắc nghiệm / Đúng Sai)
els.modeCards.forEach(card => {
    card.addEventListener('click', () => {
        els.modeCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        card.querySelector('input').checked = true;
        state.currentMode = card.dataset.mode;
    });
});

// 2. Nút Bắt đầu
els.startBtn.addEventListener('click', async () => {
    els.startBtn.disabled = true;
    els.statusText.innerText = "Đang tải dữ liệu...";
    
    try {
        const res = await fetch(CONFIG[state.currentMode].url);
        if (!res.ok) throw new Error("File not found");
        state.quizData = await res.json();
        
        // Trộn câu hỏi (Áp dụng cho cả 2 chế độ)
        if (els.shuffleCheck.checked) {
            state.quizData.sort(() => Math.random() - 0.5);
        }

        // Reset trạng thái
        state.currentIndex = 0;
        state.score = 0;
        els.loadingScreen.classList.add('hidden');
        els.quizScreen.classList.remove('hidden');
        renderQuiz();
        
    } catch (err) {
        console.error(err);
        els.statusText.innerText = "Lỗi: Không tìm thấy file dữ liệu!";
        els.statusText.style.color = "red";
    } finally {
        els.startBtn.disabled = false;
    }
});

// 3. Logic Nút Home
const returnToHome = () => {
    if(confirm("Về menu chính? Tiến trình hiện tại sẽ mất.")){
        els.quizScreen.classList.add('hidden');
        els.resultScreen.classList.add('hidden');
        els.loadingScreen.classList.remove('hidden');
        els.statusText.innerText = "";
    }
};
els.homeBtnIngame.addEventListener('click', returnToHome);
els.homeBtnResult.addEventListener('click', () => location.reload()); // Về menu sạch sẽ bằng reload

// 4. Nút Tiếp tục
els.submitBtn.addEventListener('click', () => {
    state.currentIndex++;
    if (state.currentIndex < state.quizData.length) {
        renderQuiz();
    } else {
        finishQuiz();
    }
});

// --- CORE FUNCTIONS ---

function renderQuiz() {
    // Reset state cho câu mới
    state.isSolved = false;
    state.hasClickedWrong = false;
    els.submitBtn.disabled = true;
    els.feedbackMsg.innerText = "";
    els.feedbackMsg.classList.add('hidden');

    const currentQ = state.quizData[state.currentIndex];
    
    // Update Stats
    els.currentCount.innerText = state.currentIndex + 1;
    els.totalCount.innerText = state.quizData.length;
    els.liveScore.innerText = state.score;
    els.progressBar.style.width = `${(state.currentIndex / state.quizData.length) * 100}%`;
    
    // Render Question
    els.questionText.innerText = `Câu ${state.currentIndex + 1}: ${currentQ.question}`;
    els.optionsContainer.innerHTML = '';
    
    // Setup Grid CSS Class
    els.optionsContainer.className = state.currentMode === 'tf' ? 'options-grid tf-mode' : 'options-grid';

    if (state.currentMode === 'mcq') renderMCQ(currentQ);
    else renderTF(currentQ);
}

// Render 4 đáp án
function renderMCQ(data) {
    const labels = ['A', 'B', 'C', 'D'];
    ['a', 'b', 'c', 'd'].forEach((key, index) => {
        createOptionBtn(
            `<span style="color:var(--primary); font-weight:800; margin-right:8px">${labels[index]}.</span> ${data.options[key]}`, 
            key, 
            data.answer,
            'mcq-btn'
        );
    });
}

// Render Đúng / Sai (Chữ to, không icon)
function renderTF(data) {
    createOptionBtn("ĐÚNG", true, data.answer, 'tf-btn');
    createOptionBtn("SAI", false, data.answer, 'tf-btn');
}

function createOptionBtn(htmlContent, value, correctVal, extraClass = '') {
    const btn = document.createElement('button');
    btn.className = `option-btn ${extraClass}`;
    btn.innerHTML = htmlContent;
    
    // Lưu giá trị vào element để check sau này
    btn.dataset.value = value;
    
    btn.onclick = () => checkAnswer(value, correctVal, btn);
    els.optionsContainer.appendChild(btn);
}

function checkAnswer(userVal, correctVal, btn) {
    if (state.isSolved) return; // Nếu đã chọn đúng rồi thì không làm gì nữa (tránh spam)

    const isCorrect = String(userVal) === String(correctVal); // So sánh string để an toàn cho cả boolean/text
    
    if (isCorrect) {
        // --- TRƯỜNG HỢP CHỌN ĐÚNG ---
        btn.classList.add('correct');
        state.isSolved = true;
        
        // Chỉ cộng điểm nếu chưa từng chọn sai ở câu này
        if (!state.hasClickedWrong) {
            state.score++;
            els.liveScore.innerText = state.score;
            showFeedback("Chính xác! 🎉", "green");
        } else {
            showFeedback("Đúng rồi! (Nhưng không được cộng điểm do chọn lại)", "orange");
        }

        // Khóa tất cả các nút
        Array.from(els.optionsContainer.children).forEach(b => b.disabled = true);
        
        // Mở khóa nút Tiếp tục và focus vào nó
        els.submitBtn.disabled = false;
        els.submitBtn.focus();

    } else {
        // --- TRƯỜNG HỢP CHỌN SAI ---
        btn.classList.add('wrong');
        btn.disabled = true; // Khóa nút sai này lại
        state.hasClickedWrong = true; // Đánh dấu là đã sai (mất điểm câu này)
        
        showFeedback("Sai rồi! Hãy chọn lại.", "red");
        // Không khóa các nút khác, cho phép người dùng chọn lại
    }
}

function showFeedback(msg, color) {
    els.feedbackMsg.innerText = msg;
    els.feedbackMsg.style.color = color === 'green' ? 'var(--success)' : (color === 'red' ? 'var(--error)' : '#e67e22');
    els.feedbackMsg.classList.remove('hidden');
}

function finishQuiz() {
    els.quizScreen.classList.add('hidden');
    els.resultScreen.classList.remove('hidden');
    
    els.finalScore.innerText = `${state.score}/${state.quizData.length}`;
    els.progressBar.style.width = '100%';

    const percent = state.score / state.quizData.length;
    if (percent === 1) {
        els.resultMsg.innerText = "Tuyệt đối! Xuất sắc! 🏆";
        confetti({ particleCount: 150, spread: 80 });
    } else if (percent >= 0.7) {
        els.resultMsg.innerText = "Làm tốt lắm! 🎉";
        confetti();
    } else {
        els.resultMsg.innerText = "Hãy cố gắng hơn nhé! 💪";
    }
}
