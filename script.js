let quizData = []; 
let userQuestions = []; 
let currentQuiz = 0;
let score = 0;
let wrongAnswers = [];
let isAnswered = false; // Trạng thái đã chốt câu trả lời chưa
let currentFailed = false; // Đánh dấu nếu câu này từng chọn sai

const UI = {
    loading: document.getElementById('loading-screen'),
    quiz: document.getElementById('quiz-screen'),
    result: document.getElementById('result-screen'),
    optionsGrid: document.getElementById('options-grid'),
    nextBtn: document.getElementById('submit'),
    progressBar: document.getElementById('progress-bar')
};

// 1. TẢI DỮ LIỆU
async function init() {
    try {
        const response = await fetch('questions.json');
        quizData = await response.json();
        document.getElementById('status-text').innerText = "Dữ liệu sẵn sàng!";
        document.getElementById('setup-options').classList.remove('hidden');
    } catch (error) {
        document.getElementById('status-text').innerText = "Lỗi tải file questions.json!";
    }
}
init();

// 2. BẮT ĐẦU
document.getElementById('start-btn').onclick = () => {
    userQuestions = document.getElementById('shuffle-checkbox').checked 
        ? [...quizData].sort(() => Math.random() - 0.5) 
        : [...quizData];
    
    UI.loading.classList.add('hidden');
    UI.quiz.classList.remove('hidden');
    loadQuestion();
};

// 3. HIỂN THỊ CÂU HỎI
function loadQuestion() {
    isAnswered = false;
    currentFailed = false;
    UI.nextBtn.disabled = true;
    UI.optionsGrid.innerHTML = '';
    
    const q = userQuestions[currentQuiz];
    document.getElementById('question').innerText = `Câu ${currentQuiz + 1}: ${q.question}`;
    
    // Render đáp án (Tự động nhận diện MCQ hoặc Đúng/Sai)
    if (q.options) {
        // Nếu là MCQ (a, b, c, d)
        Object.keys(q.options).forEach(key => {
            createOptionElement(q.options[key], key, q.answer);
        });
    } else {
        // Nếu là Đúng/Sai (dữ liệu chỉ có answer)
        createOptionElement("ĐÚNG", true, q.answer);
        createOptionElement("SAI", false, q.answer);
    }

    // Cập nhật Progress
    UI.progressBar.style.width = `${(currentQuiz / userQuestions.length) * 100}%`;
    document.getElementById('current-count').innerText = currentQuiz + 1;
    document.getElementById('total-count').innerText = userQuestions.length;
    document.getElementById('live-score').innerText = score;
}

function createOptionElement(text, value, correctValue) {
    const div = document.createElement('div');
    div.className = 'option-item';
    div.innerText = text;
    div.onclick = () => checkLogic(value, correctValue, div);
    UI.optionsGrid.appendChild(div);
}

// 4. LOGIC KIỂM TRA (ĐIỂM MẠNH: XÓA MÀU CŨ & SỬA LỖI SO SÁNH)
function checkLogic(userVal, correctVal, element) {
    if (isAnswered) return;

    // XÓA MÀU CÁC LỰA CHỌN CŨ (Cho phép người dùng đổi ý trước khi bấm Tiếp tục)
    Array.from(UI.optionsGrid.children).forEach(child => {
        child.classList.remove('correct', 'wrong');
    });

    // CHUẨN HÓA SO SÁNH (Sửa lỗi triệt để Đúng/Sai)
    const u = String(userVal).toLowerCase().trim();
    const c = String(correctVal).toLowerCase().trim();

    if (u === c) {
        element.classList.add('correct');
        isAnswered = true; // Chốt câu này
        if (!currentFailed) score++; // Chỉ cộng điểm nếu không sai lần nào ở câu này
        
        UI.nextBtn.disabled = false;
        // Khóa không cho nhấn nữa sau khi đã đúng
        Array.from(UI.optionsGrid.children).forEach(child => child.style.pointerEvents = 'none');
    } else {
        element.classList.add('wrong');
        currentFailed = true; // Đánh dấu đã từng sai
        UI.nextBtn.disabled = true; // Bắt buộc phải chọn lại cho đúng mới được qua

        // Lưu vào danh sách sai để review (chỉ lưu 1 lần)
        const qData = userQuestions[currentQuiz];
        if (!wrongAnswers.find(x => x.q === qData.question)) {
            wrongAnswers.push({
                q: qData.question,
                userAns: element.innerText,
                correctAns: qData.options ? qData.options[correctVal] : (correctVal ? "Đúng" : "Sai")
            });
        }
    }
}

// 5. TIẾP TỤC
UI.nextBtn.onclick = () => {
    currentQuiz++;
    if (currentQuiz < userQuestions.length) loadQuestion();
    else showFinal();
};

function showFinal() {
    UI.quiz.classList.add('hidden');
    UI.result.classList.remove('hidden');
    document.getElementById('final-score').innerText = `${score} / ${userQuestions.length}`;
    
    if (score / userQuestions.length >= 0.8) confetti({ particleCount: 150, spread: 70 });

    const review = document.getElementById('review-container');
    review.innerHTML = wrongAnswers.length > 0 
        ? wrongAnswers.map(item => `
            <div class="review-item">
                <p><strong>${item.q}</strong></p>
                <p style="color:var(--error-text)">✘ Bạn chọn: ${item.userAns}</p>
                <p style="color:var(--success-text)">✔ Đáp án: ${item.correctAns}</p>
            </div>`).join('')
        : "<p style='text-align:center; color:var(--success-text)'>Bạn thật tuyệt vời! Không sai câu nào.</p>";
}
