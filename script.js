let state = JSON.parse(localStorage.getItem('arjun_final')) || { tasks: [] };
let viewMonth = new Date();
let selectedDuration = 30;

function init() {
    renderGreeting();
    renderCalendar();
    renderWeek();
    updateFooter();
    lucide.createIcons();
}

function renderGreeting() {
    const streak = calculateStreak();
    document.getElementById('greeting').innerText = streak > 0 ? "Hi Arjun, you're on a roll!" : "Hi Arjun!";
    document.getElementById('streak-text').innerText = streak > 0 ? `🔥 ${streak} day streak, less go!!` : "🔥 Let's start your streak!";
}

function calculateStreak() {
    let streak = 0; let d = new Date();
    while(true) {
        const key = d.toISOString().split('T')[0];
        const dayTasks = state.tasks.filter(t => t.date === key);
        if(dayTasks.length > 0 && dayTasks.filter(t => t.done).length / dayTasks.length >= 0.9) {
            streak++; d.setDate(d.getDate() - 1);
        } else break;
        if(streak > 99) break;
    }
    return streak;
}

function renderCalendar() {
    const grid = document.getElementById('calendar-grid');
    grid.innerHTML = '';
    const m = viewMonth.getMonth(), y = viewMonth.getFullYear();
    document.getElementById('month-label').innerText = viewMonth.toLocaleString('default', {month:'long', year:'numeric'});

    const first = new Date(y, m, 1).getDay();
    const total = new Date(y, m + 1, 0).getDate();
    let pad = first === 0 ? 6 : first - 1;

    for (let i = 0; i < pad; i++) grid.innerHTML += `<div></div>`;
    for (let i = 1; i <= total; i++) {
        const key = `${y}-${(m+1).toString().padStart(2,'0')}-${i.toString().padStart(2,'0')}`;
        const div = document.createElement('div');
        div.className = `cal-day ${isToday(y,m,i)?'is-today':''}`;
        div.innerText = i;
        const dayTasks = state.tasks.filter(t => t.date === key);
        if(dayTasks.length > 0) {
            const ratio = dayTasks.filter(t => t.done).length / dayTasks.length;
            div.classList.add(ratio >= 0.9 ? 'prod-high' : 'prod-low');
        }
        grid.appendChild(div);
    }
}

function renderWeek() {
    const container = document.getElementById('week-columns');
    const header = document.getElementById('week-numbers-header');
    container.innerHTML = ''; header.innerHTML = '';

    let d = new Date();
    let startOfWeek = new Date(d.setDate(d.getDate() - d.getDay())); // Sunday

    for(let i = 0; i < 7; i++) {
        let current = new Date(startOfWeek);
        current.setDate(startOfWeek.getDate() + i);
        const key = current.toISOString().split('T')[0];

        // Header Number
        header.innerHTML += `<div class="flex-1 text-center text-xs font-black ${i===new Date().getDay()?'text-white':'text-gray-700'}">${current.getDate()}</div>`;

        // Column
        const col = document.createElement('div');
        col.className = 'day-col';
        col.innerHTML = `
            <div class="rise-btn">⏰</div>
            <div class="col-line" style="background: ${i<2 ? '#f8717133' : '#3b82f633'}"></div>
            <div class="sleep-btn">🌙</div>
        `;

        // Tasks
        state.tasks.filter(t => t.date === key).forEach(task => {
            const pill = document.createElement('div');
            pill.className = 'task-pill';
            const [sh, sm] = task.start.split(':').map(Number);
            const [eh, em] = task.end.split(':').map(Number);
            
            const startPos = ((sh * 60) + sm - 540) * 1.1; // Scale factor
            const duration = ((eh * 60) + em) - ((sh * 60) + sm);

            pill.style.top = `${startPos + 80}px`;
            pill.style.height = `${Math.max(duration * 1.1, 45)}px`;
            pill.innerText = task.emoji;
            col.appendChild(pill);
        });
        container.appendChild(col);
    }
}

function updateFooter() {
    const now = new Date();
    const key = now.toISOString().split('T')[0];
    const active = state.tasks.find(t => t.date === key && !t.done);
    
    if(active) {
        document.getElementById('footer-emoji').innerText = active.emoji;
        document.getElementById('footer-task-title').innerText = active.title;
        document.getElementById('footer-time-label').innerText = active.start;
        document.getElementById('tick-btn').classList.remove('is-done');
    }
}

function markActiveTaskDone() {
    const now = new Date();
    const key = now.toISOString().split('T')[0];
    const active = state.tasks.find(t => t.date === key && !t.done);
    if(active) {
        active.done = true;
        document.getElementById('tick-btn').classList.add('is-done');
        localStorage.setItem('arjun_final', JSON.stringify(state));
        setTimeout(init, 500);
    }
}

// Modal Logic
function syncTimes() {
    const start = document.getElementById('in-start').value;
    let [h, m] = start.split(':').map(Number);
    let d = new Date(); d.setHours(h, m + selectedDuration);
    document.getElementById('in-end').value = d.toTimeString().slice(0,5);
}
function setDur(val, btn) {
    selectedDuration = val;
    document.querySelectorAll('.dur-pill').forEach(b => b.classList.remove('active'));
    btn.classList.add('active'); syncTimes();
}
function saveTask() {
    const title = document.getElementById('in-title').value;
    const emoji = document.getElementById('in-emoji').value || '📸';
    if(!title) return;
    state.tasks.push({
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        title, emoji,
        start: document.getElementById('in-start').value,
        end: document.getElementById('in-end').value,
        done: false
    });
    localStorage.setItem('arjun_final', JSON.stringify(state));
    closeModal(); init();
}

function openModal() { document.getElementById('modal').classList.remove('hidden'); }
function closeModal() { document.getElementById('modal').classList.add('hidden'); }
function isToday(y,m,d) { const n = new Date(); return n.getFullYear()===y && n.getMonth()===m && n.getDate()===d; }
function navMonth(dir) { viewMonth.setMonth(viewMonth.getMonth()+dir); renderCalendar(); }

init();
