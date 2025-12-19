let questions = [];
let currentQuestionIndex = 0;
let score = 0;
let isAnswered = false;
let currentMode = '';

// 1. Khởi động Quiz
async function startQuiz(mode) {
    currentMode = mode;
    try {
        let data = [];
        if (mode === 'mixed') {
            const [d1, d2] = await Promise.all([fetch('trac-nghiem.json').then(r => r.json()), fetch('dung-sai.json').then(r => r.json())]);
            data = [...d1, ...d2];
        } else {
            const file = mode === 'multiple-choice' ? 'trac-nghiem.json' : 'dung-sai.json';
            const res = await fetch(file);
            data = await res.json();
        }
        
        questions = shuffle(data);
        saveProgress();
        switchScreen('menu-screen', 'quiz-screen');
        showQuestion();
    } catch (e) { alert("Lỗi tải dữ liệu!"); }
}

// 2. Thuật toán xáo trộn Fisher-Yates (Tối ưu nhất)
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 3. Hiển thị câu hỏi
function showQuestion() {
    if (currentQuestionIndex >= questions.length) return showFinalResult();

    isAnswered = false;
    const q = questions[currentQuestionIndex];
    
    document.getElementById('question-counter').innerText = `Câu: ${currentQuestionIndex + 1}/${questions.length}`;
    document.getElementById('live-score').innerText = `Đúng: ${score}`;
    document.getElementById('progress-bar').style.width = ((currentQuestionIndex + 1) / questions.length * 100) + '%';
    document.getElementById('question-text').innerText = q.question;

    const container = document.getElementById('options-container');
    container.innerHTML = '';

    q.options.forEach((opt, idx) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn fade-in';
        btn.innerHTML = `<span style="opacity:0.5; margin-right:10px">${idx + 1}.</span> ${opt}`;
        btn.onclick = () => checkAnswer(btn, opt, q.answer);
        container.appendChild(btn);
    });
    document.getElementById('navigation-area').classList.add('hidden');
}

// 4. Kiểm tra đáp án
function checkAnswer(selectedBtn, selectedValue, correctAnswer) {
    if (isAnswered) return;
    isAnswered = true;

    if (selectedValue === correctAnswer) {
        selectedBtn.classList.add('correct');
        score++;
    } else {
        selectedBtn.classList.add('wrong');
        Array.from(document.querySelectorAll('.option-btn')).forEach(btn => {
            if (btn.innerText.includes(correctAnswer)) btn.classList.add('correct');
        });
    }
    document.getElementById('navigation-area').classList.remove('hidden');
}

// 5. Điều khiển phím tắt
document.addEventListener('keydown', (e) => {
    if (document.getElementById('quiz-screen').classList.contains('hidden')) return;
    
    if (!isAnswered && ['1','2','3','4'].includes(e.key)) {
        const btns = document.querySelectorAll('.option-btn');
        if (btns[e.key - 1]) btns[e.key - 1].click();
    } else if (isAnswered && e.key === 'Enter') {
        nextQuestion();
    }
});

// 6. Tự động lưu & Phục hồi
function saveProgress() {
    localStorage.setItem('quiz_state', JSON.stringify({ mode: currentMode, questions, currentQuestionIndex, score }));
}

function nextQuestion() {
    currentQuestionIndex++;
    saveProgress();
    showQuestion();
}

function switchScreen(hideId, showId) {
    document.getElementById(hideId).classList.add('hidden');
    const show = document.getElementById(showId);
    show.classList.remove('hidden');
    show.classList.add('fade-in');
}

function showFinalResult() {
    localStorage.removeItem('quiz_state');
    switchScreen('quiz-screen', 'result-screen');
    document.getElementById('score-number').innerText = score;
    document.getElementById('final-stats').innerText = `Bạn đúng ${score}/${questions.length} câu.`;
}

function restart() { location.reload(); }

// Kiểm tra khi load trang
window.onload = () => {
    const saved = localStorage.getItem('quiz_state');
    if (saved) {
        const state = JSON.parse(saved);
        if (confirm("Làm tiếp bài dở dang?")) {
            questions = state.questions; currentQuestionIndex = state.currentQuestionIndex; 
            score = state.score; currentMode = state.mode;
            switchScreen('menu-screen', 'quiz-screen');
            showQuestion();
        } else localStorage.removeItem('quiz_state');
    }
};
