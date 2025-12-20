let quizData = [];
let userQuestions = [];
let score = 0;
let wrongAnswers = [];
let correctCount = 0; // Đếm số câu đúng để chạy thanh tiến trình

const statusText = document.getElementById('status-text');
const setupOptions = document.getElementById('setup-options');
const loadingScreen = document.getElementById('loading-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const progressBar = document.getElementById('progress-bar');

// Hàm quan trọng: Chuyển đổi ký tự HTML để không bị mất chữ khi hiển thị
function escapeHtml(text) {
    if (!text) return text;
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
            statusText.innerText = "Dữ liệu đã sẵn sàng!";
            setupOptions.classList.remove('hidden');
        } else {
            throw new Error("File missing");
        }
    } catch (e) {
        statusText.innerText = "Vui lòng tải file JSON câu hỏi lên!";
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
            
            score = 0;
            correctCount = 0;
            wrongAnswers = [];
            
            loadingScreen.classList.add('hidden');
            quizScreen.classList.remove('hidden');
            
            renderAllQuestions();
        } catch (err) {
            alert("Lỗi tải file! Đảm bảo bạn đã có file questions.json hoặc dungsai.json");
            location.reload();
        }
    }, 300);
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

        // Xử lý nội dung câu hỏi (escape HTML để hiện thẻ code)
        const questionTitle = escapeHtml(data.question);

        let optionsHtml = "";
        const opts = data.options;

        if (Array.isArray(opts)) {
            // Dạng Đúng/Sai
            optionsHtml = `
                <div class="option-item" onclick="handleSelect(this, ${index}, 'a')">
                    <input type="radio" name="q${index}"><span>${escapeHtml(opts[0])}</span>
                </div>
                <div class="option-item" onclick="handleSelect(this, ${index}, 'b')">
                    <input type="radio" name="q${index}"><span>${escapeHtml(opts[1])}</span>
                </div>`;
        } else {
            // Dạng Trắc nghiệm (A, B, C, D)
            optionsHtml = Object.entries(opts).map(([key, val]) => `
                <div class="option-item" onclick="handleSelect(this, ${index}, '${key}')">
                    <input type="radio" name="q${index}"><span>${escapeHtml(val)}</span>
                </div>`).join('');
        }

        qBlock.innerHTML = `
            <div class="question-text">Câu ${index + 1}: ${questionTitle}</div>
            <div class="option-list">${optionsHtml}</div>`;
        feed.appendChild(qBlock);
    });

    document.getElementById('total-count').innerText = userQuestions.length;
    updateProgress();
}

function handleSelect(element, qIndex, selectedKey) {
    const block = document.getElementById(`q-block-${qIndex}`);
    
    // Nếu câu này đã hoàn thành (đã chọn đúng) thì không làm gì cả
    if (block.classList.contains('completed')) return;

    element.querySelector('input').checked = true;
    const data = userQuestions[qIndex];

    // Xác định đáp án đúng
    let correctKey = "";
    if (Array.isArray(data.options)) {
        correctKey = (data.answer === data.options[0]) ? "a" : "b";
    } else {
        const entry = Object.entries(data.options).find(([k, v]) => v === data.answer);
        correctKey = entry ? entry[0] : String(data.answer).toLowerCase();
    }

    if (selectedKey === correctKey) {
        // --- CHỌN ĐÚNG ---
        element.classList.remove('wrong');
        element.classList.add('correct');
        block.classList.add('completed'); // Khóa câu hỏi lại
        
        score++;
        correctCount++; // Tăng biến đếm để chạy thanh tiến trình
        
        // Hiệu ứng ăn mừng nhỏ
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 }, disableForReducedMotion: true });

    } else {
        // --- CHỌN SAI ---
        // Chỉ đánh dấu sai ô này, KHÔNG khóa câu hỏi, cho chọn lại
        element.classList.add('wrong');
        
        // Lưu vào danh sách sai (nếu chưa lưu) để review cuối game
        if (!wrongAnswers.find(w => w.q === data.question)) {
            wrongAnswers.push({ q: data.question, correctAns: data.answer });
        }
    }

    updateProgress();

    // Kiểm tra kết thúc game (khi số câu đúng = tổng số câu)
    if (correctCount === userQuestions.length) {
        setTimeout(showFinalResults, 1500);
    }
}

function updateProgress() {
    // Thanh tiến trình dựa trên số câu ĐÚNG (correctCount)
    const percent = (correctCount / userQuestions.length) * 100;
    progressBar.style.width = percent + "%";
    
    document.getElementById('current-count').innerText = correctCount; // Hiển thị số câu đúng
    document.getElementById('live-score').innerText = score; // Hiển thị điểm (có thể > tổng câu nếu tính cơ chế khác, ở đây bằng nhau)
}

function showFinalResults() {
    quizScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');
    
    document.getElementById('final-score').innerText = score + "/" + userQuestions.length;
    
    if (score === userQuestions.length) {
        confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
    }

    const review = document.getElementById('review-container');
    if (wrongAnswers.length === 0) {
        review.innerHTML = `<p style="text-align:center; color:var(--success); font-weight:bold;">Xuất sắc! Bạn không sai câu nào!</p>`;
    } else {
        // Hiển thị các câu đã từng chọn sai
        review.innerHTML = wrongAnswers.map(item => `
            <div class="review-item">
                <p style="font-weight:600; margin-bottom:5px">${escapeHtml(item.q)}</p>
                <p style="color:var(--text-light); font-size:0.9rem">Đáp án đúng: <span style="color:var(--success); font-weight:700">${escapeHtml(item.correctAns)}</span></p>
            </div>`).join('');
    }
}
