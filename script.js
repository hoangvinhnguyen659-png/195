// --- CÁC BIẾN TOÀN CỤC ---
let quizData = [];
let userQuestions = [];
let score = 0;
let correctCount = 0;

// Icons cho Dark Mode
const sunIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`;
const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

const themeToggle = document.getElementById('theme-toggle');
const body = document.body;

// ==========================================
// 1. KHỞI TẠO GIAO DIỆN (DARK/LIGHT)
// ==========================================
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        if(themeToggle) themeToggle.innerHTML = sunIcon;
    } else {
        if(themeToggle) themeToggle.innerHTML = moonIcon;
    }
}

if(themeToggle) {
    themeToggle.onclick = () => {
        body.classList.toggle('dark-mode');
        const isDark = body.classList.contains('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        themeToggle.innerHTML = isDark ? sunIcon : moonIcon;
    };
}

// ==========================================
// 2. LOGIC THÔNG BÁO CẬP NHẬT
// ==========================================
function showUpdateNotification() {
    const toast = document.getElementById('update-toast');
    const isClosedThisSession = sessionStorage.getItem('closedUpdateToast');

    if (toast && !isClosedThisSession) { 
        toast.classList.remove('toast-hidden'); 
        setTimeout(() => {
            toast.classList.add('show');
        }, 800); 
    }
}

function hideToastTemporarily() {
    const toast = document.getElementById('update-toast');
    if(toast && toast.classList.contains('show')) {
        toast.classList.remove('show');
        setTimeout(() => {
            toast.classList.add('toast-hidden');
        }, 300);
    }
}

function closeToast() {
    const toast = document.getElementById('update-toast');
    if(toast) {
        toast.classList.remove('show');
        sessionStorage.setItem('closedUpdateToast', 'true');
        setTimeout(() => {
            toast.classList.add('toast-hidden');
        }, 300);
    }
}

// ==========================================
// 3. KHỞI TẠO DỮ LIỆU & GIAO DIỆN CHÍNH
// ==========================================
const statusText = document.getElementById('status-text');
const setupOptions = document.getElementById('setup-options');
const loadingScreen = document.getElementById('loading-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const progressBar = document.getElementById('progress-bar');

function escapeHtml(text) {
    if (!text) return "";
    return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

async function init() {
    initTheme();
    showUpdateNotification();
    initQRModal(); // Khởi tạo tính năng phóng to QR

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

// ==========================================
// 4. LOGIC MODAL QR MOMO
// ==========================================
function initQRModal() {
    const qrTrigger = document.getElementById('qr-trigger');
    const qrModal = document.getElementById('qr-modal');
    const qrClose = document.getElementById('qr-close');

    if (qrTrigger && qrModal && qrClose) {
        qrTrigger.onclick = () => qrModal.classList.remove('hidden');
        qrClose.onclick = () => qrModal.classList.add('hidden');
        
        // Đóng khi click ra ngoài vùng trắng
        qrModal.onclick = (e) => {
            if (e.target === qrModal) qrModal.classList.add('hidden');
        };
    }
}

// ==========================================
// 5. LOGIC TRÒ CHƠI
// ==========================================
async function startGame(fileName) {
    hideToastTemporarily(); 

    statusText.innerText = "Đang tải dữ liệu...";
    setupOptions.classList.add('hidden');
    setTimeout(async () => {
        try {
            const res = await fetch(fileName);
            if (!res.ok) throw new Error();
            quizData = await res.json();
            const isShuffle = document.getElementById('shuffle-checkbox')?.checked || false;
            userQuestions = isShuffle ? [...quizData].sort(() => Math.random() - 0.5) : [...quizData];
            resetAndRender();
        } catch (err) {
            alert("Không tìm thấy file câu hỏi: " + fileName);
            location.reload();
        }
    }, 200);
}

function resetAndRender() {
    score = 0; correctCount = 0;
    loadingScreen.classList.add('hidden');
    resultScreen.classList.add('hidden');
    quizScreen.classList.remove('hidden');
    renderAllQuestions();
    const scrollArea = document.querySelector('.quiz-scroll-area');
    if(scrollArea) scrollArea.scrollTop = 0;
}

document.getElementById('btn-tracnghiem')?.addEventListener('click', () => startGame('questions.json'));
document.getElementById('btn-dungsai')?.addEventListener('click', () => startGame('dungsai.json'));

function renderAllQuestions() {
    const feed = document.getElementById('quiz-feed');
    feed.innerHTML = "";
    userQuestions.forEach((data, index) => {
        const qBlock = document.createElement('div');
        qBlock.className = 'question-block';
        qBlock.id = `q-block-${index}`;
        qBlock.dataset.subFinished = 0; 
        
        let questionTitle = "";
        if(data.topic) {
            questionTitle = `<span style="color: #666; font-size: 0.85em; display: block; margin-bottom: 4px;">[${escapeHtml(data.topic)}]</span>`;
        }
        questionTitle += escapeHtml(data.question);

        let contentHtml = "";
        
        // Chế độ Đúng/Sai (subQuestions)
        if (data.subQuestions && Array.isArray(data.subQuestions)) {
            contentHtml = data.subQuestions.map((sub, subIdx) => {
                const explainHtml = sub.explanation ? `<div class="explanation explanation-box hidden"><strong>Giải thích:</strong> ${escapeHtml(sub.explanation)}</div>` : '';
                return `<div class="sub-question-container" id="sub-container-${index}-${subIdx}" style="margin-bottom: 20px;">
                    <div style="margin-bottom: 12px; font-weight: 500; color: var(--text);"><strong>${subIdx + 1}.</strong> ${escapeHtml(sub.content)}</div>
                    <div class="sub-options-row">
                        <div class="option-item" onclick="handleSubSelect(this, ${index}, ${subIdx}, 'Đúng')"><span>Đúng</span></div>
                        <div class="option-item" onclick="handleSubSelect(this, ${index}, ${subIdx}, 'Sai')"><span>Sai</span></div>
                    </div>
                    ${explainHtml}
                </div>`;
            }).join('');
        } 
        // Chế độ Trắc nghiệm (options)
        else {
            const opts = data.options;
            let optionsHtml = "";
            
            if (opts && typeof opts === 'object' && !Array.isArray(opts)) {
                optionsHtml = Object.entries(opts).map(([key, val]) => {
                    return `<div class="option-item" onclick="handleSelect(this, ${index}, '${key}')">
                                <input type="radio" name="q${index}">
                                <span><strong>${key.toUpperCase()}.</strong> ${escapeHtml(val)}</span>
                            </div>`;
                }).join('');
            } else if (Array.isArray(opts)) {
                const keys = ['a', 'b', 'c', 'd', 'e', 'f'];
                optionsHtml = opts.map((opt, i) => {
                    const key = keys[i] || 'z';
                    return `<div class="option-item" onclick="handleSelect(this, ${index}, '${key}')">
                                <input type="radio" name="q${index}">
                                <span>${escapeHtml(opt)}</span>
                            </div>`;
                }).join('');
            }
            
            const explainHtml = data.explanation ? `<div class="explanation explanation-box hidden"><strong>Giải thích:</strong> ${escapeHtml(data.explanation)}</div>` : '';
            contentHtml = `<div class="option-list">${optionsHtml}</div>${explainHtml}`;
        }
        
        qBlock.innerHTML = `<div class="question-text">Câu ${index + 1}: <br>${questionTitle}</div><div class="content-area">${contentHtml}</div>`;
        feed.appendChild(qBlock);
    });
    
    if(document.getElementById('total-count')) document.getElementById('total-count').innerText = userQuestions.length;
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
    const correctKey = String(data.answer).toLowerCase();
    
    if (selectedKey === correctKey) {
        element.classList.add('correct'); 
        targetBlock.classList.add('completed'); 
        score++; correctCount++;
        const explanationBox = targetBlock.querySelector('.explanation');
        if (explanationBox) explanationBox.classList.remove('hidden');
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
        const explanationBox = subContainer.querySelector('.explanation');
        if (explanationBox) explanationBox.classList.remove('hidden');
        
        const block = document.getElementById(`q-block-${qIndex}`);
        let finished = parseInt(block.dataset.subFinished) + 1;
        block.dataset.subFinished = finished;
        
        if (finished === data.subQuestions.length) {
            block.classList.add('completed'); 
            score++; correctCount++; 
            updateProgress();
        }
    } else { 
        element.classList.add('wrong'); 
    }
}

function updateProgress() {
    const percent = userQuestions.length > 0 ? (correctCount / userQuestions.length) * 100 : 0;
    if(progressBar) progressBar.style.width = percent + "%";
    
    if(document.getElementById('current-count')) document.getElementById('current-count').innerText = correctCount;
    if(document.getElementById('live-score')) document.getElementById('live-score').innerText = score;
    
    if (correctCount === userQuestions.length && userQuestions.length > 0) {
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
