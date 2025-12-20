// 1. KHAI BÁO BIẾN
let quizData = []; 
let currentQuiz = 0;
let score = 0;
let userQuestions = []; 
let wrongAnswers = [];
// Biến mới: lưu trạng thái lựa chọn hiện tại
let currentSelection = null; 

// 2. DOM ELEMENTS
const loadingScreen = document.getElementById('loading-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const statusText = document.getElementById('status-text');
const setupOptions = document.getElementById('setup-options');
const shuffleCheckbox = document.getElementById('shuffle-checkbox');

// Nút chọn chế độ mới (Trắc nghiệm / Đúng Sai)
const btnTracNghiem = document.getElementById('btn-tracnghiem');
const btnDungSai = document.getElementById('btn-dungsai');

const questionEl = document.getElementById('question');
const answerEls = document.querySelectorAll('.answer');
const submitBtn = document.getElementById('submit');
const progressBar = document.getElementById('progress-bar');
const currentCountEl = document.getElementById('current-count');
const totalCountEl = document.getElementById('total-count');
const liveScoreEl = document.getElementById('live-score');

// 3. TẢI DATA BAN ĐẦU
async function init() {
    try {
        await fetch('questions.json'); // Test kết nối
        statusText.innerText = "Sẵn sàng!";
        setupOptions.classList.remove('hidden');
    } catch (error) {
        statusText.innerText = "Lỗi tải dữ liệu!";
    }
}
init();

// 4. HÀM BẮT ĐẦU GAME
async function startGame(fileName) {
    try {
        statusText.innerText = "Đang tải câu hỏi...";
        const res = await fetch(fileName);
        quizData = await res.json();

        // Trộn câu hỏi
        userQuestions = shuffleCheckbox.checked 
            ? [...quizData].sort(() => Math.random() - 0.5) 
            : [...quizData];
        
        // Reset chỉ số
        currentQuiz = 0;
        score = 0;
        wrongAnswers = [];
        loadingScreen.classList.add('hidden');
        quizScreen.classList.remove('hidden');
        loadQuiz();

    } catch (err) {
        alert("Không tìm thấy file " + fileName);
    }
}

// Gán sự kiện cho 2 nút chế độ
btnTracNghiem.addEventListener('click', () => startGame('questions.json'));
btnDungSai.addEventListener('click', () => startGame('dungsai.json'));

// 5. HIỂN THỊ CÂU HỎI
function loadQuiz() {
    resetUIState();
    const currentQuizData = userQuestions[currentQuiz];

    questionEl.innerText = `Câu ${currentQuiz + 1}: ${currentQuizData.question}`;

    // --- LOGIC SỬA LỖI UNDEFINED CHO ĐÚNG/SAI ---
    if (Array.isArray(currentQuizData.options)) {
        // Nếu file dungsai.json có dạng ["Đúng", "Sai"]
        document.getElementById('a_text').innerText = currentQuizData.options[0];
        document.getElementById('b_text').innerText = currentQuizData.options[1];
        
        // Ẩn 2 câu trả lời C và D đi
        document.getElementById('label-c').style.display = 'none';
        document.getElementById('label-d').style.display = 'none';
    } else {
        // Nếu file questions.json có dạng {a: "...", b: "...", ...}
        document.getElementById('a_text').innerText = currentQuizData.options.a;
        document.getElementById('b_text').innerText = currentQuizData.options.b;
        document.getElementById('c_text').innerText = currentQuizData.options.c;
        document.getElementById('d_text').innerText = currentQuizData.options.d;
        
        // Hiện lại 2 câu trả lời C và D
        document.getElementById('label-c').style.display = 'flex';
        document.getElementById('label-d').style.display = 'flex';
    }

    // Cập nhật thanh tiến trình
    const progressPercent = (currentQuiz / userQuestions.length) * 100;
    progressBar.style.width = `${progressPercent}%`;
    currentCountEl.innerText = currentQuiz + 1;
    totalCountEl.innerText = userQuestions.length;
    liveScoreEl.innerText = score;
}

// 6. XỬ LÝ KHI CHỌN ĐÁP ÁN (GIỮ NGUYÊN LOGIC CỦA BẠN)
answerEls.forEach(el => {
    el.addEventListener('click', () => {
        const selectedId = el.id;
        const currentQuizData = userQuestions[currentQuiz];
        // Đồng bộ hóa key đáp án (chuyển về chữ thường để so khớp chính xác)
        const correctId = String(currentQuizData.answer).toLowerCase();

        // 6.1. Xóa sạch màu cũ
        document.querySelectorAll('.option-item').forEach(opt => {
            opt.classList.remove('correct', 'wrong', 'dimmed');
        });

        const selectedLabel = document.getElementById(`label-${selectedId}`);
        
        // 6.2. Kiểm tra Đúng / Sai và Tô màu
        if (selectedId === correctId) {
            // -- ĐÚNG --
            selectedLabel.classList.add('correct');
            document.querySelectorAll('.option-item').forEach(opt => {
                if(opt.id !== `label-${selectedId}`) {
                    opt.classList.add('dimmed');
                }
            });
            currentSelection = { isCorrect: true };
        } else {
            // -- SAI --
            selectedLabel.classList.add('wrong');
            
            // Lấy text của câu trả lời đã chọn để hiển thị trong phần Review
            let userAnsText = "";
            let correctAnsText = "";

            if (Array.isArray(currentQuizData.options)) {
                userAnsText = (selectedId === 'a') ? currentQuizData.options[0] : currentQuizData.options[1];
                correctAnsText = (correctId === 'a') ? currentQuizData.options[0] : currentQuizData.options[1];
            } else {
                userAnsText = currentQuizData.options[selectedId];
                correctAnsText = currentQuizData.options[correctId];
            }

            currentSelection = { 
                isCorrect: false,
                q: currentQuizData.question,
                userAns: userAnsText,
                correctAns: correctAnsText
            };
        }

        submitBtn.disabled = false; // Mở nút tiếp tục
    });
});

// 7. NHẤN NÚT TIẾP TỤC
submitBtn.addEventListener('click', () => {
    if (currentSelection) {
        if (currentSelection.isCorrect) {
            score++;
        } else {
            wrongAnswers.push({
                q: currentSelection.q,
                userAns: currentSelection.userAns,
                correctAns: currentSelection.correctAns
            });
        }
    }

    currentQuiz++;
    if (currentQuiz < userQuestions.length) {
        loadQuiz();
    } else {
        showResults();
    }
});

// 8. RESET UI
function resetUIState() {
    currentSelection = null;
    submitBtn.disabled = true;
    answerEls.forEach(el => {
        el.checked = false;
        el.parentElement.classList.remove('correct', 'wrong', 'dimmed');
    });
}

// 9. HIỂN THỊ KẾT QUẢ
function showResults() {
    quizScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');
    progressBar.style.width = `100%`;
    document.getElementById('final-score').innerText = `${score} / ${userQuestions.length}`;

    if (score / userQuestions.length >= 0.8) {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }

    const reviewContainer = document.getElementById('review-container');
    if (wrongAnswers.length > 0) {
        reviewContainer.innerHTML = wrongAnswers.map((item) => `
            <div style="margin-bottom: 12px; padding: 12px; border-left: 4px solid var(--error); background: #fff5f5; border-radius: 8px;">
                <p><strong>Câu hỏi:</strong> ${item.q}</p>
                <p style="color: var(--error);">✘ Bạn chọn: ${item.userAns}</p>
                <p style="color: var(--success);">✔ Đáp án đúng: ${item.correctAns}</p>
            </div>
        `).join('');
    } else {
        reviewContainer.innerHTML = "<p style='color: var(--success); font-weight:bold; text-align:center;'>Xuất sắc! Bạn không làm sai câu nào!</p>";
    }
}
