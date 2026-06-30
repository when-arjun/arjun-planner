// --- GLOBAL STATE & PERSISTENCE ---
let state = JSON.parse(localStorage.getItem('arjun_v4')) || { tasks: [], history: {} };
let viewDate = new Date();
let selectedDuration = 30;

const saveState = () => localStorage.setItem('arjun_v4', JSON.stringify(state));

// --- CORE INITIALIZATION ---
function init() {
    renderCalendar();
    renderTimeline();
    updateStreak();
    startLiveFooter();
    setupTimeSync();
    lucide.createIcons();
}

// --- PRODUCTIVITY & STREAK ENGINE ---
function updateStreak() {
    let streak = 0;
    let checkDate = new Date();
    
    while (true) {
        const key = formatDate(checkDate);
        const dayTasks = state.tasks.filter(t => t.date === key);
        if (dayTasks.length > 0) {
            const done = dayTasks.filter(t => t.done).length;
            if (done / dayTasks.length >= 0.9) {
                streak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else break;
        } else {
            if (streak > 0) break; // End of streak
            checkDate.setDate(checkDate.getDate() - 1); // Check yesterday if nothing today yet
            if (streak === 0 && formatDate(checkDate) !== formatDate(new Date())) break; 
        }
        if (streak > 100) break; // Limit safety
    }
    document.getElementById('streak-display').innerText = `${streak} day streak, less go!!`;
}

// --- CALENDAR LOGIC ---
function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';
    const m = viewDate.getMonth(), y = viewDate.getFullYear();
    document.getElementById('month-label').innerText = viewDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

    const first = new Date(y, m, 1).getDay();
    const total = new Date(y, m + 1, 0).getDate();
    let pad = first === 0 ? 6 : first - 1;

    for (let i = 0; i < pad; i++) grid.innerHTML += `<div></div>`;

    for (let i = 1; i <= total; i++) {
        const key = `${y}-${m+1}-${i}`;
        const dayTasks = state.tasks.filter(t => t.date === key);
        const dayDiv = document.createElement('div');
        dayDiv.className = `cal-day ${isSameDay(new Date(y, m, i), new Date()) ? 'is-today' : ''}`;
        dayDiv.innerText = i;

        if (dayTasks.length > 0) {
            const ratio = dayTasks.filter(t => t.done).length / dayTasks.length;
            dayDiv.classList.add(ratio >= 0.9 ? 'prod-high' : 'prod-low');
        }
        grid.appendChild(dayDiv);
    }
}

// --- TIMELINE ARCHITECTURE ---
function renderTimeline() {
    const canvas = document.getElementById('timeline-canvas');
    canvas.innerHTML = '';
    const startOfWeek = new Date(viewDate);
    startOfWeek.setDate(viewDate.getDate() - viewDate.getDay() + 1);

    for (let i = 0; i < 7; i++) {
        const current = new Date(startOfWeek);
        current.setDate(startOfWeek.getDate() + i);
        const key = formatDate(current);

        const col = document.createElement('div');
        col.className = 'tm-col snap-center';
        col.innerHTML = `
            <div class="absolute top-4 left-0 right-0 text-center text-[10px] font-black text-gray-700">${current.getDate()}</div>
            <div class="tm-line"></div>
        `;

        state.tasks.filter(t => t.date === key).forEach(task => {
            const bubble = document.createElement('div');
            bubble.className = 'task-bubble';
            const [h, m] = task.start.split(':').map(Number);
            bubble.style.top = `${(h * 25) + (m * 0.4) + 60}px`;
            bubble.innerText = task.emoji;
            col.appendChild(bubble);
        });
        canvas.appendChild(col);
    }
}

// --- ADVANCED TIME SYNC SYSTEM ---
function setupTimeSync() {
    const start = document.getElementById('in-start');
    const end = document.getElementById('in-end');
    const presetBox = document.getElementById('duration-presets');
    const presets = [15, 30, 45, 60, 90, 120];

    presetBox.innerHTML = presets.map(p => `<button onclick="updateDuration(${p}, this)" class="dur-pill ${p===30?'active':''}">${p}m</button>`).join('');

    start.addEventListener('input', () => syncTime('start'));
    end.addEventListener('input', () => syncTime('end'));
}

function syncTime(changed) {
    const startVal = document.getElementById('in-start').value;
    const endVal = document.getElementById('in-end').value;
    if (!startVal || !endVal) return;

    if (changed === 'start') {
        const d = new Date(`2000-01-01T${startVal}`);
        d.setMinutes(d.getMinutes() + selectedDuration);
        document.getElementById('in-end').value = d.toTimeString().slice(0,5);
    } else {
        const s = new Date(`2000-01-01T${startVal}`);
        const e = new Date(`2000-01-01T${endVal}`);
        selectedDuration = (e - s) / 60000;
        document.querySelectorAll('.dur-pill').forEach(b => b.classList.remove('active'));
    }
}

function updateDuration(val, btn) {
    selectedDuration = val;
    document.querySelectorAll('.dur-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    syncTime('start');
}

// --- TASK ACTIONS ---
function saveTask() {
    const title = document.getElementById('in-title').value;
    const emoji = document.getElementById('in-emoji').value || '📍';
    const start = document.getElementById('in-start').value;
    
    if (!title || !start) return;

    state.tasks.push({
        id: Date.now(),
        date: formatDate(new Date()),
        title, emoji, start, done: false
    });

    saveState();
    closeModal();
    init();
}

// --- LIVE FOOTER ENGINE ---
function startLiveFooter() {
    setInterval(() => {
        const now = new Date();
        const timeStr = now.toTimeString().slice(0,5);
        const active = state.tasks.find(t => t.date === formatDate(now) && !t.done);

        if (active) {
            document.getElementById('footer-emoji-wrapper').innerText = active.emoji;
            document.getElementById('footer-task-name').innerText = active.title;
            document.getElementById('footer-status').innerText = "In Progress";
        }
    }, 1000);
}

// --- UTILS ---
function formatDate(d) { return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`; }
function isSameDay(d1, d2) { return formatDate(d1) === formatDate(d2); }
function navMonth(dir) { viewDate.setMonth(viewDate.getMonth() + dir); renderCalendar(); }
function openModal() { document.getElementById('task-modal').classList.remove('hidden'); setTimeout(() => document.body.classList.add('modal-open'), 10); }
function closeModal() { document.body.classList.remove('modal-open'); setTimeout(() => document.getElementById('task-modal').classList.add('hidden'), 500); }

init();