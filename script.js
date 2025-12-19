// --- 1. CONFIG & STATE ---
const CONFIG = {
    mcq: { url: 'questions.json', label: 'Trắc nghiệm' },
    tf:  { url: 'dungsai.json', label: 'Đúng Sai' }
};

let state = {
    quizData: [],
    currentMode: 'mcq', // 'mcq' hoặc 'tf'
    currentIndex: 0,
    score: 0,
    wrongAnswers: [],
    isAnswered: false
};

// --- 2. DOM ELEMENTS ---
const elements = {
    loadingScreen: document.getElementById('loading-screen'),
    quizScreen: document.getElementById('quiz-screen'),
    resultScreen: document.getElementById('result-screen'),
    setupOptions: document.getElementById('setup-options'),
    statusText: document.getElementById('status-text'),
    modeCards: document.querySelectorAll('.mode-card'),
    modeInputs: document.querySelectorAll('input[name="quizMode"]'),
    shuffleCheck: document.getElementById('shuffle-checkbox'),
    startBtn: document.getElementById('start-btn'),
    
    // Quiz View
    progressBar: document.getElementById('progress-bar'),
    currentCount: document.getElementById('current-count'),
    totalCount: document.getElementById('total-count'),
    liveScore: document.getElementById('live-score'),
    questionText: document.getElementById('question-text'),
    optionsContainer: document.getElementById('options-container'),
    submitBtn: document.getElementById('submit-btn'),

    // Result View
    finalScore: document.getElementById('final-score'),
    reviewContainer: document.getElementById('review-container')
};

// --- 3. EVENT LISTENERS ---

// Chuyển đổi UI khi chọn Mode
elements.modeCards.forEach(card => {
    card.addEventListener('click', () => {
        elements.modeCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        const input = card.querySelector('input');
        input.checked = true;
        state.currentMode = input.value;
    });
});

// Nút Bắt đầu
elements.startBtn.addEventListener('click', async () => {
    elements.startBtn.disabled = true;
    elements.statusText.innerText = "Đang tải dữ liệu...";
    
    const success = await loadData(state.currentMode);
    
    if (success) {
        // Trộn câu hỏi nếu cần
        if (elements.shuffleCheck.checked) {
            state.quizData.sort(() => Math.random() - 0.5);
        }
        
        elements.loadingScreen.classList.add('hidden');
        elements.quizScreen.classList.remove('hidden');
        renderQuiz();
    } else {
        elements.startBtn.disabled = false;
    }
});

// Nút Tiếp tục
elements.submitBtn.addEventListener('click', () => {
    state.currentIndex++;
    if (state.currentIndex < state.quizData.length) {
        renderQuiz();
    } else {
        finishQuiz();
    }
});

// --- 4. CORE FUNCTIONS ---

// Tải dữ liệu từ JSON
async function loadData(mode) {
    try {
        const url = CONFIG[mode].url;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
        state.quizData = await res.json();
        return true;
    } catch (err) {
        console.error(err);
        elements.statusText.innerText = `Lỗi: Không thể tải file ${CONFIG[mode].url}. Hãy kiểm tra lại!`;
        elements.statusText.style.color = "var(--error)";
        return false;
    }
}

// Render câu hỏi (Controller chính)
function renderQuiz() {
    resetStateForNewQuestion();
    const currentQ = state.quizData[state.currentIndex];
    
    // Cập nhật thông tin header
    elements.currentCount.innerText = state.currentIndex + 1;
    elements.totalCount.innerText = state.quizData.length;
    elements.liveScore.innerText = state.score;
    const progress = ((state.currentIndex) / state.quizData.length) * 100;
    elements.progressBar.style.width = `${progress}%`;

    // Hiển thị câu hỏi
    elements.questionText.innerText = `Câu ${state.currentIndex + 1}: ${currentQ.question}`;

    // Xóa đáp án cũ
    elements.optionsContainer.innerHTML = '';
    elements.optionsContainer.className = 'options-grid'; // Reset class

    // Render theo mode
    if (state.currentMode === 'mcq') {
        renderMCQOptions(currentQ);
    } else if (state.currentMode === 'tf') {
        renderTFOptions(currentQ);
    }
}

// 4.1 Render Trắc nghiệm (4 đáp án)
function renderMCQOptions(data) {
    const keys = ['a', 'b', 'c', 'd'];
    keys.forEach(key => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerHTML = `<span style="font-weight:800; margin-right:10px; color:var(--primary)">${key.toUpperCase()}.</span> ${data.options[key]}`;
        btn.dataset.key = key;
        btn.onclick = () => checkAnswer(key, data.answer, btn);
        elements.optionsContainer.appendChild(btn);
    });
}

// 4.2 Render Đúng/Sai (2 nút to)
function renderTFOptions(data) {
    elements.optionsContainer.classList.add('tf-mode'); // Thêm class để CSS chia 2 cột
    
    const options = [
        { label: "ĐÚNG", value: true, emoji: "✅" },
        { label: "SAI", value: false, emoji: "❌" }
    ];

    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn tf-btn';
        btn.dataset.value = opt.value; // Lưu giá trị true/false vào data attribute
        btn.innerHTML = `<div style="font-size:1.5rem; margin-bottom:5px;">${opt.emoji}</div>${opt.label}`;
        
        btn.onclick = () => checkAnswer(opt.value, data.answer, btn);
        elements.optionsContainer.appendChild(btn);
    });
}

// 5. XỬ LÝ CHECK ĐÁP ÁN (Dùng chung cho cả 2 mode)
function checkAnswer(userChoice, correctChoice, btnElement) {
    if (state.isAnswered) return; // Chặn click nhiều lần
    state.isAnswered = true;

    // Logic so sánh: 
    // Với MCQ: userChoice là 'a', correctChoice là 'a'
    // Với TF: userChoice là true (boolean), correctChoice là true (boolean)
    const isCorrect = userChoice === correctChoice;
    const allButtons = elements.optionsContainer.querySelectorAll('.option-btn');

    if (isCorrect) {
        state.score++;
        btnElement.classList.add('correct');
        elements.liveScore.innerText = state.score;
    } else {
        btnElement.classList.add('wrong');
        
        // Tìm và highlight đáp án đúng
        allButtons.forEach(btn => {
            // Logic tìm đáp án đúng cho MCQ
            if (state.currentMode === 'mcq' && btn.dataset.key === correctChoice) {
                btn.classList.add('correct');
            }
            // Logic tìm đáp án đúng cho TF
            if (state.currentMode === 'tf') {
                // Chuyển đổi dataset.value từ string "true"/"false" sang boolean để so sánh
                const btnValue = btn.dataset.value === 'true'; 
                if (btnValue === correctChoice) btn.classList.add('correct');
            }
        });

        // Lưu câu sai để review
        const currentQ = state.quizData[state.currentIndex];
        saveWrongAnswer(currentQ, userChoice, correctChoice);
    }

    // Khóa tất cả các nút
    allButtons.forEach(btn => btn.disabled = true);
    elements.submitBtn.disabled = false;
    elements.submitBtn.focus(); // Focus vào nút tiếp tục để user nhấn Space/Enter
}

function saveWrongAnswer(questionData, userVal, correctVal) {
    let userText, correctText;

    if (state.currentMode === 'mcq') {
        userText = questionData.options[userVal];
        correctText = questionData.options[correctVal];
    } else {
        userText = userVal ? "Đúng" : "Sai";
        correctText = correctVal ? "Đúng" : "Sai";
    }

    state.wrongAnswers.push({
        q: questionData.question,
        u: userText,
        c: correctText,
        explain: questionData.explain || "" // Hỗ trợ giải thích nếu JSON có
    });
}

function resetStateForNewQuestion() {
    state.isAnswered = false;
    elements.submitBtn.disabled = true;
}

// 6. KẾT THÚC
function finishQuiz() {
    elements.quizScreen.classList.add('hidden');
    elements.resultScreen.classList.remove('hidden');
    elements.progressBar.style.width = '100%';
    
    elements.finalScore.innerText = `${state.score}/${state.quizData.length}`;

    // Hiệu ứng pháo hoa nếu điểm cao
    if (state.score / state.quizData.length >= 0.7) {
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
    }

    // Render danh sách câu sai
    if (state.wrongAnswers.length > 0) {
        elements.reviewContainer.innerHTML = state.wrongAnswers.map(item => `
            <div class="review-item">
                <p style="font-weight:700; margin-bottom:5px">${item.q}</p>
                <div style="font-size:0.9rem">
                    <p style="color:var(--error)">✖ Bạn chọn: ${item.u}</p>
                    <p style="color:var(--success)">✔ Đáp án đúng: ${item.c}</p>
                    ${item.explain ? `<p style="color:#64748b; font-style:italic; margin-top:5px">ℹ️ ${item.explain}</p>` : ''}
                </div>
            </div>
        `).join('');
    } else {
        elements.reviewContainer.innerHTML = `
            <div style="text-align:center; padding:20px; color:var(--success); font-weight:700;">
                Xuất sắc! Bạn trả lời đúng tất cả các câu hỏi! 🎉
            </div>
        `;
    }
}
