// 1. KHAI BÁO BIẾN TOÀN CỤC - GIỮ NGUYÊN PHONG CÁCH CỦA BẠN
let quizData = []; 
let currentQuiz = 0;
let score = 0;
let userQuestions = []; 
let wrongAnswers = [];

// 2. TRUY XUẤT CÁC PHẦN TỬ DOM
const loadingScreen = document.getElementById('loading-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const statusText = document.getElementById('status-text');
const setupOptions = document.getElementById('setup-options');
const startBtn = document.getElementById('start-btn');
const shuffleCheckbox = document.getElementById('shuffle-checkbox');
const btnHome = document.getElementById('btn-home');

const questionEl = document.getElementById('question');
const answerEls = document.querySelectorAll('.answer');
const submitBtn = document.getElementById('submit');

const progressBar = document.getElementById('progress-bar');
const currentCountEl = document.getElementById('current-count');
const totalCountEl = document.getElementById('total-count');
const liveScoreEl = document.getElementById('live-score');

// 3. TẢI DỮ LIỆU
async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        if (!response.ok) throw new Error('Không thể tải file');
        quizData = await response.json();
        statusText.innerText = "Dữ liệu đã sẵn sàng!";
        setupOptions.classList.remove('hidden');
    } catch (error) {
        statusText.style.color = "red";
        statusText.innerText = "Lỗi: Không tìm thấy file questions.json!";
    }
}
loadQuestions();

// 4. LOGIC BẮT ĐẦU THI
startBtn.addEventListener('click', () => {
    userQuestions = shuffleCheckbox.checked 
        ? [...quizData].sort(() => Math.random() - 0.5) 
        : [...quizData];
    
    loadingScreen.classList.add('hidden');
    quizScreen.classList.remove('hidden');
    if (btnHome) btnHome.classList.remove('hidden');
    loadQuiz();
});

// 5. HIỂN THỊ CÂU HỎI
function loadQuiz() {
    resetUIState();
    
    // Tinh hoa: Cuộn nội dung lên đầu mỗi khi sang câu mới
    const scrollArea = document.querySelector('.quiz-scroll-area');
    if (scrollArea) scrollArea.scrollTop = 0;

    const currentQuizData = userQuestions[currentQuiz];
    questionEl.innerText = `Câu ${currentQuiz + 1}: ${currentQuizData.question}`;
    
    // Hiển thị text đáp án
    document.getElementById('a_text').innerText = currentQuizData.options.a;
    document.getElementById('b_text').innerText = currentQuizData.options.b;
    document.getElementById('c_text').innerText = currentQuizData.options.c;
    document.getElementById('d_text').innerText = currentQuizData.options.d;

    // Cập nhật số liệu
    const progressPercent = (currentQuiz / userQuestions.length) * 100;
    progressBar.style.width = `${progressPercent}%`;
    currentCountEl.innerText = currentQuiz + 1;
    totalCountEl.innerText = userQuestions.length;
    liveScoreEl.innerText = score;
}

// 6. XỬ LÝ CHỌN ĐÁP ÁN (Tinh hoa: Sửa lỗi đổi đáp án & hiện màu ngay)
answerEls.forEach(el => {
    el.addEventListener('change', () => {
        // Mỗi lần click: Xóa sạch màu xanh/đỏ cũ để không bị chồng màu
        document.querySelectorAll('.option-item').forEach(item => {
            item.classList.remove('correct', 'wrong', 'dimmed');
        });

        const selectedId = el.id; 
        const currentQuizData = userQuestions[currentQuiz];
        const correctId = currentQuizData.answer;

        const selectedLabel = document.getElementById(`label-${selectedId}`);
        const correctLabel = document.getElementById(`label-${correctId}`);

        if (selectedId === correctId) {
            selectedLabel.classList.add('correct');
            // Làm mờ các đáp án không được chọn
            document.querySelectorAll('.option-item').forEach(item => {
                if(item !== selectedLabel) item.classList.add('dimmed');
            });
            // Chỉ tính điểm 1 lần
            if (!submitBtn.getAttribute('data-scored')) {
                score++;
                submitBtn.setAttribute('data-scored', 'true');
            }
        } else {
            selectedLabel.classList.add('wrong');
            correctLabel.classList.add('correct');
            // Lưu vào danh sách sai
            if (!submitBtn.getAttribute('data-scored')) {
                wrongAnswers.push({
                    q: currentQuizData.question,
                    userAns: currentQuizData.options[selectedId],
                    correctAns: currentQuizData.options[correctId]
                });
                submitBtn.setAttribute('data-scored', 'false'); // Đánh dấu đã trả lời
            }
        }

        lockOptions();
        submitBtn.disabled = false;
    });
});

// 7. NHẤN NÚT TIẾP TỤC
submitBtn.addEventListener('click', () => {
    currentQuiz++;
    if (currentQuiz < userQuestions.length) {
        loadQuiz();
    } else {
        showResults();
    }
});

// 8. HÀM HỖ TRỢ
function resetUIState() {
    submitBtn.disabled = true;
    submitBtn.removeAttribute('data-scored'); // Reset trạng thái tính điểm
    answerEls.forEach(el => {
        el.checked = false;
        el.disabled = false;
        el.parentElement.style.pointerEvents = 'auto';
        el.parentElement.classList.remove('correct', 'wrong', 'dimmed');
    });
}

function lockOptions() {
    answerEls.forEach(el => {
        el.disabled = true;
        el.parentElement.style.pointerEvents = 'none';
    });
}

// 9. HIỂN THỊ KẾT QUẢ
function showResults() {
    quizScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');
    if (btnHome) btnHome.classList.add('hidden');
    
    document.getElementById('final-score').innerText = `${score} / ${userQuestions.length}`;

    if (score / userQuestions.length >= 0.8) {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }

    const reviewContainer = document.getElementById('review-container');
    if (wrongAnswers.length > 0) {
        reviewContainer.innerHTML = wrongAnswers.map(item => `
            <div style="margin-bottom: 12px; padding: 12px; border-left: 4px solid var(--error); background: #fff5f5; border-radius: 8px;">
                <p><strong>${item.q}</strong></p>
                <p style="color: var(--error);">✘ Bạn chọn: ${item.userAns}</p>
                <p style="color: var(--success);">✔ Đáp án đúng: ${item.correctAns}</p>
            </div>
        `).join('');
    } else {
        reviewContainer.innerHTML = "<p style='color: var(--success); font-weight:bold; text-align:center;'>Xuất sắc! Bạn không sai câu nào!</p>";
    }
}
