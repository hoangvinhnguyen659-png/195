let quizData = [];
let userQuestions = [];
let score = 0;
let correctCount = 0;
let totalSubQuestions = 0; // Biến mới để đếm tổng số ý cần trả lời

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
        // Kiểm tra file mặc định (nếu cần)
        const response = await fetch('questions.json');
        if (response.ok) {
            statusText.innerText = "Sẵn sàng!";
            setupOptions.classList.remove('hidden');
        } else {
            statusText.innerText = "Sẵn sàng (Chưa tìm thấy questions.json mặc định)";
            setupOptions.classList.remove('hidden');
        }
    } catch (e) {
        statusText.innerText = "Lỗi kết nối hoặc file!";
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

    // Tính tổng số câu hỏi (Câu trắc nghiệm = 1, Câu chùm 4 ý = 4)
    userQuestions.forEach(q => {
        if (q.type === 'group' && q.items) {
            totalSubQuestions += q.items.length;
        } else {
            totalSubQuestions += 1;
        }
    });
    
    loadingScreen.classList.add('hidden');
    resultScreen.classList.add('hidden');
    quizScreen.classList.remove('hidden');
    
    renderAllQuestions();
    
    // Reset thanh cuộn
    const scrollArea = document.querySelector('.quiz-scroll-area');
    if (scrollArea) scrollArea.scrollTop = 0;
}

function restartQuiz() {
    resetAndRender();
}

// Gán sự kiện cho nút bấm
document.getElementById('btn-tracnghiem').onclick = () => startGame('questions.json');
document.getElementById('btn-dungsai').onclick = () => startGame('dungsai.json');

function renderAllQuestions() {
    const feed = document.getElementById('quiz-feed');
    feed.innerHTML = "";
    
    userQuestions.forEach((data, index) => {
        const qBlock = document.createElement('div');
        qBlock.className = 'question-block';
        qBlock.id = `q-block-${index}`;

        // === TRƯỜNG HỢP 1: Dạng Đúng/Sai theo chùm ===
        if (data.type === 'group') {
            // Render các ý nhỏ 1, 2, 3, 4
            let itemsHtml = data.items.map((item, subIndex) => `
                <div class="sub-question-item" id="sub-q-${index}-${subIndex}">
                    <div class="sub-q-text">
                        <strong>${subIndex + 1})</strong> ${escapeHtml(item.text)}
                    </div>
                    <div class="ds-buttons">
                        <button class="btn-ds" onclick="handleTrueFalse(this, ${index}, ${subIndex}, 'Đúng')">Đúng</button>
                        <button class="btn-ds" onclick="handleTrueFalse(this, ${index}, ${subIndex}, 'Sai')">Sai</button>
                    </div>
                </div>
            `).join('');

            qBlock.innerHTML = `
                <div class="context-box">
                    ${escapeHtml(data.content)}
                </div>
                <div class="sub-list">${itemsHtml}</div>
            `;
        } 
        // === TRƯỜNG HỢP 2: Trắc nghiệm ABCD thường ===
        else {
            const questionTitle = escapeHtml(data.question);
            let optionsHtml = "";
            const opts = data.options;
            const labels = ['A', 'B', 'C', 'D', 'E', 'F']; // Nhãn cho đáp án

            // Xử lý nếu options là mảng (Array) hoặc Object
            if (Array.isArray(opts)) {
                optionsHtml = opts.map((opt, i) => `
                    <div class="option-item" onclick="handleSelect(this, ${index}, '${i}')">
                        <input type="radio" name="q${index}">
                        <span><b>${labels[i]}.</b> ${escapeHtml(opt)}</span>
                    </div>
                `).join('');
            } else {
                // Nếu là Object cũ (a: "...", b: "...")
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

    // Reset style cũ
    const allOptions = block.querySelectorAll('.option-item');
    allOptions.forEach(opt => opt.classList.remove('wrong'));

    // Đánh dấu nút radio
    element.querySelector('input').checked = true;
    const data = userQuestions[qIndex];

    // Tìm key đáp án đúng
    let correctKey = "";
    if (Array.isArray(data.options)) {
        // Nếu data.answer là text (VD: "Hà Nội"), tìm index của nó
        const idx = data.options.indexOf(data.answer);
        correctKey = String(idx); 
        // Lưu ý: Nếu data.answer trong JSON bạn lưu là '0' hoặc 'A' thì cần chỉnh lại logic này tùy file JSON
        // Giả sử JSON lưu text đáp án đầy đủ
    } else {
        const entry = Object.entries(data.options).find(([k, v]) => v === data.answer);
        correctKey = entry ? entry[0] : String(data.answer).toLowerCase();
    }
    
    // So sánh (chuyển về string để an toàn)
    if (String(selectedKey) === String(correctKey)) {
        element.classList.add('correct');
        block.classList.add('completed'); 
        score++;
        correctCount++;
    } else {
        element.classList.add('wrong');
        // Không khóa block ngay để cho chọn lại? 
        // Nếu muốn chọn sai là khóa luôn thì thêm: block.classList.add('completed');
    }

    updateProgress();
    checkFinish();
}

// --- XỬ LÝ ĐÚNG SAI (1, 2, 3, 4) ---
function handleTrueFalse(btn, qIndex, subIndex, userChoice) {
    const subRow = document.getElementById(`sub-q-${qIndex}-${subIndex}`);
    if (subRow.classList.contains('answered')) return;
    
    const correctAns = userQuestions[qIndex].items[subIndex].answer;
    
    subRow.classList.add('answered');
    const allBtns = subRow.querySelectorAll('.btn-ds');
    allBtns.forEach(b => b.disabled = true);

    if (userChoice === correctAns) {
        btn.classList.add('btn-correct');
        score++;
        correctCount++;
    } else {
        btn.classList.add('btn-wrong');
        // Hiện đáp án đúng
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
    // Đếm số lượng câu (hoặc ý nhỏ) đã được trả lời (đúng hoặc sai đều tính)
    const answeredBlocks = document.querySelectorAll('.question-block.completed').length;
    const answeredSubItems = document.querySelectorAll('.sub-question-item.answered').length;
    
    // Tổng số lượt trả lời đã thực hiện
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
