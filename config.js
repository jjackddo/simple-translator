// 브라우저용 API 키 설정 (번역 기능용)
//
// 이 키는 GitHub 공개 저장소에 그대로 올라갑니다.
// 반드시 Google Cloud Console에서 HTTP 리퍼러 제한을 걸어야 안전합니다:
//
//   애플리케이션 제한: HTTP 리퍼러(웹사이트)
//     - https://jjackddo.github.io/*
//     - http://localhost:*
//   API 제한: Cloud Translation API 만
//
// 제한 덕분에 키가 유출돼도 허용된 도메인 외에서는 사용 불가능합니다.

window.APP_CONFIG = {
  GOOGLE_API_KEY: "AIzaSyAtL8aL6u8UJ_QMUC3UnV99fW6PkBpELro"   // ← 여기에 브라우저용 API 키를 붙여넣으세요 (AIza...)
};
