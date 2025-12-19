// --- KHAI BÁO BIẾN TOÀN CỤC ---
let questions = []; // Chứa danh sách câu hỏi
let currentQuestionIndex = 0;
let score = 0;
let isAnswered = false; // Trạng thái đã chọn đáp án hay chưa

// --- 1. HÀM BẮT ĐẦU (KHI CHỌN CHẾ ĐỘ) ---
async function startQuiz(mode) {
    try {
        if (mode === 'multiple-choice') {
            const res = await fetch('trac-nghiem.json');
            questions = await res.json();
        } else if (mode === 'true-false') {
            const res = await fetch('dung-sai.json');
            questions = await res.json();
        } else if (mode === 'mixed') {
            const [res1, res2] = await Promise.all([
                fetch('trac-nghiem.json'),
                fetch('dung-sai.json')
            ]);
            const data1 = await res1.json();
            const data2 = await res2.json();
            // Gộp và trộn ngẫu nhiên
            questions = [...data1, ...data2].sort(() => Math.random() - 0.5);
        }

        // Chuyển màn hình
        document.getElementById('menu-screen').classList.add('hidden');
        document.getElementById('quiz-screen').classList.remove('hidden');

        showQuestion();
    } catch (error) {
        console.error("Lỗi tải dữ liệu JSON:", error);
        alert("Không thể tải file dữ liệu. Hãy đảm bảo bạn đã tạo file trac-nghiem.json và dung-sai.json");
    }
}

// --- 2. HIỂN THỊ CÂU HỎI ---
function showQuestion() {
    if (currentQuestionIndex >= questions.length) {
        showFinalResult();
        return;
    }

    isAnswered = false;
    const q = questions[currentQuestionIndex];

    // Cập nhật số thứ tự và điểm hiện tại
    document.getElementById('question-counter').innerText = `Câu hỏi: ${currentQuestionIndex + 1}/${questions.length}`;
    document.getElementById('live-score').innerText = `Đúng: ${score}`;

    // Cập nhật Thanh tiến độ (Progress Bar)
    const percent = ((currentQuestionIndex + 1) / questions.length) * 100;
    document.getElementById('progress-bar').style.width = percent + '%';

    // Hiển thị nội dung câu hỏi
    document.getElementById('question-text').innerText = q.question;

    // Hiển thị các lựa chọn
    const container = document.getElementById('options-container');
    container.innerHTML = '';

    q.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = opt;
        btn.onclick = (e) => checkAnswer(e.target, opt, q.answer);
        container.appendChild(btn);
    });

    // Ẩn nút Tiếp tục
    document.getElementById('navigation-area').classList.add('hidden');
}

// --- 3. KIỂM TRA ĐÁP ÁN ---
function checkAnswer(selectedBtn, selectedValue, correctAnswer) {
    if (isAnswered) return;
    isAnswered = true;

    const allButtons = document.querySelectorAll('.option-btn');

    if (selectedValue === correctAnswer) {
        selectedBtn.classList.add('correct');
        score++;
        document.getElementById('live-score').innerText = `Đúng: ${score}`;
    } else {
        selectedBtn.classList.add('wrong');
        // Tìm và làm nổi bật đáp án đúng để người dùng biết
        allButtons.forEach(btn => {
            if (btn.innerText === correctAnswer) {
                btn.classList.add('correct');
            }
        });
    }

    // Vô hiệu hóa các nút sau khi đã chọn
    allButtons.forEach(btn => btn.style.pointerEvents = 'none');

    // Hiện nút "Tiếp tục"
    document.getElementById('navigation-area').classList.remove('hidden');
}

// --- 4. CHUYỂN CÂU KẾ TIẾP ---
function nextQuestion() {
    currentQuestionIndex++;
    showQuestion();
}

// --- 5. HIỂN THỊ KẾT QUẢ CUỐI CÙNG ---
function showFinalResult() {
    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('result-screen').classList.remove('hidden');

    document.getElementById('score-number').innerText = score;
    document.getElementById('final-stats').innerText = 
        `Chúc mừng! Bạn đã hoàn thành ${questions.length} câu hỏi với ${score} câu trả lời chính xác.`;
}
