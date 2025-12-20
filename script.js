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

// HÀM QUAN TRỌNG: Giúp hiển thị các thẻ HTML như <h1>, <br> dưới dạng văn bản
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
        statusText.innerText = "Vui lòng tải file JSON!";
        setupOptions.classList.remove('hidden');
    }
}
init();

async function startGame(fileName) {
    statusText.innerText = "Đang tải...";
    setupOptions.classList.add('hidden');

    setTimeout(async () => {
        try {
            const res = await fetch(fileName);
            quizData = await res.json();
            
            const isShuffle = document.getElementById('shuffle-checkbox').checked;
            userQuestions = isShuffle ? [...quizData].sort(() => Math.random() - 0.5) : [...quizData];
            
            score = 0;
            correctCount = 0;
            
            loadingScreen.classList.add('hidden');
            quizScreen.classList.remove('hidden');
            
            renderAllQuestions();
        } catch (err) {
            alert("Lỗi tải file dữ liệu!");
            location.reload();
        }
    }, 200);
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

        // Dùng escapeHtml để sửa lỗi hiển thị nội dung
        const questionTitle = escapeHtml(data.question);

        let optionsHtml = "";
        const opts = data.options;

        if (Array.isArray(opts)) {
            // Đúng/Sai
            optionsHtml = `
                <div class="option-item" onclick="handleSelect(this, ${index}, 'a')">
                    <input type="radio" name="q${index}"><span>${escapeHtml(opts[0])}</span>
                </div>
                <div class="option-item" onclick="handleSelect(this, ${index}, 'b')">
                    <input type="radio" name="q${index}"><span>${escapeHtml(opts[1])}</span>
                </div>`;
        } else {
            // Trắc nghiệm
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
    
    // Nếu câu này đã ĐÚNG (hoàn thành) thì không cho bấm nữa
    if (block.classList.contains('completed')) return;

    // Reset màu của các lựa chọn cũ (để khi chọn lại không bị dính đỏ nhiều cái)
    const allOptions = block.querySelectorAll('.option-item');
    allOptions.forEach(opt => opt.classList.remove('wrong'));

    element.querySelector('input').checked = true;
    const data = userQuestions[qIndex];

    // Tìm đáp án đúng
    let correctKey = "";
    if (Array.isArray(data.options)) {
        correctKey = (data.answer === data.options[0]) ? "a" : "b";
    } else {
        const entry = Object.entries(data.options).find(([k, v]) => v === data.answer);
        correctKey = entry ? entry[0] : String(data.answer).toLowerCase();
    }

    if (selectedKey === correctKey) {
        // --- CHỌN ĐÚNG ---
        element.classList.add('correct');
        block.classList.add('completed'); // Khóa câu hỏi
        score++;
        correctCount++;
    } else {
        // --- CHỌN SAI ---
        // Chỉ hiện màu đỏ, KHÔNG khóa, cho phép chọn lại
        element.classList.add('wrong');
    }

    updateProgress();

    // Nếu làm xong hết
    if (correctCount === userQuestions.length) {
        setTimeout(showFinalResults, 1000);
    }
}

function updateProgress() {
    const percent = (correctCount / userQuestions.length) * 100;
    progressBar.style.width = percent + "%";
    document.getElementById('current-count').innerText = correctCount;
    document.getElementById('live-score').innerText = score;
}

function showFinalResults() {
    quizScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');
    document.getElementById('final-score').innerText = score + " / " + userQuestions.length;
}
