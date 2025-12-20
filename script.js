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
            alert("Không tìm thấy file câu hỏi: " + fileName);
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
        let optionsHtml = "";

        // KIỂM TRA ĐỊNH DẠNG: Nếu có subQuestions thì render kiểu Đúng/Sai
        if (data.subQuestions) {
            optionsHtml = `<div class="ds-container">` + 
                data.subQuestions.map((sub, subIdx) => `
                <div class="sub-q-row" id="q-${index}-sub-${subIdx}">
                    <div class="sub-q-text">${sub.label}. ${escapeHtml(sub.content)}</div>
                    <div class="sub-q-btns">
                        <button class="btn-ds" onclick="handleDSClick(${index}, ${subIdx}, 'Đúng')">Đúng</button>
                        <button class="btn-ds" onclick="handleDSClick(${index}, ${subIdx}, 'Sai')">Sai</button>
                    </div>
                </div>`).join('') + `</div>`;
        } 
        // Ngược lại render kiểu Trắc nghiệm cũ
        else {
            const opts = data.options;
            const entries = Array.isArray(opts) 
                ? opts.map((v, i) => [String.fromCharCode(97 + i), v]) 
                : Object.entries(opts);

            optionsHtml = `<div class="option-list">` + 
                entries.map(([key, val]) => `
                <div class="option-item" onclick="handleSelect(this, ${index}, '${key}')">
                    <input type="radio" name="q${index}"><span>${escapeHtml(val)}</span>
                </div>`).join('') + `</div>`;
        }

        qBlock.innerHTML = `
            <div class="question-text">Câu ${index + 1}: ${questionTitle}</div>
            ${optionsHtml}`;
        feed.appendChild(qBlock);
    });

    document.getElementById('total-count').innerText = userQuestions.length;
    updateProgress();
}

// XỬ LÝ CHẾ ĐỘ TRẮC NGHIỆM (Dạng cũ)
function handleSelect(element, qIndex, selectedKey) {
    const block = document.getElementById(`q-block-${qIndex}`);
    if (block.classList.contains('completed')) return;

    const data = userQuestions[qIndex];
    let correctKey = "";
    
    if (Array.isArray(data.options)) {
        correctKey = (data.answer === data.options[0]) ? "a" : (data.answer === data.options[1] ? "b" : "c"); 
        // Logic tìm key cho mảng
    } else {
        const entry = Object.entries(data.options).find(([k, v]) => v === data.answer);
        correctKey = entry ? entry[0] : String(data.answer).toLowerCase();
    }

    if (selectedKey === correctKey) {
        element.classList.add('correct');
        block.classList.add('completed'); 
        score++;
        correctCount++;
    } else {
        element.classList.add('wrong');
        // Hiện đáp án đúng sau khi chọn sai
        const allOpts = block.querySelectorAll('.option-item');
        allOpts.forEach((opt, idx) => {
             // Tạm thời chỉ đánh dấu completed để khóa câu hỏi
        });
        block.classList.add('completed');
        correctCount++; // Vẫn tăng count để tính tiến độ hoàn thành bài
    }

    updateProgress();
    checkEndGame();
}

// XỬ LÝ CHẾ ĐỘ ĐÚNG/SAI (Dạng mới)
function handleDSClick(qIndex, subIdx, userChoice) {
    const row = document.getElementById(`q-${qIndex}-sub-${subIdx}`);
    if (row.classList.contains('answered')) return;

    const data = userQuestions[qIndex].subQuestions[subIdx];
    const btns = row.querySelectorAll('.btn-ds');

    row.classList.add('answered');
    btns.forEach(btn => {
        if (btn.innerText === userChoice) {
            if (userChoice === data.answer) {
                btn.classList.add('ds-correct');
                score += 0.25; // Mỗi ý 0.25đ
            } else {
                btn.classList.add('ds-wrong');
            }
        }
        if (btn.innerText === data.answer) btn.classList.add('ds-correct');
    });

    // Kiểm tra hoàn thành 4 ý của 1 câu lớn
    const block = document.getElementById(`q-block-${qIndex}`);
    const answeredRows = block.querySelectorAll('.sub-q-row.answered').length;
    if (answeredRows === 4) {
        block.classList.add('completed');
        correctCount++;
        updateProgress();
    }
    checkEndGame();
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
