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
        qBlock.dataset.subFinished = 0; 

        const questionTitle = escapeHtml(data.question);
        let contentHtml = "";

        if (data.subQuestions && Array.isArray(data.subQuestions)) {
            // PHẦN ĐÚNG SAI: KHÔNG CÓ NÚT TRÒN, Nút bo tròn trải đều
            contentHtml = data.subQuestions.map((sub, subIdx) => `
                <div class="sub-question-container" id="sub-container-${index}-${subIdx}" style="margin-bottom: 20px;">
                    <div style="margin-bottom: 10px;"><strong>${subIdx + 1}.</strong> ${escapeHtml(sub.content)}</div>
                    <div class="option-list" style="display: flex; gap: 15px;">
                        <div class="option-item" 
                             style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 12px; border: 1px solid #e0e0e0; border-radius: 12px; cursor: pointer; min-height: 45px;" 
                             onclick="handleSubSelect(this, ${index}, ${subIdx}, 'Đúng')">
                            <span>Đúng</span>
                        </div>
                        <div class="option-item" 
                             style="flex: 1; display: flex; align-items: center; justify-content: center; padding: 12px; border: 1px solid #e0e0e0; border-radius: 12px; cursor: pointer; min-height: 45px;" 
                             onclick="handleSubSelect(this, ${index}, ${subIdx}, 'Sai')">
                            <span>Sai</span>
                        </div>
                    </div>
                </div>
            `).join('');
        } else {
            // PHẦN TRẮC NGHIỆM: CÓ NÚT TRÒN (Giữ nguyên cấu trúc của bạn)
            const opts = data.options;
            let optionsHtml = "";
            if (Array.isArray(opts)) {
                optionsHtml = `
                    <div class="option-item" onclick="handleSelect(this, ${index}, 'a')">
                        <input type="radio" name="q${index}"><span>${escapeHtml(opts[0])}</span>
                    </div>
                    <div class="option-item" onclick="handleSelect(this, ${index}, 'b')">
                        <input type="radio" name="q${index}"><span>${escapeHtml(opts[1])}</span>
                    </div>`;
            } else {
                optionsHtml = Object.entries(opts).map(([key, val]) => `
                    <div class="option-item" onclick="handleSelect(this, ${index}, '${key}')">
                        <input type="radio" name="q${index}"><span>${escapeHtml(val)}</span>
                    </div>`).join('');
            }
            contentHtml = `<div class="option-list">${optionsHtml}</div>`;
        }

        qBlock.innerHTML = `
            <div class="question-text">Câu ${index + 1}: ${questionTitle}</div>
            <div class="content-area">${contentHtml}</div>`;
        feed.appendChild(qBlock);
    });

    document.getElementById('total-count').innerText = userQuestions.length;
    updateProgress();
}

function handleSelect(element, qIndex, selectedKey) {
    const block = document.getElementById(`q-block-${qIndex}`);
    if (block.classList.contains('completed')) return;

    const allOptions = block.querySelectorAll('.option-item');
    allOptions.forEach(opt => opt.classList.remove('wrong'));

    element.querySelector('input').checked = true;
    const data = userQuestions[qIndex];
    let correctKey = "";
    if (Array.isArray(data.options)) {
        correctKey = (data.answer === data.options[0]) ? "a" : "b";
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
    } else {
        element.classList.add('wrong');
    }
}

function handleSubSelect(element, qIndex, subIdx, selectedValue) {
    const subContainer = document.getElementById(`sub-container-${qIndex}-${subIdx}`);
    if (subContainer.classList.contains('sub-completed')) return;

    const options = subContainer.querySelectorAll('.option-item');
    options.forEach(opt => opt.classList.remove('wrong'));

    const data = userQuestions[qIndex];
    const correctAnswer = data.subQuestions[subIdx].answer;

    if (selectedValue === correctAnswer) {
        element.classList.add('correct');
        subContainer.classList.add('sub-completed');
        
        const block = document.getElementById(`q-block-${qIndex}`);
        let finished = parseInt(block.dataset.subFinished) + 1;
        block.dataset.subFinished = finished;

        if (finished === data.subQuestions.length) {
            block.classList.add('completed');
            score++;
            correctCount++;
            updateProgress();
        }
    } else {
        element.classList.add('wrong');
    }
}

function updateProgress() {
    const percent = userQuestions.length > 0 ? (correctCount / userQuestions.length) * 100 : 0;
    progressBar.style.width = percent + "%";
    document.getElementById('current-count').innerText = correctCount;
    document.getElementById('live-score').innerText = score;
    if (correctCount === userQuestions.length && userQuestions.length > 0) {
        setTimeout(showFinalResults, 500);
    }
}

function showFinalResults() {
    quizScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');
    document.getElementById('final-score').innerText = score + "/" + userQuestions.length;
}
