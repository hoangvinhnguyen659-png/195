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
            // Giao diện Đúng/Sai
            contentHtml = `<div class="ds-container">` + 
                data.subQuestions.map((sub, subIdx) => `
                <div class="option-list" id="q-${index}-sub-${subIdx}" style="margin-bottom:15px; border-bottom:1px dashed #eee; padding-bottom:10px;">
                    <div style="margin-bottom:8px; font-size:0.95rem;">${sub.label}. ${escapeHtml(sub.content)}</div>
                    <div style="display:flex; gap:10px;">
                        <div class="option-item" style="flex:1; margin-bottom:0;" onclick="handleDSSelect(this, ${index}, ${subIdx}, 'Đúng')">
                            <input type="radio" name="sub-${index}-${subIdx}"><span>Đúng</span>
                        </div>
                        <div class="option-item" style="flex:1; margin-bottom:0;" onclick="handleDSSelect(this, ${index}, ${subIdx}, 'Sai')">
                            <input type="radio" name="sub-${index}-${subIdx}"><span>Sai</span>
                        </div>
                    </div>
                </div>`).join('') + `</div>`;
        } else {
            // Giao diện Trắc nghiệm cũ
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

// XỬ LÝ TRẮC NGHIỆM: Cho phép chọn lại nếu sai
function handleSelect(element, qIndex, selectedKey) {
    const block = document.getElementById(`q-block-${qIndex}`);
    if (block.classList.contains('completed')) return;

    // Reset các lựa chọn cũ trong cùng một câu nếu người dùng chọn lại
    const allOptions = block.querySelectorAll('.option-item');
    allOptions.forEach(opt => {
        opt.classList.remove('wrong');
        opt.classList.remove('correct');
    });

    element.querySelector('input').checked = true;
    const data = userQuestions[qIndex];
    let correctKey = "";
    
    if (Array.isArray(data.options)) {
        correctKey = (data.answer === data.options[0]) ? "a" : (data.answer === data.options[1] ? "b" : "c");
    } else {
        const entry = Object.entries(data.options).find(([k, v]) => v === data.answer);
        correctKey = entry ? entry[0] : String(data.answer).toLowerCase();
    }

    if (selectedKey === correctKey) {
        element.classList.add('correct');
        block.classList.add('completed'); 
        score++;
        correctCount++;
        updateProgress();
        checkEndGame();
    } else {
        element.classList.add('wrong');
        // Không khóa câu hỏi, cho phép người dùng nhấn lại đáp án khác
    }
}

// XỬ LÝ ĐÚNG/SAI: Cho phép chọn lại từng ý nhỏ
function handleDSSelect(element, qIndex, subIdx, userChoice) {
    const subContainer = document.getElementById(`q-${qIndex}-sub-${subIdx}`);
    if (subContainer.classList.contains('sub-completed')) return;

    // Reset màu của 2 nút Đúng/Sai trong hàng đó để chọn lại
    const siblings = subContainer.querySelectorAll('.option-item');
    siblings.forEach(s => {
        s.classList.remove('wrong');
        s.classList.remove('correct');
    });

    element.querySelector('input').checked = true;
    const subData = userQuestions[qIndex].subQuestions[subIdx];

    if (userChoice === subData.answer) {
        element.classList.add('correct');
        subContainer.classList.add('sub-completed'); // Khóa ý nhỏ này lại
        score += 0.25;
        
        // Kiểm tra xem đã xong cả 4 ý chưa
        const parentBlock = document.getElementById(`q-block-${qIndex}`);
        const finishedSubs = parentBlock.querySelectorAll('.sub-completed').length;
        if (finishedSubs === 4) {
            parentBlock.classList.add('completed');
            correctCount++;
            updateProgress();
            checkEndGame();
        }
    } else {
        element.classList.add('wrong');
        // Không khóa, cho phép chọn lại Đúng thành Sai hoặc ngược lại
    }
}

function updateProgress() {
    const percent = userQuestions.length > 0 ? (correctCount / userQuestions.length) * 100 : 0;
    progressBar.style.width = percent + "%";
    document.getElementById('current-count').innerText = correctCount;
    document.getElementById('live-score').innerText = Math.round(score * 100) / 100;
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
