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
    try {
        const response = await fetch('questions.json');
        if (response.ok) {
            statusText.innerText = "Dữ liệu đã sẵn sàng!";
            setupOptions.classList.remove('hidden');
        } else {
            statusText.innerText = "Không tìm thấy dữ liệu!";
        }
    } catch (error) {
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
        
        userQuestions = shuffleCheckbox.checked ? 
            [...quizData].sort(() => Math.random() - 0.5) : [...quizData];
        
        currentQuiz = 0;
        score = 0;
        wrongAnswers = [];
        
        loadingScreen.classList.add('hidden');
        quizScreen.classList.remove('hidden');
        if (btnHome) btnHome.classList.remove('hidden');
        
        loadQuiz();
    } catch (err) {
        alert("Lỗi tải dữ liệu!");
    }
}

document.getElementById('btn-tracnghiem').onclick = () => startGame('questions.json');
document.getElementById('btn-dungsai').onclick = () => startGame('dungsai.json');

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

    progressBar.style.width = (currentQuiz / userQuestions.length) * 100 + "%";
    currentCountEl.innerText = currentQuiz + 1;
    totalCountEl.innerText = userQuestions.length;
    liveScoreEl.innerText = score;
}

// 5. HÀM RESET TRẠNG THÁI
function deselectAnswers() {
    answerEls.forEach(function(el) {
        el.checked = false;
        const parent = el.parentElement;
        parent.classList.remove('correct', 'wrong', 'dimmed', 'locked');
    });
    submitBtn.disabled = true;
    currentSelection = null;
}

// 6. XỬ LÝ CHỌN ĐÁP ÁN (BỔ SUNG LOGIC XÓA MÀU CŨ)
answerEls.forEach(function(el) {
    el.onclick = function() {
        // BỔ SUNG: Xóa sạch màu sắc cũ mỗi khi đổi đáp án
        document.querySelectorAll('.option-item').forEach(function(item) {
            item.classList.remove('correct', 'wrong', 'dimmed');
        });

        const selectedId = el.id; 
        const data = userQuestions[currentQuiz];
        const label = el.parentElement;
        
        let correctKey = "";
        if (Array.isArray(data.options)) {
            correctKey = (data.answer === data.options[0]) ? "a" : "b";
        } else {
            correctKey = String(data.answer).toLowerCase();
        }

        if (selectedId === correctKey) {
            label.classList.add('correct');
            // Khóa toàn bộ để tập trung vào câu đúng
            document.querySelectorAll('.option-item').forEach(function(item) {
                item.classList.add('locked'); 
                if(item !== label) item.classList.add('dimmed');
            });

            currentSelection = { isCorrect: true };
            submitBtn.disabled = false; 
        } else {
            label.classList.add('wrong');
            submitBtn.disabled = true; 

            let uAns = Array.isArray(data.options) ? (selectedId === 'a' ? data.options[0] : data.options[1]) : data.options[selectedId];
            let cAns = Array.isArray(data.options) ? data.answer : data.options[correctKey];

            currentSelection = { 
                isCorrect: false, 
                q: data.question, 
                userAns: uAns, 
                correctAns: cAns 
            };
        }
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
            html += `<div style="margin-bottom:15px; padding:15px; border-left:5px solid #e74c3c; background:#fff5f5; border-radius:12px; text-align:left;">
                <p><strong>${item.q}</strong></p>
                <p style="color:#e74c3c">✘ Sai: ${item.userAns}</p>
                <p style="color:#2ecc71">✔ Đúng: ${item.correctAns}</p>
            </div>`;
        });
        review.innerHTML = html;
    } else {
        review.innerHTML = "<p style='text-align:center'>Bạn quá xuất sắc!</p>";
    }
}

if (btnHome) {
    btnHome.onclick = () => location.reload();
}
