// --- CENTRAL STATE ---
let state = JSON.parse(localStorage.getItem('arjun_final_v1')) || { tasks: [] };
let viewDate = new Date(); // Controls both calendar and week view
let currentDuration = 30;

function save() { localStorage.setItem('arjun_final_v1', JSON.stringify(state)); }

// --- APP LIFECYCLE ---
function init() {
    renderGreeting();
    renderCalendar();
    renderTimeline();
    updateFooter();
    lucide.createIcons();
}

// 1 & 6. GREETING & STREAK
function renderGreeting() {
    const streak = calculateStreak();
    document.getElementById('greeting').innerText = streak > 0 ? "You're on a roll!" : "Hi Arjun!";
    document.getElementById('streak-info').innerText = streak > 0 ? `🔥 ${streak} day streak, less go!!` : "🔥 Let's start your streak!";
}

function calculateStreak() {
    let s = 0; let d = new Date();
    while(true) {
        const key = d.toISOString().split('T')[0];
        const dayTasks = state.tasks.filter(t => t.date === key);
        if(dayTasks.length > 0 && dayTasks.filter(t => t.done).length / dayTasks.length >= 0.9) {
            s++; d.setDate(d.getDate() - 1);
        } else break;
        if(s > 100) break;
    }
    return s;
}

// 6. WEEK NAVIGATION
function changeWeek(dir) {
    viewDate.setDate(viewDate.getDate() + (dir * 7));
    init();
}

function changeMonth(dir) {
    viewDate.setMonth(viewDate.getMonth() + dir);
    init();
}

// CALENDAR RENDER
function renderCalendar() {
    const grid = document.getElementById('calendar-grid'); grid.innerHTML = '';
    const m = viewDate.getMonth(), y = viewDate.getFullYear();
    document.getElementById('month-label').innerText = viewDate.toLocaleString('default', {month:'long', year:'numeric'});

    const first = new Date(y, m, 1).getDay();
    const total = new Date(y, m + 1, 0).getDate();
    let pad = first === 0 ? 6 : first - 1;

    for (let i = 0; i < pad; i++) grid.innerHTML += `<div></div>`;
    for (let i = 1; i <= total; i++) {
        const key = `${y}-${(m+1).toString().padStart(2,'0')}-${i.toString().padStart(2,'0')}`;
        const day = document.createElement('div');
        day.className = `cal-day ${isToday(y,m,i)?'is-today':''}`;
        day.innerText = i;
        const tasks = state.tasks.filter(t => t.date === key);
        if(tasks.length > 0) day.classList.add(tasks.filter(t => t.done).length / tasks.length >= 0.9 ? 'prod-high' : 'prod-low');
        grid.appendChild(day);
    }
}

// 1, 5, 6. TIMELINE RENDER
function renderTimeline() {
    const container = document.getElementById('timeline-columns'); container.innerHTML = '';
    const days = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
    
    // Get the Monday of the current viewDate
    let start = new Date(viewDate);
    start.setDate(viewDate.getDate() - (viewDate.getDay() === 0 ? 6 : viewDate.getDay() - 1));

    for(let i = 0; i < 7; i++) {
        let current = new Date(start);
        current.setDate(start.getDate() + i);
        const key = current.toISOString().split('T')[0];

        const col = document.createElement('div');
        col.className = 'tm-col';
        col.innerHTML = `
            <div class="day-name">${days[current.getDay()]} ${current.getDate()}</div>
            <div class="icon-wrap rise-btn">⏰</div>
            <div class="icon-wrap sleep-btn">🌙</div>
        `;

        // Task Scaling (Point 2 & 3 Fix)
        state.tasks.filter(t => t.date === key).forEach(task => {
            const pill = document.createElement('div');
            pill.className = 'task-pill';
            const [sh, sm] = task.start.split(':').map(Number);
            const [eh, em] = task.end.split(':').map(Number);
            const top = ((sh * 60) + sm - 540) * 1.1; // Offset relative to 9AM
            const dur = ((eh * 60) + em) - ((sh * 60) + sm);
            pill.style.top = `${top + 80}px`;
            pill.style.height = `${Math.max(dur * 1.1, 40)}px`;
            pill.innerText = task.emoji;
            col.appendChild(pill);
        });
        container.appendChild(col);
    }
}

// 3 & 4. TASK LOGIC
function calculateEndTime() {
    const s = document.getElementById('in-start').value;
    let [h, m] = s.split(':').map(Number);
    let d = new Date(); d.setHours(h, m + currentDuration);
    document.getElementById('in-end').value = d.toTimeString().slice(0,5);
}

function setDur(m, btn) {
    currentDuration = m;
    document.querySelectorAll('.dur-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active'); calculateEndTime();
}

function saveNewTask() {
    const title = document.getElementById('in-title').value;
    const emoji = document.getElementById('in-emoji').value || '📸';
    if(!title) return;

    state.tasks.push({
        id: Date.now(),
        date: viewDate.toISOString().split('T')[0], // Saves to currently viewed date
        title, emoji,
        start: document.getElementById('in-start').value,
        end: document.getElementById('in-end').value,
        done: false
    });
    save(); toggleModal(false); init();
}

function tickLastTask() {
    const todayKey = viewDate.toISOString().split('T')[0];
    const todayTasks = state.tasks.filter(t => t.date === todayKey);
    if(todayTasks.length > 0) {
        const last = todayTasks[todayTasks.length - 1];
        last.done = !last.done;
        document.getElementById('tick-btn').classList.toggle('done', last.done);
        save(); setTimeout(init, 300);
    }
}

function updateFooter() {
    const todayTasks = state.tasks.filter(t => t.date === viewDate.toISOString().split('T')[0]);
    if(todayTasks.length > 0) {
        const last = todayTasks[todayTasks.length - 1];
        document.getElementById('footer-emoji').innerText = last.emoji;
        document.getElementById('footer-title').innerText = last.title;
        document.getElementById('footer-status').innerText = last.done ? "Completed" : "Active";
        document.getElementById('tick-btn').classList.toggle('done', last.done);
    }
}

// HELPERS
function isToday(y,m,d) { const n = new Date(); return n.getFullYear()===y && n.getMonth()===m && n.getDate()===d; }
function toggleModal(s) { document.getElementById('modal').classList.toggle('hidden', !s); }
init();
