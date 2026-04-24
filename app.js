// ========== TTS (Text-to-Speech) ==========
const VOICE_PREF_KEY = 'vn-phrasebook-voice';
let vietnameseVoices = [];
let vietnameseVoice = null;

// 음성 품질 점수 — 높을수록 선호
function scoreVoice(v) {
  let s = 0;
  const name = (v.name || '').toLowerCase();
  if (v.lang === 'vi-VN') s += 10;
  else if ((v.lang || '').startsWith('vi')) s += 5;
  // 향상된/프리미엄 키워드
  if (/enhanced|premium|neural|natural/i.test(name)) s += 20;
  if (/\(enhanced\)|\(premium\)/i.test(v.name || '')) s += 20;
  // 알려진 품질 좋은 베트남어 음성 이름
  if (/linh|hoaimy|namminh|lien/i.test(name)) s += 3;
  // 네트워크 음성(Google 등)은 기본 로컬보다 보통 더 자연스러움
  if (v.localService === false) s += 2;
  return s;
}

function refreshVietnameseVoices() {
  const all = speechSynthesis.getVoices();
  vietnameseVoices = all
    .filter(v => (v.lang || '').toLowerCase().startsWith('vi'))
    .sort((a, b) => scoreVoice(b) - scoreVoice(a));

  const saved = localStorage.getItem(VOICE_PREF_KEY);
  vietnameseVoice =
    (saved && vietnameseVoices.find(v => v.name === saved)) ||
    vietnameseVoices[0] ||
    null;

  renderVoicePicker();
}

function renderVoicePicker() {
  const wrap = document.getElementById('voice-wrap');
  const select = document.getElementById('voice');
  if (!wrap || !select) return;

  if (vietnameseVoices.length <= 1) {
    wrap.hidden = true;
    return;
  }
  wrap.hidden = false;
  select.innerHTML = '';
  vietnameseVoices.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v.name;
    const hq = /enhanced|premium|neural|natural/i.test(v.name) ? ' ⭐' : '';
    opt.textContent = `${v.name} (${v.lang})${hq}`;
    if (vietnameseVoice && v.name === vietnameseVoice.name) opt.selected = true;
    select.appendChild(opt);
  });
}

// iOS/Safari는 getVoices()가 최초에 빈 배열일 수 있음
if (typeof speechSynthesis !== 'undefined') {
  refreshVietnameseVoices();
  speechSynthesis.onvoiceschanged = refreshVietnameseVoices;
}

let currentRate = 0.9;

function speak(text) {
  if (!('speechSynthesis' in window)) {
    alert('이 브라우저는 음성 합성을 지원하지 않습니다.');
    return;
  }
  speechSynthesis.cancel(); // 이전 재생 중단
  const u = new SpeechSynthesisUtterance(text);
  u.lang = (vietnameseVoice && vietnameseVoice.lang) || 'vi-VN';
  u.rate = currentRate;
  u.pitch = 1.0;
  if (vietnameseVoice) u.voice = vietnameseVoice;
  speechSynthesis.speak(u);
}

// ========== MP3 오디오 (고품질, 있으면 우선 사용) ==========
let audioManifest = {};   // { "Xin chào": "abc123.mp3", ... }
let currentAudio = null;

async function loadAudioManifest() {
  try {
    const resp = await fetch('audio/manifest.json', { cache: 'no-cache' });
    if (resp.ok) {
      audioManifest = await resp.json();
      updateAudioStatus();
    }
  } catch (e) {
    // MP3 없음 — TTS로 폴백
  }
}

function stopAudio() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}

function play(vi) {
  stopAudio();
  const fname = audioManifest[vi];
  if (fname) {
    const audio = new Audio('audio/' + fname);
    audio.playbackRate = currentRate;
    audio.preservesPitch = true;
    currentAudio = audio;
    audio.play().catch(err => {
      console.warn('MP3 재생 실패, TTS로 대체:', err);
      speak(vi);
    });
    return;
  }
  speak(vi);
}

function updateAudioStatus() {
  const el = document.getElementById('audio-status');
  if (!el) return;
  const count = Object.keys(audioManifest).length;
  if (count > 0) {
    el.textContent = `🔊 고품질 음성 ${count}개`;
    el.className = 'status-pill hq';
  } else {
    el.textContent = '📱 기기 음성';
    el.className = 'status-pill tts';
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
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
      const li = document.createElement('li');
      li.className = 'phrase';
      li.innerHTML = `
        <div class="ko">${item.ko}</div>
        <div class="vi">${item.vi}</div>
        <div class="speaker" aria-hidden="true">🔊</div>
      `;
      li.onclick = () => {
        play(item.vi);
        li.classList.add('playing');
        setTimeout(() => li.classList.remove('playing'), 800);
      };
      ul.appendChild(li);
    });
    section.appendChild(ul);
    container.appendChild(section);
  });
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

// ========== 속도 조절 ==========
function setupRate() {
  const slider = document.getElementById('rate');
  const label = document.getElementById('rate-label');
  slider.addEventListener('input', e => {
    currentRate = parseFloat(e.target.value);
    label.textContent = currentRate.toFixed(1) + 'x';
  });
}

// ========== 음성 선택 ==========
function setupVoicePicker() {
  const select = document.getElementById('voice');
  if (!select) return;
  select.addEventListener('change', e => {
    const picked = vietnameseVoices.find(v => v.name === e.target.value);
    if (picked) {
      vietnameseVoice = picked;
      localStorage.setItem(VOICE_PREF_KEY, picked.name);
      // 미리듣기 — 음성 선택 변경 시 TTS 테스트이므로 직접 speak 사용
      speak('Xin chào');
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

// ========== 오프라인 프리로드 (모든 MP3 미리 캐시) ==========
async function preloadAllAudio(progressCb) {
  const files = [...new Set(Object.values(audioManifest))];
  if (files.length === 0) return { total: 0, ok: 0 };
  let ok = 0;
  for (let i = 0; i < files.length; i++) {
    try {
      const resp = await fetch('audio/' + files[i], { cache: 'reload' });
      if (resp.ok) ok++;
    } catch (e) { /* ignore */ }
    if (progressCb) progressCb(i + 1, files.length);
  }
  return { total: files.length, ok };
}

function setupPreloadButton() {
  const btn = document.getElementById('preload-btn');
  if (!btn) return;
  btn.addEventListener('click', async () => {
    const files = [...new Set(Object.values(audioManifest))];
    if (files.length === 0) {
      btn.textContent = '⚠️ 매니페스트 없음 — 먼저 생성 스크립트 실행';
      return;
    }
    btn.disabled = true;
    btn.textContent = `다운로드 중… 0/${files.length}`;
    const result = await preloadAllAudio((done, total) => {
      btn.textContent = `다운로드 중… ${done}/${total}`;
    });
    btn.textContent = `✅ 완료 — ${result.ok}/${result.total} 파일 캐시됨`;
    setTimeout(() => {
      btn.disabled = false;
      btn.textContent = '📥 오프라인용 전체 음성 다운로드';
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
      const vi = await translate(text, 'ko', 'vi');
      viBox.textContent = vi;
      statusEl.textContent = '';
      speak(vi);
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
    recognition.lang = 'vi-VN';
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
          const ko = await translate(final, 'vi', 'ko');
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
  setupRate();
  setupVoicePicker();
  setupInputModal();
  setupListenModal();
  setupHelp();
  setupPreloadButton();
  registerSW();
  loadAudioManifest();
});
