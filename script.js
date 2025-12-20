let quizData = [], userQuestions = [], score = 0, correctCount = 0;

const $ = id => document.getElementById(id); // Helper rút gọn lấy Element

// Khởi tạo
(async function init() {
    try {
        const res = await fetch('questions.json');
        if (res.ok) { 
            $('status-text').innerText = "Sẵn sàng!"; 
            $('setup-options').classList.remove('hidden'); 
        }
    } catch (e) { $('status-text').innerText = "Lỗi dữ liệu!"; }
})();

async function startGame(fileName) {
    $('status-text').innerText = "Đang tải...";
    try {
        const res = await fetch(fileName);
        quizData = await res.json();
        const isShuffle = $('shuffle-checkbox').checked;
        userQuestions = isShuffle ? [...quizData].sort(() => Math.random() - 0.5) : [...quizData];
        
        score = 0; correctCount = 0;
        $('loading-screen').classList.add('hidden');
        $('result-screen').classList.add('hidden');
        $('quiz-screen').classList.remove('hidden');
        
        renderAllQuestions();
        document.querySelector('.quiz-scroll-area').scrollTop = 0;
    } catch (err) { alert("Lỗi tải file!"); }
}

$('btn-tracnghiem').onclick = () => startGame('questions.json');
$('btn-dungsai').onclick = () => startGame('dungsai.json');

function renderAllQuestions() {
    const feed = $('quiz-feed');
    feed.innerHTML = userQuestions.map((data, idx) => {
        let content = "";
        if (data.subQuestions) {
            content = data.subQuestions.map((sub, sIdx) => `
                <div class="sub-q-group" id="q-${idx}-sub-${sIdx}">
                    <div class="sub-q-text">${sub.label}. ${sub.content}</div>
                    <div class="ds-row">
                        <div class="option-item" onclick="handleCheck(this, ${idx}, 'Đúng', ${sIdx})">Đúng</div>
                        <div class="option-item" onclick="handleCheck(this, ${idx}, 'Sai', ${sIdx})">Sai</div>
                    </div>
                </div>`).join('');
        } else {
            const entries = Array.isArray(data.options) ? data.options.map((v, i) => [String.fromCharCode(97 + i), v]) : Object.entries(data.options);
            content = `<div class="option-list">${entries.map(([k, v]) => `
                <div class="option-item" onclick="handleCheck(this, ${idx}, '${k}')">
                    <span class="opt-label">${k.toUpperCase()}.</span> ${v}
                </div>`).join('')}</div>`;
        }
        return `<div class="question-block" id="q-block-${idx}">
                    <div class="question-text">Câu ${idx + 1}: ${data.question}</div>${content}
                </div>`;
    }).join('');
    
    $('total-count').innerText = userQuestions.length;
    updateProgress();
}

// Hàm xử lý chung cho cả 2 chế độ
function handleCheck(el, qIdx, userChoice, sIdx = null) {
    const isDS = sIdx !== null;
    const parent = isDS ? $(`q-${qIdx}-sub-${sIdx}`) : $(`q-block-${qIdx}`);
    if (parent.classList.contains(isDS ? 'sub-completed' : 'completed')) return;

    const data = userQuestions[qIdx];
    let isCorrect = false;

    if (isDS) {
        isCorrect = userChoice === data.subQuestions[sIdx].answer;
    } else {
        const correctKey = Array.isArray(data.options) 
            ? String.fromCharCode(97 + data.options.indexOf(data.answer)) 
            : Object.keys(data.options).find(k => data.options[k] === data.answer);
        isCorrect = userChoice === correctKey;
    }

    parent.querySelectorAll('.option-item').forEach(i => i.classList.remove('wrong', 'correct'));

    if (isCorrect) {
        el.classList.add('correct');
        parent.classList.add(isDS ? 'sub-completed' : 'completed');
        score += isDS ? 0.25 : 1;
        
        if (!isDS || $(`q-block-${qIdx}`).querySelectorAll('.sub-completed').length === 4) {
            if (isDS) $(`q-block-${qIdx}`).classList.add('completed');
            correctCount++;
            updateProgress();
            if (correctCount === userQuestions.length) setTimeout(showResults, 800);
        }
    } else {
        el.classList.add('wrong');
    }
}

function updateProgress() {
    const percent = (correctCount / userQuestions.length) * 100 || 0;
    $('progress-bar').style.width = percent + "%";
    $('current-count').innerText = correctCount;
    $('live-score').innerText = Math.round(score * 100) / 100;
}

function showResults() {
    $('quiz-screen').classList.add('hidden');
    $('result-screen').classList.remove('hidden');
    $('final-score').innerText = (Math.round(score * 100) / 100) + "/" + userQuestions.length;
}
