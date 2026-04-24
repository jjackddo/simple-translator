#!/usr/bin/env python3
"""
Google Cloud Text-to-Speech로 phrases.js의 모든 베트남어 문장을 MP3로 생성.

사용법:
  1. 프로젝트 루트에 .env 파일 생성 후 아래 한 줄 작성:
       GOOGLE_TTS_API_KEY=AIza...여기에_발급받은_키...
     또는 export GOOGLE_TTS_API_KEY="..." 로 환경변수 설정

  2. 실행:
       python3 tools/generate_audio.py

옵션:
  --voice NAME    음성 이름 (기본 vi-VN-Neural2-A 여성, vi-VN-Neural2-D 남성)
  --rate FLOAT    생성 속도 0.25~4.0 (기본 0.9)
  --force         이미 있는 파일도 재생성
  --list-voices   사용 가능한 베트남어 음성 목록만 출력하고 종료
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
AUDIO_DIR = os.path.join(ROOT, 'audio')
MANIFEST_PATH = os.path.join(AUDIO_DIR, 'manifest.json')
ENV_PATH = os.path.join(ROOT, '.env')

TTS_URL = 'https://texttospeech.googleapis.com/v1/text:synthesize'
VOICES_URL = 'https://texttospeech.googleapis.com/v1/voices'


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
    in_str = None  # 따옴표 종류
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


def extract_phrases(js_text):
    """phrases.js에서 { ko: "...", vi: "..." } 객체를 모두 뽑아낸다."""
    js_text = strip_comments(js_text)
    pattern = re.compile(
        r'\{\s*ko\s*:\s*(["\'])(?P<ko>(?:\\.|(?!\1).)*?)\1'
        r'\s*,\s*vi\s*:\s*(["\'])(?P<vi>(?:\\.|(?!\3).)*?)\3\s*\}',
        re.DOTALL,
    )
    result = []
    for m in pattern.finditer(js_text):
        result.append({'ko': m.group('ko'), 'vi': m.group('vi')})
    return result


def hash_name(vi, voice):
    key = f'{voice}|{vi}'.encode('utf-8')
    return hashlib.sha1(key).hexdigest()[:12] + '.mp3'


def synthesize(text, voice, rate, api_key):
    body = {
        'input': {'text': text},
        'voice': {'languageCode': 'vi-VN', 'name': voice},
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


def list_voices(api_key):
    req = urllib.request.Request(f'{VOICES_URL}?languageCode=vi-VN&key={api_key}')
    with urllib.request.urlopen(req, timeout=15) as resp:
        data = json.load(resp)
    print(f"{'이름':<25} {'성별':<8} 샘플레이트")
    print('-' * 45)
    for v in data.get('voices', []):
        print(f"{v['name']:<25} {v['ssmlGender']:<8} {v.get('naturalSampleRateHertz','?')}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--voice', default='vi-VN-Neural2-A')
    parser.add_argument('--rate', type=float, default=0.9)
    parser.add_argument('--force', action='store_true')
    parser.add_argument('--list-voices', action='store_true')
    args = parser.parse_args()

    api_key = load_api_key()

    if args.list_voices:
        list_voices(api_key)
        return

    os.makedirs(AUDIO_DIR, exist_ok=True)

    with open(PHRASES_JS, encoding='utf-8') as f:
        js = f.read()

    phrases = extract_phrases(js)
    # vi 기준 중복 제거
    seen = set()
    unique = []
    for p in phrases:
        if p['vi'] not in seen:
            seen.add(p['vi'])
            unique.append(p)

    print(f'총 {len(unique)}개 고유 문장 · 음성 {args.voice} · 속도 {args.rate}x')

    manifest = {}
    created = skipped = failed = 0

    for i, p in enumerate(unique, 1):
        vi = p['vi']
        fname = hash_name(vi, args.voice)
        fpath = os.path.join(AUDIO_DIR, fname)
        manifest[vi] = fname

        if os.path.exists(fpath) and not args.force:
            skipped += 1
            continue

        print(f'[{i:3d}/{len(unique)}] {vi[:45]}')
        try:
            audio = synthesize(vi, args.voice, args.rate, api_key)
            with open(fpath, 'wb') as fo:
                fo.write(audio)
            created += 1
        except Exception as e:
            failed += 1
            print(f'  ✗ 실패: {e}', file=sys.stderr)

    with open(MANIFEST_PATH, 'w', encoding='utf-8') as f:
        json.dump(manifest, f, ensure_ascii=False, indent=2)

    print()
    print(f'생성 {created} · 스킵 {skipped} · 실패 {failed}')
    print(f'매니페스트: {os.path.relpath(MANIFEST_PATH, ROOT)}')


if __name__ == '__main__':
    main()
