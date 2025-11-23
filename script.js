/* ======================= CONFIG & STORAGE ======================= */
const SOUND = {
  done: "sound/complete.mp3",
  reminder: "sound/reminder.mp3",
  achievement: "sound/achievement.mp3",
  levelup: "sound/levelup.mp3"
};

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let level = JSON.parse(localStorage.getItem("level")) || 1;
let streak = JSON.parse(localStorage.getItem("streak")) || 0;
let totalCompletedTasks = JSON.parse(localStorage.getItem("totalCompletedTasks")) || 0;
let badges = JSON.parse(localStorage.getItem("badges")) || [];
let weekData = JSON.parse(localStorage.getItem("weekData")) || [0,0,0,0,0,0,0];

/* ======================= DOM REFS ======================= */
const greetingElement = document.getElementById("greeting");
const quoteBox = document.getElementById("quote");
const levelEl = document.getElementById("level");
const streakEl = document.getElementById("streak");
const progressPercentEl = document.getElementById("progressPercent");
const arcFill = document.getElementById("arcFill");
const taskList = document.getElementById("taskList");
const modal = document.getElementById("modal");
const modalTaskName = document.getElementById("modalTaskName");
const modalDeadline = document.getElementById("modalDeadline");
const modalSave = document.getElementById("modalSave");
const modalCancel = document.getElementById("modalCancel");
const openAdd = document.getElementById("openAdd");
const resetBtn = document.getElementById("resetBtn");
const popup = document.getElementById("popup");
const popupTitle = document.getElementById("popupTitle");
const popupBody = document.getElementById("popupBody");
const achClose = document.getElementById("achClose");
const streakFlame = document.getElementById("streakFlame");
const badgeContainer = document.getElementById("badgeContainer");

/* ======================= GREETING & QUOTES ======================= */
const greetings = [
    "Hey Shelsia ✨",
    "Hi love 💕",
    "Hey kanmani 🌿",
    "Welcome back, sweetheart ✨",
    "Hello beautiful 🌸",
    "You're here — that's power. 🔥"
];

const aestheticQuotes = [
    "Soft life requires hard discipline.",
    "Your future self is watching — don't disappoint her.",
    "Small wins create big transformation.",
    "You are the standard. Act like it.",
    "Slow progress is still progress — keep moving.",
    "Elegance is consistency, not perfection.",
    "Your habits are designing the woman you become.",
    "Some days require grace. Some require grit. Today requires both.",
    "Routine builds identity. Identity builds destiny.",
    "No rush, no pause — steady and intentional."
];

function setGreeting() {
    const greet = greetings[Math.floor(Math.random() * greetings.length)];
    greetingElement.textContent = greet;

    const quote = aestheticQuotes[Math.floor(Math.random() * aestheticQuotes.length)];
    quoteBox.textContent = `"${quote}"`;
}

// Rotate quotes every 5s
function updateQuote() {
    quoteBox.textContent = `"${aestheticQuotes[Math.floor(Math.random() * aestheticQuotes.length)]}"`;
}

document.addEventListener("DOMContentLoaded", () => {
    setGreeting();
    updateQuote();
    setInterval(updateQuote, 5000);
});

/* ======================= UTILITIES ======================= */
function playSound(path){
  try{ new Audio(path).play().catch(()=>{}); } catch(e){}
}
function saveAll(){
  localStorage.setItem("tasks", JSON.stringify(tasks));
  localStorage.setItem("level", JSON.stringify(level));
  localStorage.setItem("streak", JSON.stringify(streak));
  localStorage.setItem("totalCompletedTasks", JSON.stringify(totalCompletedTasks));
  localStorage.setItem("badges", JSON.stringify(badges));
  localStorage.setItem("weekData", JSON.stringify(weekData));
}

/* ======================= TASK UI & LOGIC ======================= */
openAdd.addEventListener("click", ()=> {
  modalTaskName.value = "";
  modalDeadline.value = "";
  modal.classList.remove("hidden");
});
modalCancel.addEventListener("click", ()=> modal.classList.add("hidden"));

modalSave.addEventListener("click", ()=> {
  const name = modalTaskName.value.trim();
  const time = modalDeadline.value;
  if(!name || !time){ alert("Enter task name and a deadline time."); return; }
  const parts = time.split(":").map(s => Number(s));
  const now = new Date();
  const deadline = new Date(now.getFullYear(), now.getMonth(), now.getDate(), parts[0], parts[1] || 0, 0, 0).getTime();

  tasks.push({ id: Date.now(), name, deadlineTs: deadline, reminderNotified:false, completedAt:null, completedOnTime:false });
  modal.classList.add("hidden");
  saveAll();
  render();
});

resetBtn.addEventListener("click", ()=> {
  if(!confirm("Reset all data?")) return;
  localStorage.clear();
  window.location.reload();
});

function render(){
  levelEl.textContent = `Level: ${level}`;
  streakEl.textContent = `Streak: ${streak}`;

  const onTimeCount = tasks.filter(t=>t.completedOnTime).length;
  const pct = tasks.length ? Math.round((onTimeCount / tasks.length) * 100) : 0;
  progressPercentEl.textContent = `${pct}%`;
  const circ = 2 * Math.PI * 40;
  arcFill.style.strokeDasharray = `${circ}`;
  arcFill.style.strokeDashoffset = `${circ * (1 - pct/100)}`;

  taskList.innerHTML = "";
  tasks.forEach((t, idx) => {
    const now = Date.now();
    const remaining = Math.max(0, t.deadlineTs - now);
    const minutesLeft = Math.ceil(remaining / 60000);
    const timeLabel = remaining > 0 ? `${minutesLeft} min left` : (t.completedAt ? (t.completedOnTime ? "Done on-time" : "Done (late)") : "Missed");

    const row = document.createElement("div");
    row.className = "task-row";
    row.innerHTML = `
      <div>
        <div style="font-weight:700">${t.name}</div>
        <div class="meta">${timeLabel} • ${new Date(t.deadlineTs).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'})}</div>
      </div>
      <div>
        <button class="btn primary" data-idx="${idx}" ${t.completedAt ? "disabled" : ""}>${t.completedAt ? "Done ✓" : "Done"}</button>
      </div>
    `;
    taskList.appendChild(row);
  });

  displayBadges();
  updateStreakVisual();
}

/* ======================= MARK TASK DONE ======================= */
taskList.addEventListener("click", (ev) => {
  const btn = ev.target.closest("button[data-idx]");
  if(!btn) return;
  const idx = Number(btn.getAttribute("data-idx"));
  if(isNaN(idx)) return;

  const now = Date.now();
  const t = tasks[idx];
  if(!t || t.completedAt) return;

  t.completedAt = now;
  t.completedOnTime = now <= t.deadlineTs;
  t.reminderNotified = true;
  totalCompletedTasks++;

  playSound(SOUND.done);

  if(t.completedOnTime) confetti({ particleCount: 80, spread: 60, origin:{ y:0.6 } });

  const motivationQuotes = [
    "Small steps every day → Big change.",
    "You're not tired — you're upgrading.",
    "Future you is already proud.",
    "No excuses. Just progress.",
    "One task done = one weakness destroyed.",
    "Consistency becomes identity.",
    "Soft discipline is self-love."
  ];
  const q = motivationQuotes[Math.floor(Math.random()*motivationQuotes.length)];
  popupTitle.textContent = t.completedOnTime ? "✨ Well done" : "✨ Good job";
  popupBody.textContent = q;
  popup.classList.remove("hidden");

  const allOnTime = tasks.length>0 && tasks.every(x => x.completedOnTime);
  if(allOnTime){
    popupTitle.textContent = "✨ Day Complete";
    popupBody.textContent = "Soft Luxury — you honored the promise you made to yourself today.";
    playSound(SOUND.achievement);
  }

  checkBadges();
  saveAll();
  render();
});

achClose.addEventListener("click", ()=> {
  popup.classList.add("hidden");
  playSound(SOUND.achievement);
});

/* ======================= REMINDERS (30 MIN BEFORE) ======================= */
const REMINDER_BEFORE = 30 * 60 * 1000; // 30 minutes

const reminderQuotes = [
  "⏳ Discipline check — task coming soon. Prepare yourself.",
  "⏳ Gentle nudge: your task is due in 30 minutes.",
  "⏳ Queens don’t postpone greatness — finish it on time."
];

setInterval(()=> {
  const now = Date.now();
  tasks.forEach(t => {
    if(!t.completedAt && !t.reminderNotified && (t.deadlineTs - now <= REMINDER_BEFORE)){
      const r = reminderQuotes[Math.floor(Math.random()*reminderQuotes.length)];
      const box = document.createElement("div");
      box.className = "reminder";
      box.innerText = r;
      document.body.appendChild(box);
      setTimeout(()=> box.remove(), 7000);

      playSound(SOUND.reminder);
      t.reminderNotified = true;
      saveAll();
      render();
    }
  });
}, 60 * 1000);

/* ======================= MIDNIGHT EVALUATION & AUTO-CLEAR ======================= */
function scheduleMidnightCheck(){
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate()+1, 0, 0, 5, 0);
  const ms = next - now;
  setTimeout(()=> { applyEndOfDayLogic(); scheduleMidnightCheck(); }, ms);
}

function applyEndOfDayLogic(){
  let missed = 0;
  let completedOnTimeCount = 0;
  tasks.forEach(t => {
    if(t.completedAt && t.completedOnTime) completedOnTimeCount++;
    else missed++;
  });

  if(missed >= 3) streak = 0;
  else streak = streak + 1;

  if(streak % 7 === 0 && streak !== 0){
    level++;
    playSound(SOUND.levelup);
    popupTitle.textContent = "👑 Streak Milestone";
    popupBody.textContent = `Streak ${streak} days — Level up!`;
    popup.classList.remove("hidden");
    confetti({ particleCount: 120, spread: 80, origin:{ y:0.6 } });
  }

  const d = new Date();
  let idx = d.getDay() - 1; if(idx < 0) idx = 6;
  weekData[idx] = completedOnTimeCount;

  tasks = [];
  saveAll();
  render();
}

(function initDaily(){
  render();
  displayBadges();
  scheduleMidnightCheck();
})();

/* ======================= BADGES ======================= */
const badgeRules = [
  { name: "🍼 Beginner", n:1 },
  { name: "⚡ Rookie", n:5 },
  { name: "🔥 Focus Warrior", n:10 },
  { name: "💪 Discipline Beast", n:20 },
  { name: "🎯 Elite Performer", n:30 },
  { name: "👑 Unstoppable", n:50 }
];

function checkBadges(){
  badgeRules.forEach(r => {
    if(totalCompletedTasks >= r.n && !badges.includes(r.name)){
      badges.push(r.name);
      popupTitle.textContent = "🏆 Badge Unlocked";
      popupBody.textContent = `${r.name}`;
      popup.classList.remove("hidden");
      playSound(SOUND.levelup);
      confetti({ particleCount: 90, spread: 60, origin:{ y:0.6 } });
    }
  });
  saveAll();
}

function displayBadges(){
  badgeContainer.innerHTML = badges.map(b => `<span>${b}</span>`).join("");
}

/* ======================= WEEKLY CHART ======================= */
const ctx = document.getElementById("weekChart").getContext("2d");
const chart = new Chart(ctx, {
  type: 'bar',
  data: { labels:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"], datasets:[{ data: weekData, backgroundColor: 'rgba(203,168,106,0.95)', borderRadius:6 }]},
  options: { plugins:{ legend:{ display:false } }, scales:{ y:{ beginAtZero:true, ticks:{ stepSize:1 } } } }
});
setInterval(()=> {
  chart.data.datasets[0].data = weekData;
  chart.update();
}, 2000);

/* ======================= STREAK VISUAL ======================= */
function updateStreakVisual(){
  if(streak <= 0) streakFlame.textContent = "⚪";
  else if(streak <= 2) streakFlame.textContent = "✨";
  else if(streak <= 6) streakFlame.textContent = "🔥";
  else if(streak <= 14) streakFlame.textContent = "🔥🔥";
  else streakFlame.textContent = "👑🔥🔥";
}

/* ======================= NOTE ======================= */
/* Browser audio may be blocked until you interact with the page.
   Click 'Create Today's Task' or any button once after opening to unlock sounds. */
