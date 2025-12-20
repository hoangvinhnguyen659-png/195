let quizData = []; 
let score = 0;
let userQuestions = []; 
let wrongAnswers = [];

// Truy xuất phần tử (Giữ nguyên tên của bạn)
const loadingScreen = document.getElementById('loading-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const statusText = document.getElementById('status-text');
const setupOptions = document.getElementById('setup-options');
const shuffleCheckbox = document.getElementById('shuffle-checkbox');
const btnHome = document.getElementById('btn-home');

const progressBar = document.getElementById('progress-bar');
const currentCountEl = document.getElementById('current-count');
const totalCountEl = document.getElementById('total-count');
const liveScoreEl = document.getElementById('live-score');

// Khởi tạo
async function init() {
    try {
        const response = await fetch('questions.json');
        if (response.ok) {
            statusText.innerText = "Dữ liệu đã sẵn sàng!";
            setupOptions.classList.remove('hidden');
        }
    } catch (error) { statusText.innerText = "Lỗi kết nối!"; }
}
init();

// Bắt đầu game
async function startGame(fileName) {
    try {
        const res = await fetch(fileName);
        quizData = await res.json();
        userQuestions = shuffleCheckbox.checked ? [...quizData].sort(() => Math.random() - 0.5) : [...quizData];
        score = 0; wrongAnswers = [];
        loadingScreen.classList.add('hidden');
        quizScreen.classList.remove('hidden');
        if (btnHome) btnHome.classList.remove('hidden');
        loadQuiz(); 
    } catch (err) { alert("Lỗi!"); }
}

document.getElementById('btn-tracnghiem').onclick = () => startGame('questions.json');
document.getElementById('btn-dungsai').onclick = () => startGame('dungsai.json');

// THAY ĐỔI: Hàm nạp danh sách 110 câu
function loadQuiz() {
    const feed = document.getElementById('quiz-body-feed');
    feed.innerHTML = ""; 

    userQuestions.forEach((data, index) => {
        let optionsHtml = "";
        const options = data.options;

        if (Array.isArray(options)) {
            optionsHtml = `
                <div class="option-item" onclick="handleFeedSelect(this, ${index}, 'a')"><span>${options[0]}</span></div>
                <div class="option-item" onclick="handleFeedSelect(this, ${index}, 'b')"><span>${options[1]}</span></div>`;
        } else {
            optionsHtml = Object.entries(options).map(([key, text]) => `
                <div class="option-item" onclick="handleFeedSelect(this, ${index}, '${key}')">
                    <strong>${key.toUpperCase()}.</strong> &nbsp; ${text}
                </div>`).join('');
        }

        feed.innerHTML += `
            <div class="question-card" id="q-card-${index}">
                <div style="font-weight:700; margin-bottom:15px; font-size:1.1rem;">Câu ${index + 1}: ${data.question}</div>
                <div class="option-list">${optionsHtml}</div>
            </div>`;
    });

    totalCountEl.innerText = userQuestions.length;
    updateStats();
}

// Xử lý chọn đáp án
function handleFeedSelect(element, qIndex, selectedKey) {
    const data = userQuestions[qIndex];
    const card = document.getElementById(`q-card-${qIndex}`);
    if (card.classList.contains('answered')) return;

    const options = card.querySelectorAll('.option-item');
    card.classList.add('answered');
    options.forEach(opt => opt.classList.add('locked', 'dimmed'));

    let correctKey = Array.isArray(data.options) ? ((data.answer === data.options[0]) ? "a" : "b") : data.answer.toLowerCase();

    if (selectedKey === correctKey) {
        element.classList.remove('dimmed'); element.classList.add('correct');
        score++;
    } else {
        element.classList.remove('dimmed'); element.classList.add('wrong');
        options.forEach(opt => {
            if (opt.innerText.toLowerCase().includes(data.answer.toLowerCase()) || opt.innerText.startsWith(correctKey.toUpperCase())) {
                opt.classList.remove('dimmed'); opt.classList.add('correct');
            }
        });
        wrongAnswers.push({ q: data.question, userAns: selectedKey, correctAns: data.answer });
    }
    updateStats();
    if (document.querySelectorAll('.answered').length === userQuestions.length) setTimeout(showResults, 1200);
}

function updateStats() {
    const done = document.querySelectorAll('.answered').length;
    progressBar.style.width = (done / userQuestions.length) * 100 + "%";
    currentCountEl.innerText = done;
    liveScoreEl.innerText = score;
}

// Kết quả (Giữ nguyên của bạn)
function showResults() {
    quizScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');
    document.getElementById('final-score').innerText = score + " / " + userQuestions.length;
    if (score / userQuestions.length >= 0.8) confetti({ particleCount: 150, spread: 70 });
    
    const review = document.getElementById('review-container');
    review.innerHTML = wrongAnswers.length > 0 ? wrongAnswers.map(item => `
        <div style="margin-bottom:15px; padding:15px; border-left:5px solid #e74c3c; background:#fff5f5; border-radius:12px;">
            <p><strong>${item.q}</strong></p>
            <p style="color:#e74c3c">✘ Sai</p>
            <p style="color:#2ecc71">✔ Đúng: ${item.correctAns}</p>
        </div>`).join('') : "<p>Bạn thật xuất sắc!</p>";
}

if (btnHome) btnHome.onclick = () => location.reload();
