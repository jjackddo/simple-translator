#!/usr/bin/env python3
"""
Google Cloud Text-to-Speech로 phrases.js의 문장을 언어별 MP3로 생성.

사용법:
  1. 프로젝트 루트에 .env 파일 작성:
       GOOGLE_TTS_API_KEY=AIza...
     또는 export GOOGLE_TTS_API_KEY="..."

  2. 실행:
       python3 tools/generate_audio.py               # 기본 vi (베트남어)
       python3 tools/generate_audio.py --lang ja     # 일본어

옵션:
  --lang CODE     언어 (vi | ja). 기본 vi
  --voice NAME    음성 이름. 미지정 시 언어별 기본값 사용
  --rate FLOAT    생성 속도 (기본 0.9)
  --force         이미 있는 파일도 재생성
  --list-voices   해당 언어의 음성 목록만 출력
"""

import argparse
import base64
import hashlib
import json
import os
import re
import sys
import urllib.error
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PHRASES_JS = os.path.join(ROOT, 'phrases.js')
AUDIO_ROOT = os.path.join(ROOT, 'audio')
ENV_PATH = os.path.join(ROOT, '.env')

TTS_URL = 'https://texttospeech.googleapis.com/v1/text:synthesize'
VOICES_URL = 'https://texttospeech.googleapis.com/v1/voices'

# 언어별/성별 기본 설정
LANG_CONFIG = {
    'vi': {
        'language_code': 'vi-VN',
        'voices': {
            'female': 'vi-VN-Neural2-A',
            'male':   'vi-VN-Neural2-D',
        },
    },
    'ja': {
        'language_code': 'ja-JP',
        'voices': {
            'female': 'ja-JP-Neural2-B',
            'male':   'ja-JP-Neural2-C',
        },
    },
    'zh': {
        # Google TTS는 만다린을 cmn-CN으로 지정 (Neural2 없음, Wavenet 최상급)
        'language_code': 'cmn-CN',
        'voices': {
            'female': 'cmn-CN-Wavenet-A',
            'male':   'cmn-CN-Wavenet-B',
        },
    },
}


def load_api_key():
    key = os.environ.get('GOOGLE_TTS_API_KEY')
    if key:
        return key.strip()
    if os.path.exists(ENV_PATH):
        with open(ENV_PATH, encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line.startswith('GOOGLE_TTS_API_KEY='):
                    return line.split('=', 1)[1].strip().strip('"\'')
    print('오류: GOOGLE_TTS_API_KEY가 없습니다.', file=sys.stderr)
    print('  → 프로젝트 루트의 .env 파일에 아래를 추가하세요:', file=sys.stderr)
    print('    GOOGLE_TTS_API_KEY=AIza...', file=sys.stderr)
    sys.exit(1)


def strip_comments(js_text):
    """// 라인 주석과 /* ... */ 블록 주석을 제거 (문자열 리터럴은 건드리지 않음)."""
    out = []
    i, n = 0, len(js_text)
    in_str = None
    while i < n:
        ch = js_text[i]
        if in_str:
            out.append(ch)
            if ch == '\\' and i + 1 < n:
                out.append(js_text[i + 1])
                i += 2
                continue
            if ch == in_str:
                in_str = None
            i += 1
            continue
        if ch in ('"', "'"):
            in_str = ch
            out.append(ch)
            i += 1
            continue
        if ch == '/' and i + 1 < n and js_text[i + 1] == '/':
            while i < n and js_text[i] != '\n':
                i += 1
            continue
        if ch == '/' and i + 1 < n and js_text[i + 1] == '*':
            i += 2
            while i + 1 < n and not (js_text[i] == '*' and js_text[i + 1] == '/'):
                i += 1
            i += 2
            continue
        out.append(ch)
        i += 1
    return ''.join(out)


FIELD_RE = re.compile(
    r'(?P<key>[A-Za-z_][A-Za-z0-9_]*)\s*:\s*(?P<quote>["\'])(?P<val>(?:\\.|(?!(?P=quote)).)*)(?P=quote)',
    re.DOTALL,
)

# 내부에 다른 '{'를 포함하지 않는 리프 객체만 매칭 (즉 개별 항목)
ITEM_RE = re.compile(r'\{\s*[^{}]*?\bko\s*:[^{}]*?\}', re.DOTALL)


def extract_phrases(js_text):
    """phrases.js에서 { ko, vi, ja, ... } 항목 객체를 모두 추출."""
    js_text = strip_comments(js_text)
    results = []
    for m in ITEM_RE.finditer(js_text):
        item = parse_item(m.group(0))
        if item and 'ko' in item:
            results.append(item)
    return results


def parse_item(block):
    item = {}
    for m in FIELD_RE.finditer(block):
        key = m.group('key')
        val = m.group('val')
        val = val.replace('\\"', '"').replace("\\'", "'").replace('\\\\', '\\')
        item[key] = val
    return item


def hash_name(text, voice):
    key = f'{voice}|{text}'.encode('utf-8')
    return hashlib.sha1(key).hexdigest()[:12] + '.mp3'


def synthesize(text, language_code, voice, rate, api_key):
    body = {
        'input': {'text': text},
        'voice': {'languageCode': language_code, 'name': voice},
        'audioConfig': {
            'audioEncoding': 'MP3',
            'speakingRate': rate,
            'sampleRateHertz': 24000,
        },
    }
    req = urllib.request.Request(
        f'{TTS_URL}?key={api_key}',
        data=json.dumps(body).encode('utf-8'),
        headers={'Content-Type': 'application/json'},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            payload = json.load(resp)
        return base64.b64decode(payload['audioContent'])
    except urllib.error.HTTPError as e:
        detail = e.read().decode('utf-8', errors='replace')
        raise RuntimeError(f'HTTP {e.code} {e.reason}\n{detail}')


def list_voices(language_code, api_key):
    req = urllib.request.Request(f'{VOICES_URL}?languageCode={language_code}&key={api_key}')
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.load(resp)
    print(f"{'이름':<28} {'성별':<8} 샘플레이트")
    print('-' * 48)
    for v in data.get('voices', []):
        print(f"{v['name']:<28} {v['ssmlGender']:<8} {v.get('naturalSampleRateHertz','?')}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--lang', default='vi', choices=sorted(LANG_CONFIG.keys()))
    parser.add_argument('--gender', default='female', choices=['female', 'male'])
    parser.add_argument('--voice', default=None)
    parser.add_argument('--rate', type=float, default=0.9)
    parser.add_argument('--force', action='store_true')
    parser.add_argument('--list-voices', action='store_true')
    parser.add_argument('--all', action='store_true',
                        help='모든 언어/성별 조합을 한 번에 생성')
    args = parser.parse_args()

    api_key = load_api_key()

    if args.list_voices:
        cfg = LANG_CONFIG[args.lang]
        list_voices(cfg['language_code'], api_key)
        return

    # --all 모드: 모든 lang × gender 조합을 순차 실행
    if args.all:
        for lang_code in sorted(LANG_CONFIG.keys()):
            for g in ('female', 'male'):
                run_one(lang_code, g, None, args.rate, args.force, api_key)
        return

    run_one(args.lang, args.gender, args.voice, args.rate, args.force, api_key)


def run_one(lang, gender, voice_override, rate, force, api_key):
    cfg = LANG_CONFIG[lang]
    voice = voice_override or cfg['voices'][gender]
    language_code = cfg['language_code']

    audio_dir = os.path.join(AUDIO_ROOT, lang, gender)
    manifest_path = os.path.join(audio_dir, 'manifest.json')
    os.makedirs(audio_dir, exist_ok=True)

    with open(PHRASES_JS, encoding='utf-8') as f:
        js = f.read()

    phrases = extract_phrases(js)
    seen = set()
    unique = []
    for p in phrases:
        text = p.get(lang)
        if not text or text in seen:
            continue
        seen.add(text)
        unique.append(p)

    print(f'[{lang}/{gender}] 총 {len(unique)}개 · 음성 {voice} · 속도 {rate}x')

    manifest = {}
    created = skipped = failed = 0

    for i, p in enumerate(unique, 1):
        text = p[lang]
        fname = hash_name(text, voice)
        fpath = os.path.join(audio_dir, fname)
        manifest[text] = fname

        if os.path.exists(fpath) and not force:
            skipped += 1
            continue

        print(f'[{i:3d}/{len(unique)}] {text[:45]}')
        try:
            audio = synthesize(text, language_code, voice, rate, api_key)
            with open(fpath, 'wb') as fo:
                fo.write(audio)
            created += 1
        except Exception as e:
            failed += 1
            print(f'  ✗ 실패: {e}', file=sys.stderr)

    with open(manifest_path, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    print()
    print(f'생성 {created} · 스킵 {skipped} · 실패 {failed}')
    print(f'매니페스트: {os.path.relpath(manifest_path, ROOT)}')


if __name__ == '__main__':
    main()
