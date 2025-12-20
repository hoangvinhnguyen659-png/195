let quizData = [];
let userQuestions = [];
let score = 0;
let correctCount = 0;

const statusText = document.getElementById('status-text');
const setupOptions = document.getElementById('setup-options');
const loadingScreen = document.getElementById('loading-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const progressBar = document.getElementById('progress-bar');

function escapeHtml(text) {
    if (!text) return "";
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

async function init() {
    try {
        const response = await fetch('questions.json');
        if (response.ok) {
            statusText.innerText = "Sẵn sàng!";
            setupOptions.classList.remove('hidden');
        } else {
            throw new Error("File missing");
        }
    } catch (e) {
        statusText.innerText = "Kiểm tra file questions.json!";
        setupOptions.classList.remove('hidden');
    }
}
init();

async function startGame(fileName) {
    statusText.innerText = "Đang tải dữ liệu...";
    setupOptions.classList.add('hidden');

    setTimeout(async () => {
        try {
            const res = await fetch(fileName);
            quizData = await res.json();
            
            const isShuffle = document.getElementById('shuffle-checkbox').checked;
            userQuestions = isShuffle ? [...quizData].sort(() => Math.random() - 0.5) : [...quizData];
            
            resetAndRender();
        } catch (err) {
            alert("Không tìm thấy file câu hỏi!");
            location.reload();
        }
    }, 200);
}

function resetAndRender() {
    score = 0;
    correctCount = 0;
    loadingScreen.classList.add('hidden');
    resultScreen.classList.add('hidden');
    quizScreen.classList.remove('hidden');
    renderAllQuestions();
    document.querySelector('.quiz-scroll-area').scrollTop = 0;
}

function renderAllQuestions() {
    const feed = document.getElementById('quiz-feed');
    feed.innerHTML = "";
    
    userQuestions.forEach((data, index) => {
        const qBlock = document.createElement('div');
        qBlock.className = 'question-block';
        qBlock.id = `q-block-${index}`;

        let optionsHtml = "";
        
        // KIỂM TRA LOẠI CÂU HỎI: ĐÚNG SAI (Có mảng subQuestions)
        if (data.subQuestions && Array.isArray(data.subQuestions)) {
            optionsHtml = data.subQuestions.map((sub, subIdx) => `
                <div class="sub-q-row" id="q-${index}-sub-${subIdx}">
                    <div class="sub-q-text"><b>${String.fromCharCode(97 + subIdx)}.</b> ${escapeHtml(sub.text)}</div>
                    <div class="tf-group">
                        <button class="btn-tf" onclick="handleTF(this, ${index}, ${subIdx}, true)">Đúng</button>
                        <button class="btn-tf" onclick="handleTF(this, ${index}, ${subIdx}, false)">Sai</button>
                    </div>
                </div>
            `).join('');
        } 
        // LOẠI CÂU HỎI: TRẮC NGHIỆM (A, B, C, D)
        else {
            const labels = ['A', 'B', 'C', 'D'];
            const opts = Array.isArray(data.options) ? data.options : Object.values(data.options);
            const keys = Array.isArray(data.options) ? data.options : Object.keys(data.options);

            optionsHtml = opts.map((opt, idx) => `
                <div class="option-item-new" onclick="handleSelectNew(this, ${index}, '${keys[idx]}')">
                    <span class="label-circle">${labels[idx]}</span>
                    <span class="opt-content">${escapeHtml(opt)}</span>
                </div>
            `).join('');
        }

        qBlock.innerHTML = `
            <div class="question-text">Câu ${index + 1}: ${escapeHtml(data.question)}</div>
            <div class="option-list">${optionsHtml}</div>`;
        feed.appendChild(qBlock);
    });

    document.getElementById('total-count').innerText = userQuestions.length;
    updateProgress();
}

// Xử lý Trắc nghiệm A B C D
function handleSelectNew(element, qIndex, selectedKey) {
    const block = document.getElementById(`q-block-${qIndex}`);
    if (block.classList.contains('completed')) return;

    const data = userQuestions[qIndex];
    let correctKey = "";
    
    if (Array.isArray(data.options)) {
        correctKey = data.answer; 
    } else {
        const entry = Object.entries(data.options).find(([k, v]) => v === data.answer);
        correctKey = entry ? entry[0] : data.answer;
    }

    if (selectedKey === correctKey) {
        element.classList.add('correct-choice');
        block.classList.add('completed');
        score++;
        correctCount++;
        updateProgress();
    } else {
        element.classList.add('wrong-choice');
        // Cho phép chọn lại cho đến khi đúng (tùy nhu cầu của bạn)
    }

    if (correctCount === userQuestions.length) {
        setTimeout(showFinalResults, 500);
    }
}

// Xử lý Đúng/Sai (Từng ý a, b, c, d)
function handleTF(btn, qIndex, subIdx, userChoice) {
    const row = document.getElementById(`q-${qIndex}-sub-${subIdx}`);
    if (row.classList.contains('answered')) return;

    const correctAnswer = userQuestions[qIndex].subQuestions[subIdx].answer; // true hoặc false

    const buttons = row.querySelectorAll('.btn-tf');
    buttons.forEach(b => b.disabled = true);

    if (userChoice === correctAnswer) {
        btn.classList.add('tf-correct');
        row.classList.add('answered');
        // Cách tính điểm Đúng/Sai có thể tùy chỉnh, ở đây mỗi ý đúng là một phần điểm nhỏ
        // Hoặc bạn có thể chỉ tính correctCount khi đúng hết cả 4 ý.
    } else {
        btn.classList.add('tf-wrong');
    }
    
    // Logic kiểm tra hoàn thành câu hỏi lớn (ví dụ: xong cả 4 ý)
    const block = document.getElementById(`q-block-${qIndex}`);
    const answeredSubs = block.querySelectorAll('.sub-q-row.answered').length;
    if (answeredSubs === userQuestions[qIndex].subQuestions.length && !block.classList.contains('completed')) {
        block.classList.add('completed');
        score++;
        correctCount++;
        updateProgress();
    }
}

function updateProgress() {
    const percent = userQuestions.length > 0 ? (correctCount / userQuestions.length) * 100 : 0;
    progressBar.style.width = percent + "%";
    document.getElementById('current-count').innerText = correctCount;
    document.getElementById('live-score').innerText = score;
}

function showFinalResults() {
    quizScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');
    document.getElementById('final-score').innerText = score + "/" + userQuestions.length;
}

function restartQuiz() {
    location.reload();
}

document.getElementById('btn-tracnghiem').onclick = () => startGame('questions.json');
document.getElementById('btn-dungsai').onclick = () => startGame('dungsai.json');
