let quizData = [];
let userQuestions = [];
let score = 0;
let correctCount = 0;
let totalSubQuestions = 0; // Biến đếm tổng số ý nhỏ để tính điểm

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
            statusText.innerText = "Sẵn sàng (Chưa tìm thấy questions.json mặc định)";
            setupOptions.classList.remove('hidden');
        }
    } catch (e) {
        statusText.innerText = "Lỗi kết nối!";
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
    totalSubQuestions = 0;

    // Tính tổng số câu hỏi
    userQuestions.forEach(q => {
        // Nếu có subQuestions => Đây là dạng bài chùm Đúng/Sai
        if (q.subQuestions && Array.isArray(q.subQuestions)) {
            totalSubQuestions += q.subQuestions.length;
        } else {
            // Ngược lại là trắc nghiệm thường (ABCD)
            totalSubQuestions += 1;
        }
    });
    
    loadingScreen.classList.add('hidden');
    resultScreen.classList.add('hidden');
    quizScreen.classList.remove('hidden');
    
    renderAllQuestions();
    
    const scrollArea = document.querySelector('.quiz-scroll-area');
    if (scrollArea) scrollArea.scrollTop = 0;
}

function restartQuiz() {
    resetAndRender();
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

        // === TRƯỜNG HỢP 1: Dạng Đúng/Sai (Nhận diện qua biến subQuestions) ===
        if (data.subQuestions && Array.isArray(data.subQuestions)) {
            // Render các ý nhỏ 1, 2, 3, 4
            let itemsHtml = data.subQuestions.map((item, subIndex) => `
                <div class="sub-question-item" id="sub-q-${index}-${subIndex}">
                    <div class="sub-q-text">
                        <strong>${subIndex + 1})</strong> ${escapeHtml(item.content)}
                    </div>
                    <div class="ds-buttons">
                        <button class="btn-ds" onclick="handleTrueFalse(this, ${index}, ${subIndex}, 'Đúng')">Đúng</button>
                        <button class="btn-ds" onclick="handleTrueFalse(this, ${index}, ${subIndex}, 'Sai')">Sai</button>
                    </div>
                </div>
            `).join('');

            qBlock.innerHTML = `
                <div class="context-box">
                    ${escapeHtml(data.question)}
                </div>
                <div class="sub-list">${itemsHtml}</div>
            `;
        } 
        // === TRƯỜNG HỢP 2: Trắc nghiệm ABCD thường ===
        else {
            const questionTitle = escapeHtml(data.question);
            let optionsHtml = "";
            const opts = data.options;
            const labels = ['A', 'B', 'C', 'D', 'E', 'F']; 

            if (Array.isArray(opts)) {
                optionsHtml = opts.map((opt, i) => `
                    <div class="option-item" onclick="handleSelect(this, ${index}, '${i}')">
                        <input type="radio" name="q${index}">
                        <span><b>${labels[i]}.</b> ${escapeHtml(opt)}</span>
                    </div>
                `).join('');
            } else if (opts) {
                let i = 0;
                optionsHtml = Object.entries(opts).map(([key, val]) => {
                    const labelChar = labels[i] || key.toUpperCase();
                    i++;
                    return `
                    <div class="option-item" onclick="handleSelect(this, ${index}, '${key}')">
                        <input type="radio" name="q${index}">
                        <span><b>${labelChar}.</b> ${escapeHtml(val)}</span>
                    </div>`;
                }).join('');
            }

            qBlock.innerHTML = `
                <div class="question-text">Câu ${index + 1}: ${questionTitle}</div>
                <div class="option-list">${optionsHtml}</div>`;
        }

        feed.appendChild(qBlock);
    });

    document.getElementById('total-count').innerText = totalSubQuestions;
    updateProgress();
}

// --- XỬ LÝ TRẮC NGHIỆM ABCD ---
function handleSelect(element, qIndex, selectedKey) {
    const block = document.getElementById(`q-block-${qIndex}`);
    if (block.classList.contains('completed')) return;

    const allOptions = block.querySelectorAll('.option-item');
    allOptions.forEach(opt => opt.classList.remove('wrong'));

    element.querySelector('input').checked = true;
    const data = userQuestions[qIndex];

    let correctKey = "";
    if (Array.isArray(data.options)) {
        const idx = data.options.indexOf(data.answer);
        correctKey = String(idx); 
    } else {
        const entry = Object.entries(data.options).find(([k, v]) => v === data.answer);
        correctKey = entry ? entry[0] : String(data.answer).toLowerCase();
    }
    
    if (String(selectedKey) === String(correctKey)) {
        element.classList.add('correct');
        block.classList.add('completed'); 
        score++;
        correctCount++;
    } else {
        element.classList.add('wrong');
    }

    updateProgress();
    checkFinish();
}

// --- XỬ LÝ ĐÚNG SAI (Cho cấu trúc JSON mới) ---
function handleTrueFalse(btn, qIndex, subIndex, userChoice) {
    const subRow = document.getElementById(`sub-q-${qIndex}-${subIndex}`);
    if (subRow.classList.contains('answered')) return;
    
    // Lấy đáp án từ mảng subQuestions
    const correctAns = userQuestions[qIndex].subQuestions[subIndex].answer;
    
    subRow.classList.add('answered');
    const allBtns = subRow.querySelectorAll('.btn-ds');
    allBtns.forEach(b => b.disabled = true);

    if (userChoice === correctAns) {
        btn.classList.add('btn-correct');
        score++;
        correctCount++;
    } else {
        btn.classList.add('btn-wrong');
        allBtns.forEach(b => {
             if(b.innerText === correctAns) b.classList.add('btn-correct-show');
        });
    }

    updateProgress();
    checkFinish();
}

function updateProgress() {
    const percent = totalSubQuestions > 0 ? (correctCount / totalSubQuestions) * 100 : 0;
    progressBar.style.width = percent + "%";
    document.getElementById('current-count').innerText = correctCount;
    document.getElementById('live-score').innerText = score;
}

function checkFinish() {
    const answeredBlocks = document.querySelectorAll('.question-block.completed').length;
    const answeredSubItems = document.querySelectorAll('.sub-question-item.answered').length;
    
    const totalAnswered = answeredBlocks + answeredSubItems;

    if (totalAnswered >= totalSubQuestions) {
        setTimeout(showFinalResults, 800);
    }
}

function showFinalResults() {
    quizScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');
    document.getElementById('final-score').innerText = score + "/" + totalSubQuestions;
}
