/* =====================================================
   HTML Mastery Quiz & Challenge Platform - Frontend Logic
   ===================================================== */

const API_URL = '/api';

let state = {
    screen: 'auth',
    authMode: 'login',
    user: null,
    token: localStorage.getItem('token'),
    sessions: [
        { id: 1, title: 'أساسيات HTML', desc: 'هيكل الصفحة، العناوين، والفقرات', unlocked: true },
        { id: 2, title: 'الروابط والصور', desc: 'إضافة التفاعل والوسائط', unlocked: false },
        { id: 3, title: 'الجداول والقوائم', desc: 'تنظيم البيانات والمحتوى', unlocked: false },
        { id: 4, title: 'النماذج والعناصر الدلالية', desc: 'بناء واجهات تفاعلية', unlocked: false },
    ],
    currentChallenge: null,
    builderCode: []
};

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {

    initAuth();
    initEditorUI();

    // Back Buttons
    const backCategory = document.getElementById('btn-back-category');
    if (backCategory) backCategory.onclick = () => showScreen('dashboard');

    const backQuiz = document.getElementById('btn-back-quiz');
    if (backQuiz) backQuiz.onclick = () => {
        if (confirm('هل تريد حقاً إلغاء الاختبار؟')) showScreen('dashboard');
    };

    const backChallenge = document.getElementById('btn-back-challenge');
    if (backChallenge) backChallenge.onclick = () => showScreen('category');

    const backAdmin = document.getElementById('btn-back-admin');
    if (backAdmin) backAdmin.onclick = () => showScreen('dashboard');

    const adminLogout = document.getElementById('btn-admin-logout');
    if (adminLogout) adminLogout.onclick = () => logout();

    if (!localStorage.getItem('appLang')) {
        localStorage.setItem('appLang', 'ar');
    }
    if (state.token) {
        fetchUserProgress().then(() => {
            if (!state.user) return;
            const lastScreen = localStorage.getItem('lastScreen');
            if (lastScreen && lastScreen !== 'auth' && lastScreen !== 'quiz') {
                showScreen(lastScreen);
            } else {
                showScreen('dashboard');
            }
        });
    } else {
        showScreen('auth');
    }
});

// --- Navigation ---
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screenEl = document.getElementById(`screen-${screenId}`);
    if (screenEl) {
        screenEl.classList.add('active');
        state.screen = screenId;
        localStorage.setItem('lastScreen', screenId);
    }
}

// --- Auth Logic ---
function initAuth() {
    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const authForm = document.getElementById('auth-form');
    const btnAuth = document.getElementById('btn-auth');

    tabLogin.addEventListener('click', () => {
        state.authMode = 'login';
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
        btnAuth.textContent = 'تسجيل الدخول';
    });

    tabRegister.addEventListener('click', () => {
        state.authMode = 'register';
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
        btnAuth.textContent = 'إنشاء حساب';
    });

    authForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const route = state.authMode === 'login' ? '/auth/login' : '/auth/register';

        try {
            const res = await fetch(`${API_URL}${route}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            if (res.ok) {
                state.token = data.token;
                localStorage.setItem('token', data.token);
                state.user = data.user;
                if (data.user.role === 'Admin') {
                    initAdminDashboard();
                } else {
                    renderDashboard();
                }
            } else {
                showAuthError(data.message || 'فشل تسجيل الدخول');
            }
        } catch (err) {
            showAuthError('تعذر الاتصال بالخادم');
        }
    });
}

function showAuthError(msg) {
    const err = document.getElementById('auth-error');
    err.textContent = msg;
    err.classList.remove('hidden');
}

// --- Dashboard Logic ---
async function fetchUserProgress() {
    try {
        const res = await fetch(`${API_URL}/progress`, {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        const data = await res.json();
        if (res.ok) {
            state.user = data;
            renderDashboard(false); // Only prepare data, don't switch screen yet
            return data;
        } else {
            console.error('[Auth] Progress fetch failed, clearing session.');
            localStorage.removeItem('token');
            state.token = null;
            showScreen('auth');
        }
    } catch (err) {
        showScreen('auth');
    }
}

function renderDashboard(switchScreen = true) {
    if (!state.user) return;
    console.log('[Dashboard] Rendering for user:', state.user.username);
    if (switchScreen) showScreen('dashboard');
    document.getElementById('user-display').textContent = state.user.username;

    const adminNavBtn = document.getElementById('btn-admin-nav');
    if (adminNavBtn) {
        if (state.user.role === 'Admin') {
            adminNavBtn.classList.remove('hidden');
            adminNavBtn.onclick = () => {
                initAdminDashboard();
            };
        } else {
            adminNavBtn.classList.add('hidden');
        }
    }

    // Only display pts for students (safeguard)
    const ptsCount = document.getElementById('user-points');
    if (ptsCount) ptsCount.textContent = state.user.points || 0;

    const ptsDisplay = document.getElementById('user-points-display');
    if (state.user.role === 'Admin') {
        if (ptsDisplay) ptsDisplay.style.display = 'none';
    } else {
        if (ptsDisplay) ptsDisplay.style.display = 'inline-block';
    }

    const grid = document.querySelector('.sessions-grid');
    grid.innerHTML = '';

    state.sessions.forEach(session => {
        const userCurrentSession = state.user.currentSession || 1;
        const isUnlocked = session.id <= userCurrentSession;
        const quizId = `q_s${session.id}`;

        // تحديات الجلسة الأربعة: s1c1, s1c2, s1c3, s1c4 إلخ
        const allChallengeIds = [
            `s${session.id}c1`,
            `s${session.id}c2`,
            `s${session.id}c3`,
            `s${session.id}c4`
        ];

        const isCompleted = (state.user.completedQuizzes || []).includes(quizId);
        const quizScore = state.user.quizScores ? state.user.quizScores[quizId] : null;

        // تحقق من أن جميع التحديات الأربعة مكتملة
        const completedChallenges = state.user.completedChallenges || [];
        const challengeDone = allChallengeIds.every(id => completedChallenges.includes(id));

        // حساب عدد التحديات المكتملة من 4
        const completeCount = allChallengeIds.filter(id => completedChallenges.includes(id)).length;
        const challengeProgressText = `${completeCount}/4`;

        const card = document.createElement('div');
        card.className = `session-card ${isUnlocked ? '' : 'locked'} ${isCompleted ? 'completed' : ''}`;
        card.style.animationDelay = `${session.id * 0.1}s`; // Staggered bouncy entrance

        let statusHtml = isUnlocked ? 'مفتوحة' : '🔒 مقفولة';
        if (isCompleted && challengeDone) {
            statusHtml = `<div class="completion-badge">✅ مكتمل</div>`;
        }

        const quizScoreDisplay = (quizScore !== null && quizScore !== undefined) ? `${quizScore}%` : '---';

        card.innerHTML = `
            <div class="session-info">
                <h3>الجلسة ${session.id}: ${session.title}</h3>
                <p>${session.desc}</p>
                <div class="session-progress-markers">
                    <div class="marker-group">
                        <span class="marker-label">⭐ النتيجة في النظري</span>
                        <span class="marker-val ${quizScore >= 50 ? 'passed' : (quizScore !== null ? 'failed' : '')}">
                            ${quizScoreDisplay}
                        </span>
                    </div>
                    <div class="marker-group">
                        <span class="marker-label">🛠️ التحدي العملي</span>
                        <span class="marker-val ${challengeDone ? 'passed' : ''}">
                            ${challengeDone ? '✅ مكتمل' : `${completeCount > 0 ? '⏳ ' + challengeProgressText : 'قيد الانتظار'}`}
                        </span>
                    </div>
                </div>
            </div>
            <div class="session-status">
                ${statusHtml}
                ${(!isUnlocked && session.id > 1) ? `<div class="lock-reason">أكمل الجلسة ${session.id - 1} أولاً</div>` : ''}
            </div>
        `;
        if (isUnlocked) {
            card.onclick = () => startSession(session.id);
        } else {
            card.onclick = () => alert(`🔒 عذراً، يجب عليك إكمال الجلسة ${Math.max(0, session.id - 1)} أولاً.`);
        }
        grid.appendChild(card);
    });
}

// --- Quiz System ---
let quizState = {
    questions: [],
    currentIndex: 0,
    userAnswers: [], // Store { questionIndex, selectedAnswer, isCorrect }
    score: 0,
    timer: null,
    timeLeft: 30,
    startTime: null,
    sessionId: null
};


function renderQuestion() {
    const q = quizState.questions[quizState.currentIndex];

    // Update labels
    document.getElementById('q-current').textContent = quizState.currentIndex + 1;
    document.getElementById('q-total').textContent = quizState.questions.length;
    document.getElementById('category-badge').textContent = q.category || 'HTML';
    document.getElementById('question-text').textContent = q.question;

    // Progress Bar
    const progressPct = ((quizState.currentIndex) / quizState.questions.length) * 100;
    document.getElementById('progress-pct').textContent = `${Math.round(progressPct)}%`;
    document.getElementById('progress-fill').style.width = `${progressPct}%`;

    // دالة لعشولة الخيارات عشوائياً
    function shuffleChoices(choices) {
        const shuffled = [...choices];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // عشول الخيارات
    const shuffledChoices = shuffleChoices(q.choices);

    // Options
    const optionsGrid = document.getElementById('options-grid');
    optionsGrid.innerHTML = '';

    shuffledChoices.forEach((choice, idx) => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        const letter = String.fromCharCode(65 + idx); // A, B, C, D
        btn.innerHTML = `
            <div class="option-letter">${letter}</div>
            <span class="option-text"></span>
            <div class="option-icon"></div>
        `;
        btn.querySelector('.option-text').textContent = choice;
        btn.onclick = () => selectOption(choice, btn);
        optionsGrid.appendChild(btn);
    });

    // Reset UI
    document.getElementById('explanation-box').classList.add('hidden');
    document.getElementById('btn-confirm').disabled = true;
    document.getElementById('btn-confirm').classList.remove('hidden');
    document.getElementById('btn-next').classList.add('hidden');
    document.getElementById('btn-prev').disabled = quizState.currentIndex === 0;

    startTimer();
}

function startTimer() {
    clearInterval(quizState.timer);
    quizState.timeLeft = 30;
    document.getElementById('timer-display').textContent = quizState.timeLeft;

    quizState.timer = setInterval(() => {
        quizState.timeLeft--;
        document.getElementById('timer-display').textContent = quizState.timeLeft;
        if (quizState.timeLeft <= 0) {
            clearInterval(quizState.timer);
            autoConfirm();
        }
    }, 1000);
}

function selectOption(choice, btn) {
    document.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    quizState.selectedChoice = choice;
    document.getElementById('btn-confirm').disabled = false;
}

function autoConfirm() {
    const q = quizState.questions[quizState.currentIndex];

    if (!quizState.selectedChoice) {
        // الوقت انتهى بدون اختيار - أظهر الإجابة الصحيحة مباشرة (0 نقاط)
        console.log(`⏱️ [AUTO] انتهى الوقت! الإجابة الصحيحة: ${q.correctAnswer}`);

        // سجل الإجابة الخاطئة (لم يختر شيء)
        quizState.userAnswers[quizState.currentIndex] = {
            question: q.question,
            selected: '❌ لم يتم اختيار إجابة (انتهى الوقت)',
            correct: q.correctAnswer,
            isCorrect: false,
            isTimeout: true
        };

        // اعرض الإجابة الصحيحة
        document.querySelectorAll('.option-btn').forEach(btn => {
            const text = btn.querySelector('.option-text').textContent;
            btn.style.pointerEvents = 'none';
            btn.style.opacity = '0.5'; // Variable أخف للإجابات الأخرى
            if (text === q.correctAnswer) {
                btn.classList.add('correct');
                btn.style.opacity = '1'; // الصحيحة واضحة
            }
        });

        // اعرض شرح + رسالة المهلة
        document.getElementById('explanation-text').innerHTML = `
            <div style="color: #ef4444; font-weight: bold; margin-bottom: 10px;">⏱️ انتهت مهلة الوقت!</div>
            <div style="color: #22c55e; font-weight: bold; margin-bottom: 10px;">✅ الإجابة الصحيحة: <strong>${q.correctAnswer}</strong></div>
            <div style="color: #6b7280;">${q.explanation}</div>
        `;
        document.getElementById('explanation-box').classList.remove('hidden');

        document.getElementById('btn-confirm').classList.add('hidden');
        document.getElementById('btn-next').classList.remove('hidden');
    } else {
        // اختار إجابة - تحقق منها عادياً
        confirmAnswer();
    }
}

document.getElementById('btn-confirm').onclick = () => confirmAnswer();

function confirmAnswer(forcedChoice = undefined) {
    clearInterval(quizState.timer);
    const q = quizState.questions[quizState.currentIndex];
    const selected = forcedChoice !== undefined ? forcedChoice : quizState.selectedChoice;
    const isCorrect = selected === q.correctAnswer;

    if (isCorrect) quizState.score++;

    quizState.userAnswers[quizState.currentIndex] = {
        question: q.question,
        selected: selected,
        correct: q.correctAnswer,
        isCorrect: isCorrect
    };

    // Show feedback
    document.querySelectorAll('.option-btn').forEach(btn => {
        const text = btn.querySelector('.option-text').textContent;
        btn.style.pointerEvents = 'none';
        if (text === q.correctAnswer) {
            btn.classList.add('correct');
        } else if (text === selected && !isCorrect) {
            btn.classList.add('wrong');
        }
    });

    // Show Explanation
    document.getElementById('explanation-text').textContent = q.explanation;
    document.getElementById('explanation-box').classList.remove('hidden');

    document.getElementById('btn-confirm').classList.add('hidden');
    document.getElementById('btn-next').classList.remove('hidden');

    // Update answered count
    document.getElementById('answered-count').textContent = quizState.userAnswers.filter(a => a).length;
}

document.getElementById('btn-next').onclick = () => {
    quizState.currentIndex++;
    if (quizState.currentIndex < quizState.questions.length) {
        renderQuestion();
    } else {
        showResults();
    }
};

document.getElementById('btn-prev').onclick = () => {
    if (quizState.currentIndex > 0) {
        quizState.currentIndex--;
        renderQuestion();
        // Note: In a real system you'd handle showing the already answered state
    }
};

async function showResults() {
    showScreen('results');
    const total = quizState.questions.length;
    const pct = Math.round((quizState.score / total) * 100);

    const scorePct = Math.round((quizState.score / quizState.questions.length) * 100);
    const passThreshold = 50;
    const isPassed = scorePct >= passThreshold;

    // عدد النجوم
    const starsCount = Math.min(5, Math.ceil((quizState.score / quizState.questions.length) * 5) || 1);
    const stars = '⭐'.repeat(starsCount);

    // تحديث واجهة النتائج
    document.querySelector('.trophy-icon').textContent = isPassed ? '🏆' : '💪';
    document.querySelector('.results-title').textContent = isPassed ? 'شكراً على المحاولة!' : 'حاول مرة أخرى';

    // رسالة مفصلة عن الدرجة
    let resultMessage = `درجتك النهائية: <strong>${quizState.score}/${quizState.questions.length}</strong> (${scorePct}%)`;
    if (isPassed) {
        resultMessage += ` ✅ - لقد اجتزت الاختبار بنجاح!`;
    } else {
        resultMessage += ` ❌ - تحتاج إلى ${passThreshold}% على الأقل للاجتياز.`;
    }

    document.querySelector('.results-sub').innerHTML = resultMessage;

    // عرض الإحصائيات
    document.getElementById('stat-pct').textContent = `${scorePct}%`;
    document.getElementById('stat-score').textContent = `${quizState.score}/${quizState.questions.length}`;

    // تنسيق الوقت
    const timeSpent = Math.floor((Date.now() - quizState.startTime) / 1000);
    const mins = Math.floor(timeSpent / 60);
    const secs = timeSpent % 60;
    document.getElementById('stat-time').textContent = `${mins}:${secs.toString().padStart(2, '0')}`;

    // إضافة النجوم
    const trophyWrap = document.querySelector('.trophy-wrap');
    let starsDiv = trophyWrap.querySelector('.stars-display');
    if (!starsDiv) {
        starsDiv = document.createElement('div');
        starsDiv.className = 'stars-display';
        starsDiv.style.fontSize = '2rem';
        starsDiv.style.marginTop = '1rem';
        trophyWrap.appendChild(starsDiv);
    }
    starsDiv.textContent = stars;

    const reviewList = document.getElementById('answers-review');
    reviewList.innerHTML = `<h3 style="margin-bottom:1rem; color:#fff;">📋 تفصيل الإجابات:</h3>`;
    quizState.userAnswers.forEach((ans, i) => {
        const div = document.createElement('div');
        div.className = `review-item ${ans.isCorrect ? 'correct' : 'wrong'}`;
        div.innerHTML = `
            <div class="review-content">
                <p class="review-q"><strong>السؤال ${i + 1}:</strong> ${ans.question}</p>
                <div class="review-meta">
                    <span class="${ans.isCorrect ? 'answer-correct' : 'answer-wrong'}">إجابتك: </span>
                    <span class="choice-text"></span>
                    ${!ans.isCorrect ? `<br><span class="answer-correct">الإجابة الصحيحة: </span><span class="correct-text"></span>` : ''}
                </div>
            </div>
            <span class="review-icon">${ans.isCorrect ? '✅' : '❌'}</span>
        `;
        div.querySelector('.review-q').textContent = `س${i + 1}: ${ans.question}`;
        div.querySelector('.choice-text').textContent = ans.selected || 'لم يتم الاختيار';
        if (!ans.isCorrect) {
            div.querySelector('.correct-text').textContent = ans.correct;
        }
        reviewList.appendChild(div);
    });

    // حفظ التقدم والنقاط في الخادم
    try {
        console.log(`Sending quiz results for session ${quizState.sessionId}: ${quizState.score}/${quizState.questions.length}`);
        const res = await fetch(`${API_URL}/progress/quiz`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
            },
            body: JSON.stringify({
                sessionId: quizState.sessionId,
                score: quizState.score,
                totalQuestions: quizState.questions.length
            })
        });

        if (res.ok) {
            console.log('Quiz progress saved successfully. Now unlocking session...');
            // فتح الجلسة التالية فقط إذا اجتاز الاختبار
            const unlockRes = await fetch(`${API_URL}/progress/unlock-session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${state.token}`
                },
                body: JSON.stringify({ quizScore: scorePct })
            });

            if (unlockRes.ok) {
                console.log('Session unlocking logic executed.');
            }

            // تحديث البيانات النهائي
            await fetchUserProgress();
        } else {
            console.error('Failed to save quiz progress:', await res.text());
        }
    } catch (err) {
        console.error('Error during quiz submission flow:', err);
    }
}

document.getElementById('btn-restart').onclick = () => {
    showScreen('dashboard');
    renderDashboard();
};

// --- Session Management ---
function startSession(id) {
    showCategories(id);
}

async function showCategories(sessionId) {
    try {
        const res = await fetch(`${API_URL}/progress/quiz-data/${sessionId}`, {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        const data = await res.json();

        // Fetch challenges to see how many we have
        const chalRes = await fetch(`${API_URL}/progress/challenge-data/${sessionId}`, {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        const challenges = await chalRes.json();

        showScreen('category');
        const grid = document.getElementById('categories-grid');

        let html = `
            <div class="category-card" onclick="startQuiz(${sessionId})">
                <div class="category-icon">📝</div>
                <h3>اختبار نظري شامل</h3>
                <p>اختبر معلوماتك في مفاهيم هذه الجلسة</p>
                <div class="category-type">نظري</div>
            </div>
        `;

        if (Array.isArray(challenges)) {
            challenges.forEach((chal, index) => {
                html += `
                    <div class="category-card" onclick="openSpecificChallenge(${sessionId}, ${index})">
                        <div class="category-icon">🛠️</div>
                        <h3>${chal.title}</h3>
                        <p>${chal.description}</p>
                        <div class="category-type">تحدي عملي</div>
                    </div>
                `;
            });
        }

        grid.innerHTML = html;
    } catch (err) {
        console.error(err);
        alert('تعذر تحميل بيانات الجلسة');
    }
}

async function openSpecificChallenge(sessionId, index) {
    try {
        const res = await fetch(`${API_URL}/progress/challenge-data/${sessionId}`, {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        const challenges = await res.json();
        const data = challenges[index];

        console.log('[Challenge Debug] Loaded data:', data);

        if (!data || (!data.id && !data.challengeId)) {
            alert('لا يوجد تحدي متاح لهذه الجلسة حالياً.');
            return;
        }

        // Standardize the id
        data.id = data.id || data.challengeId;

        state.currentChallenge = data;
        document.getElementById('challenge-title').textContent = data.title;
        document.getElementById('challenge-desc').textContent = data.description;
        state.builderCode = [];
        renderEditor();
        showScreen('challenge');
    } catch (err) {
        console.error('Challenge Load Error:', err);
        alert(`تعذر تحميل التحدي: ${err.message}`);
    }
}

async function startQuiz(sessionId, categoryFilter = null) {
    try {
        const res = await fetch(`${API_URL}/progress/quiz-data/${sessionId}`, {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        let data = await res.json();

        if (categoryFilter) {
            data = data.filter(q => q.category === categoryFilter);
        }

        if (data.length === 0) {
            alert('لا توجد أسئلة متاحة حالياً.');
            return;
        }

        quizState = {
            questions: data,
            currentIndex: 0,
            userAnswers: [],
            score: 0,
            timeLeft: 30,
            startTime: Date.now(),
            sessionId: sessionId
        };

        showScreen('quiz');
        renderQuestion();
    } catch (err) {
        alert('تعذر تحميل الأسئلة');
    }
}

// loadChallenge is deprecated in favor of openSpecificChallenge

function renderEditor() {
    const canvas = document.getElementById('editor-canvas');
    canvas.innerHTML = '';
    state.builderCode.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'editor-item';

        itemDiv.innerHTML = `
            <div class="item-content">
                <span class="code-tag"></span>
            </div>
            <div class="item-controls">
                <button class="control-btn move-up" title="Move Up">🔼</button>
                <button class="control-btn move-down" title="Move Down">🔽</button>
                <button class="control-btn delete" title="Delete">🗑️</button>
            </div>
        `;

        const span = itemDiv.querySelector('.code-tag');
        span.textContent = item;

        // Click to Edit for BOTH tags and text
        span.onclick = (e) => {
            e.stopPropagation();
            const newValue = prompt('Edit Code:', item);
            if (newValue !== null && newValue.trim() !== "") {
                state.builderCode[index] = newValue;
                renderEditor();
            } else if (newValue === "") {
                if (confirm("حذف هذا الجزء؟")) {
                    state.builderCode.splice(index, 1);
                    renderEditor();
                }
            }
        };

        // Manual controls as backup to D&D
        itemDiv.querySelector('.move-up').onclick = (e) => {
            e.stopPropagation();
            if (index > 0) {
                const temp = state.builderCode[index];
                state.builderCode[index] = state.builderCode[index - 1];
                state.builderCode[index - 1] = temp;
                renderEditor();
            }
        };

        itemDiv.querySelector('.move-down').onclick = (e) => {
            e.stopPropagation();
            if (index < state.builderCode.length - 1) {
                const temp = state.builderCode[index];
                state.builderCode[index] = state.builderCode[index + 1];
                state.builderCode[index + 1] = temp;
                renderEditor();
            }
        };

        itemDiv.querySelector('.delete').onclick = (e) => {
            e.stopPropagation();
            if (confirm(`حذف هذا العنصر؟`)) {
                state.builderCode.splice(index, 1);
                renderEditor();
            }
        };

        itemDiv.setAttribute('draggable', true);
        itemDiv.dataset.index = index;

        itemDiv.addEventListener('dragstart', (e) => {
            e.stopPropagation();
            itemDiv.classList.add('dragging');
            e.dataTransfer.setData('sourceIndex', index);
            e.dataTransfer.effectAllowed = 'move';
        });

        itemDiv.addEventListener('dragend', () => {
            itemDiv.classList.remove('dragging');
        });

        itemDiv.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
        });

        itemDiv.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const sourceIndex = parseInt(e.dataTransfer.getData('sourceIndex'));
            if (isNaN(sourceIndex) || sourceIndex === index) return;

            const movedItem = state.builderCode.splice(sourceIndex, 1)[0];
            state.builderCode.splice(index, 0, movedItem);
            renderEditor();
        });

        canvas.appendChild(itemDiv);
    });
    updatePreview();
}

function updatePreview() {
    const iframe = document.getElementById('preview-iframe');
    const code = state.builderCode.join('');
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(`<html><body style="font-family: sans-serif; direction: rtl; padding: 20px;">${code}</body></html>`);
    doc.close();
}

document.querySelectorAll('.tag-button').forEach(btn => {
    btn.onclick = () => {
        const tag = btn.dataset.tag;

        if (tag === "!DOCTYPE html") {
            state.builderCode.push(`<!DOCTYPE html>`);
        } else if (['img', 'input', 'br', 'hr', 'meta', 'link', 'source', 'area', 'wbr', 'embed', 'param', 'track'].includes(tag)) {
            state.builderCode.push(`<${tag}>`);
        } else if (tag === "!-- content --") {
            state.builderCode.push(`<!-- اكتب تعليقك هنا -->`);
        } else {
            // Paired tags
            let defaultText = "";
            const textTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'b', 'strong', 'i', 'em', 'small', 'u', 'mark', 'sub', 'sup', 'title', 'button', 'label', 'a', 'option', 'summary', 'caption'];
            if (textTags.includes(tag)) {
                defaultText = "نص جديد";
            }

            state.builderCode.push(`<${tag}>`);
            if (defaultText) state.builderCode.push(defaultText);
            state.builderCode.push(`</${tag}>`);
        }
        renderEditor();
    };
});


document.getElementById('btn-clear-code').onclick = () => {
    state.builderCode = [];
    renderEditor();
};

document.getElementById('btn-check-solution').onclick = async () => {
    // دالة تنظيف ذكية للكود
    function cleanCode(code) {
        return code
            // إصلاح الأخطاء الإملائية
            .replace(/<titel>/gi, '<title>')
            .replace(/<\/titel>/gi, '</title>')
            // إزالة escaped quotes وتحويلها لنقاط عادية
            .replace(/\\"/g, '"')
            .replace(/&quot;/g, '"')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            // توحيد علامات الاقتباس (تحويل كل الفواصل العليا للفواصل العادية)
            .replace(/['']/g, '"')
            // إزالة المسافات الكثيرة (اترك واحدة فقط إن وجدت)
            .replace(/\s+/g, ' ')
            // إزالة المسافات حول علامات الـ HTML
            .replace(/\s*([<>])\s*/g, '$1')
            // إزالة المسافات داخل الأقواس المعقوفة
            .replace(/\(\s+/g, '(')
            .replace(/\s+\)/g, ')')
            // توحيد الفواصل: إزالة جميع المسافات
            .replace(/\s+/g, '')
            // تحويل النصوص الإنجليزية فقط لأحرف صغيرة
            .replace(/[A-Z]/g, (match) => match.toLowerCase())
            .toLowerCase();
    }

    const studentRaw = state.builderCode.join('');
    const expectedSolution = state.currentChallenge.expectedSolution;

    // تنظيف كلا الكودين بنفس الطريقة
    const studentCleaned = cleanCode(studentRaw);
    const expectedCleaned = cleanCode(expectedSolution);

    console.log('=== تحليل التحدي ===');
    console.log('التحدي:', state.currentChallenge.title);
    console.log('الكود المدخل (الخام):', studentRaw.substring(0, 150));
    console.log('الكود المتوقع (الخام):', expectedSolution.substring(0, 150));
    console.log('الكود المدخل (نظيف):', studentCleaned.substring(0, 150));
    console.log('الكود المتوقع (نظيف):', expectedCleaned.substring(0, 150));
    console.log('طول الكود المدخل:', studentCleaned.length);
    console.log('طول الكود المتوقع:', expectedCleaned.length);
    console.log('هل يتطابقان؟', studentCleaned === expectedCleaned);

    // المقارنة
    let isSuccess = studentCleaned === expectedCleaned;

    if (isSuccess) {
        console.log('✅ [SUCCESS] التحدي صحيح!');
        showFeedback('✅ صح! (+20 نقطة)', 'success');

        // احتفالية!
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#3b82f6', '#8b5cf6', '#22c55e']
            });
        }

        try {
            console.log('[CHALLENGE] جاري إرسال التحدي المكتمل...');
            console.log('[CHALLENGE] Challenge ID:', state.currentChallenge.id);

            // إرسال التحدي المكتمل للخادم (استخدم الـ ID الكامل من challenges.json)
            const res = await fetch(`${API_URL}/progress/challenge`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${state.token}`
                },
                body: JSON.stringify({ challengeId: state.currentChallenge.id })
            });

            if (res.ok) {
                console.log('[CHALLENGE] تم استقبال التحدي بنجاح');
                const data = await res.json();
                console.log('[CHALLENGE] رد الخادم:', data);

                // فتح الجلسة التالية
                console.log('[UNLOCK] جاري فتح الجلسة التالية...');
                const unlockRes = await fetch(`${API_URL}/progress/unlock-session`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${state.token}`
                    },
                    body: JSON.stringify({})
                });

                if (unlockRes.ok) {
                    console.log('[UNLOCK] تم فتح الجلسة التالية');
                    const unlockData = await unlockRes.json();
                    console.log('[UNLOCK] رد الخادم:', unlockData);
                }

                // تحديث البيانات بالكامل
                console.log('[SYNC] جاري تحديث البيانات...');
                await fetchUserProgress();
                console.log('[SYNC] تم تحديث البيانات');

                // رسالة نجاح إضافية
                setTimeout(() => {
                    showFeedback('🎉 تم الانتقال للتحدي التالي! اضغط السهم للخروج', 'success');
                }, 1500);
            } else {
                console.error('[CHALLENGE] فشل الرد:', res.status, res.statusText);
                const errorText = await res.text();
                console.error('[CHALLENGE] تفاصيل الخطأ:', errorText);
                showFeedback('❌ خطأ في حفظ التحدي', 'error');
            }
        } catch (err) {
            console.error('[ERROR] خطأ عند إرسال التحدي:', err);
            showFeedback('❌ خطأ في الاتصال بالخادم', 'error');
        }
    } else {
        console.log('❌ [FAILED] الكود غير صحيح');
        console.log('الفرق:');
        console.log('- الطول المتوقع:', expectedCleaned.length);
        console.log('- الطول المدخل:', studentCleaned.length);
        showFeedback('❌ الحل غير صحيح', 'error');
    }
};

// --- Admin Logic ---
async function initAdminDashboard() {
    showScreen('admin');
    const res = await fetch(`${API_URL}/admin/students`, {
        headers: { 'Authorization': `Bearer ${state.token}` }
    });
    const students = await res.json();
    const tbody = document.getElementById('student-list-body');
    tbody.innerHTML = '';

    let totalPoints = 0;
    let totalChallenges = 0;
    let totalQuizzes = 0;

    students.forEach((s, idx) => {
        const row = document.createElement('tr');
        const progressPct = Math.round((s.currentSession / 4) * 100);

        // حساب النقاط من الإنجاز
        let earnedPoints = 0;
        let spentPoints = 0;

        // كل اختبار نجح = 50 نقطة
        if (s.quizScores) {
            Object.values(s.quizScores).forEach(score => {
                if (score >= 50) {
                    earnedPoints += 50;
                    totalQuizzes++;
                }
            });
        }

        // كل تحدي = 20 نقطة
        if (s.completedChallenges) {
            earnedPoints += (s.completedChallenges.length * 20);
            totalChallenges += s.completedChallenges.length;
        }

        // النقاط الحالية (ما تبقى بعد الصرف)
        const currentPoints = s.points || 0;
        spentPoints = earnedPoints - currentPoints;

        totalPoints += earnedPoints;

        row.innerHTML = `
            <td style="animation: slideDown ${0.3 + (idx * 0.1)}s ease;">
                <span style="font-weight: 600;">${s.username}</span>
            </td>
            <td style="animation: slideDown ${0.35 + (idx * 0.1)}s ease;">
                الجلسة ${s.currentSession}/4
            </td>
            <td style="animation: slideDown ${0.4 + (idx * 0.1)}s ease;">
                <span class="stat-value" style="-webkit-text-fill-color: #22c55e; font-size: 1.2rem;">+${earnedPoints}</span>
            </td>
            <td style="animation: slideDown ${0.45 + (idx * 0.1)}s ease;">
                <span style="color: #ef4444; font-weight: 600;">-${spentPoints}</span>
            </td>
            <td style="animation: slideDown ${0.5 + (idx * 0.1)}s ease;">
                <span style="background: linear-gradient(135deg, #3b82f6, #8b5cf6); padding: 0.5rem 1rem; border-radius: 8px; font-weight: 600;">💰 ${currentPoints}</span>
            </td>
            <td style="animation: slideDown ${0.55 + (idx * 0.1)}s ease;">
                <div class="progress-bar-mini">
                    <div class="progress-fill-mini" style="width: ${progressPct}%; animation: slideInRight 0.8s ease;"></div>
                </div>
                <span>${progressPct}%</span>
            </td>
            <td style="animation: slideDown ${0.6 + (idx * 0.1)}s ease;">
                ${s.courseCompleted ? '✅ مكتمل' : '⏳ قيد التقدم'}
            </td>
            <td style="animation: slideDown ${0.65 + (idx * 0.1)}s ease;">
                <button class="btn btn-ghost danger btn-sm" onclick="deleteStudent('${s._id}')">🗑️</button>
            </td>
        `;
        tbody.appendChild(row);
    });

    // تحديث الإحصائيات
    document.getElementById('total-students').textContent = students.length;
    document.getElementById('completed-course-count').textContent = students.filter(s => s.courseCompleted).length;

    // إضافة إحصائيات إضافية إن وجدت
    const statsContainer = document.querySelector('.admin-stats');
    if (statsContainer) {
        statsContainer.innerHTML = `
            <div class="stat-card" style="animation: bounceIn 0.6s ease;">
                <div style="font-size: 0.9rem; color: #94a3b8;">إجمالي النقاط المكتسبة</div>
                <div class="stat-value">+${totalPoints}</div>
            </div>
            <div class="stat-card" style="animation: bounceIn 0.6s ease 0.1s backwards;">
                <div style="font-size: 0.9rem; color: #94a3b8;">إجمالي الاختبارات المُكملة</div>
                <div class="stat-value">${totalQuizzes}</div>
            </div>
            <div class="stat-card" style="animation: bounceIn 0.6s ease 0.2s backwards;">
                <div style="font-size: 0.9rem; color: #94a3b8;">إجمالي التحديات المُكملة</div>
                <div class="stat-value">${totalChallenges}</div>
            </div>
            <div class="stat-card" style="animation: bounceIn 0.6s ease 0.3s backwards;">
                <div style="font-size: 0.9rem; color: #94a3b8;">عدد الطلاب</div>
                <div class="stat-value">${students.length}</div>
            </div>
        `;
    }
}

async function deleteStudent(id) {
    if (!confirm('هل أنت متأكد من حذف هذا الطالب نهائياً؟')) return;

    try {
        const res = await fetch(`${API_URL}/admin/students/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        if (res.ok) {
            alert('تم حذف الطالب بنجاح');
            initAdminDashboard();
        } else {
            alert('فشل في حذف الطالب');
        }
    } catch (err) {
        console.error(err);
        alert('خطأ في الاتصال بالخادم');
    }
}

// --- Specialized UI Interactions ---
function initEditorUI() {
    // Accordion Logic
    document.addEventListener('click', (e) => {
        const header = e.target.closest('.tag-header');
        if (header) {
            const cat = header.closest('.tag-cat');
            cat.classList.toggle('expanded');
        }
    });

    // ✨ دالة تصحيح الأخطاء الذكية
    function autoFixCode(code) {
        let fixed = code;

        // 1. تصحيح الأخطاء الإملائية الشائعة
        const commonMistakes = {
            'titel': 'title',
            'titl': 'title',
            'boddy': 'body',
            'hml': 'html',
            'htm': 'html',
            'headd': 'head',
            'parapraph': 'paragraph',
            'pargraph': 'p',
            'brk': 'br',
            'spna': 'span',
            'dvi': 'div',
            'buton': 'button',
            'inpt': 'input',
            'form': 'form',
            'img': 'img',
            'scr': 'src',
            'alt': 'alt',
            'href': 'href'
        };

        for (let mistake in commonMistakes) {
            const regex = new RegExp(`<${mistake}([>\\s/])`, 'gi');
            fixed = fixed.replace(regex, `<${commonMistakes[mistake]}$1`);
            const closeRegex = new RegExp(`</${mistake}>`, 'gi');
            fixed = fixed.replace(closeRegex, `</${commonMistakes[mistake]}>`);
        }

        // 2. إضافة DOCTYPE إذا كان مفقوداً
        if (!fixed.toLowerCase().includes('<!doctype')) {
            fixed = '<!DOCTYPE html>\n' + fixed;
        }

        // 3. التأكد من وجود html و head و body
        if (!fixed.toLowerCase().includes('<html')) {
            fixed = fixed.replace('<title', '<html>\n<head>\n<title');
            fixed = fixed.replace('</title>', '</title>\n</head>\n<body>\n').replace('</body>', '</body>\n</html>');
        }

        // 4. إضافة عناصر مفقودة
        if (!fixed.toLowerCase().includes('<head')) {
            fixed = fixed.replace(/<html[^>]*>/, '<html>\n<head>\n<title>عنوان الصفحة</title>\n</head>\n');
        }

        if (!fixed.toLowerCase().includes('<body')) {
            fixed = fixed.replace(/<\/head>/, '</head>\n<body>');
        }

        // 5. إغلاق العناصر التي لم تُغلق
        const openTags = ['html', 'head', 'body', 'p', 'div', 'section', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];
        openTags.forEach(tag => {
            const regex = new RegExp(`<${tag}([>\\s])`, 'gi');
            if (fixed.match(regex)) {
                const closeTag = `</${tag}>`;
                if (!fixed.toLowerCase().includes(closeTag)) {
                    fixed += `\n${closeTag}`;
                }
            }
        });

        return fixed;
    }

    // 🔄 زر إضافة الكود المكتوب
    document.getElementById('btn-parse-code').onclick = () => {
        const codeInput = document.getElementById('html-code-input').value.trim();

        if (!codeInput) {
            showFeedback('⚠️ الرجاء كتابة بعض الكود أولاً', 'error');
            return;
        }

        // تقسيم الكود إلى أسطر وإزالة الفراغات الزائدة
        const lines = codeInput.split('\n').filter(line => line.trim());

        state.builderCode = [];
        lines.forEach(line => {
            line = line.trim();
            if (line) {
                state.builderCode.push(line);
            }
        });

        renderEditor();
        showFeedback('✅ تم إضافة الكود! تحقق من المعاينة أعلاه', 'success');
        document.getElementById('html-code-input').value = '';
    };

    // 🔧 زر تصحيح الأخطاء التلقائي
    document.getElementById('btn-auto-fix').onclick = () => {
        const codeInput = document.getElementById('html-code-input').value;

        if (!codeInput.trim()) {
            showFeedback('⚠️ الرجاء كتابة كود لتصحيحه', 'error');
            return;
        }

        const fixed = autoFixCode(codeInput);
        document.getElementById('html-code-input').value = fixed;
        showFeedback('🔧 تم تصحيح الأخطاء الشائعة! (يمكنك الآن إضافة الكود)', 'success');
    };

    // Hint Logic - التلميح يظهر فقط بعد الدفع
    const btnShowHint = document.getElementById('btn-show-hint');
    if (btnShowHint) {
        btnShowHint.onclick = async () => {
            if (!state.currentChallenge) {
                showFeedback('❌ لا يوجد تحدي نشط', 'error');
                return;
            }

            const cost = 10;
            let currentPoints = parseInt(state.user.points || 0);

            // التحقق من النقاط أولاً
            if (currentPoints < cost) {
                showFeedback(`⚠️ ليس لديك نقاط كافية (لديك ${currentPoints}، تحتاج ${cost})`, 'error');
                return;
            }

            // طلب تأكيد من المستخدم
            if (!confirm(`هل تريد عرض تلميح مقابل ${cost} نقاط؟\nستتبقى لديك ${currentPoints - cost} نقطة`)) {
                return; // ألغى العملية
            }

            const newPoints = currentPoints - cost;

            try {
                // تحديث النقاط في الخادم أولاً
                const res = await fetch(`${API_URL}/progress/points`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${state.token}`
                    },
                    body: JSON.stringify({ points: newPoints })
                });

                if (res.ok) {
                    // تحديث النقاط محلياً بعد التأكيد من الخادم
                    state.user.points = newPoints;
                    updatePointsUI();

                    // عرض التلميح بعد الدفع مباشرة
                    showFeedback(`💡 تلميح: ${state.currentChallenge.hint}`, 'success', true);
                } else {
                    showFeedback('❌ فشل تحديث النقاط. حاول مرة أخرى', 'error');
                }
            } catch (err) {
                console.error('Error updating points:', err);
                showFeedback('❌ خطأ في الاتصال بالخادم', 'error');
            }
        };
    }

    // Drag and Drop Logic
    document.querySelectorAll('.tag-button').forEach(btn => {
        btn.onclick = () => {
            const tag = btn.dataset.tag;
            insertTagAt(tag, state.builderCode.length); // Direct append
        };

        btn.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('tag', btn.dataset.tag);
        });
    });

    const canvas = document.getElementById('editor-canvas');
    canvas.addEventListener('dragover', (e) => {
        e.preventDefault();
        canvas.classList.add('drag-over');
    });

    canvas.addEventListener('dragleave', () => {
        canvas.classList.remove('drag-over');
    });

    canvas.addEventListener('drop', (e) => {
        e.preventDefault();
        canvas.classList.remove('drag-over');
        const tag = e.dataTransfer.getData('tag');
        if (!tag) return;

        // Determine insertion index based on mouse Y position
        const items = Array.from(canvas.querySelectorAll('.editor-item'));
        let targetIndex = state.builderCode.length;

        for (let i = 0; i < items.length; i++) {
            const rect = items[i].getBoundingClientRect();
            const midpoint = rect.top + rect.height / 2;
            if (e.clientY < midpoint) {
                targetIndex = i;
                break;
            }
        }

        insertTagAt(tag, targetIndex);
    });
}

function insertTagAt(tag, index) {
    const newItems = [];
    if (tag === "all") {
        newItems.push(`<!DOCTYPE html>`);
        newItems.push(`<html>`);
        newItems.push(`<head>`);
        newItems.push(`<title>عنوان الصفحة</title>`);
        newItems.push(`</head>`);
        newItems.push(`<body>`);
        newItems.push(`<h1>مرحباً بكم</h1>`);
        newItems.push(`</body>`);
        newItems.push(`</html>`);
    } else if (tag === "!DOCTYPE html") {
        newItems.push(`<!DOCTYPE html>`);
    } else if (tag === "a") {
        // الرابط مقسوم لثلاث أسطر
        newItems.push(`<a href="#">`);
        newItems.push(`نص الرابط`);
        newItems.push(`</a>`);
    } else if (tag === "img") {
        newItems.push(`<img src="image.png" alt="وصف الصورة" />`);
    } else if (['input', 'br', 'hr', 'meta', 'link', 'source', 'area', 'wbr', 'embed', 'param', 'track'].includes(tag)) {
        newItems.push(`<${tag}>`);
    } else if (tag === "!-- content --") {
        newItems.push(`<!-- اكتب تعليقك هنا -->`);
    } else {
        const textTags = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'b', 'strong', 'i', 'em', 'small', 'u', 'mark', 'sub', 'sup', 'title', 'button', 'label', 'option', 'summary', 'caption'];
        newItems.push(`<${tag}>`);
        if (textTags.includes(tag)) newItems.push("نص جديد");
        newItems.push(`</${tag}>`);
    }

    state.builderCode.splice(index, 0, ...newItems);
    renderEditor();
}

function updatePointsUI() {
    const el = document.getElementById('user-points');
    if (el) el.textContent = state.user.points || 0;
}

function showFeedback(msg, type, persistent = false) {
    const el = document.getElementById('challenge-feedback');
    if (!el) return;

    el.textContent = msg;
    el.className = `challenge-feedback ${type}`;
    el.classList.remove('hidden');

    // Auto-hide only if NOT persistent
    if (!persistent) {
        setTimeout(() => {
            el.classList.add('hidden');
        }, 5000);
    }
}

// UI Init is handled in the main DOMContentLoaded below

document.getElementById('btn-admin-logout').onclick = () => {
    logout();
};

document.getElementById('btn-logout').onclick = () => {
    logout();
};

function logout() {
    localStorage.removeItem('token');
    location.reload();
}
