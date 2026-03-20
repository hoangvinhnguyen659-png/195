let quizData = [], userQuestions = [], score = 0, correctCount = 0;
const sunIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>`;
const moonIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

const body = document.body, themeToggle = document.getElementById('theme-toggle');

function initTheme() {
    const isDark = localStorage.getItem('theme') === 'dark';
    body.classList.toggle('dark-mode', isDark);
    if(themeToggle) themeToggle.innerHTML = isDark ? sunIcon : moonIcon;
}

if(themeToggle) themeToggle.onclick = () => {
    const isDark = body.classList.toggle('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    themeToggle.innerHTML = isDark ? sunIcon : moonIcon;
};

function showUpdateNotification() {
    const toast = document.getElementById('update-toast');
    if (toast && localStorage.getItem('update_hidden_date') !== new Date().toDateString()) {
        setTimeout(() => { toast.classList.remove('toast-hidden'); toast.classList.add('show'); }, 1000);
    }
}

function closeToast() {
    const toast = document.getElementById('update-toast');
    if (document.getElementById('hide-today-check')?.checked) localStorage.setItem('update_hidden_date', new Date().toDateString());
    toast.classList.remove('show');
    setTimeout(() => toast.classList.add('toast-hidden'), 400);
}

const statusText = document.getElementById('status-text'), setupOptions = document.getElementById('setup-options');
const quizScreen = document.getElementById('quiz-screen'), resultScreen = document.getElementById('result-screen');

function escapeHtml(t) { return t ? String(t).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m])) : ""; }

async function init() {
    initTheme();
    try {
        const res = await fetch('questions.json');
        if (res.ok) { statusText.innerText = "Sẵn sàng!"; setupOptions.classList.remove('hidden'); showUpdateNotification(); }
    } catch (e) { statusText.innerText = "Lỗi tải file!"; }
}
init();

async function startGame(file) {
    statusText.innerText = "Đang tải...";
    try {
        const res = await fetch(file);
        quizData = await res.json();
        userQuestions = document.getElementById('shuffle-checkbox')?.checked ? [...quizData].sort(() => Math.random() - 0.5) : [...quizData];
        score = 0; correctCount = 0;
        document.getElementById('loading-screen').classList.add('hidden');
        quizScreen.classList.remove('hidden');
        renderQuestions();
    } catch (e) { alert("Lỗi file!"); location.reload(); }
}

document.getElementById('btn-tracnghiem')?.addEventListener('click', () => startGame('questions.json'));
document.getElementById('btn-dungsai')?.addEventListener('click', () => startGame('dungsai.json'));

function renderQuestions() {
    const feed = document.getElementById('quiz-feed'); feed.innerHTML = "";
    userQuestions.forEach((q, i) => {
        const block = document.createElement('div');
        block.className = 'question-block'; block.id = `q-${i}`; block.dataset.finished = 0;
        let html = `<div class="question-text">Câu ${i+1}: ${escapeHtml(q.question)}</div>`;
        if (q.subQuestions) {
            html += q.subQuestions.map((s, si) => `
                <div id="s-${i}-${si}" style="margin-bottom:15px">
                    <p>${si+1}. ${escapeHtml(s.content)}</p>
                    <div class="sub-options-row">
                        <div class="option-item" onclick="handleSub(${i},${si},'Đúng',this)">Đúng</div>
                        <div class="option-item" onclick="handleSub(${i},${si},'Sai',this)">Sai</div>
                    </div>
                    ${s.explanation ? `<div class="explanation-box hidden">${escapeHtml(s.explanation)}</div>` : ''}
                </div>`).join('');
        } else {
            html += `<div class="option-list">` + Object.entries(q.options).map(([k, v]) => `<div class="option-item" onclick="handleSel(${i},'${k}',this)">${escapeHtml(v)}</div>`).join('') + `</div>`;
            if (q.explanation) html += `<div class="explanation-box hidden">${escapeHtml(q.explanation)}</div>`;
        }
        block.innerHTML = html; feed.appendChild(block);
    });
    document.getElementById('total-count').innerText = userQuestions.length;
    updateProg();
}

function handleSel(i, k, el) {
    const b = document.getElementById(`q-${i}`); if (b.classList.contains('done')) return;
    const ans = userQuestions[i].answer;
    const isCorrect = (userQuestions[i].options[k] === ans);
    if (isCorrect) { el.classList.add('correct'); b.classList.add('done'); score++; correctCount++; updateProg(); b.querySelector('.explanation-box')?.classList.remove('hidden'); }
    else el.classList.add('wrong');
}

function handleSub(i, si, val, el) {
    const s = document.getElementById(`s-${i}-${si}`); if (s.classList.contains('done')) return;
    if (val === userQuestions[i].subQuestions[si].answer) {
        el.classList.add('correct'); s.classList.add('done'); s.querySelector('.explanation-box')?.classList.remove('hidden');
        const b = document.getElementById(`q-${i}`); b.dataset.finished = parseInt(b.dataset.finished) + 1;
        if (parseInt(b.dataset.finished) === userQuestions[i].subQuestions.length) { score++; correctCount++; updateProg(); }
    } else el.classList.add('wrong');
}

function updateProg() {
    const p = (correctCount / userQuestions.length) * 100;
    document.getElementById('progress-bar').style.width = p + "%";
    document.getElementById('current-count').innerText = correctCount;
    document.getElementById('live-score').innerText = score;
    if (correctCount === userQuestions.length) setTimeout(() => { quizScreen.classList.add('hidden'); resultScreen.classList.remove('hidden'); document.getElementById('final-score').innerText = score + "/" + userQuestions.length; }, 600);
}
function restartQuiz() { location.reload(); }
