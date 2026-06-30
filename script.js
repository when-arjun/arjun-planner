let state = JSON.parse(localStorage.getItem('arjun_v5')) || { tasks: [], streak: 0 };
let currentMonth = new Date();
let selectedDur = 30;

function init() {
    renderGreeting();
    renderCalendar();
    renderWeekTimeline();
    lucide.createIcons();
}

// 1. Dynamic Greeting & Streak (Point 6)
function renderGreeting() {
    const streak = calculateStreak();
    document.getElementById('greeting').innerText = streak > 0 ? "Hi Arjun, you're on a roll!" : "Let's start your streak!";
    document.getElementById('streak-text').innerText = streak > 0 ? `🔥 ${streak} day streak, less go!!` : "🔥 No streak yet, get moving!";
}

function calculateStreak() {
    let streak = 0; let d = new Date();
    while(true) {
        const key = d.toISOString().split('T')[0];
        const dayTasks = state.tasks.filter(t => t.date === key);
        if(dayTasks.length > 0 && dayTasks.filter(t => t.done).length / dayTasks.length >= 0.9) {
            streak++; d.setDate(d.getDate() - 1);
        } else break;
        if(streak > 365) break;
    }
    return streak;
}

// 2. Month Calendar
function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';
    const m = currentMonth.getMonth(), y = currentMonth.getFullYear();
    document.getElementById('month-label').innerText = currentMonth.toLocaleString('default', {month:'long', year:'numeric'});

    const first = new Date(y, m, 1).getDay();
    const total = new Date(y, m + 1, 0).getDate();
    let pad = first === 0 ? 6 : first - 1;

    for (let i = 0; i < pad; i++) grid.innerHTML += `<div></div>`;
    for (let i = 1; i <= total; i++) {
        const dateKey = `${y}-${(m+1).toString().padStart(2,'0')}-${i.toString().padStart(2,'0')}`;
        const dayDiv = document.createElement('div');
        dayDiv.className = `cal-day ${isToday(y, m, i) ? 'is-today' : ''}`;
        dayDiv.innerText = i;

        const dayTasks = state.tasks.filter(t => t.date === dateKey);
        if(dayTasks.length > 0) {
            const ratio = dayTasks.filter(t => t.done).length / dayTasks.length;
            dayDiv.classList.add(ratio >= 0.9 ? 'prod-high' : 'prod-low');
        }
        grid.appendChild(dayDiv);
    }
}

// 3. Weekly Timeline (Sun-Sat) (Point 1, 2, 3)
function renderWeekTimeline() {
    const colContainer = document.getElementById('week-columns');
    colContainer.innerHTML = '';
    
    // Find start of current week (Sunday)
    let curr = new Date();
    let sun = new Date(curr.setDate(curr.getDate() - curr.getDay()));

    for(let i = 0; i < 7; i++) {
        let d = new Date(sun);
        d.setDate(sun.getDate() + i);
        const dateKey = d.toISOString().split('T')[0];

        const col = document.createElement('div');
        col.className = 'day-col';
        col.innerHTML = `
            <div class="rise-icon">⏰</div>
            <div class="v-line" style="background: ${getLineColor(i)}"></div>
            <div class="sleep-icon">🌙</div>
        `;

        // Proportionate Bubbles
        state.tasks.filter(t => t.date === dateKey).forEach(task => {
            const pill = document.createElement('div');
            pill.className = 'task-pill';
            
            // MATH: 1 hour = 60 pixels. Start time @ 9AM = 0px top.
            const [h, m] = task.start.split(':').map(Number);
            const [eh, em] = task.end.split(':').map(Number);
            
            const startMins = (h * 60) + m - 540; // Relative to 9AM
            const endMins = (eh * 60) + em - 540;
            const duration = endMins - startMins;

            pill.style.top = `${startMins + 75}px`; // +75 for padding
            pill.style.height = `${Math.max(duration, 40)}px`;
            pill.style.backgroundColor = task.color || '#1a1a1e';
            pill.innerText = task.emoji;
            col.appendChild(pill);
        });

        colContainer.appendChild(col);
    }
}

// 4. Modal & Time Wheel Sync (Point 4)
function syncTimes() {
    const start = document.getElementById('in-start').value;
    let [h, m] = start.split(':').map(Number);
    let d = new Date();
    d.setHours(h, m + selectedDur);
    document.getElementById('in-end').value = d.toTimeString().slice(0,5);
}

function setDur(mins, btn) {
    selectedDur = mins;
    document.querySelectorAll('.dur-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    syncTimes();
}

function saveTask() {
    const title = document.getElementById('in-title').value;
    const emoji = document.getElementById('in-emoji').value || '📍';
    if(!title) return;

    state.tasks.push({
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        title, emoji,
        start: document.getElementById('in-start').value,
        end: document.getElementById('in-end').value,
        done: false
    });

    localStorage.setItem('arjun_v5', JSON.stringify(state));
    closeModal(); init();
}

// Utilities
function getLineColor(i) { return ['#f87171', '#f87171', '#3b82f6', '#f87171', '#f87171', '#f87171', '#f87171'][i]; }
function isToday(y, m, d) { const n = new Date(); return n.getFullYear()===y && n.getMonth()===m && n.getDate()===d; }
function navMonth(dir) { currentMonth.setMonth(currentMonth.getMonth()+dir); renderCalendar(); }
function openModal() { document.getElementById('modal').classList.remove('hidden'); }
function closeModal() { document.getElementById('modal').classList.add('hidden'); }
function toggleActiveTask() { document.getElementById('tick-btn').classList.toggle('checked'); }

init();
