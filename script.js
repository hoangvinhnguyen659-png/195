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
            throw new Error();
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
        
        // TRƯỜNG HỢP 1: CÂU HỎI ĐÚNG SAI (Có subQuestions)
        if (data.subQuestions && Array.isArray(data.subQuestions)) {
            optionsHtml = data.subQuestions.map((sub, subIdx) => `
                <div class="sub-q-row" id="q-${index}-sub-${subIdx}">
                    <div class="sub-q-text"><b>${sub.label}.</b> ${escapeHtml(sub.content)}</div>
                    <div class="tf-group">
                        <button class="btn-tf" onclick="handleTFSelect(this, ${index}, ${subIdx}, 'Đúng')">Đúng</button>
                        <button class="btn-tf" onclick="handleTFSelect(this, ${index}, ${subIdx}, 'Sai')">Sai</button>
                    </div>
                </div>
            `).join('');
        } 
        // TRƯỜNG HỢP 2: TRẮC NGHIỆM A B C D
        else {
            const labels = ['A', 'B', 'C', 'D'];
            const opts = Array.isArray(data.options) ? data.options : Object.values(data.options);
            const keys = Array.isArray(data.options) ? data.options : Object.keys(data.options);

            optionsHtml = opts.map((opt, idx) => `
                <div class="option-item-new" onclick="handleMCQSelect(this, ${index}, '${keys[idx]}')">
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

// Xử lý chọn Trắc nghiệm A B C D
function handleMCQSelect(element, qIndex, selectedKey) {
    const block = document.getElementById(`q-block-${qIndex}`);
    if (block.classList.contains('completed')) return;

    const data = userQuestions[qIndex];
    let correctKey = "";
    
    // Tìm key đúng
    if (Array.isArray(data.options)) {
        correctKey = data.answer; 
    } else {
        const entry = Object.entries(data.options).find(([k, v]) => v === data.answer);
        correctKey = entry ? entry[0] : data.answer;
    }

    if (selectedKey === correctKey) {
        element.classList.add('correct');
        block.classList.add('completed');
        score++;
        correctCount++;
        updateProgress();
        checkFinish();
    } else {
        // Cho phép chọn lại cho đến khi đúng, chỉ đánh dấu đỏ lựa chọn sai
        element.classList.add('wrong');
        setTimeout(() => element.classList.remove('wrong'), 1000);
    }
}

// Xử lý chọn Đúng / Sai cho từng ý nhỏ
function handleTFSelect(btn, qIndex, subIdx, userChoice) {
    const row = document.getElementById(`q-${qIndex}-sub-${subIdx}`);
    if (row.classList.contains('answered')) return;

    const correctAnswer = userQuestions[qIndex].subQuestions[subIdx].answer;

    if (userChoice === correctAnswer) {
        btn.classList.add('tf-correct');
        row.classList.add('answered');
        
        // Khóa các nút của hàng này
        const buttons = row.querySelectorAll('.btn-tf');
        buttons.forEach(b => b.disabled = true);

        // Kiểm tra xem đã hoàn thành toàn bộ các ý của câu hỏi lớn chưa
        const block = document.getElementById(`q-block-${qIndex}`);
        const totalSubs = userQuestions[qIndex].subQuestions.length;
        const answeredSubs = block.querySelectorAll('.sub-q-row.answered').length;

        if (answeredSubs === totalSubs) {
            block.classList.add('completed');
            score++;
            correctCount++;
            updateProgress();
            checkFinish();
        }
    } else {
        btn.classList.add('tf-wrong');
        setTimeout(() => btn.classList.remove('tf-wrong'), 1000);
    }
}

function updateProgress() {
    const percent = userQuestions.length > 0 ? (correctCount / userQuestions.length) * 100 : 0;
    progressBar.style.width = percent + "%";
    document.getElementById('current-count').innerText = correctCount;
    document.getElementById('live-score').innerText = score;
}

function checkFinish() {
    if (correctCount === userQuestions.length) {
        setTimeout(showFinalResults, 600);
    }
}

function showFinalResults() {
    quizScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');
    document.getElementById('final-score').innerText = score + "/" + userQuestions.length;
}

function restartQuiz() {
    location.reload();
}

// Gán sự kiện cho các nút chọn chế độ ở màn hình chờ
document.getElementById('btn-tracnghiem').onclick = () => startGame('questions.json');
document.getElementById('btn-dungsai').onclick = () => startGame('dungsai.json');
// Gán sự kiện cho nút Home/Quay lại
document.getElementById('btn-home-nav').onclick = () => location.reload();
