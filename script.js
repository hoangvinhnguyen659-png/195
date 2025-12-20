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
        statusText.innerText = "Vui lòng kiểm tra file JSON!";
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
            alert("Không tìm thấy file: " + fileName);
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

document.getElementById('btn-tracnghiem').onclick = () => startGame('questions.json');
document.getElementById('btn-dungsai').onclick = () => startGame('dungsai.json');

function renderAllQuestions() {
    const feed = document.getElementById('quiz-feed');
    feed.innerHTML = "";
    
    userQuestions.forEach((data, index) => {
        const qBlock = document.createElement('div');
        qBlock.className = 'question-block';
        qBlock.id = `q-block-${index}`;

        const questionTitle = escapeHtml(data.question);
        let contentHtml = "";

        if (data.subQuestions) {
            // Chế độ Đúng/Sai
            contentHtml = `<div class="ds-container">` + 
                data.subQuestions.map((sub, subIdx) => `
                <div class="sub-q-group" id="q-${index}-sub-${subIdx}">
                    <div class="sub-q-text">${sub.label}. ${escapeHtml(sub.content)}</div>
                    <div class="option-list ds-row">
                        <div class="option-item" onclick="handleDSSelect(this, ${index}, ${subIdx}, 'Đúng')">
                            <input type="radio" name="sub-${index}-${subIdx}"><span>Đúng</span>
                        </div>
                        <div class="option-item" onclick="handleDSSelect(this, ${index}, ${subIdx}, 'Sai')">
                            <input type="radio" name="sub-${index}-${subIdx}"><span>Sai</span>
                        </div>
                    </div>
                </div>`).join('') + `</div>`;
        } else {
            // Chế độ Trắc nghiệm
            const opts = data.options;
            const entries = Array.isArray(opts) ? opts.map((v, i) => [String.fromCharCode(97 + i), v]) : Object.entries(opts);
            contentHtml = `<div class="option-list">` + 
                entries.map(([key, val]) => `
                <div class="option-item" onclick="handleSelect(this, ${index}, '${key}')">
                    <input type="radio" name="q${index}"><span>${escapeHtml(val)}</span>
                </div>`).join('') + `</div>`;
        }

        qBlock.innerHTML = `<div class="question-text">Câu ${index + 1}: ${questionTitle}</div>${contentHtml}`;
        feed.appendChild(qBlock);
    });

    document.getElementById('total-count').innerText = userQuestions.length;
    updateProgress();
}

// TRẮC NGHIỆM: Làm mờ nếu chọn đúng
function handleSelect(element, qIndex, selectedKey) {
    const block = document.getElementById(`q-block-${qIndex}`);
    if (block.classList.contains('completed')) return;

    const data = userQuestions[qIndex];
    let correctKey = "";
    if (Array.isArray(data.options)) {
        correctKey = (data.answer === data.options[0]) ? "a" : (data.answer === data.options[1] ? "b" : (data.answer === data.options[2] ? "c" : "d"));
    } else {
        const entry = Object.entries(data.options).find(([k, v]) => v === data.answer);
        correctKey = entry ? entry[0] : String(data.answer).toLowerCase();
    }

    // Reset màu để người dùng chọn lại nếu sai
    block.querySelectorAll('.option-item').forEach(item => item.classList.remove('wrong', 'correct'));
    element.querySelector('input').checked = true;

    if (selectedKey === correctKey) {
        element.classList.add('correct');
        block.classList.add('completed'); // Hiệu ứng làm mờ CSS sẽ tự kích hoạt ở đây
        score++;
        correctCount++;
        updateProgress();
        checkEndGame();
    } else {
        element.classList.add('wrong');
    }
}

// ĐÚNG/SAI: Làm mờ từng hàng nếu chọn đúng
function handleDSSelect(element, qIndex, subIdx, userChoice) {
    const group = document.getElementById(`q-${qIndex}-sub-${subIdx}`);
    if (group.classList.contains('sub-completed')) return;

    const subData = userQuestions[qIndex].subQuestions[subIdx];
    
    group.querySelectorAll('.option-item').forEach(item => item.classList.remove('wrong', 'correct'));
    element.querySelector('input').checked = true;

    if (userChoice === subData.answer) {
        element.classList.add('correct');
        group.classList.add('sub-completed'); // Hiệu ứng làm mờ CSS kích hoạt cho hàng này
        score += 0.25;
        
        const parentBlock = document.getElementById(`q-block-${qIndex}`);
        if (parentBlock.querySelectorAll('.sub-completed').length === 4) {
            parentBlock.classList.add('completed');
            correctCount++;
            updateProgress();
            checkEndGame();
        }
    } else {
        element.classList.add('wrong');
    }
}

function updateProgress() {
    const percent = userQuestions.length > 0 ? (correctCount / userQuestions.length) * 100 : 0;
    progressBar.style.width = percent + "%";
    document.getElementById('current-count').innerText = correctCount;
    document.getElementById('live-score').innerText = (Math.round(score * 100) / 100);
}

function checkEndGame() {
    if (correctCount === userQuestions.length && userQuestions.length > 0) {
        setTimeout(showFinalResults, 800);
    }
}

function showFinalResults() {
    quizScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');
    document.getElementById('final-score').innerText = (Math.round(score * 100) / 100) + "/" + userQuestions.length;
}

function restartQuiz() {
    location.reload();
}
