// 1. KHAI BÁO BIẾN - GIỮ NGUYÊN PHONG CÁCH CỦA BẠN
let quizData = []; 
let currentQuiz = 0;
let score = 0;
let userQuestions = []; 
let wrongAnswers = [];
let currentSelection = null; 

// TRUY XUẤT PHẦN TỬ HTML
const loadingScreen = document.getElementById('loading-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const statusText = document.getElementById('status-text');
const setupOptions = document.getElementById('setup-options');
const shuffleCheckbox = document.getElementById('shuffle-checkbox');
const btnHome = document.getElementById('btn-home');

const questionEl = document.getElementById('question');
const answerEls = document.querySelectorAll('.answer');
const submitBtn = document.getElementById('submit');
const progressBar = document.getElementById('progress-bar');
const currentCountEl = document.getElementById('current-count');
const totalCountEl = document.getElementById('total-count');
const liveScoreEl = document.getElementById('live-score');

// 2. HÀM KHỞI TẠO
async function init() {
    console.log("Đang kiểm tra kết nối dữ liệu...");
    try {
        const response = await fetch('questions.json');
        if (response.ok) {
            statusText.innerText = "Dữ liệu đã sẵn sàng!";
            setupOptions.classList.remove('hidden');
        } else {
            statusText.innerText = "Không tìm thấy dữ liệu!";
        }
    } catch (error) {
        console.error(error);
        statusText.innerText = "Lỗi kết nối server!";
    }
}
init();

// 3. HÀM BẮT ĐẦU GAME
async function startGame(fileName) {
    statusText.innerText = "Đang tải câu hỏi...";
    try {
        const res = await fetch(fileName);
        quizData = await res.json();
        
        // Logic trộn câu hỏi
        if (shuffleCheckbox.checked) {
            userQuestions = [...quizData].sort(function() {
                return Math.random() - 0.5;
            });
        } else {
            userQuestions = [...quizData];
        }
        
        currentQuiz = 0;
        score = 0;
        wrongAnswers = [];
        
        loadingScreen.classList.add('hidden');
        quizScreen.classList.remove('hidden');
        
        if (btnHome) {
            btnHome.classList.remove('hidden');
        }
        
        loadQuiz();
    } catch (err) {
        alert("Lỗi: Không thể đọc file " + fileName);
        statusText.innerText = "Lỗi tải file!";
    }
}

// GÁN SỰ KIỆN CHO 2 NÚT CHẾ ĐỘ
document.getElementById('btn-tracnghiem').onclick = function() {
    startGame('questions.json');
};

document.getElementById('btn-dungsai').onclick = function() {
    startGame('dungsai.json');
};

// 4. HÀM HIỂN THỊ CÂU HỎI
function loadQuiz() {
    deselectAnswers();
    
    const currentData = userQuestions[currentQuiz];
    questionEl.innerText = "Câu " + (currentQuiz + 1) + ": " + currentData.question;

    const options = currentData.options;

    if (Array.isArray(options)) {
        document.getElementById('a_text').innerText = options[0]; 
        document.getElementById('b_text').innerText = options[1]; 
        
        document.getElementById('label-c').style.display = 'none';
        document.getElementById('label-d').style.display = 'none';
    } else {
        document.getElementById('a_text').innerText = options.a;
        document.getElementById('b_text').innerText = options.b;
        document.getElementById('c_text').innerText = options.c;
        document.getElementById('d_text').innerText = options.d;
        
        document.getElementById('label-c').style.display = 'flex';
        document.getElementById('label-d').style.display = 'flex';
    }

    const progressVal = (currentQuiz / userQuestions.length) * 100;
    progressBar.style.width = progressVal + "%";
    currentCountEl.innerText = currentQuiz + 1;
    totalCountEl.innerText = userQuestions.length;
    liveScoreEl.innerText = score;
}

// 5. HÀM RESET TRẠNG THÁI
function deselectAnswers() {
    answerEls.forEach(function(el) {
        el.checked = false;
        const parent = el.parentElement;
        parent.classList.remove('correct');
        parent.classList.remove('wrong');
        parent.classList.remove('dimmed');
    });
    submitBtn.disabled = true;
    currentSelection = null;
}

// 6. XỬ LÝ CHỌN ĐÁP ÁN (BỔ SUNG HIỆU ỨNG MỜ)
answerEls.forEach(function(el) {
    el.onclick = function() {
        const selectedId = el.id; 
        const data = userQuestions[currentQuiz];
        
        let correctKey = "";
        if (Array.isArray(data.options)) {
            if (data.answer === data.options[0]) {
                correctKey = "a";
            } else if (data.answer === data.options[1]) {
                correctKey = "b";
            } else {
                correctKey = String(data.answer).toLowerCase();
            }
        } else {
            correctKey = String(data.answer).toLowerCase();
        }

        // Reset màu ô
        document.querySelectorAll('.option-item').forEach(function(item) {
            item.classList.remove('correct', 'wrong', 'dimmed');
        });

        const label = el.parentElement;

        // BỔ SUNG: Hiệu ứng làm mờ các câu không được chọn
        document.querySelectorAll('.option-item').forEach(function(item) {
            if(item !== label) {
                item.classList.add('dimmed');
            }
        });

        if (selectedId === correctKey) {
            label.classList.add('correct');
            currentSelection = { isCorrect: true };
        } else {
            label.classList.add('wrong');
            
            let uAns = "";
            let cAns = "";
            if (Array.isArray(data.options)) {
                uAns = (selectedId === 'a') ? data.options[0] : data.options[1];
                cAns = data.answer;
            } else {
                uAns = data.options[selectedId];
                cAns = data.options[correctKey];
            }

            currentSelection = { 
                isCorrect: false, 
                q: data.question, 
                userAns: uAns, 
                correctAns: cAns 
            };
        }
        submitBtn.disabled = false;
    };
});

// 7. NÚT TIẾP TỤC
submitBtn.onclick = function() {
    if (currentSelection.isCorrect) {
        score++;
    } else {
        wrongAnswers.push(currentSelection);
    }

    currentQuiz++;
    if (currentQuiz < userQuestions.length) {
        loadQuiz();
    } else {
        showResults();
    }
};

// 8. KẾT QUẢ CUỐI CÙNG
function showResults() {
    quizScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');
    if (btnHome) btnHome.classList.add('hidden');

    document.getElementById('final-score').innerText = score + " / " + userQuestions.length;

    if (score / userQuestions.length >= 0.8) {
        confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
    }

    const review = document.getElementById('review-container');
    if (wrongAnswers.length > 0) {
        let html = "";
        wrongAnswers.forEach(function(item) {
            html += '<div style="margin-bottom:15px; padding:10px; border-left:4px solid #e74c3c; background:#fff5f5; border-radius:8px; text-align:left;">';
            html += '<p><strong>' + item.q + '</strong></p>';
            html += '<p style="color:#e74c3c">✘ Sai: ' + item.userAns + '</p>';
            html += '<p style="color:#2ecc71">✔ Đúng: ' + item.correctAns + '</p>';
            html += '</div>';
        });
        review.innerHTML = html;
    } else {
        review.innerHTML = "<p style='text-align:center'>Bạn quá xuất sắc!</p>";
    }
}

// 9. NÚT HOME
if (btnHome) {
    btnHome.onclick = function() {
        location.reload();
    };
}
