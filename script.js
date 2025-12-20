let quizData = []; 
let userQuestions = []; 
let score = 0;
let wrongAnswers = [];

const statusText = document.getElementById('status-text');
const setupOptions = document.getElementById('setup-options');
const loadingScreen = document.getElementById('loading-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const progressBar = document.getElementById('progress-bar');

async function init() {
    try {
        const response = await fetch('questions.json');
        if (response.ok) {
            statusText.innerText = "Dữ liệu đã sẵn sàng!";
            setupOptions.classList.remove('hidden');
        }
    } catch (e) { statusText.innerText = "Lỗi dữ liệu!"; }
}
init();

async function startGame(fileName) {
    // THÔNG BÁO ĐỂ NGƯỜI DÙNG BIẾT ĐANG TẢI 110 CÂU
    statusText.innerText = "Đang nạp 110 câu hỏi, vui lòng đợi...";
    setupOptions.classList.add('hidden');

    setTimeout(async () => {
        try {
            const res = await fetch(fileName);
            quizData = await res.json();
            userQuestions = document.getElementById('shuffle-checkbox').checked ? 
                [...quizData].sort(() => Math.random() - 0.5) : [...quizData];
            
            score = 0;
            wrongAnswers = [];
            
            loadingScreen.classList.add('hidden');
            quizScreen.classList.remove('hidden');
            document.getElementById('btn-home').classList.remove('hidden');
            
            renderAllQuestions();
        } catch (err) { alert("Lỗi tải!"); }
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

        let optionsHtml = "";
        const opts = data.options;

        if (Array.isArray(opts)) {
            optionsHtml = `
                <label class="option-item" onclick="handleSelect(this, ${index}, 'a')"><input type="radio"><span>${opts[0]}</span></label>
                <label class="option-item" onclick="handleSelect(this, ${index}, 'b')"><input type="radio"><span>${opts[1]}</span></label>`;
        } else {
            optionsHtml = Object.entries(opts).map(([key, val]) => `
                <label class="option-item" onclick="handleSelect(this, ${index}, '${key}')">
                    <input type="radio"><span>${val}</span>
                </label>`).join('');
        }

        qBlock.innerHTML = `
            <div style="font-weight:700; margin-bottom:15px; line-height:1.5;">Câu ${index + 1}: ${data.question}</div>
            <div class="option-list">${optionsHtml}</div>`;
        feed.appendChild(qBlock);
    });

    document.getElementById('total-count').innerText = userQuestions.length;
    updateProgress();
}

function handleSelect(element, qIndex, selectedKey) {
    const block = document.getElementById(`q-block-${index = qIndex}`);
    if (block.classList.contains('answered')) return;
    block.classList.add('answered');

    const data = userQuestions[qIndex];
    const options = block.querySelectorAll('.option-item');
    options.forEach(opt => opt.classList.add('locked', 'dimmed'));
    element.querySelector('input').checked = true;

    let correctKey = Array.isArray(data.options) ? 
        ((data.answer === data.options[0]) ? "a" : "b") : String(data.answer).toLowerCase();

    if (selectedKey === correctKey) {
        element.classList.remove('dimmed');
        element.classList.add('correct');
        score++;
    } else {
        element.classList.remove('dimmed');
        element.classList.add('wrong');
        options.forEach(opt => {
            const spanText = opt.querySelector('span').innerText;
            if (spanText === data.answer || opt.innerHTML.includes(`'${correctKey}'`)) {
                opt.classList.remove('dimmed');
                opt.classList.add('correct');
            }
        });
        wrongAnswers.push({ q: data.question, userAns: selectedKey, correctAns: data.answer });
    }
    updateProgress();

    // Tự động hiện kết quả khi làm hết
    if (document.querySelectorAll('.answered').length === userQuestions.length) {
        setTimeout(showFinalResults, 1000);
    }
}

function updateProgress() {
    const answeredCount = document.querySelectorAll('.answered').length;
    progressBar.style.width = (answeredCount / userQuestions.length) * 100 + "%";
    document.getElementById('current-count').innerText = answeredCount;
    document.getElementById('live-score').innerText = score;
}

function showFinalResults() {
    quizScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');
    document.getElementById('final-score').innerText = score + " / " + userQuestions.length;
    if (score / userQuestions.length >= 0.8) confetti({ particleCount: 150 });

    const review = document.getElementById('review-container');
    review.innerHTML = wrongAnswers.map(item => `
        <div style="margin-bottom:15px; padding:15px; border-left:5px solid #e74c3c; background:#fff5f5; border-radius:12px; text-align:left;">
            <p><strong>${item.q}</strong></p>
            <p style="color:#e74c3c">✘ Đáp án đúng: ${item.correctAns}</p>
        </div>`).join('');
}
