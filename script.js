let quizData = []; let score = 0; let userQuestions = []; let wrongAnswers = [];

const loadingScreen = document.getElementById('loading-screen');
const quizScreen = document.getElementById('quiz-screen');
const statusText = document.getElementById('status-text');
const setupOptions = document.getElementById('setup-options');
const shuffleCheckbox = document.getElementById('shuffle-checkbox');
const progressBar = document.getElementById('progress-bar');

async function init() {
    try {
        const res = await fetch('questions.json');
        if (res.ok) { statusText.innerText = "Dữ liệu đã sẵn sàng!"; setupOptions.classList.remove('hidden'); }
    } catch (e) { statusText.innerText = "Lỗi kết nối dữ liệu!"; }
}
init();

async function startGame(file) {
    statusText.innerText = "Đang xử lý 110 câu hỏi...";
    setupOptions.classList.add('hidden');
    
    setTimeout(async () => {
        try {
            const res = await fetch(file);
            quizData = await res.json();
            userQuestions = shuffleCheckbox.checked ? [...quizData].sort(() => Math.random() - 0.5) : [...quizData];
            
            loadingScreen.classList.add('hidden');
            quizScreen.classList.remove('hidden');
            document.getElementById('btn-home').classList.remove('hidden');
            renderFeed();
        } catch (e) { alert("Lỗi!"); location.reload(); }
    }, 400); 
}

document.getElementById('btn-tracnghiem').onclick = () => startGame('questions.json');
document.getElementById('btn-dungsai').onclick = () => startGame('dungsai.json');

function renderFeed() {
    const feed = document.getElementById('quiz-feed');
    feed.innerHTML = "";

    userQuestions.forEach((data, index) => {
        const card = document.createElement('div');
        card.className = 'question-card';
        card.id = `q-${index}`;

        const qTitle = document.createElement('div');
        qTitle.style = "font-weight:800; margin-bottom:18px; line-height:1.5; color:#2d3436; font-size:1.1rem";
        qTitle.innerText = `Câu ${index + 1}: ${data.question}`; // Dùng innerText để hiện mã code dạng text
        card.appendChild(qTitle);

        const list = document.createElement('div');
        const options = data.options;

        if (Array.isArray(options)) {
            ['a', 'b'].forEach((k, i) => list.appendChild(createOpt(options[i], k, index, data.answer)));
        } else {
            Object.entries(options).forEach(([k, v]) => list.appendChild(createOpt(v, k, index, data.answer)));
        }
        
        card.appendChild(list);
        feed.appendChild(card);
    });
    
    document.getElementById('total-count').innerText = userQuestions.length;
    updateStats();
}

function createOpt(text, key, qIdx, correct) {
    const div = document.createElement('div');
    div.className = 'option-item';
    div.innerHTML = `<b style="color:var(--primary); margin-right:12px">${key.toUpperCase()}.</b> <span class="txt"></span>`;
    div.querySelector('.txt').innerText = text; // Fix triệt để lỗi mất nội dung thẻ HTML
    div.onclick = () => handleCheck(div, qIdx, key, correct);
    return div;
}

function handleCheck(el, qIdx, key, correct) {
    const card = document.getElementById(`q-${qIdx}`);
    if (card.classList.contains('done')) return;
    card.classList.add('done');

    const opts = card.querySelectorAll('.option-item');
    opts.forEach(o => o.classList.add('locked', 'dimmed'));

    const isTrue = (key.toLowerCase() === correct.toLowerCase()) || (el.innerText.toLowerCase().includes(correct.toLowerCase()));

    if (isTrue) {
        el.classList.remove('dimmed'); el.classList.add('correct');
        score++;
    } else {
        el.classList.remove('dimmed'); el.classList.add('wrong');
        opts.forEach(o => {
            if (o.innerText.toLowerCase().includes(correct.toLowerCase())) {
                o.classList.remove('dimmed'); o.classList.add('correct');
            }
        });
        wrongAnswers.push({q: userQuestions[qIdx].question, ans: correct});
    }
    updateStats();
    if (document.querySelectorAll('.done').length === userQuestions.length) setTimeout(showResults, 1000);
}

function updateStats() {
    const done = document.querySelectorAll('.done').length;
    progressBar.style.width = (done / userQuestions.length) * 100 + "%";
    document.getElementById('current-count').innerText = done;
    document.getElementById('live-score').innerText = score;
}

function showResults() {
    quizScreen.classList.add('hidden');
    document.getElementById('result-screen').classList.remove('hidden');
    document.getElementById('final-score').innerText = `${score} / ${userQuestions.length}`;
    if (score/userQuestions.length > 0.8) confetti({particleCount: 150});
    
    const container = document.getElementById('review-container');
    container.innerHTML = wrongAnswers.map(i => `
        <div style="background:#fff; padding:20px; border-radius:15px; margin-bottom:12px; border-left:6px solid var(--error); box-shadow:0 4px 12px rgba(0,0,0,0.05)">
            <p style="font-size:0.95rem; margin-bottom:8px"><b>${i.q}</b></p>
            <p style="color:var(--success); font-weight:800">✓ Đáp án: ${i.ans}</p>
        </div>
    `).join('');
}
