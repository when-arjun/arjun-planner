// --- APP STATE ---
let state = JSON.parse(localStorage.getItem('arjun_v6')) || { 
    tasks: [], 
    wake: "08:00", 
    sleep: "22:00",
    initialized: false 
};
let viewDate = new Date();
let currentDuration = 30;

function save() { localStorage.setItem('arjun_v6', JSON.stringify(state)); }

// --- ONBOARDING LOGIC ---
function init() {
    if (!state.initialized) {
        document.getElementById('onboarding').classList.remove('hidden');
    } else {
        renderAll();
    }
}

function finishOnboarding() {
    state.wake = document.getElementById('setup-wake').value;
    state.sleep = document.getElementById('setup-sleep').value;
    state.initialized = true;
    save();
    document.getElementById('onboarding').classList.add('hidden');
    renderAll();
}

function renderAll() {
    renderGreeting();
    renderCalendar();
    renderTimeline();
    updateFooter();
    lucide.createIcons();
}

// --- PRECISION TIMELINE ENGINE ---
function timeToMins(t) {
    const [h, m] = t.split(':').map(Number);
    return (h * 60) + m;
}

function renderTimeline() {
    const axis = document.getElementById('time-axis');
    const cols = document.getElementById('timeline-columns');
    axis.innerHTML = ''; cols.innerHTML = '';

    const wakeMins = timeToMins(state.wake);
    const sleepMins = timeToMins(state.sleep);
    const totalMins = sleepMins - wakeMins;

    // 1. Render Axis & Grid Lines
    const hoursCount = Math.floor(totalMins / 60);
    for (let i = 0; i <= hoursCount; i++) {
        const curMins = wakeMins + (i * 60);
        const topPercent = ((curMins - wakeMins) / totalMins) * 100;
        
        // Time Label
        const hour = Math.floor(curMins / 60);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 === 0 ? 12 : hour % 12;
        
        const label = document.createElement('div');
        label.className = 'absolute w-full';
        label.style.top = `${topPercent}%`;
        label.innerText = `${displayHour}${ampm}`;
        axis.appendChild(label);
    }

    // 2. Render 7 Days
    const days = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
    let start = new Date(viewDate);
    start.setDate(viewDate.getDate() - (viewDate.getDay() === 0 ? 6 : viewDate.getDay() - 1));

    for (let i = 0; i < 7; i++) {
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

        // Precise Task Placement (Point 1 formula)
        state.tasks.filter(t => t.date === key).forEach(task => {
            const startMins = timeToMins(task.start);
            const endMins = timeToMins(task.end);
            const duration = endMins - startMins;

            const topPercent = ((startMins - wakeMins) / totalMins) * 100;
            const heightPercent = (duration / totalMins) * 100;

            const pill = document.createElement('div');
            pill.className = 'task-pill';
            pill.style.top = `${topPercent}%`;
            pill.style.height = `${heightPercent}%`;
            pill.innerText = task.emoji;
            col.appendChild(pill);
        });

        cols.appendChild(col);
    }
}

// --- STANDARD LOGIC ---
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
        date: viewDate.toISOString().split('T')[0],
        title, emoji,
        start: document.getElementById('in-start').value,
        end: document.getElementById('in-end').value,
        done: false
    });
    save(); toggleModal(false); renderAll();
}

function tickLastTask() {
    const todayKey = viewDate.toISOString().split('T')[0];
    const todayTasks = state.tasks.filter(t => t.date === todayKey);
    if(todayTasks.length > 0) {
        const last = todayTasks[todayTasks.length - 1];
        last.done = !last.done;
        save(); setTimeout(renderAll, 300);
    }
}

function updateFooter() {
    const todayTasks = state.tasks.filter(t => t.date === viewDate.toISOString().split('T')[0]);
    if(todayTasks.length > 0) {
        const last = todayTasks[todayTasks.length - 1];
        document.getElementById('footer-emoji').innerText = last.emoji;
        document.getElementById('footer-title').innerText = last.title;
        document.getElementById('tick-btn').classList.toggle('done', last.done);
    }
}

function renderGreeting() {
    const s = calculateStreak();
    document.getElementById('greeting').innerText = s > 0 ? "You're on a roll!" : "Hi Arjun!";
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
        day.className = `cal-day ${new Date().getDate()===i && new Date().getMonth()===m ? 'is-today' : ''}`;
        day.innerText = i;
        const tasks = state.tasks.filter(t => t.date === key);
        if(tasks.length > 0) day.classList.add(tasks.filter(t => t.done).length / tasks.length >= 0.9 ? 'prod-high' : 'prod-low');
        grid.appendChild(day);
    }
}

function toggleModal(s) { document.getElementById('modal').classList.toggle('hidden', !s); }
function changeWeek(dir) { viewDate.setDate(viewDate.getDate() + (dir * 7)); renderAll(); }
function changeMonth(dir) { viewDate.setMonth(viewDate.getMonth() + dir); renderAll(); }

init();
