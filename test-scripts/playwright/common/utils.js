/** Playwright 공통 유틸리티 */

export function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function getFormattedTimestamp() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 파일명으로 사용해도 되는(Windows/mac 공통) 타임스탬프 포맷
 * 예: 2026-03-17_22-55-17
 */
export function getFileSafeTimestamp() {
  return getFormattedTimestamp()
    .replace(/\s/g, '_')   // 공백 → 언더스코어
    .replace(/:/g, '-');   // Windows에서 불가한 ':' 제거
}
