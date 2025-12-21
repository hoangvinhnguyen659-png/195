let quizData = [];
let userQuestions = [];
let userAnswers = {}; // Bộ nhớ lưu trạng thái từng câu hỏi
let score = 0;

const statusText = document.getElementById('status-text');
const setupOptions = document.getElementById('setup-options');
const loadingScreen = document.getElementById('loading-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const progressBar = document.getElementById('progress-bar');
const quizFeed = document.getElementById('quiz-feed');

function escapeHtml(text) {
    if (!text) return "";
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Khởi tạo ứng dụng
async function init() {
    try {
        const response = await fetch('questions.json');
        if (response.ok) {
            statusText.innerText = "Sẵn sàng!";
            setupOptions.classList.remove('hidden');
        } else {
            statusText.innerText = "Sẵn sàng (File mặc định chưa sẵn sàng)";
            setupOptions.classList.remove('hidden');
        }
    } catch (e) {
        statusText.innerText = "Lỗi kết nối!";
        setupOptions.classList.remove('hidden');
    }
}
init();

// Bắt đầu game
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

// Reset dữ liệu và vẽ giao diện
function resetAndRender() {
    score = 0;
    userAnswers = {};
    
    // Khởi tạo bộ nhớ cho từng câu hỏi
    userQuestions.forEach((_, index) => {
        userAnswers[index] = { 
            completed: false, 
            subAnswers: {} // Dành cho đúng/sai
        };
    });

    loadingScreen.classList.add('hidden');
    resultScreen.classList.add('hidden');
    quizScreen.classList.remove('hidden');
    
    renderAllQuestions();
    
    const scrollArea = document.querySelector('.quiz-scroll-area');
    if (scrollArea) scrollArea.scrollTop = 0;
}

// Render toàn bộ danh sách câu hỏi
function renderAllQuestions() {
    quizFeed.innerHTML = "";
    
    userQuestions.forEach((data, index) => {
        const qBlock = document.createElement('div');
        qBlock.className = 'question-block';
        qBlock.id = `q-block-${index}`;

        // DẠNG ĐÚNG/SAI
        if (data.subQuestions && Array.isArray(data.subQuestions)) {
            let itemsHtml = data.subQuestions.map((item, subIndex) => `
                <div class="sub-question-item" id="sub-q-${index}-${subIndex}">
                    <div class="sub-q-text">
                        <strong>${subIndex + 1}.</strong> ${escapeHtml(item.content)}
                    </div>
                    <div class="ds-buttons">
                        <button class="btn-ds" onclick="handleTrueFalse(this, ${index}, ${subIndex}, 'Đúng')">Đúng</button>
                        <button class="btn-ds" onclick="handleTrueFalse(this, ${index}, ${subIndex}, 'Sai')">Sai</button>
                    </div>
                </div>
            `).join('');

            qBlock.innerHTML = `
                <div class="context-box">Câu ${index + 1}: ${escapeHtml(data.question)}</div>
                <div class="sub-list">${itemsHtml}</div>
            `;
        } 
        // DẠNG TRẮC NGHIỆM ABCD
        else {
            const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
            let optionsHtml = data.options.map((opt, i) => `
                <div class="option-item" onclick="handleSelect(this, ${index}, ${i})">
                    <input type="radio" name="q${index}">
                    <span><b>${labels[i]}.</b> ${escapeHtml(opt)}</span>
                </div>
            `).join('');

            qBlock.innerHTML = `
                <div class="question-text">Câu ${index + 1}: ${escapeHtml(data.question)}</div>
                <div class="option-list">${optionsHtml}</div>
            `;
        }

        quizFeed.appendChild(qBlock);
    });

    updateProgress();
}

// Xử lý chọn Trắc nghiệm ABCD
function handleSelect(element, qIndex, selectedIdx) {
    const block = document.getElementById(`q-block-${qIndex}`);
    if (userAnswers[qIndex].completed) return;

    const data = userQuestions[qIndex];
    const allOptions = block.querySelectorAll('.option-item');
    
    // Tìm đáp án đúng (Xử lý cả mảng hoặc text)
    let correctIdx = -1;
    if (Array.isArray(data.options)) {
        correctIdx = data.options.indexOf(data.answer);
    }

    // Hiển thị kết quả
    allOptions.forEach(opt => opt.classList.remove('correct', 'wrong'));
    element.querySelector('input').checked = true;

    if (selectedIdx === correctIdx) {
        element.classList.add('correct');
    } else {
        element.classList.add('wrong');
        if (correctIdx !== -1) allOptions[correctIdx].classList.add('correct');
    }

    // Khóa câu hỏi và cập nhật tiến trình
    userAnswers[qIndex].completed = true;
    block.classList.add('completed');
    updateProgress();
}

// Xử lý chọn Đúng/Sai (Cho phép đổi đáp án)
function handleTrueFalse(btn, qIndex, subIndex, choice) {
    const parent = btn.parentElement;
    const buttons = parent.querySelectorAll('.btn-ds');
    
    // Xóa màu cũ
    buttons.forEach(b => b.classList.remove('selected-true', 'selected-false'));

    // Thêm màu mới
    if (choice === 'Đúng') {
        btn.classList.add('selected-true');
    } else {
        btn.classList.add('selected-false');
    }

    // Lưu đáp án
    userAnswers[qIndex].subAnswers[subIndex] = choice;

    // Kiểm tra đã làm đủ 4 ý chưa
    const totalSubNeeded = userQuestions[qIndex].subQuestions.length;
    const answeredCount = Object.keys(userAnswers[qIndex].subAnswers).length;

    if (answeredCount === totalSubNeeded) {
        userAnswers[qIndex].completed = true;
    }

    updateProgress();
}

// Cập nhật thanh tiến trình và điểm số hiển thị
function updateProgress() {
    const totalQuestions = userQuestions.length;
    const completedCount = Object.values(userAnswers).filter(a => a.completed).length;

    const percent = totalQuestions > 0 ? (completedCount / totalQuestions) * 100 : 0;
    progressBar.style.width = percent + "%";
    
    document.getElementById('current-count').innerText = completedCount;
    document.getElementById('total-count').innerText = totalQuestions;

    // Nếu đã hoàn thành tất cả các câu hỏi lớn
    if (completedCount === totalQuestions && totalQuestions > 0) {
        setTimeout(finishQuiz, 800);
    }
}

// Kết thúc và tính điểm cuối cùng
function finishQuiz() {
    let finalScore = 0;
    let totalPoints = 0;

    userQuestions.forEach((q, i) => {
        if (q.subQuestions) {
            // Tính điểm từng ý nhỏ Đúng/Sai
            q.subQuestions.forEach((sub, subIdx) => {
                totalPoints++;
                if (userAnswers[i].subAnswers[subIdx] === sub.answer) {
                    finalScore++;
                }
            });
        } else {
            // Tính điểm trắc nghiệm ABCD
            totalPoints++;
            // Kiểm tra class 'correct' trong block tương ứng
            const block = document.getElementById(`q-block-${i}`);
            if (block.querySelector('.option-item.correct:not(.wrong)')) {
                finalScore++;
            }
        }
    });

    document.getElementById('final-score').innerText = `${finalScore}/${totalPoints}`;
    quizScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');
}

function restartQuiz() {
    resetAndRender();
}

// Gán sự kiện cho các nút điều hướng chính
document.getElementById('btn-tracnghiem').onclick = () => startGame('questions.json');
document.getElementById('btn-dungsai').onclick = () => startGame('dungsai.json');
document.getElementById('btn-home-nav').onclick = () => location.reload();
