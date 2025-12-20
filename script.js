// GIỮ NGUYÊN CÁC BIẾN CŨ CỦA BẠN
let quizData = []; 
let currentQuiz = 0;
let score = 0;
let userQuestions = []; 
let wrongAnswers = [];

// BỔ SUNG: Biến để quản lý nút Home và lựa chọn
const btnHome = document.getElementById('btn-home'); 
let currentSelection = null; 

const loadingScreen = document.getElementById('loading-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const statusText = document.getElementById('status-text');
const setupOptions = document.getElementById('setup-options');
const shuffleCheckbox = document.getElementById('shuffle-checkbox');
const questionEl = document.getElementById('question');
const answerEls = document.querySelectorAll('.answer');
const submitBtn = document.getElementById('submit');
const progressBar = document.getElementById('progress-bar');
const currentCountEl = document.getElementById('current-count');
const totalCountEl = document.getElementById('total-count');
const liveScoreEl = document.getElementById('live-score');

// HÀM INIT CŨ CỦA BẠN
async function init() {
    try {
        const response = await fetch('questions.json');
        if (response.ok) {
            statusText.innerText = "Sẵn sàng!";
            setupOptions.classList.remove('hidden');
        }
    } catch (error) {
        statusText.innerText = "Lỗi kết nối!";
    }
}
init();

// HÀM START GAME CŨ - BỔ SUNG NÚT HOME
async function startGame(fileName) {
    try {
        const res = await fetch(fileName);
        quizData = await res.json();
        
        if (shuffleCheckbox.checked) {
            userQuestions = [...quizData].sort(() => Math.random() - 0.5);
        } else {
            userQuestions = [...quizData];
        }
        
        currentQuiz = 0;
        score = 0;
        wrongAnswers = [];
        
        loadingScreen.classList.add('hidden');
        quizScreen.classList.remove('hidden');
        
        // BỔ SUNG: Hiện nút Home khi vào màn hình chơi
        if (btnHome) {
            btnHome.classList.remove('hidden');
        }
        
        loadQuiz();
    } catch (err) {
        alert("Lỗi tải dữ liệu!");
    }
}

// GIỮ NGUYÊN CÁC NÚT CHỌN CHẾ ĐỘ
document.getElementById('btn-tracnghiem').onclick = function() {
    startGame('questions.json');
};
document.getElementById('btn-dungsai').onclick = function() {
    startGame('dungsai.json');
};

// HÀM LOAD QUIZ - BỔ SUNG LOGIC HIỆN/ẨN NHÃN C,D
function loadQuiz() {
    deselectAnswers();
    const currentQuizData = userQuestions[currentQuiz];
    questionEl.innerText = "Câu " + (currentQuiz + 1) + ": " + currentQuizData.question;

    // GIỮ CẤU TRÚC GÁN TEXT CŨ NHƯNG THÊM KIỂM TRA ĐÚNG/SAI
    if (Array.isArray(currentQuizData.options)) {
        // Nếu là Đúng/Sai
        document.getElementById('a_text').innerText = currentQuizData.options[0];
        document.getElementById('b_text').innerText = currentQuizData.options[1];
        
        // BỔ SUNG: Ẩn C và D để không bị trống
        document.getElementById('label-c').style.display = 'none';
        document.getElementById('label-d').style.display = 'none';
    } else {
        // Nếu là Trắc nghiệm
        document.getElementById('a_text').innerText = currentQuizData.options.a;
        document.getElementById('b_text').innerText = currentQuizData.options.b;
        document.getElementById('c_text').innerText = currentQuizData.options.c;
        document.getElementById('d_text').innerText = currentQuizData.options.d;
        
        // BỔ SUNG: Hiện lại C và D
        document.getElementById('label-c').style.display = 'flex';
        document.getElementById('label-d').style.display = 'flex';
    }

    progressBar.style.width = (currentQuiz / userQuestions.length) * 100 + "%";
    currentCountEl.innerText = currentQuiz + 1;
    totalCountEl.innerText = userQuestions.length;
    liveScoreEl.innerText = score;
}

// HÀM BỎ CHỌN CŨ
function deselectAnswers() {
    answerEls.forEach(answerEl => {
        answerEl.checked = false;
        answerEl.parentElement.classList.remove('correct');
        answerEl.parentElement.classList.remove('wrong');
        answerEl.parentElement.classList.remove('dimmed');
    });
    submitBtn.disabled = true;
    currentSelection = null;
}

// SỰ KIỆN CLICK ĐÁP ÁN - BỔ SUNG SỬA LỖI HIỆN ĐỎ
answerEls.forEach(answerEl => {
    answerEl.onclick = function() {
        const selected = answerEl.id;
        const data = userQuestions[currentQuiz];
        
        // BỔ SUNG: Logic tìm đáp án đúng thông minh (Sửa lỗi hiện đỏ)
        let correct = "";
        if (Array.isArray(data.options)) {
            // Nếu JSON ghi "Đúng" hoặc "Sai" thay vì "a", "b"
            if (data.answer === data.options[0]) correct = "a";
            else if (data.answer === data.options[1]) correct = "b";
            else correct = String(data.answer).toLowerCase();
        } else {
            correct = String(data.answer).toLowerCase();
        }

        // Xóa màu cũ của các label
        document.querySelectorAll('.option-item').forEach(item => {
            item.classList.remove('correct', 'wrong', 'dimmed');
        });

        const parentLabel = answerEl.parentElement;

        if (selected === correct) {
            // CHỌN ĐÚNG
            parentLabel.classList.add('correct');
            document.querySelectorAll('.option-item').forEach(item => {
                if(item !== parentLabel) item.classList.add('dimmed');
            });
            currentSelection = { isCorrect: true };
        } else {
            // CHỌN SAI
            parentLabel.classList.add('wrong');
            
            // Lấy text để hiện trong phần kết quả
            let uText = "";
            let cText = "";
            if (Array.isArray(data.options)) {
                uText = (selected === 'a') ? data.options[0] : data.options[1];
                cText = data.answer;
            } else {
                uText = data.options[selected];
                cText = data.options[correct];
            }

            currentSelection = { 
                isCorrect: false, 
                q: data.question, 
                userAns: uText, 
                correctAns: cText 
            };
        }
        submitBtn.disabled = false;
    };
});

// NÚT TIẾP TỤC CŨ CỦA BẠN
submitBtn.onclick = function() {
    if (currentSelection) {
        if (currentSelection.isCorrect) {
            score++;
        } else {
            wrongAnswers.push(currentSelection);
        }
    }

    currentQuiz++;

    if (currentQuiz < userQuestions.length) {
        loadQuiz();
    } else {
        showResults();
    }
};

// HÀM HIỂN THỊ KẾT QUẢ CŨ
function showResults() {
    quizScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');
    
    // Ẩn nút Home khi đã xem xong kết quả
    if (btnHome) btnHome.classList.add('hidden');

    document.getElementById('final-score').innerText = score + " / " + userQuestions.length;

    if (score / userQuestions.length >= 0.8) {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 }
        });
    }

    // HIỂN THỊ CÁC CÂU SAI
    const reviewContainer = document.getElementById('review-container');
    if (wrongAnswers.length > 0) {
        let reviewHTML = "";
        wrongAnswers.forEach(item => {
            reviewHTML += '<div style="margin-bottom:15px; padding:10px; border-left:4px solid #e74c3c; background:#fff5f5; border-radius:8px;">';
            reviewHTML += '<p><strong>' + item.q + '</strong></p>';
            reviewHTML += '<p style="color:#e74c3c">✘ Sai: ' + item.userAns + '</p>';
            reviewHTML += '<p style="color:#2ecc71">✔ Đúng: ' + item.correctAns + '</p>';
            reviewHTML += '</div>';
        });
        reviewContainer.innerHTML = reviewHTML;
    } else {
        reviewContainer.innerHTML = "<p style='text-align:center'>Bạn không làm sai câu nào!</p>";
    }
}

// BỔ SUNG: Nút Home quay lại từ màn hình kết quả hoặc khi đang chơi
if (btnHome) {
    btnHome.onclick = function() {
        location.reload();
    };
}
