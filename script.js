let quizData = [];
let currentIdx = 0;
let score = 0;
let isAnswered = false;

// Thuật toán đảo mảng ngẫu nhiên (Fisher-Yates)
const shuffle = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

// Khởi động bài thi
async function startQuiz(mode) {
    try {
        let rawData = [];
        if (mode === 'mixed') {
            const [d1, d2] = await Promise.all([
                fetch('tracnghiem.json').then(r => r.json()),
                fetch('dungsai.json').then(r => r.json())
            ]);
            rawData = [...d1, ...d2];
        } else {
            const file = mode === 'multiple-choice' ? 'tracnghiem.json' : 'dungsai.json';
            rawData = await fetch(file).then(r => r.json());
        }

        quizData = shuffle(rawData);
        currentIdx = 0;
        score = 0;
        
        switchScreen('menu-screen', 'quiz-screen');
        renderQuestion();
        saveProgress();
    } catch (e) {
        alert("Lỗi tải dữ liệu. Hãy đảm bảo file JSON nằm cùng thư mục!");
    }
}

// Hiển thị câu hỏi
function renderQuestion() {
    isAnswered = false;
    const q = quizData[currentIdx];
    
    document.getElementById('q-counter').innerText = `Câu: ${currentIdx + 1}/${quizData.length}`;
    document.getElementById('score-counter').innerText = `Đúng: ${score}`;
    document.getElementById('progress-bar').style.width = `${((currentIdx + 1) / quizData.length) * 100}%`;
    document.getElementById('q-text').innerText = q.question;
    
    const list = document.getElementById('options-list');
    list.innerHTML = '';
    
    // Đảo cả thứ tự đáp án để chống học vẹt
    const shuffledOptions = shuffle([...q.options]);
    
    shuffledOptions.forEach((opt, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerHTML = `<span style="opacity:0.5; margin-right:8px">${index + 1}.</span> ${opt}`;
        btn.onclick = () => checkAnswer(btn, opt, q.answer);
        list.appendChild(btn);
    });
    
    document.getElementById('footer-nav').classList.add('hidden');
}

// Kiểm tra đáp án
function checkAnswer(btn, selected, correct) {
    if (isAnswered) return;
    isAnswered = true;
    
    const allBtns = document.querySelectorAll('.option-btn');
    if (selected === correct) {
        btn.classList.add('correct');
        score++;
    } else {
        btn.classList.add('wrong');
        allBtns.forEach(b => {
            if (b.innerText.includes(correct)) b.classList.add('correct');
        });
    }
    document.getElementById('footer-nav').classList.remove('hidden');
    saveProgress();
}

function handleNext() {
    currentIdx++;
    if (currentIdx < quizData.length) renderQuestion();
    else showResult();
}

function showResult() {
    localStorage.removeItem('quiz_state');
    switchScreen('quiz-screen', 'result-screen');
    document.getElementById('res-score').innerText = score;
    document.getElementById('res-msg').innerText = `Chúc mừng! Bạn đã hoàn thành ${score}/${quizData.length} câu hỏi chính xác.`;
}

// Chuyển màn hình
function switchScreen(hide, show) {
    document.getElementById(hide).classList.remove('active');
    document.getElementById(show).classList.add('active');
}

// Lưu tiến độ vào LocalStorage
function saveProgress() {
    localStorage.setItem('quiz_state', JSON.stringify({ quizData, currentIdx, score }));
}

// Phím tắt bàn phím
document.addEventListener('keydown', (e) => {
    if (document.getElementById('quiz-screen').classList.contains('active')) {
        if (!isAnswered && ['1','2','3','4'].includes(e.key)) {
            const btns = document.querySelectorAll('.option-btn');
            if (btns[e.key-1]) btns[e.key-1].click();
        } else if (isAnswered && e.key === 'Enter') {
            handleNext();
        }
    }
});

// Khôi phục khi F5
window.onload = () => {
    const saved = localStorage.getItem('quiz_state');
    if (saved) {
        if (confirm("Bạn có muốn tiếp tục bài thi đang dở không?")) {
            const data = JSON.parse(saved);
            quizData = data.quizData;
            currentIdx = data.currentIdx;
            score = data.score;
            switchScreen('menu-screen', 'quiz-screen');
            renderQuestion();
        } else localStorage.removeItem('quiz_state');
    }
};
