// --- STATE ---
let state = JSON.parse(localStorage.getItem('arjun_structured')) || { tasks: [] };
let selectedDate = new Date(); // The day we are currently looking at
let selectedColor = '#f87171';

function save() { localStorage.setItem('arjun_structured', JSON.stringify(state)); }

// --- APP INITIALIZE ---
function init() {
    renderGreeting();
    renderCalendar();
    renderWeekStrip();
    renderTimeline();
    updateFooter();
    lucide.createIcons();
}

// 1. GREETING & STREAK
function renderGreeting() {
    let streak = 0; let d = new Date();
    while(true) {
        const key = d.toISOString().split('T')[0];
        const dayTasks = state.tasks.filter(t => t.date === key);
        if(dayTasks.length > 0 && dayTasks.filter(t => t.done).length / dayTasks.length >= 0.9) {
            streak++; d.setDate(d.getDate() - 1);
        } else break;
    }
    document.getElementById('greeting').innerText = streak > 0 ? "You're on a roll!" : "Hi Arjun!";
    document.getElementById('streak-info').innerText = streak > 0 ? `🔥 ${streak} day streak, less go!!` : "🔥 Let's start your streak!";
}

// 2. PRODUCTIVITY CALENDAR
function renderCalendar() {
    const grid = document.getElementById('calendar-grid'); grid.innerHTML = '';
    const m = selectedDate.getMonth(), y = selectedDate.getFullYear();
    document.getElementById('month-label').innerText = selectedDate.toLocaleString('default', {month:'long', year:'numeric'});

    const first = new Date(y, m, 1).getDay();
    const total = new Date(y, m + 1, 0).getDate();
    let pad = first === 0 ? 6 : first - 1;

    for (let i = 0; i < pad; i++) grid.innerHTML += `<div></div>`;
    for (let i = 1; i <= total; i++) {
        const key = `${y}-${(m+1).toString().padStart(2,'0')}-${i.toString().padStart(2,'0')}`;
        const div = document.createElement('div');
        div.className = `cal-day ${y===new Date().getFullYear() && m===new Date().getMonth() && i===new Date().getDate() ? 'is-today' : ''}`;
        div.innerText = i;
        const dayTasks = state.tasks.filter(t => t.date === key);
        if(dayTasks.length > 0) div.classList.add(dayTasks.filter(t => t.done).length / dayTasks.length >= 0.9 ? 'prod-high' : 'prod-low');
        grid.appendChild(div);
    }
}

// 3. WEEK STRIP SELECTOR
function renderWeekStrip() {
    const strip = document.getElementById('week-strip'); strip.innerHTML = '';
    const names = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
    
    let start = new Date(selectedDate);
    start.setDate(selectedDate.getDate() - selectedDate.getDay());

    for(let i = 0; i < 7; i++) {
        let d = new Date(start); d.setDate(start.getDate() + i);
        const isActive = d.toDateString() === selectedDate.toDateString();
        
        const dayBtn = document.createElement('div');
        dayBtn.className = `week-day ${isActive ? 'active' : ''}`;
        dayBtn.innerHTML = `<span>${names[d.getDay()]}</span><span>${d.getDate()}</span>`;
        dayBtn.onclick = () => { selectedDate = d; init(); };
        strip.appendChild(dayBtn);
    }
}

// 4. STRUCTURED TIMELINE
function renderTimeline() {
    const list = document.getElementById('task-list'); list.innerHTML = '';
    const key = selectedDate.toISOString().split('T')[0];
    const dayTasks = state.tasks.filter(t => t.date === key);

    dayTasks.forEach(task => {
        const pill = document.createElement('div');
        pill.className = `task-pill ${task.done ? 'done' : ''}`;
        
        // Positioning math: 1 hour = 100px. Offset from 9AM.
        const [h, m] = task.start.split(':').map(Number);
        const [eh, em] = task.end.split(':').map(Number);
        const startPos = (h * 100) + (m * 1.6) - 900;
        const duration = ((eh * 60) + em) - ((h * 60) + m);

        pill.style.top = `${startPos}px`;
        pill.style.height = `${Math.max(duration * 1.6, 60)}px`;
        pill.style.borderLeft = `6px solid ${task.color}`;
        
        pill.innerHTML = `
            <div class="pill-emoji">${task.emoji}</div>
            <div class="pill-title">${task.title}</div>
            <div class="pill-time">${task.start}</div>
        `;
        list.appendChild(pill);
    });
}

// 5. ACTIONS
function saveTask() {
    const title = document.getElementById('in-title').value;
    if(!title) return;
    state.tasks.push({
        id: Date.now(),
        date: selectedDate.toISOString().split('T')[0],
        title, emoji: document.getElementById('in-emoji').value || '📸',
        start: document.getElementById('in-start').value,
        end: document.getElementById('in-end').value,
        color: selectedColor, done: false
    });
    save(); toggleModal(false); init();
}

function updateFooter() {
    const key = new Date().toISOString().split('T')[0];
    const active = state.tasks.find(t => t.date === key && !t.done);
    if(active) {
        document.getElementById('footer-emoji').innerText = active.emoji;
        document.getElementById('footer-title').innerText = active.title;
        document.getElementById('tick-btn').classList.remove('active');
    }
}

function markCurrentDone() {
    const key = new Date().toISOString().split('T')[0];
    const active = state.tasks.find(t => t.date === key && !t.done);
    if(active) {
        active.done = true;
        document.getElementById('tick-btn').classList.add('active');
        save(); setTimeout(init, 500);
    }
}

function toggleModal(s) { document.getElementById('modal').classList.toggle('hidden', !s); }
function setColor(c, b) { 
    selectedColor = c; 
    document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
    b.classList.add('active');
}
function changeWeek(dir) { selectedDate.setDate(selectedDate.getDate() + (dir * 7)); init(); }
function changeMonth(dir) { selectedDate.setMonth(selectedDate.getMonth() + dir); init(); }

init();
