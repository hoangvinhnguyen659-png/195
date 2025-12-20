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
        
        // KIỂM TRA NẾU LÀ CÂU HỎI ĐÚNG SAI (Có subQuestions)
        if (data.subQuestions && Array.isArray(data.subQuestions)) {
            let subHtml = data.subQuestions.map((sub, sIdx) => `
                <div class="sub-item" id="sub-${index}-${sIdx}">
                    <p><strong>${sub.label}.</strong> ${escapeHtml(sub.content)}</p>
                    <div class="sub-buttons">
                        <button class="btn-ds" onclick="handleDungSaiSelect(this, ${index}, ${sIdx}, 'Đúng')">Đúng</button>
                        <button class="btn-ds" onclick="handleDungSaiSelect(this, ${index}, ${sIdx}, 'Sai')">Sai</button>
                    </div>
                </div>
            `).join('');

            qBlock.innerHTML = `
                <div class="question-text">Câu ${index + 1}: ${questionTitle}</div>
                <div class="sub-list">${subHtml}</div>`;
        } 
        // NGƯỢC LẠI LÀ TRẮC NGHIỆM THƯỜNG
        else {
            let optionsHtml = "";
            if (Array.isArray(data.options)) {
                optionsHtml = data.options.map((opt, i) => `
                    <div class="option-item" onclick="handleSelect(this, ${index}, '${String.fromCharCode(97 + i)}')">
                        <input type="radio" name="q${index}"><span>${escapeHtml(opt)}</span>
                    </div>`).join('');
            } else {
                optionsHtml = Object.entries(data.options).map(([key, val]) => `
                    <div class="option-item" onclick="handleSelect(this, ${index}, '${key}')">
                        <input type="radio" name="q${index}"><span>${escapeHtml(val)}</span>
                    </div>`).join('');
            }
            qBlock.innerHTML = `
                <div class="question-text">Câu ${index + 1}: ${questionTitle}</div>
                <div class="option-list">${optionsHtml}</div>`;
        }
        feed.appendChild(qBlock);
    });

    document.getElementById('total-count').innerText = userQuestions.length;
    updateProgress();
}

// Xử lý chọn cho câu hỏi Đúng/Sai (Ý nhỏ)
function handleDungSaiSelect(button, qIndex, subIndex, selectedVal) {
    const subItem = document.getElementById(`sub-${qIndex}-${subIndex}`);
    if (subItem.classList.contains('answered')) return;

    const data = userQuestions[qIndex].subQuestions[subIndex];
    const correctVal = data.answer;

    if (selectedVal === correctVal) {
        button.classList.add('ds-correct');
    } else {
        button.classList.add('ds-wrong');
    }

    subItem.classList.add('answered');
    
    // Kiểm tra nếu cả 4 ý của câu này đã xong thì đánh dấu câu đó hoàn thành
    const block = document.getElementById(`q-block-${qIndex}`);
    const totalSubs = userQuestions[qIndex].subQuestions.length;
    const answeredSubs = block.querySelectorAll('.sub-item.answered').length;

    if (answeredSubs === totalSubs) {
        block.classList.add('completed');
        correctCount++; // Chỉ tăng tiến độ khi xong cả 1 câu lớn
        updateProgress();
    }
}

// Giữ nguyên handleSelect cho trắc nghiệm
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

    if (selectedKey === correctKey) {
        element.classList.add('correct');
        block.classList.add('completed'); 
        score++;
        correctCount++;
    } else {
        element.classList.add('wrong');
    }
    updateProgress();
}

function updateProgress() {
    const percent = userQuestions.length > 0 ? (correctCount / userQuestions.length) * 100 : 0;
    progressBar.style.width = percent + "%";
    document.getElementById('current-count').innerText = correctCount;
    if (correctCount === userQuestions.length && userQuestions.length > 0) {
        setTimeout(showFinalResults, 800);
    }
}

function showFinalResults() {
    quizScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');
    document.getElementById('final-score').innerText = correctCount + "/" + userQuestions.length;
}
