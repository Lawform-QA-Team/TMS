// 타임아웃 상수 - 환경변수로 재정의 가능
export const TIMEOUT = {
  // 테스트 전체 제한 시간 (spec.js, playwright.config.ts)
  TEST: Number(process.env.TEST_TIMEOUT) || 120000,

  // 셀렉터/요소 대기 시간 (waitForSelector 기본값)
  ELEMENT: Number(process.env.ELEMENT_TIMEOUT) || 10000,

  // 페이지 로드 대기 시간 (goto, waitForNavigation)
  NAVIGATION: Number(process.env.NAVIGATION_TIMEOUT) || 30000,

  // 짧은 UI 안정화 대기 (wait(2000) 대체)
  UI_STABLE: Number(process.env.UI_STABLE_TIMEOUT) || 2000,
};
