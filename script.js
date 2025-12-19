let quizData = []; 
let userQuestions = []; 
let currentQuiz = 0;
let score = 0;
let isAnswered = false; // Đã chốt câu này chưa
let currentFailed = false; // Đánh dấu nếu câu này từng chọn sai

const UI = {
    loading: document.getElementById('loading-screen'),
    quiz: document.getElementById('quiz-screen'),
    optionsBox: document.getElementById('options-container'),
    nextBtn: document.getElementById('submit')
};

// 1. TẢI DỮ LIỆU
async function init() {
    try {
        const res = await fetch('questions.json');
        quizData = await res.json();
        document.getElementById('status-text').innerText = "Dữ liệu sẵn sàng!";
        document.getElementById('setup-options').classList.remove('hidden');
    } catch (e) { document.getElementById('status-text').innerText = "Lỗi tải questions.json!"; }
}
init();

// 2. BẮT ĐẦU
document.getElementById('start-btn').onclick = () => {
    userQuestions = document.getElementById('shuffle-checkbox').checked 
        ? [...quizData].sort(() => Math.random() - 0.5) : [...quizData];
    UI.loading.classList.add('hidden');
    UI.quiz.classList.remove('hidden');
    loadQuestion();
};

// 3. HIỂN THỊ (TỰ ĐỘNG CHUYỂN CHẾ ĐỘ MCQ/ĐÚNG-SAI)
function loadQuestion() {
    isAnswered = false;
    currentFailed = false;
    UI.nextBtn.disabled = true;
    const q = userQuestions[currentQuiz];
    
    document.getElementById('question').innerText = `Câu ${currentQuiz + 1}: ${q.question}`;
    UI.optionsBox.innerHTML = '';

    // KIỂM TRA NẾU CÂU HỎI LÀ ĐÚNG/SAI (Không có thuộc tính options)
    if (!q.options) {
        UI.optionsBox.className = "tf-grid"; // Hiện 2 cột
        renderOption("ĐÚNG", true, q.answer);
        renderOption("SAI", false, q.answer);
    } else {
        UI.optionsBox.className = "option-list"; // Hiện danh sách dọc
        Object.keys(q.options).forEach(key => renderOption(q.options[key], key, q.answer));
    }

    // Cập nhật Progress & Score
    document.getElementById('progress-bar').style.width = `${(currentQuiz / userQuestions.length) * 100}%`;
    document.getElementById('current-count').innerText = currentQuiz + 1;
    document.getElementById('total-count').innerText = userQuestions.length;
    document.getElementById('live-score').innerText = score;
}

function renderOption(text, val, correct) {
    const div = document.createElement('div');
    div.className = 'option-item';
    div.innerText = text;
    div.onclick = () => handleCheck(val, correct, div);
    UI.optionsBox.appendChild(div);
}

// 4. LOGIC TỐI ƯU: CHỌN LẠI & SỬA LỖI ĐÚNG/SAI
function handleCheck(userVal, correctVal, element) {
    if (isAnswered) return;

    // XÓA MÀU CŨ KHI CHỌN LẠI (Đảm bảo chỉ hiện 1 trạng thái màu)
    const items = UI.optionsBox.querySelectorAll('.option-item');
    items.forEach(i => i.classList.remove('correct', 'wrong'));

    // So sánh chuẩn hóa kiểu dữ liệu (String/Boolean/Number)
    const user = String(userVal).toLowerCase().trim();
    const target = String(correctVal).toLowerCase().trim();

    if (user === target) {
        element.classList.add('correct');
        if (!currentFailed) score++; // Chỉ cộng điểm nếu không bấm sai lần nào ở câu này
        isAnswered = true; // Chốt câu
        UI.nextBtn.disabled = false;
        items.forEach(i => i.style.pointerEvents = 'none'); // Khóa nhấn sau khi đúng
    } else {
        element.classList.add('wrong');
        currentFailed = true; // Đánh dấu đã từng sai câu này
    }
}

UI.nextBtn.onclick = () => {
    currentQuiz++;
    if (currentQuiz < userQuestions.length) loadQuestion();
    else showResult();
};

function showResult() {
    UI.quiz.classList.add('hidden');
    document.getElementById('result-screen').classList.remove('hidden');
    document.getElementById('final-score').innerText = `${score} / ${userQuestions.length}`;
    if (score / userQuestions.length >= 0.8) confetti({ particleCount: 150, spread: 70 });
}
