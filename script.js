/**
 * BIẾN TOÀN CỤC
 */
let quizData = [];       // Dữ liệu gốc từ file JSON
let userQuestions = [];  // Danh sách câu hỏi sau khi xử lý (có thể đảo câu)
let score = 0;           // Tổng điểm (Trắc nghiệm +0.25 cho mỗi ý Đúng/Sai)
let correctCount = 0;    // Số câu lớn đã hoàn thành xong

// Lấy các phần tử giao diện từ HTML
const statusText = document.getElementById('status-text');
const setupOptions = document.getElementById('setup-options');
const loadingScreen = document.getElementById('loading-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const progressBar = document.getElementById('progress-bar');

/**
 * HÀM TIỆN ÍCH
 * Chống lỗi hiển thị khi nội dung câu hỏi có ký tự đặc biệt như <, >
 */
function escapeHtml(text) {
    if (!text) return "";
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

/**
 * KHỞI TẠO ỨNG DỤNG
 * Kiểm tra xem file câu hỏi có tồn tại không trước khi cho phép bắt đầu
 */
async function init() {
    try {
        const res = await fetch('questions.json');
        if (res.ok) { 
            statusText.innerText = "Sẵn sàng!"; 
            setupOptions.classList.remove('hidden'); 
        }
    } catch (e) { 
        statusText.innerText = "Lỗi tải dữ liệu!"; 
        setupOptions.classList.remove('hidden'); 
    }
}
init();

/**
 * BẮT ĐẦU TRÒ CHƠI
 * @param {string} fileName - Tên file JSON cần tải ('questions.json' hoặc 'dungsai.json')
 */
async function startGame(fileName) {
    statusText.innerText = "Đang tải câu hỏi...";
    setupOptions.classList.add('hidden');
    try {
        const res = await fetch(fileName);
        quizData = await res.json();
        
        // Kiểm tra xem người dùng có chọn đảo câu hỏi không
        const isShuffle = document.getElementById('shuffle-checkbox').checked;
        userQuestions = isShuffle ? [...quizData].sort(() => Math.random() - 0.5) : [...quizData];
        
        resetAndRender();
    } catch (err) { 
        alert("Không thể đọc file dữ liệu!"); 
        location.reload(); 
    }
}

/**
 * RESET TRẠNG THÁI VÀ HIỂN THỊ
 */
function resetAndRender() {
    score = 0; 
    correctCount = 0;
    loadingScreen.classList.add('hidden'); 
    resultScreen.classList.add('hidden'); 
    quizScreen.classList.remove('hidden');
    
    renderAllQuestions(); // Vẽ toàn bộ câu hỏi ra màn hình
    document.querySelector('.quiz-scroll-area').scrollTop = 0; // Cuộn về đầu trang
}

// Gắn sự kiện cho 2 nút chọn chế độ ở màn hình chính
document.getElementById('btn-tracnghiem').onclick = () => startGame('questions.json');
document.getElementById('btn-dungsai').onclick = () => startGame('dungsai.json');

/**
 * VẼ CÂU HỎI RA MÀN HÌNH
 * Tự động nhận diện cấu trúc Trắc nghiệm hay Đúng/Sai
 */
function renderAllQuestions() {
    const feed = document.getElementById('quiz-feed');
    feed.innerHTML = ""; // Xóa các câu hỏi cũ

    userQuestions.forEach((data, index) => {
        const qBlock = document.createElement('div');
        qBlock.className = 'question-block';
        qBlock.id = `q-block-${index}`;
        
        let contentHtml = "";

        // TRƯỜNG HỢP: Câu hỏi Đúng/Sai (Chùm 4 ý)
        if (data.subQuestions) {
            contentHtml = data.subQuestions.map((sub, subIdx) => `
                <div class="sub-q-group" id="q-${index}-sub-${subIdx}">
                    <div class="sub-q-text">${sub.label}. ${escapeHtml(sub.content)}</div>
                    <div class="ds-row">
                        <div class="option-item" onclick="handleDSSelect(this, ${index}, ${subIdx}, 'Đúng')">Đúng</div>
                        <div class="option-item" onclick="handleDSSelect(this, ${index}, ${subIdx}, 'Sai')">Sai</div>
                    </div>
                </div>`).join('');
        } 
        // TRƯỜNG HỢP: Câu hỏi Trắc nghiệm (1 đáp án)
        else {
            const opts = data.options;
            // Chuyển đổi options từ Object hoặc Array sang dạng danh sách chuẩn [key, value]
            const entries = Array.isArray(opts) ? opts.map((v, i) => [String.fromCharCode(97 + i), v]) : Object.entries(opts);
            
            contentHtml = `<div class="option-list">` + 
                entries.map(([key, val]) => 
                    `<div class="option-item" onclick="handleSelect(this, ${index}, '${key}')">${escapeHtml(val)}</div>`
                ).join('') + `</div>`;
        }

        qBlock.innerHTML = `
            <div class="question-text">Câu ${index + 1}: ${escapeHtml(data.question)}</div>
            ${contentHtml}
        `;
        feed.appendChild(qBlock);
    });

    document.getElementById('total-count').innerText = userQuestions.length;
    updateProgress();
}

/**
 * XỬ LÝ CHỌN TRẮC NGHIỆM
 */
function handleSelect(el, qIdx, key) {
    const block = document.getElementById(`q-block-${qIdx}`);
    if (block.classList.contains('completed')) return; // Nếu đã xong thì không cho bấm nữa

    const data = userQuestions[qIdx];
    // Tìm đáp án đúng (tự động khớp giữa Text và Key a, b, c, d)
    const correctKey = Array.isArray(data.options) 
        ? String.fromCharCode(97 + data.options.indexOf(data.answer)) 
        : Object.keys(data.options).find(k => data.options[k] === data.answer);

    // Xóa màu cũ nếu người dùng chọn lại
    block.querySelectorAll('.option-item').forEach(i => i.classList.remove('wrong', 'correct'));

    if (key === correctKey) {
        el.classList.add('correct'); 
        block.classList.add('completed'); // Kích hoạt hiệu ứng mờ nhẹ trong CSS
        score++; 
        correctCount++; 
        updateProgress(); 
        checkEnd();
    } else {
        el.classList.add('wrong'); // Chọn sai thì hiện đỏ nhưng không khóa
    }
}

/**
 * XỬ LÝ CHỌN ĐÚNG/SAI
 */
function handleDSSelect(el, qIdx, subIdx, choice) {
    const group = document.getElementById(`q-${qIdx}-sub-${subIdx}`);
    if (group.classList.contains('sub-completed')) return;

    // Reset màu trong 2 nút Đúng/Sai của hàng đó
    group.querySelectorAll('.option-item').forEach(i => i.classList.remove('wrong', 'correct'));

    if (choice === userQuestions[qIdx].subQuestions[subIdx].answer) {
        el.classList.add('correct'); 
        group.classList.add('sub-completed'); // Khóa hàng nhỏ này lại
        score += 0.25; // Mỗi ý đúng được 0.25 điểm
        
        // Kiểm tra nếu đã hoàn thành cả 4 ý của câu lớn
        const parent = document.getElementById(`q-block-${qIdx}`);
        if (parent.querySelectorAll('.sub-completed').length === 4) {
            parent.classList.add('completed');
            correctCount++; 
            updateProgress(); 
            checkEnd();
        }
    } else {
        el.classList.add('wrong'); // Sai thì hiện đỏ cho chọn lại
    }
}

/**
 * CẬP NHẬT THANH TIẾN ĐỘ VÀ ĐIỂM SỐ REAL-TIME
 */
function updateProgress() {
    const percent = (correctCount / userQuestions.length) * 100 || 0;
    progressBar.style.width = percent + "%";
    document.getElementById('current-count').innerText = correctCount;
    // Làm tròn điểm đến 2 chữ số thập phân
    document.getElementById('live-score').innerText = Math.round(score * 100) / 100;
}

/**
 * KIỂM TRA HOÀN THÀNH BÀI THI
 */
function checkEnd() { 
    if (correctCount === userQuestions.length) {
        setTimeout(showResults, 800); 
    }
}

/**
 * HIỂN THỊ MÀN HÌNH KẾT QUẢ
 */
function showResults() {
    quizScreen.classList.add('hidden'); 
    resultScreen.classList.remove('hidden');
    document.getElementById('final-score').innerText = Math.round(score * 100) / 100 + "/" + userQuestions.length;
}

/**
 * CHƠI LẠI
 */
function restartQuiz() { 
    location.reload(); 
}
