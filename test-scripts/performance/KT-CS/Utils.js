// KT-CS k6 부하 테스트 공통 유틸
// 삼성전자 프로젝트 스크립트(common/utils.js)의 getFormattedTimestamp 사용 패턴을
// 그대로 재현. 실제 원본 구현을 확보하면 이 파일을 교체하세요.

/**
 * 파일명에 쓸 타임스탬프 문자열을 반환한다. 예: "2026-07-24 15:30:00"
 * 호출부에서 .replace(/\s/g, '_') 로 공백을 언더스코어로 치환해서 사용.
 */
export function getFormattedTimestamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}