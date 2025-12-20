let quizData = [];
let userQuestions = [];
let score = 0;
let wrongAnswers = [];

const statusText = document.getElementById('status-text');
const setupOptions = document.getElementById('setup-options');
const loadingScreen = document.getElementById('loading-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const progressBar = document.getElementById('progress-bar');
const btnHome = document.getElementById('btn-home');

// Khởi tạo
async function init() {
    try {
        // Kiểm tra file tồn tại (giả lập)
        const response = await fetch('questions.json');
        if (response.ok) {
            statusText.innerText = "Dữ liệu đã sẵn sàng!";
            setupOptions.classList.remove('hidden');
        } else {
            throw new Error("File not found");
        }
    } catch (e) {
        statusText.innerText = "Vui lòng tải file questions.json và dungsai.json lên!";
        // Vẫn hiện nút để test nếu file có sẵn
        setupOptions.classList.remove('hidden');
    }
}
init();

// Bắt đầu game
async function startGame(fileName) {
    statusText.innerText = "Đang tải câu hỏi...";
    setupOptions.classList.add('hidden');

    setTimeout(async () => {
        try {
            const res = await fetch(fileName);
            quizData = await res.json();
            
            // Xử lý trộn câu hỏi
            const isShuffle = document.getElementById('shuffle-checkbox').checked;
            userQuestions = isShuffle ? [...quizData].sort(() => Math.random() - 0.5) : [...quizData];
            
            // Reset trạng thái
            score = 0;
            wrongAnswers = [];
            
            // Chuyển màn hình
            loadingScreen.classList.add('hidden');
            quizScreen.classList.remove('hidden');
            btnHome.classList.remove('hidden');
            
            renderAllQuestions();
        } catch (err) {
            alert("Không tải được file dữ liệu! Hãy chắc chắn file json cùng thư mục.");
            location.reload();
        }
    }, 400); // Thêm delay nhỏ tạo cảm giác loading
}

document.getElementById('btn-tracnghiem').onclick = () => startGame('questions.json');
document.getElementById('btn-dungsai').onclick = () => startGame('dungsai.json');

function renderAllQuestions() {
    const feed = document.getElementById('quiz-feed');
    feed.innerHTML = "";
    
    userQuestions.forEach((data, index) => {
        const qBlock = document.createElement('div');
        qBlock.className = 'question-block';
        qBlock.id = `q-block-${index}`;

        let optionsHtml = "";
        const opts = data.options;

        // Xử lý hiển thị Options (Mảng cho Đúng/Sai, Object cho Trắc nghiệm)
        if (Array.isArray(opts)) {
            // Trường hợp Đúng / Sai (Mảng)
            optionsHtml = `
                <div class="option-item" onclick="handleSelect(this, ${index}, 'a')">
                    <input type="radio" name="q${index}"><span>${opts[0]}</span>
                </div>
                <div class="option-item" onclick="handleSelect(this, ${index}, 'b')">
                    <input type="radio" name="q${index}"><span>${opts[1]}</span>
                </div>`;
        } else {
            // Trường hợp Trắc Nghiệm (Object a,b,c,d)
            optionsHtml = Object.entries(opts).map(([key, val]) => `
                <div class="option-item" onclick="handleSelect(this, ${index}, '${key}')">
                    <input type="radio" name="q${index}"><span>${val}</span>
                </div>`).join('');
        }

        qBlock.innerHTML = `
            <div class="question-text">Câu ${index + 1}: ${data.question}</div>
            <div class="option-list">${optionsHtml}</div>`;
        feed.appendChild(qBlock);
    });

    document.getElementById('total-count').innerText = userQuestions.length;
    updateProgress();
}

// Xử lý khi chọn đáp án (Logic quan trọng)
function handleSelect(element, qIndex, selectedKey) {
    const block = document.getElementById(`q-block-${qIndex}`);
    
    // Nếu đã trả lời thì không cho chọn lại (áp dụng cho cả 2 chế độ)
    if (block.classList.contains('answered')) return;
    
    block.classList.add('answered'); // Đánh dấu đã trả lời
    element.querySelector('input').checked = true; // Check radio button

    const data = userQuestions[qIndex];
    const options = block.querySelectorAll('.option-item');
    
    // Xác định key đúng
    let correctKey = "";
    if (Array.isArray(data.options)) {
        // Đúng sai: so sánh string
        correctKey = (data.answer === data.options[0]) ? "a" : "b";
    } else {
        // Trắc nghiệm: so sánh key (a,b,c,d) hoặc text
        // Giả sử data.answer trong JSON là text đáp án, ta cần tìm key của nó
        const entry = Object.entries(data.options).find(([k, v]) => v === data.answer);
        // Nếu data.answer lưu "A", "B" thì dùng toLowerCase, nếu lưu text thì dùng entry
        correctKey = entry ? entry[0] : String(data.answer).toLowerCase();
    }

    // Kiểm tra đúng sai
    if (selectedKey === correctKey) {
        // ĐÚNG
        element.classList.add('correct');
        score++;
        
        // Hiệu ứng confetti nhỏ khi đúng (tùy chọn)
        // confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 }, disableForReducedMotion: true });
    } else {
        // SAI
        element.classList.add('wrong');
        
        // Tìm và highlight đáp án đúng để người dùng biết
        options.forEach(opt => {
            // Logic tìm option đúng để highlight
            const textSpan = opt.querySelector('span').innerText;
            // Cách 1: So sánh text
            if (textSpan === data.answer) {
                opt.classList.add('correct');
            }
            // Cách 2: So sánh qua key (nếu data.answer là 'A', 'B'...)
            if(opt.getAttribute('onclick').includes(`'${correctKey}'`)) {
                 opt.classList.add('correct');
            }
        });

        // Lưu lại câu sai để review
        wrongAnswers.push({ 
            q: data.question, 
            userAns: selectedKey, 
            correctAns: data.answer 
        });
    }

    updateProgress();

    // Tự động chuyển màn hình kết quả khi làm hết
    const answeredCount = document.querySelectorAll('.question-block.answered').length;
    if (answeredCount === userQuestions.length) {
        setTimeout(showFinalResults, 1200);
    }
}

function updateProgress() {
    const answeredCount = document.querySelectorAll('.question-block.answered').length;
    const percent = (answeredCount / userQuestions.length) * 100;
    
    progressBar.style.width = percent + "%";
    document.getElementById('current-count').innerText = answeredCount;
    document.getElementById('live-score').innerText = score;
}

function showFinalResults() {
    quizScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');
    btnHome.classList.add('hidden'); // Ẩn nút home khi hiện kết quả

    document.getElementById('final-score').innerText = score + "/" + userQuestions.length;
    
    // Hiệu ứng pháo hoa nếu điểm cao (>70%)
    if (score / userQuestions.length >= 0.7) {
        confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });
    }

    const review = document.getElementById('review-container');
    if (wrongAnswers.length === 0) {
        review.innerHTML = `<p style="text-align:center; color:var(--success); font-weight:bold;">Xuất sắc! Bạn làm đúng hết!</p>`;
    } else {
        review.innerHTML = wrongAnswers.map(item => `
            <div class="review-item">
                <p style="font-weight:600; margin-bottom:5px">${item.q}</p>
                <p style="color:var(--text-light); font-size:0.9rem">Đáp án đúng: <span style="color:var(--success); font-weight:700">${item.correctAns}</span></p>
            </div>`).join('');
    }
}
