/**
 * BIẾN TOÀN CỤC
 */
let quizData = [], userQuestions = [], score = 0, correctCount = 0;

const statusText = document.getElementById('status-text');
const setupOptions = document.getElementById('setup-options');
const loadingScreen = document.getElementById('loading-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const progressBar = document.getElementById('progress-bar');

/**
 * HÀM TIỆN ÍCH: Chống lỗi hiển thị ký tự đặc biệt
 */
function escapeHtml(text) {
    if (!text) return "";
    return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

/**
 * KHỞI TẠO: Kiểm tra file trước khi bắt đầu
 */
async function init() {
    try {
        const res = await fetch('questions.json');
        if (res.ok) { 
            statusText.innerText = "Sẵn sàng!"; 
            setupOptions.classList.remove('hidden'); 
        }
    } catch (e) { 
        statusText.innerText = "Lỗi kết nối dữ liệu!"; 
        setupOptions.classList.remove('hidden'); 
    }
}
init();

/**
 * BẮT ĐẦU: Tải dữ liệu và trộn câu hỏi
 */
async function startGame(fileName) {
    statusText.innerText = "Đang tải...";
    setupOptions.classList.add('hidden');
    try {
        const res = await fetch(fileName);
        quizData = await res.json();
        const isShuffle = document.getElementById('shuffle-checkbox').checked;
        userQuestions = isShuffle ? [...quizData].sort(() => Math.random() - 0.5) : [...quizData];
        resetAndRender();
    } catch (err) { alert("Lỗi tải file!"); location.reload(); }
}

function resetAndRender() {
    score = 0; correctCount = 0;
    loadingScreen.classList.add('hidden'); resultScreen.classList.add('hidden'); quizScreen.classList.remove('hidden');
    renderAllQuestions();
    document.querySelector('.quiz-scroll-area').scrollTop = 0;
}

document.getElementById('btn-tracnghiem').onclick = () => startGame('questions.json');
document.getElementById('btn-dungsai').onclick = () => startGame('dungsai.json');

/**
 * VẼ GIAO DIỆN CÂU HỎI
 */
function renderAllQuestions() {
    const feed = document.getElementById('quiz-feed');
    feed.innerHTML = "";

    userQuestions.forEach((data, index) => {
        const qBlock = document.createElement('div');
        qBlock.className = 'question-block';
        qBlock.id = `q-block-${index}`;
        
        let contentHtml = "";

        // CHẾ ĐỘ ĐÚNG/SAI: Nút ngang trơn tru
        if (data.subQuestions) {
            contentHtml = data.subQuestions.map((sub, subIdx) => `
                <div class="sub-q-group" id="q-${index}-sub-${subIdx}">
                    <div class="sub-q-text">${sub.label}. ${escapeHtml(sub.content)}</div>
                    <div class="ds-row">
                        <div class="option-item" onclick="handleDSSelect(this, ${index}, ${subIdx}, 'Đúng')">Đúng</div>
                        <div class="option-item" onclick="handleDSSelect(this, ${index}, ${subIdx}, 'Sai')">Sai</div>
                    </div>
                </div>`).join('');
        } 
        // CHẾ ĐỘ TRẮC NGHIỆM: Có nhãn A, B, C, D
        else {
            const opts = data.options;
            const entries = Array.isArray(opts) ? opts.map((v, i) => [String.fromCharCode(97 + i), v]) : Object.entries(opts);
            
            contentHtml = `<div class="option-list">` + entries.map(([key, val]) => {
                const label = key.toUpperCase() + ". ";
                return `<div class="option-item" onclick="handleSelect(this, ${index}, '${key}')">
                            <span class="opt-label">${label}</span> ${escapeHtml(val)}
                        </div>`;
            }).join('') + `</div>`;
        }

        qBlock.innerHTML = `<div class="question-text">Câu ${index + 1}: ${escapeHtml(data.question)}</div>${contentHtml}`;
        feed.appendChild(qBlock);
    });
    document.getElementById('total-count').innerText = userQuestions.length;
    updateProgress();
}

/**
 * LOGIC TRẮC NGHIỆM
 */
function handleSelect(el, qIdx, key) {
    const block = document.getElementById(`q-block-${qIdx}`);
    if (block.classList.contains('completed')) return;
    
    const data = userQuestions[qIdx];
    const correctKey = Array.isArray(data.options) 
        ? String.fromCharCode(97 + data.options.indexOf(data.answer)) 
        : Object.keys(data.options).find(k => data.options[k] === data.answer);

    block.querySelectorAll('.option-item').forEach(i => i.classList.remove('wrong', 'correct'));
    
    if (key === correctKey) {
        el.classList.add('correct'); 
        block.classList.add('completed'); // Kích hoạt mờ nhẹ CSS
        score++; correctCount++; updateProgress(); checkEnd();
    } else {
        el.classList.add('wrong'); // Sai cho chọn lại
    }
}

/**
 * LOGIC ĐÚNG/SAI
 */
function handleDSSelect(el, qIdx, subIdx, choice) {
    const group = document.getElementById(`q-${qIdx}-sub-${subIdx}`);
    if (group.classList.contains('sub-completed')) return;

    group.querySelectorAll('.option-item').forEach(i => i.classList.remove('wrong', 'correct'));
    
    if (choice === userQuestions[qIdx].subQuestions[subIdx].answer) {
        el.classList.add('correct'); 
        group.classList.add('sub-completed'); // Mờ nhẹ hàng này
        score += 0.25;
        const parent = document.getElementById(`q-block-${qIdx}`);
        if (parent.querySelectorAll('.sub-completed').length === 4) {
            parent.classList.add('completed');
            correctCount++; updateProgress(); checkEnd();
        }
    } else {
        el.classList.add('wrong'); // Sai cho chọn lại
    }
}

function updateProgress() {
    const percent = (correctCount / userQuestions.length) * 100 || 0;
    progressBar.style.width = percent + "%";
    document.getElementById('current-count').innerText = correctCount;
    document.getElementById('live-score').innerText = Math.round(score * 100) / 100;
}

function checkEnd() { if (correctCount === userQuestions.length) setTimeout(showResults, 800); }

function showResults() {
    quizScreen.classList.add('hidden'); resultScreen.classList.remove('hidden');
    document.getElementById('final-score').innerText = Math.round(score * 100) / 100 + "/" + userQuestions.length;
}

function restartQuiz() { location.reload(); }
