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
            contentHtml = data.subQuestions.map((sub, subIdx) => {
                const explainHtml = sub.explanation 
                    ? `<div id="explain-${index}-${subIdx}" 
                            style="display: none; margin-top: 12px; padding: 12px 16px; 
                            background-color: rgba(0,0,0,0.03); border-left: 4px solid var(--primary); 
                            border-radius: 8px; font-size: 0.9rem; line-height: 1.5; color: var(--text);">
                            <span style="font-weight: 700; color: var(--primary); display: block; margin-bottom: 4px;">Giải thích:</span>
                            ${escapeHtml(sub.explanation)}
                       </div>` 
                    : '';

                return `
                <div class="sub-question-container" id="sub-container-${index}-${subIdx}" style="margin-bottom: 24px;">
                    <div style="margin-bottom: 12px;"><strong>${subIdx + 1}.</strong> ${escapeHtml(sub.content)}</div>
                    <div class="option-list" style="display: flex; gap: 12px;">
                        <div class="option-item" 
                             style="flex: 1; justify-content: center; align-items: center; margin-bottom: 0; min-height: 48px; border-radius: 12px; font-weight: 600;" 
                             onclick="handleSubSelect(this, ${index}, ${subIdx}, 'Đúng')">
                            <span>Đúng</span>
                        </div>
                        <div class="option-item" 
                             style="flex: 1; justify-content: center; align-items: center; margin-bottom: 0; min-height: 48px; border-radius: 12px; font-weight: 600;" 
                             onclick="handleSubSelect(this, ${index}, ${subIdx}, 'Sai')">
                            <span>Sai</span>
                        </div>
                    </div>
                    ${explainHtml}
                </div>
                `;
            }).join('');
        } else {
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
    const targetBlock = document.getElementById(`q-block-${qIndex}`);
    if (targetBlock.classList.contains('completed')) return;

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
        
        const explainBox = document.getElementById(`explain-${qIndex}-${subIdx}`);
        if (explainBox) {
            explainBox.style.display = 'block';
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

// DARK MODE LOGIC
function toggleDarkMode() {
    const body = document.body;
    const iconPath = document.getElementById('icon-path');
    body.classList.toggle('dark-mode');
    if (body.classList.contains('dark-mode')) {
        iconPath.setAttribute('d', 'M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z');
        localStorage.setItem('theme', 'dark');
    } else {
        iconPath.setAttribute('d', 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z');
        localStorage.setItem('theme', 'light');
    }
}

window.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        const iconPath = document.getElementById('icon-path');
        if(iconPath) iconPath.setAttribute('d', 'M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z');
    }
});
