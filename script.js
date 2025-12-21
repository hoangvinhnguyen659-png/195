let quizData = [];
let userQuestions = [];
let score = 0;
let completedQuestionsCount = 0; 

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

// Gán sự kiện cho các nút chọn chế độ
document.getElementById('btn-tracnghiem').onclick = () => startGame('questions.json');
document.getElementById('btn-dungsai').onclick = () => startGame('dungsai.json');

async function startGame(fileName) {
    statusText.innerText = "Đang tải dữ liệu...";
    setupOptions.classList.add('hidden');

    try {
        const res = await fetch(fileName);
        if (!res.ok) throw new Error("Fetch failed");
        quizData = await res.json();
        
        const isShuffle = document.getElementById('shuffle-checkbox').checked;
        userQuestions = isShuffle ? [...quizData].sort(() => Math.random() - 0.5) : [...quizData];
        
        resetAndRender();
    } catch (err) {
        console.error(err);
        alert("Lỗi: Không tìm thấy hoặc file JSON sai định dạng!");
        location.reload();
    }
}

function resetAndRender() {
    score = 0;
    completedQuestionsCount = 0;
    
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
        qBlock.dataset.subCorrect = 0; 

        const questionTitle = escapeHtml(data.question);
        let contentHtml = "";

        // TRƯỜNG HỢP 1: CÂU HỎI ĐÚNG SAI (Có subQuestions)
        if (data.subQuestions && Array.isArray(data.subQuestions)) {
            contentHtml = data.subQuestions.map((sub, subIdx) => `
                <div class="sub-question-item" style="margin-bottom: 25px; padding-left: 10px; border-left: 3px solid #eee;" id="q-${index}-sub-${subIdx}">
                    <div style="margin-bottom: 10px;"><strong>${subIdx + 1}.</strong> ${escapeHtml(sub.content)}</div>
                    <div class="option-list" style="display: flex; gap: 15px;">
                        <div class="option-item" onclick="handleSubSelect(this, ${index}, ${subIdx}, 'Đúng')">
                            <span>Đúng</span>
                        </div>
                        <div class="option-item" onclick="handleSubSelect(this, ${index}, ${subIdx}, 'Sai')">
                            <span>Sai</span>
                        </div>
                    </div>
                </div>
            `).join('');
        } 
        // TRƯỜNG HỢP 2: TRẮC NGHIỆM THƯỜNG
        else {
            const opts = data.options;
            let optionsHtml = "";
            if (Array.isArray(opts)) {
                optionsHtml = opts.map((opt, i) => `
                    <div class="option-item" onclick="handleNormalSelect(this, ${index}, '${i === 0 ? 'a' : 'b'}')">
                        <span>${escapeHtml(opt)}</span>
                    </div>`).join('');
            } else {
                optionsHtml = Object.entries(opts).map(([key, val]) => `
                    <div class="option-item" onclick="handleNormalSelect(this, ${index}, '${key}')">
                        <span>${escapeHtml(val)}</span>
                    </div>`).join('');
            }
            contentHtml = `<div class="option-list">${optionsHtml}</div>`;
        }

        qBlock.innerHTML = `
            <div class="question-text" style="font-weight: bold; font-size: 1.1em; color: #2c3e50; margin-bottom: 20px;">
                Câu ${index + 1}: ${questionTitle}
            </div>
            ${contentHtml}`;
        feed.appendChild(qBlock);
    });

    document.getElementById('total-count').innerText = userQuestions.length;
    updateProgress();
}

// Hàm xử lý cho Đúng/Sai
function handleSubSelect(element, qIndex, subIdx, selectedValue) {
    const currentSubContainer = document.getElementById(`q-${qIndex}-sub-${subIdx}`);
    
    // Nếu ý này đã trả lời đúng rồi thì không cho bấm lại
    if (currentSubContainer.classList.contains('sub-completed')) return;

    // Reset màu 'wrong' khi chọn lại
    const siblingOptions = currentSubContainer.querySelectorAll('.option-item');
    siblingOptions.forEach(opt => opt.classList.remove('wrong'));

    const correctValue = userQuestions[qIndex].subQuestions[subIdx].answer;

    if (selectedValue === correctValue) {
        element.classList.add('correct');
        currentSubContainer.classList.add('sub-completed');
        
        const mainBlock = document.getElementById(`q-block-${qIndex}`);
        let currentSubCorrect = parseInt(mainBlock.dataset.subCorrect) + 1;
        mainBlock.dataset.subCorrect = currentSubCorrect;

        // Nếu đúng đủ cả 4 ý phụ của câu hỏi lớn
        if (currentSubCorrect === userQuestions[qIndex].subQuestions.length) {
            mainBlock.classList.add('completed');
            score++;
            completedQuestionsCount++;
            updateProgress();
        }
    } else {
        element.classList.add('wrong');
    }
}

// Hàm xử lý cho Trắc nghiệm thường
function handleNormalSelect(element, qIndex, selectedKey) {
    const block = document.getElementById(`q-block-${qIndex}`);
    if (block.classList.contains('completed')) return;

    const allOptions = block.querySelectorAll('.option-item');
    allOptions.forEach(opt => opt.classList.remove('wrong'));

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
        completedQuestionsCount++;
        updateProgress();
    } else {
        element.classList.add('wrong');
    }
}

function updateProgress() {
    const total = userQuestions.length;
    const percent = total > 0 ? (completedQuestionsCount / total) * 100 : 0;
    
    progressBar.style.width = percent + "%";
    document.getElementById('current-count').innerText = completedQuestionsCount;
    document.getElementById('live-score').innerText = score;

    if (completedQuestionsCount === total && total > 0) {
        setTimeout(showFinalResults, 800);
    }
}

function showFinalResults() {
    quizScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');
    document.getElementById('final-score').innerText = score + "/" + userQuestions.length;
}

function restartQuiz() {
    resetAndRender();
}
