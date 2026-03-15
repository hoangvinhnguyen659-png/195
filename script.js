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
            
            const isShuffle = document.getElementById('shuffle-checkbox') ? document.getElementById('shuffle-checkbox').checked : false;
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
    
    const scrollArea = document.querySelector('.quiz-scroll-area');
    if(scrollArea) scrollArea.scrollTop = 0;
}

function restartQuiz() {
    resetAndRender();
}

// Gắn sự kiện cho các nút chọn bộ câu hỏi (kiểm tra xem nút có tồn tại không trước khi gắn)
const btnTracNghiem = document.getElementById('btn-tracnghiem');
if (btnTracNghiem) btnTracNghiem.onclick = () => startGame('questions.json');

const btnDungSai = document.getElementById('btn-dungsai');
if (btnDungSai) btnDungSai.onclick = () => startGame('dungsai.json');

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
            // ĐÚNG SAI: Có phần giải thích ẩn
            contentHtml = data.subQuestions.map((sub, subIdx) => {
                const explainHtml = sub.explanation 
                    ? `<div class="explanation hidden" style="margin-top: 12px; padding: 10px 15px; background-color: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 8px; font-size: 14px; color: #166534;">
                         <strong>Giải thích:</strong> ${escapeHtml(sub.explanation)}
                       </div>` 
                    : '';

                return `
                <div class="sub-question-container" id="sub-container-${index}-${subIdx}" style="margin-bottom: 20px;">
                    <div style="margin-bottom: 12px;"><strong>${subIdx + 1}.</strong> ${escapeHtml(sub.content)}</div>
                    <div class="option-list" style="display: flex; gap: 15px;">
                        <div class="option-item" 
                             style="flex: 1; justify-content: center; align-items: center; margin-bottom: 0; min-height: 48px; border-radius: 12px; cursor: pointer;" 
                             onclick="handleSubSelect(this, ${index}, ${subIdx}, 'Đúng')">
                            <span>Đúng</span>
                        </div>
                        <div class="option-item" 
                             style="flex: 1; justify-content: center; align-items: center; margin-bottom: 0; min-height: 48px; border-radius: 12px; cursor: pointer;" 
                             onclick="handleSubSelect(this, ${index}, ${subIdx}, 'Sai')">
                            <span>Sai</span>
                        </div>
                    </div>
                    ${explainHtml}
                </div>
                `;
            }).join('');
        } else {
            // TRẮC NGHIỆM: Có phần giải thích ẩn (nếu có trường explanation trong JSON)
            const opts = data.options;
            let optionsHtml = "";
            if (Array.isArray(opts)) {
                optionsHtml = `
                    <div class="option-item" style="cursor: pointer;" onclick="handleSelect(this, ${index}, 'a')">
                        <input type="radio" name="q${index}"><span>${escapeHtml(opts[0])}</span>
                    </div>
                    <div class="option-item" style="cursor: pointer;" onclick="handleSelect(this, ${index}, 'b')">
                        <input type="radio" name="q${index}"><span>${escapeHtml(opts[1])}</span>
                    </div>`;
            } else {
                optionsHtml = Object.entries(opts).map(([key, val]) => `
                    <div class="option-item" style="cursor: pointer;" onclick="handleSelect(this, ${index}, '${key}')">
                        <input type="radio" name="q${index}"><span>${escapeHtml(val)}</span>
                    </div>`).join('');
            }

            const explainHtml = data.explanation 
                ? `<div class="explanation hidden" style="margin-top: 15px; padding: 10px 15px; background-color: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 8px; font-size: 14px; color: #166534;">
                     <strong>Giải thích:</strong> ${escapeHtml(data.explanation)}
                   </div>` 
                : '';

            contentHtml = `<div class="option-list">${optionsHtml}</div>${explainHtml}`;
        }

        qBlock.innerHTML = `
            <div class="question-text" style="font-weight: bold; margin-bottom: 15px;">Câu ${index + 1}: ${questionTitle}</div>
            <div class="content-area">${contentHtml}</div>`;
        feed.appendChild(qBlock);
    });

    const totalCountEl = document.getElementById('total-count');
    if (totalCountEl) totalCountEl.innerText = userQuestions.length;
    
    updateProgress();
}

function handleSelect(element, qIndex, selectedKey) {
    const targetBlock = document.getElementById(`q-block-${qIndex}`);
    if (targetBlock.classList.contains('completed')) return;

    // Xóa màu đỏ (class 'wrong') cũ để chọn lại
    const allOptions = targetBlock.querySelectorAll('.option-item');
    allOptions.forEach(opt => opt.classList.remove('wrong'));

    const radio = element.querySelector('input');
    if(radio) radio.checked = true;

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
        targetBlock.classList.add('completed'); 
        score++;
        correctCount++;
        
        // Hiện giải thích cho câu trắc nghiệm
        const explanationBox = targetBlock.querySelector('.explanation');
        if (explanationBox) {
            explanationBox.classList.remove('hidden');
        }

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
        
        // Hiện giải thích cho câu Đúng/Sai
        const explanationBox = subContainer.querySelector('.explanation');
        if (explanationBox) {
            explanationBox.classList.remove('hidden');
        }
        
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
    
    if(progressBar) progressBar.style.width = percent + "%";
    
    const currentCountEl = document.getElementById('current-count');
    if(currentCountEl) currentCountEl.innerText = correctCount;
    
    const liveScoreEl = document.getElementById('live-score');
    if(liveScoreEl) liveScoreEl.innerText = score;
    
    if (correctCount === userQuestions.length && userQuestions.length > 0) {
        setTimeout(showFinalResults, 600);
    }
}

function showFinalResults() {
    if(quizScreen) quizScreen.classList.add('hidden');
    if(resultScreen) resultScreen.classList.remove('hidden');
    
    const finalScoreEl = document.getElementById('final-score');
    if(finalScoreEl) finalScoreEl.innerText = score + "/" + userQuestions.length;
}
