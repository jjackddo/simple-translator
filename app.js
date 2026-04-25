// ========== 언어 설정 ==========
// code: 브라우저 SpeechSynthesis/SpeechRecognition 언어 태그
// translateCode: Google Cloud Translation API에 넣을 언어 코드
const LANG_CONFIG = {
  vi: { code: 'vi-VN', translateCode: 'vi',    label: '🇻🇳 베트남어', title: '베트남 여행 회화', voiceQualityNames: /linh|hoaimy|namminh|lien/i },
  ja: { code: 'ja-JP', translateCode: 'ja',    label: '🇯🇵 일본어',   title: '일본 여행 회화',   voiceQualityNames: /kyoko|otoya|hattori/i },
  zh: { code: 'zh-CN', translateCode: 'zh-CN', label: '🇨🇳 중국어',   title: '중국 여행 회화',   voiceQualityNames: /xiaoxiao|xiaoyi|yunxi|yunjian/i },
};
const LANG_STORAGE_KEY = 'vn-phrasebook-lang';
const GENDER_STORAGE_KEY = 'vn-phrasebook-gender';
const VOICE_PREF_KEY_PREFIX = 'vn-phrasebook-voice-';

let currentLang = localStorage.getItem(LANG_STORAGE_KEY) || 'vi';
if (!LANG_CONFIG[currentLang]) currentLang = 'vi';

let currentGender = localStorage.getItem(GENDER_STORAGE_KEY) || 'female';
if (currentGender !== 'female' && currentGender !== 'male') currentGender = 'female';

function langCode() { return LANG_CONFIG[currentLang].code; }

// ========== TTS (Text-to-Speech) ==========
let availableVoices = [];   // 현재 언어에 맞는 음성 목록
let selectedVoice = null;

function scoreVoice(v) {
  const cfg = LANG_CONFIG[currentLang];
  const name = (v.name || '').toLowerCase();
  let s = 0;
  if (v.lang === cfg.code) s += 10;
  else if ((v.lang || '').startsWith(currentLang)) s += 5;
  if (/enhanced|premium|neural|natural/i.test(name)) s += 20;
  if (/\(enhanced\)|\(premium\)/i.test(v.name || '')) s += 20;
  if (cfg.voiceQualityNames.test(name)) s += 3;
  if (v.localService === false) s += 2;
  return s;
}

function refreshVoices() {
  if (typeof speechSynthesis === 'undefined') return;
  const all = speechSynthesis.getVoices();
  const prefix = currentLang;
  availableVoices = all
    .filter(v => (v.lang || '').toLowerCase().startsWith(prefix))
    .sort((a, b) => scoreVoice(b) - scoreVoice(a));

  const saved = localStorage.getItem(VOICE_PREF_KEY_PREFIX + currentLang);
  selectedVoice =
    (saved && availableVoices.find(v => v.name === saved)) ||
    availableVoices[0] ||
    null;

  renderVoicePicker();
}

function renderVoicePicker() {
  const wrap = document.getElementById('voice-wrap');
  const select = document.getElementById('voice');
  if (!wrap || !select) return;

  if (availableVoices.length <= 1) {
    wrap.hidden = true;
    return;
  }
  wrap.hidden = false;
  select.innerHTML = '';
  availableVoices.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v.name;
    const hq = /enhanced|premium|neural|natural/i.test(v.name) ? ' ⭐' : '';
    opt.textContent = `${v.name} (${v.lang})${hq}`;
    if (selectedVoice && v.name === selectedVoice.name) opt.selected = true;
    select.appendChild(opt);
  });
}

if (typeof speechSynthesis !== 'undefined') {
  refreshVoices();
  speechSynthesis.onvoiceschanged = refreshVoices;
}

const RATE_STORAGE_KEY = 'vn-phrasebook-rate';
let currentRate = (() => {
  const v = parseFloat(localStorage.getItem(RATE_STORAGE_KEY));
  return (v >= 0.5 && v <= 1.2) ? v : 0.9;
})();

function speak(text) {
  if (!('speechSynthesis' in window)) {
    alert('이 브라우저는 음성 합성을 지원하지 않습니다.');
    return;
  }
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = (selectedVoice && selectedVoice.lang) || langCode();
  u.rate = currentRate;
  u.pitch = 1.0;
  if (selectedVoice) u.voice = selectedVoice;
  speechSynthesis.speak(u);
}

// ========== MP3 오디오 (Web Audio BufferSource 기반) ==========
// HTMLAudioElement를 쓰지 않으므로:
//  1) iOS의 "미디어 재생 위젯"(잠금화면/제어센터 Now Playing)이 뜨지 않음
//  2) MediaElementSource + playbackRate에서 발생하던 iOS 지지직 아티팩트 해소
// 레벨 미터는 AudioContext의 시계(currentTime)를 이용한 진행 바.
let audioManifest = {};
let audioCtx = null;
let currentSource = null;
let sourceStartedAt = 0;
let sourceDuration = 0;
const BUFFER_CACHE_MAX = 25;     // 최근 재생한 버퍼만 유지 (메모리 절약)
const bufferCache = new Map();   // path → decoded AudioBuffer (LRU)

function cacheGet(path) {
  if (!bufferCache.has(path)) return null;
  const v = bufferCache.get(path);
  bufferCache.delete(path);
  bufferCache.set(path, v);      // LRU bump
  return v;
}

function cachePut(path, buffer) {
  if (bufferCache.has(path)) bufferCache.delete(path);
  bufferCache.set(path, buffer);
  while (bufferCache.size > BUFFER_CACHE_MAX) {
    bufferCache.delete(bufferCache.keys().next().value);
  }
}

function getAudioContext() {
  if (audioCtx) return audioCtx;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return null;
  audioCtx = new Ctx();
  return audioCtx;
}

async function loadAudioManifest() {
  audioManifest = {};
  try {
    const resp = await fetch(`audio/${currentLang}/${currentGender}/manifest.json`, { cache: 'no-cache' });
    if (resp.ok) audioManifest = await resp.json();
  } catch (e) {
    // MP3 없음 — TTS로 폴백
  }
}

async function decodeBuffer(path) {
  const ctx = getAudioContext();
  if (!ctx) throw new Error('Web Audio API unsupported');
  const cached = cacheGet(path);
  if (cached) return cached;
  const resp = await fetch(path);
  if (!resp.ok) throw new Error(`fetch ${resp.status}`);
  const arr = await resp.arrayBuffer();
  // Safari 구버전 호환: Promise 또는 콜백 형태 모두 지원
  const buffer = await new Promise((resolve, reject) => {
    const p = ctx.decodeAudioData(arr, resolve, reject);
    if (p && typeof p.then === 'function') p.then(resolve, reject);
  });
  cachePut(path, buffer);
  return buffer;
}

function stopAudio() {
  if (currentSource) {
    try { currentSource.onended = null; } catch {}
    try { currentSource.stop(0); } catch {}
    try { currentSource.disconnect(); } catch {}
    currentSource = null;
  }
  if ('speechSynthesis' in window) speechSynthesis.cancel();
  stopMeter();
}

async function play(text) {
  stopAudio();
  const fname = audioManifest[text];
  if (!fname) { speak(text); return; }
  const audioPath = `audio/${currentLang}/${currentGender}/${fname}`;

  const ctx = getAudioContext();
  if (!ctx) { speak(text); return; }
  // 사용자 제스처 내에서 호출되므로 resume() 가능
  if (ctx.state === 'suspended') {
    try { await ctx.resume(); } catch {}
  }

  let buffer;
  try {
    buffer = await decodeBuffer(audioPath);
  } catch (err) {
    console.warn('MP3 디코드 실패, TTS로 대체:', err);
    speak(text);
    return;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = currentRate;
  source.connect(ctx.destination);
  source.onended = () => {
    if (currentSource === source) {
      currentSource = null;
      stopMeter();
    }
  };

  currentSource = source;
  sourceStartedAt = ctx.currentTime;
  sourceDuration = buffer.duration / currentRate;
  try {
    source.start(0);
  } catch (err) {
    console.warn('MP3 재생 실패:', err);
    speak(text);
    return;
  }
  startMeter();
}

// ========== 레벨 미터 (시간 기반 진행 바) ==========
let meterRAF = null;

function startMeter() {
  const meterEl = document.getElementById('level-meter');
  const barEl = document.getElementById('level-bar');
  if (!meterEl) return;
  meterEl.hidden = false;
  meterEl.classList.add('active');

  const tick = () => {
    if (!currentSource || !audioCtx) { stopMeter(); return; }
    const elapsed = audioCtx.currentTime - sourceStartedAt;
    const pct = sourceDuration > 0
      ? Math.min(100, (elapsed / sourceDuration) * 100)
      : 0;
    if (barEl) barEl.style.width = pct + '%';
    if (elapsed >= sourceDuration) { stopMeter(); return; }
    meterRAF = requestAnimationFrame(tick);
  };
  meterRAF = requestAnimationFrame(tick);
}

function stopMeter() {
  if (meterRAF) {
    cancelAnimationFrame(meterRAF);
    meterRAF = null;
  }
  const meterEl = document.getElementById('level-meter');
  const barEl = document.getElementById('level-bar');
  if (meterEl) {
    meterEl.classList.remove('active');
    setTimeout(() => {
      if (!currentSource) {
        meterEl.hidden = true;
        if (barEl) barEl.style.width = '0%';
      }
    }, 250);
  }
}

// ========== 렌더링 ==========
function render() {
  const container = document.getElementById('content');
  const nav = document.getElementById('nav');
  container.innerHTML = '';
  nav.innerHTML = '';

  Object.keys(phrases).forEach((category, idx) => {
    // 네비게이션 탭
    const tab = document.createElement('button');
    tab.className = 'tab';
    tab.textContent = category;
    tab.onclick = () => {
      const el = document.getElementById('cat-' + idx);
      if (!el) return;
      const header = document.querySelector('header');
      const headerH = header ? header.offsetHeight : 0;
      const y = el.getBoundingClientRect().top + window.scrollY - headerH - 4;
      window.scrollTo(0, y);
    };
    nav.appendChild(tab);

    // 카테고리 섹션
    const section = document.createElement('section');
    section.id = 'cat-' + idx;
    section.className = 'category';

    const h2 = document.createElement('h2');
    h2.textContent = category;
    section.appendChild(h2);

    const ul = document.createElement('ul');
    phrases[category].forEach(item => {
      const target = item[currentLang];
      if (!target) return;  // 해당 언어 번역이 없으면 숨김
      const li = document.createElement('li');
      li.className = 'phrase';
      li.innerHTML = `
        <div class="ko">${escapeHtml(item.ko)}</div>
        <div class="vi">${escapeHtml(target)}</div>
        <div class="speaker" aria-hidden="true">🔊</div>
      `;
      li.onclick = () => {
        play(target);
        li.classList.add('playing');
        setTimeout(() => li.classList.remove('playing'), 800);
      };
      ul.appendChild(li);
    });
    // 렌더된 항목이 하나도 없으면 섹션 자체 숨김
    if (ul.children.length === 0) return;
    section.appendChild(ul);
    container.appendChild(section);
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[ch]);
}

// ========== 검색 ==========
function setupSearch() {
  const input = document.getElementById('search');
  input.addEventListener('input', e => {
    const q = e.target.value.trim().toLowerCase();
    document.querySelectorAll('.phrase').forEach(li => {
      const ko = li.querySelector('.ko').textContent.toLowerCase();
      const vi = li.querySelector('.vi').textContent.toLowerCase();
      li.style.display = !q || ko.includes(q) || vi.includes(q) ? '' : 'none';
    });
    // 빈 카테고리는 숨기기
    document.querySelectorAll('.category').forEach(sec => {
      const visible = [...sec.querySelectorAll('.phrase')].some(p => p.style.display !== 'none');
      sec.style.display = visible ? '' : 'none';
    });
  });
}

// ========== 음성 선택 ==========
function setupVoicePicker() {
  const select = document.getElementById('voice');
  if (!select) return;
  select.addEventListener('change', e => {
    const picked = availableVoices.find(v => v.name === e.target.value);
    if (picked) {
      selectedVoice = picked;
      localStorage.setItem(VOICE_PREF_KEY_PREFIX + currentLang, picked.name);
      // 미리듣기 — TTS 테스트이므로 직접 speak 사용
      speak({ vi: 'Xin chào', ja: 'こんにちは', zh: '你好' }[currentLang] || 'hello');
    }
  });
}

// ========== 번역 (Google Cloud Translation API v2) ==========
const TRANSLATE_URL = 'https://translation.googleapis.com/language/translate/v2';
const BROWSER_KEY_STORAGE = 'vn-phrasebook-browser-api-key';

function getBrowserApiKey() {
  // 1) 개인 기기 오버라이드 (localStorage)
  const stored = localStorage.getItem(BROWSER_KEY_STORAGE);
  if (stored) return stored;
  // 2) config.js 기본값 (referrer 제한으로 공개 안전)
  if (window.APP_CONFIG && window.APP_CONFIG.GOOGLE_API_KEY) {
    return window.APP_CONFIG.GOOGLE_API_KEY;
  }
  return '';
}

function setBrowserApiKey(key) {
  localStorage.setItem(BROWSER_KEY_STORAGE, key);
}

async function translate(text, source, target) {
  const key = getBrowserApiKey();
  if (!key) throw new Error('NO_KEY');
  const resp = await fetch(`${TRANSLATE_URL}?key=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: text, source, target, format: 'text' }),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`번역 API 오류 (${resp.status}): ${txt.slice(0, 200)}`);
  }
  const data = await resp.json();
  return data.data.translations[0].translatedText;
}

function speakKorean(text) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'ko-KR';
  u.rate = currentRate;
  speechSynthesis.speak(u);
}

// 키가 없을 때 모달 바디 맨 위에 설정 폼을 삽입
function renderKeySetup(container, onSaved) {
  const existing = container.querySelector('.key-setup');
  if (existing) existing.remove();
  if (getBrowserApiKey()) return false;
  const box = document.createElement('div');
  box.className = 'key-setup';
  box.innerHTML = `
    <p><strong>🔑 번역 API 키 설정이 필요합니다.</strong>
       도움말(?)의 "번역 기능 API 키 설정"을 먼저 따라해주세요.</p>
    <input type="password" class="key-input" placeholder="AIza... (브라우저용 키)" autocomplete="off" />
    <button type="button" class="primary-btn key-save">저장</button>
  `;
  container.prepend(box);
  box.querySelector('.key-save').addEventListener('click', () => {
    const val = box.querySelector('.key-input').value.trim();
    if (!val.startsWith('AIza')) {
      alert('키 형식이 올바르지 않습니다 (AIza로 시작해야 함)');
      return;
    }
    setBrowserApiKey(val);
    box.remove();
    if (onSaved) onSaved();
  });
  return true;
}

// ========== 오프라인 프리로드 (모든 언어×성별 조합 미리 캐시) ==========
async function collectAllAudioTargets() {
  const combos = [];
  for (const lang of Object.keys(LANG_CONFIG)) {
    for (const gender of ['female', 'male']) {
      combos.push({ lang, gender });
    }
  }
  const targets = [];
  for (const c of combos) {
    try {
      const resp = await fetch(`audio/${c.lang}/${c.gender}/manifest.json`, { cache: 'reload' });
      if (!resp.ok) continue;
      const m = await resp.json();
      for (const fname of new Set(Object.values(m))) {
        targets.push(`audio/${c.lang}/${c.gender}/${fname}`);
      }
    } catch (e) { /* skip */ }
  }
  return targets;
}

async function preloadAllAudio(progressCb) {
  const targets = await collectAllAudioTargets();
  if (targets.length === 0) return { total: 0, ok: 0 };
  let ok = 0;
  for (let i = 0; i < targets.length; i++) {
    try {
      const resp = await fetch(targets[i], { cache: 'reload' });
      if (resp.ok) ok++;
    } catch (e) { /* ignore */ }
    if (progressCb) progressCb(i + 1, targets.length);
  }
  return { total: targets.length, ok };
}

function setupPreloadButton() {
  const btn = document.getElementById('preload-btn');
  if (!btn) return;
  const originalText = '📥 모든 음성 다운로드';
  btn.addEventListener('click', async () => {
    btn.disabled = true;
    btn.textContent = '준비 중…';
    const result = await preloadAllAudio((done, total) => {
      btn.textContent = `다운로드 중… ${done}/${total}`;
    });
    if (result.total === 0) {
      btn.textContent = '⚠️ 매니페스트를 찾을 수 없습니다';
    } else {
      btn.textContent = `✅ 완료 — ${result.ok}/${result.total} 파일 캐시`;
    }
    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = originalText;
    }, 4000);
  });
}

// ========== 입력 모달 (한국어 → 베트남어) ==========
function setupInputModal() {
  const btn = document.getElementById('input-btn');
  const modal = document.getElementById('input-modal');
  if (!btn || !modal) return;

  const body = modal.querySelector('.modal-body');
  const textarea = document.getElementById('input-ko');
  const viBox = document.getElementById('input-vi');
  const statusEl = document.getElementById('input-status');
  const translateBtn = document.getElementById('input-translate-btn');
  const speakBtn = document.getElementById('input-speak-btn');

  const refresh = () => renderKeySetup(body);

  const open = () => {
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    viBox.textContent = '';
    statusEl.textContent = '';
    refresh();
    setTimeout(() => {
      if (getBrowserApiKey()) textarea.focus();
    }, 100);
  };
  const close = () => {
    modal.hidden = true;
    document.body.style.overflow = '';
    stopAudio();
  };

  btn.addEventListener('click', open);
  modal.addEventListener('click', e => { if (e.target.dataset.close) close(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !modal.hidden) close();
  });

  translateBtn.addEventListener('click', async () => {
    const text = textarea.value.trim();
    if (!text) return;
    if (!getBrowserApiKey()) { refresh(); return; }
    statusEl.textContent = '번역 중...';
    viBox.textContent = '';
    translateBtn.disabled = true;
    try {
      const translated = await translate(text, 'ko', LANG_CONFIG[currentLang].translateCode);
      viBox.textContent = translated;
      statusEl.textContent = '';
      play(translated);
    } catch (e) {
      if (e.message === 'NO_KEY') {
        statusEl.textContent = '키가 필요합니다';
        refresh();
      } else {
        statusEl.textContent = '❌ ' + e.message;
      }
    } finally {
      translateBtn.disabled = false;
    }
  });

  speakBtn.addEventListener('click', () => {
    const vi = viBox.textContent.trim();
    if (vi) speak(vi);
  });
}

// ========== 듣기 모달 (베트남어 마이크 → 한국어 번역) ==========
function setupListenModal() {
  const btn = document.getElementById('listen-btn');
  const modal = document.getElementById('listen-modal');
  if (!btn || !modal) return;

  const body = modal.querySelector('.modal-body');
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const startBtn = document.getElementById('listen-start-btn');
  const viBox = document.getElementById('listen-vi');
  const koBox = document.getElementById('listen-ko');
  const statusEl = document.getElementById('listen-status');
  let recognition = null;

  const resetUI = () => {
    startBtn.textContent = '🎤 말하기 시작';
    startBtn.classList.remove('recording');
  };

  const refresh = () => renderKeySetup(body);

  const open = () => {
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    viBox.textContent = '';
    koBox.textContent = '';
    refresh();
    if (!SR) {
      statusEl.textContent = '⚠️ 이 브라우저는 음성 인식을 지원하지 않습니다 (iOS 14.5+/Chrome 권장)';
      startBtn.disabled = true;
    } else if (!getBrowserApiKey()) {
      statusEl.textContent = '🔑 위의 API 키 설정을 먼저 완료하세요';
      startBtn.disabled = true;
    } else {
      statusEl.textContent = '버튼을 누르고 상대방 말을 들려주세요';
      startBtn.disabled = false;
    }
    resetUI();
  };
  const close = () => {
    if (recognition) { try { recognition.stop(); } catch {} recognition = null; }
    speechSynthesis.cancel();
    modal.hidden = true;
    document.body.style.overflow = '';
  };

  btn.addEventListener('click', open);
  modal.addEventListener('click', e => { if (e.target.dataset.close) close(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !modal.hidden) close();
  });

  startBtn.addEventListener('click', () => {
    if (!SR || !getBrowserApiKey()) return;
    if (recognition) { recognition.stop(); return; }

    viBox.textContent = '';
    koBox.textContent = '';
    statusEl.textContent = '🎤 듣는 중... (말이 끝나면 자동 정지)';
    startBtn.textContent = '⏹ 정지';
    startBtn.classList.add('recording');

    recognition = new SR();
    recognition.lang = langCode();
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onresult = async (ev) => {
      let interim = '';
      let final = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i];
        if (r.isFinal) final += r[0].transcript;
        else interim += r[0].transcript;
      }
      viBox.textContent = final || interim;
      if (final) {
        statusEl.textContent = '번역 중...';
        try {
          const ko = await translate(final, LANG_CONFIG[currentLang].translateCode, 'ko');
          koBox.textContent = ko;
          statusEl.textContent = '';
          speakKorean(ko);
        } catch (e) {
          statusEl.textContent = '❌ ' + e.message;
        }
      }
    };
    recognition.onerror = (ev) => {
      const map = {
        'no-speech': '소리가 감지되지 않았습니다',
        'not-allowed': '마이크 권한이 없습니다 (브라우저 설정 확인)',
        'network': '네트워크 연결 필요',
        'audio-capture': '마이크를 찾을 수 없습니다',
      };
      statusEl.textContent = '❌ ' + (map[ev.error] || ev.error);
      resetUI();
      recognition = null;
    };
    recognition.onend = () => {
      resetUI();
      if (!statusEl.textContent.startsWith('번역') && !statusEl.textContent.startsWith('❌')) {
        statusEl.textContent = viBox.textContent ? '' : '다시 시도하세요';
      }
      recognition = null;
    };
    try {
      recognition.start();
    } catch (e) {
      statusEl.textContent = '❌ 시작 실패: ' + e.message;
      resetUI();
      recognition = null;
    }
  });
}

// ========== 언어 토글 ==========
function applyLangUI() {
  const cfg = LANG_CONFIG[currentLang];
  document.title = cfg.title;
  const titleEl = document.getElementById('app-title');
  if (titleEl) titleEl.textContent = cfg.label.split(' ')[0] + ' ' + cfg.title;
  // 토글 버튼 활성 상태
  document.querySelectorAll('[data-lang]').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === currentLang);
    btn.setAttribute('aria-pressed', btn.dataset.lang === currentLang ? 'true' : 'false');
  });
  // HTML lang attribute
  document.documentElement.setAttribute('lang', 'ko');  // UI는 한국어 유지
}

async function switchLang(newLang) {
  if (!LANG_CONFIG[newLang] || newLang === currentLang) return;
  stopAudio();
  currentLang = newLang;
  localStorage.setItem(LANG_STORAGE_KEY, newLang);
  applyLangUI();
  refreshVoices();
  await loadAudioManifest();
  render();
}

function setupLangToggle() {
  document.querySelectorAll('[data-lang]').forEach(btn => {
    btn.addEventListener('click', () => switchLang(btn.dataset.lang));
  });
  applyLangUI();
}

// ========== 성별 토글 (단일 버튼, 탭하여 전환) ==========
function applyGenderUI() {
  const btn = document.getElementById('gender-toggle-btn');
  if (!btn) return;
  btn.dataset.gender = currentGender;
  btn.textContent = currentGender === 'female' ? '♀' : '♂';
  btn.setAttribute(
    'aria-label',
    currentGender === 'female' ? '여성 음성 (탭하여 남성으로)' : '남성 음성 (탭하여 여성으로)'
  );
}

async function switchGender(newGender) {
  if (newGender !== 'female' && newGender !== 'male') return;
  if (newGender === currentGender) return;
  stopAudio();
  currentGender = newGender;
  localStorage.setItem(GENDER_STORAGE_KEY, newGender);
  applyGenderUI();
  await loadAudioManifest();
}

function setupGenderToggle() {
  const btn = document.getElementById('gender-toggle-btn');
  if (!btn) return;
  btn.addEventListener('click', () => {
    switchGender(currentGender === 'female' ? 'male' : 'female');
  });
  applyGenderUI();
}

// ========== 설정 모달 ==========
function setupSettingsModal() {
  const btn = document.getElementById('settings-btn');
  const modal = document.getElementById('settings-modal');
  if (!btn || !modal) return;

  const open = () => {
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  };
  const close = () => {
    modal.hidden = true;
    document.body.style.overflow = '';
  };

  btn.addEventListener('click', open);
  modal.addEventListener('click', e => { if (e.target.dataset.close) close(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !modal.hidden) close();
  });
}

function setupRateSlider() {
  const slider = document.getElementById('rate-slider');
  const label = document.getElementById('rate-label');
  if (!slider || !label) return;
  slider.value = String(currentRate);
  label.textContent = currentRate.toFixed(2).replace(/0$/, '') + 'x';
  slider.addEventListener('input', e => {
    currentRate = parseFloat(e.target.value);
    label.textContent = currentRate.toFixed(2).replace(/0$/, '') + 'x';
    localStorage.setItem(RATE_STORAGE_KEY, String(currentRate));
  });
}

// ========== 환율 계산기 ==========
const CURRENCY_BY_LANG = {
  vi: { code: 'VND', name: '베트남 동',  hint: '예: 100,000' },
  ja: { code: 'JPY', name: '일본 엔',    hint: '예: 1,000' },
  zh: { code: 'CNY', name: '중국 위안',  hint: '예: 100' },
};
const RATES_STORAGE_KEY = 'vn-phrasebook-rates';
const RATES_TTL_MS = 6 * 60 * 60 * 1000;
const RATES_URL = 'https://open.er-api.com/v6/latest/USD';

let cachedRates = null;

function loadCachedRates() {
  try {
    cachedRates = JSON.parse(localStorage.getItem(RATES_STORAGE_KEY) || 'null');
  } catch { cachedRates = null; }
}

async function getRates() {
  if (!cachedRates) loadCachedRates();
  const fresh = cachedRates && (Date.now() - cachedRates.fetchedAt < RATES_TTL_MS);
  if (fresh) return cachedRates;

  try {
    const resp = await fetch(RATES_URL, { cache: 'no-cache' });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    if (data.result !== 'success') throw new Error(data.error_type || 'API error');
    const out = { rates: data.rates, fetchedAt: Date.now() };
    cachedRates = out;
    localStorage.setItem(RATES_STORAGE_KEY, JSON.stringify(out));
    return out;
  } catch (err) {
    if (cachedRates) return { ...cachedRates, stale: true };
    throw err;
  }
}

function convertToKRW(amount, fromCurrency, rates) {
  const fromRate = rates[fromCurrency];
  const krwRate = rates['KRW'];
  if (!fromRate || !krwRate) return null;
  return amount / fromRate * krwRate;
}

function formatKRW(n) {
  return new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 0 }).format(Math.round(n)) + ' 원';
}

function parseAmount(s) {
  if (!s) return NaN;
  const cleaned = s.replace(/,/g, '').replace(/\s/g, '');
  return parseFloat(cleaned);
}

function formatAmount(n) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(n);
}

function ageLabel(ms) {
  const min = Math.floor(ms / 60000);
  if (min < 1) return '방금';
  if (min < 60) return `${min}분 전`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

function setupCurrencyModal() {
  const btn = document.getElementById('currency-btn');
  const modal = document.getElementById('currency-modal');
  if (!btn || !modal) return;

  const inputEl = document.getElementById('currency-input');
  const unitEl = document.getElementById('currency-input-unit');
  const labelEl = document.getElementById('currency-input-label');
  const resultEl = document.getElementById('currency-result');
  const statusEl = document.getElementById('currency-status');
  const quickBtns = modal.querySelectorAll('.quick-amount');

  let ratesData = null;

  const compute = () => {
    const cfg = CURRENCY_BY_LANG[currentLang];
    const v = parseAmount(inputEl.value);
    if (!isFinite(v) || v <= 0 || !ratesData) {
      resultEl.textContent = '—';
      return;
    }
    const krw = convertToKRW(v, cfg.code, ratesData.rates);
    resultEl.textContent = (krw == null) ? '환율 없음' : `약 ${formatKRW(krw)}`;
  };

  const refreshUnit = () => {
    const cfg = CURRENCY_BY_LANG[currentLang];
    unitEl.textContent = cfg.code;
    labelEl.textContent = `현지 금액 입력 (${cfg.code} · ${cfg.name})`;
    inputEl.placeholder = cfg.hint;
  };

  const open = async () => {
    refreshUnit();
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    inputEl.value = '';
    resultEl.textContent = '—';
    statusEl.textContent = '환율 불러오는 중…';
    setTimeout(() => inputEl.focus(), 80);
    try {
      ratesData = await getRates();
      const age = Date.now() - ratesData.fetchedAt;
      statusEl.textContent = ratesData.stale
        ? `⚠️ 오프라인 — 캐시된 환율(${ageLabel(age)}) 사용 중`
        : `✓ 환율 업데이트: ${ageLabel(age)} (USD 기준 변환)`;
      compute();
    } catch (e) {
      statusEl.textContent = '❌ 환율을 가져오지 못했습니다 — 인터넷 연결을 확인하세요';
    }
  };
  const close = () => {
    modal.hidden = true;
    document.body.style.overflow = '';
  };

  btn.addEventListener('click', open);
  modal.addEventListener('click', e => { if (e.target.dataset.close) close(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !modal.hidden) close();
  });
  inputEl.addEventListener('input', compute);
  quickBtns.forEach(b => {
    b.addEventListener('click', () => {
      const current = parseAmount(inputEl.value);
      const base = isFinite(current) && current > 0 ? current : 0;
      const add = parseFloat(b.dataset.amount);
      inputEl.value = formatAmount(base + add);
      compute();
    });
  });
}

// ========== 도움말 모달 ==========
function setupHelp() {
  const btn = document.getElementById('help-btn');
  const modal = document.getElementById('help-modal');
  if (!btn || !modal) return;

  const open = () => {
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
  };
  const close = () => {
    modal.hidden = true;
    document.body.style.overflow = '';
  };

  btn.addEventListener('click', open);
  modal.addEventListener('click', e => {
    if (e.target.dataset.close) close();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !modal.hidden) close();
  });
}

// ========== 서비스 워커 등록 (오프라인) ==========
function registerSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(() => {});
    });
  }
}

// ========== 시작 ==========
document.addEventListener('DOMContentLoaded', () => {
  render();
  setupSearch();
  setupLangToggle();
  setupGenderToggle();
  setupVoicePicker();
  setupInputModal();
  setupListenModal();
  setupCurrencyModal();
  setupSettingsModal();
  setupRateSlider();
  setupHelp();
  setupPreloadButton();
  registerSW();
  loadAudioManifest();
});
