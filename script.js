:root {
    --primary: #3498db;
    --primary-dark: #2980b9;
    --secondary: #9b59b6;
    --secondary-dark: #8e44ad;
    --success: #2ecc71;
    --error: #e74c3c;
    --bg: #f0f4f8;
    --text: #2d3436;
    --radius: 14px;
}

/* CHÈN THÊM: CSS CHO NÚT HOME */
#btn-home {
    position: absolute;
    top: 15px;
    left: 15px;
    z-index: 999;
    padding: 8px 15px;
    background: #fff;
    border: 1px solid #ddd;
    border-radius: 20px;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    transition: 0.3s;
}
#btn-home:hover {
    background: #f1f1f1;
}

/* GIỮ NGUYÊN TOÀN BỘ CSS CŨ CỦA BẠN */
* { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }

body {
    font-family: 'Inter', sans-serif;
    background-color: var(--bg);
    color: var(--text);
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 15px;
}

.container {
    background: #fff;
    width: 100%;
    max-width: 600px;
    border-radius: var(--radius);
    box-shadow: 0 15px 35px rgba(0,0,0,0.1);
    overflow: hidden;
    position: relative;
    animation: fadeIn 0.5s ease-out;
}

@keyframes fadeIn {
    from { opacity: 0; transform: translateY(15px); }
    to { opacity: 1; transform: translateY(0); }
}

.hidden { display: none !important; }

#loading-screen { padding: 40px; text-align: center; }
.app-title { color: var(--primary); font-weight: 800; letter-spacing: -1px; margin-bottom: 10px; }
#status-text { margin-bottom: 20px; color: #636e72; font-weight: 500;}

.setup-group { margin: 20px 0; padding: 15px; background: #f8fafc; border-radius: 10px; display: flex; justify-content: center; }
.mode-buttons { display: flex; flex-direction: column; gap: 15px; }

.toggle-switch { display: flex; align-items: center; cursor: pointer; font-weight: 600; }
.toggle-switch input { width: 20px; height: 20px; margin-right: 10px; accent-color: var(--primary); }

.quiz-header { padding: 20px 20px 10px; border-bottom: 1px solid #f0f0f0; }
.progress-bg { background: #edf2f7; height: 10px; border-radius: 10px; margin-bottom: 15px; overflow: hidden; }
#progress-bar { 
    background: linear-gradient(90deg, var(--primary), #a29bfe, var(--success)); 
    height: 100%;
    width: 0%;
    transition: width 0.4s cubic-bezier(0.25, 1, 0.5, 1); 
}

.stats-bar { display: flex; justify-content: space-between; font-size: 0.85rem; font-weight: 800; color: #7f8c8d; }
#live-score { color: var(--success); font-size: 1rem; }

.quiz-body { padding: 20px; }
#question { font-size: 1.25rem; font-weight: 700; margin-bottom: 25px; color: #1a202c; line-height: 1.5; }

.option-item {
    border: 2px solid #e2e8f0;
    border-radius: var(--radius); 
    padding: 16px;
    margin-bottom: 12px;
    cursor: pointer; 
    display: flex;
    align-items: center; 
    font-weight: 500;
    background: #fff;
    position: relative;
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

@media (hover: hover) {
    .option-item:hover {
        border-color: var(--primary);
        background-color: #f0f7ff;
        transform: translateX(5px);
    }
}

.option-item input { margin-right: 15px; width: 20px; height: 20px; flex-shrink: 0; accent-color: var(--primary); }

.option-item.correct { 
    background-color: #defadb !important; 
    border-color: var(--success) !important; 
    color: #1c451d;
    transform: scale(1.05) !important;
    z-index: 10;
    box-shadow: 0 10px 25px rgba(46, 204, 113, 0.4);
    font-weight: 700;
}

.option-item.wrong { 
    background-color: #fff5f5 !important; 
    border-color: var(--error) !important; 
    color: #611b1b;
}

.option-item.dimmed {
    opacity: 0.3;
    filter: grayscale(100%);
    transform: scale(0.95);
    pointer-events: none;
}

.quiz-footer { padding: 15px 20px; background: #f8fafc; text-align: right; }

.btn-start, #submit {
    border: none;
    color: white;
    padding: 14px 30px;
    border-radius: 10px;
    cursor: pointer;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 1px;
    width: 100%;
    transition: transform 0.1s;
    position: relative;
}

.btn-primary, #submit { background: var(--primary); box-shadow: 0 5px 0 var(--primary-dark); }
.btn-primary:active, #submit:active { transform: translateY(3px); box-shadow: 0 2px 0 var(--primary-dark); }

.btn-secondary { background: var(--secondary); box-shadow: 0 5px 0 var(--secondary-dark); }
.btn-secondary:active { transform: translateY(3px); box-shadow: 0 2px 0 var(--secondary-dark); }

#submit:disabled { background: #cbd5e0; box-shadow: 0 5px 0 #a0aec0; cursor: not-allowed; transform: none; }

#result-screen { padding: 30px; text-align: center; }
.result-title { color: #2d3436; font-weight: 800; margin-bottom: 5px; }
#final-score { font-size: 4rem; color: var(--primary); font-weight: 800; margin: 10px 0; }
.review-title { color: #636e72; font-weight: 600; margin-bottom: 15px; }

#review-container { 
    max-height: 350px;
    overflow-y: auto;
    text-align: left;
    padding-right: 10px;
    margin-top: 10px;
}

#review-container::-webkit-scrollbar { width: 6px; }
#review-container::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 10px; }
#review-container::-webkit-scrollbar-thumb { background: #cbd5e0; border-radius: 10px; }

@media (max-width: 480px) {
    .quiz-body { padding: 15px; }
    #question { font-size: 1.1rem; }
    .btn-start, #submit { width: 100%; }
}
