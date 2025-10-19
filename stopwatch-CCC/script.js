/* Temporizadores múltiples: motor + UI (ES2020+, compatible file://) */
const MAX_VISIBLE = 50;
const listEl = document.getElementById('list');
const fallbackBanner = document.getElementById('fallback-banner');
const liveAssertive = document.getElementById('live-assertive');

// Modo claro/oscuro (informativo)
const prefersDark = matchMedia('(prefers-color-scheme: dark)');
document.getElementById('mode-label').textContent = prefersDark.matches ? 'oscuro' : 'claro';
prefersDark.addEventListener('change', e => {
  document.getElementById('mode-label').textContent = e.matches ? 'oscuro' : 'claro';
});

// ---------- Utils ----------
const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
const toSec = ({ hh = 0, mm = 0, ss = 0 }) =>
  (Number(hh) || 0) * 3600 + (Number(mm) || 0) * 60 + (Number(ss) || 0);
const fmt = (s) => {
  s = Math.max(0, Math.floor(s));
  const h = String(Math.floor(s / 3600)).padStart(2, '0');
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const sec = String(s % 60).padStart(2, '0');
  return `${h}:${m}:${sec}`;
};
const safeText = (el, txt) => { el.textContent = txt ?? ''; };

// ---------- Entorno/Permisos ----------
const IS_SECURE = (location.protocol === 'https:' || location.hostname === 'localhost');
const NOTIFY_SUPPORTED = ('Notification' in window) && IS_SECURE;

// ---------- Audio ----------
let audioCtx = null;
function ensureAudioUnlocked() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === 'suspended') return audioCtx.resume();
  return Promise.resolve();
}
function beep({ freq = 880, duration = 0.35, gain = 0.05 } = {}) {
  if (!audioCtx) return; // no desbloqueado
  const osc = audioCtx.createOscillator();
  const gn = audioCtx.createGain();
  osc.type = 'sine'; osc.frequency.value = freq;
  gn.gain.setValueAtTime(0, audioCtx.currentTime);
  gn.gain.linearRampToValueAtTime(gain, audioCtx.currentTime + 0.02);
  gn.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration);
  osc.connect(gn).connect(audioCtx.destination);
  osc.start(); osc.stop(audioCtx.currentTime + duration + 0.02);
}

// ---------- Notificaciones ----------
function ensureNotifyPermission() {
  // En file:// no hay contexto seguro → usamos fallback sin pedir permiso
  if (!NOTIFY_SUPPORTED) {
    fallbackBanner.hidden = false;
    return Promise.resolve('unsupported');
  }
  if (Notification.permission === 'granted') return Promise.resolve('granted');
  if (Notification.permission === 'denied') { fallbackBanner.hidden = false; return Promise.resolve('denied'); }
  // pedir solo en gesto de usuario
  return Notification.requestPermission().then(res => {
    if (res !== 'granted') fallbackBanner.hidden = false;
    return res;
  });
}
function notifyDone(title, body) {
  if (NOTIFY_SUPPORTED && Notification.permission === 'granted') {
    new Notification(title, { body });
  } else {
    fallbackBanner.hidden = false;
    liveAssertive.textContent = `${title}. ${body}`;
    setTimeout(() => { liveAssertive.textContent = ''; }, 3000);
  }
}

// ---------- Motor ----------
let nextId = 1;
class Timer {
  constructor({ type = 'countdown', label = '', durationSec = 0 }) {
    this.id = nextId++;
    this.type = type;
    this.label = label || `Temporizador #${this.id}`;
    this.durationSec = Math.max(0, durationSec | 0);
    this.state = 'idle';
    this.startAt = 0;
    this.endAt = 0;
    this.pausedAccum = 0;
    this.pauseAt = 0;
    this.muted = false;
    this._notified = false;
  }
  start(now) {
    if (this.state === 'running') return;
    if (this.type === 'countdown' && this.durationSec <= 0) throw new Error('Duración inválida');
    this.state = 'running';
    const t = now ?? performance.now();
    this.startAt = t;
    this.pausedAccum = 0;
    this.pauseAt = 0;
    this._notified = false;
    if (this.type === 'countdown') this.endAt = t + this.durationSec * 1000;
  }
  pause(now) {
    if (this.state !== 'running') return;
    this.state = 'paused';
    this.pauseAt = now ?? performance.now();
  }
  resume(now) {
    if (this.state !== 'paused') return;
    const t = now ?? performance.now();
    this.pausedAccum += (t - this.pauseAt);
    this.pauseAt = 0;
    this.state = 'running';
  }
  reset() {
    this.state = 'idle';
    this.startAt = 0; this.endAt = 0; this.pausedAccum = 0; this.pauseAt = 0;
    this._notified = false;
  }
  toggleMute() { this.muted = !this.muted; }
  nowSeconds(now) {
    const t = now ?? performance.now();
    if (this.state === 'idle') return this.type === 'countdown' ? this.durationSec : 0;
    if (this.type === 'stopwatch') {
      const elapsed = (this.state === 'paused' ? this.pauseAt : t) - this.startAt - this.pausedAccum;
      return Math.max(0, Math.floor(elapsed / 1000));
    } else {
      const baseMs = this.state === 'paused' ? (this.endAt - this.pauseAt) : (this.endAt - t);
      return Math.max(0, Math.ceil((baseMs + this.pausedAccum) / 1000));
    }
  }
  isDone(now) {
    if (this.type !== 'countdown' || this.state !== 'running') return false;
    return (this.endAt - (now ?? performance.now()) - this.pausedAccum) <= 0;
  }
}

const store = new Map();  // id → {timer, dom}

function addTimer(timer) {
  if (store.size >= MAX_VISIBLE) {
    alert(`Límite de ${MAX_VISIBLE} temporizadores visibles alcanzado.`);
    return;
  }
  const dom = renderCard(timer);
  store.set(timer.id, { timer, dom });
  listEl.append(dom.card);
  dom.startBtn.focus();
}

function removeTimer(id) {
  const entry = store.get(id); if (!entry) return;
  entry.dom.card.remove();
  store.delete(id);
}

// ---------- UI: tarjeta ----------
function renderCard(t) {
  const card = document.createElement('li'); card.className = 'card'; card.setAttribute('role', 'article');
  const header = document.createElement('div'); header.className = 'row';
  const label = document.createElement('div'); label.className = 'label'; safeText(label, t.label);
  const kind = document.createElement('span'); kind.className = 'pill'; safeText(kind, t.type === 'countdown' ? 'Regresiva' : 'Cronómetro');
  header.append(label, kind);

  const time = document.createElement('div'); time.className = 'time'; time.setAttribute('aria-live', 'off'); safeText(time, fmt(t.nowSeconds()));
  const controls = document.createElement('div'); controls.className = 'controls';

  const startBtn = btn('Iniciar', 'ok');
  const pauseBtn = btn('Pausar', 'warn'); pauseBtn.disabled = true;
  const resumeBtn = btn('Reanudar', 'ok'); resumeBtn.disabled = true;
  const resetBtn = btn('Restablecer', 'secondary'); resetBtn.disabled = false;
  const muteBtn = btn('Silenciar', 'secondary');
  const delBtn = btn('Eliminar', 'danger');

  controls.append(startBtn, pauseBtn, resumeBtn, resetBtn, muteBtn, delBtn);
  const meta = document.createElement('div'); meta.className = 'meta';
  meta.innerHTML = `<span class="pill">id ${t.id}</span><span class="pill">${t.type === 'countdown' ? 'hh:mm:ss objetivo' : 'hh:mm:ss transcurrido'}</span>`;

  card.append(header, time, controls, meta);

  // Eventos
  startBtn.addEventListener('click', async () => {
    try {
      await ensureAudioUnlocked();         // gesto de usuario
      await ensureNotifyPermission();      // en file:// → fallback automático
      t.start();
      startBtn.disabled = true; pauseBtn.disabled = false; resumeBtn.disabled = true;
      resetBtn.disabled = false;
    } catch (e) { alert('Error: ' + e.message); }
  });
  pauseBtn.addEventListener('click', () => { t.pause(); pauseBtn.disabled = true; resumeBtn.disabled = false; });
  resumeBtn.addEventListener('click', () => { t.resume(); pauseBtn.disabled = false; resumeBtn.disabled = true; });
  resetBtn.addEventListener('click', () => { t.reset(); startBtn.disabled = false; pauseBtn.disabled = true; resumeBtn.disabled = true; safeText(time, fmt(t.nowSeconds())); });
  delBtn.addEventListener('click', () => { removeTimer(t.id); });
  muteBtn.addEventListener('click', () => { t.toggleMute(); muteBtn.textContent = t.muted ? 'Sonar' : 'Silenciar'; });

  return { card, time, startBtn, pauseBtn, resumeBtn };
}
function btn(label, kind = '') {
  const b = document.createElement('button'); b.className = 'btn' + (kind ? ` ${kind}` : ''); b.type = 'button'; b.textContent = label; return b;
}

// ---------- Bucle de render ----------
function loop() {
  const now = performance.now();
  for (const { timer, dom } of store.values()) {
    const show = timer.nowSeconds(now);
    safeText(dom.time, fmt(show));
    if (timer.isDone(now) && !timer._notified) {
      timer.state = 'finished';
      timer._notified = true;
      if (!timer.muted) beep({ freq: 880, duration: .35, gain: 0.08 });
      notifyDone('Tiempo finalizado', `“${timer.label}” ha terminado.`);
    }
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// ---------- Controles superiores ----------
document.getElementById('request-perms').addEventListener('click', async () => {
  await ensureAudioUnlocked();
  await ensureNotifyPermission(); // en file:// mostrará banner y usará fallback
  alert('Listo: audio desbloqueado y permisos gestionados (fallback si no hay notificaciones).');
});

document.getElementById('create').addEventListener('click', () => {
  const type = document.getElementById('type').value;
  const label = (document.getElementById('label').value || '').trim();
  const hh = clamp(parseInt(document.getElementById('hh').value, 10) || 0, 0, 99);
  const mm = clamp(parseInt(document.getElementById('mm').value, 10) || 0, 0, 59);
  const ss = clamp(parseInt(document.getElementById('ss').value, 10) || 0, 0, 59);
  const durationSec = toSec({ hh, mm, ss });
  if (type === 'countdown' && durationSec <= 0) { alert('Indica una duración > 0 para la cuenta regresiva.'); return; }
  const t = new Timer({ type, label, durationSec });
  addTimer(t);
  document.getElementById('label').value = '';
  if (type === 'stopwatch') {
    document.getElementById('hh').value = '';
    document.getElementById('mm').value = '';
    document.getElementById('ss').value = '';
  }
});

// ---------- Ayuda / atajos ----------
window.addEventListener('keydown', (e) => {
  if (e.key === '?') {
    e.preventDefault();
    alert('Atajos:\n- Tab para navegar, Enter/Espacio para activar.\n- “Permisos” desbloquea audio.\n- Hasta 50 temporizadores visibles.\n- En file:// las notificaciones nativas no están disponibles: se usa un aviso accesible.');
  }
});

// ---------- Comprobaciones de plataforma ----------
if (!('performance' in window && 'now' in performance)) alert('Este navegador no soporta performance.now().');
if (!('requestAnimationFrame' in window)) alert('Este navegador no soporta requestAnimationFrame().');
if (!('AudioContext' in window || 'webkitAudioContext' in window)) console.warn('Web Audio no disponible: el sonido puede no reproducirse.');

