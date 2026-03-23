/**
 * 정규식 PII 필터링 감지 테스트 - autodoc 문서 상세 input 영역 입력 - Playwright용
 *
 * 각 PII 패턴에 해당하는 샘플 문자열을 문서 input에 입력하여
 * 필터링 감지 알림이 정상 동작하는지 확인한다.
 *
 * 허용된 오탐:
 *  - 주민등록번호: 존재하지 않는 날짜 조합(9011-31, 9002-29 비윤년)은 regex 한계로 허용
 *  - 나이/생년월일: `1살 차이`, `1000살짜리`는 경계 케이스로 허용
 *  - 계좌번호: 전화번호(010-1234-5678) 중복 감지 허용 (기능 동일)
 */
import { URLS } from '../../url_base_sam.js';
import { SELECTORS } from '../../selector_sam.js';
import { getFormattedTimestamp } from '../../../../common/utils.js';
import { getWebCredentials, loginWithPage } from '../../admin/login/login_helper.js';

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * PII 패턴별 감지 테스트용 샘플 데이터
 * @typedef {{ name: string, sample: string }} PiiSample
 * @type {PiiSample[]}
 */
const PII_SAMPLES = [
  {
    name: '주민등록번호',
    // yyMMdd[-]성별자리(1-4)+6자리
    sample: '901231-1234567',
  },
  {
    name: '운전면허번호',
    // dd-dd-dddddd-dd (lookbehind/lookahead로 날짜 부분 매칭 방지)
    sample: '24-01-012345-67',
  },
  {
    name: '전화번호',
    // 지역번호(02~08x) 또는 휴대전화(01x) prefix 포함
    sample: '010-1234-5678',
  },
  {
    name: '이메일',
    // localpart@domain.tld (TLD 2~6자리)
    sample: 'user@example.com',
  },
  {
    name: '주소',
    // 로/길 계열 + 번지 숫자
    sample: '강남대로 123',
  },
  {
    name: '나이/생년월일',
    // 세기/세대/세계 제외 lookahead 적용
    sample: '1990년생',
  },
  {
    name: '여권번호',
    // 영문 1~2자리 + 숫자 8자리 (앞뒤 경계 적용)
    sample: 'M12345678',
  },
  {
    name: '계좌번호',
    // ddd-dd-dddddd (마지막 세그먼트 4자리 이상)
    sample: '110-123-456789',
  },
  {
    name: '신용카드번호',
    // 카드사 첫자리(3,4,5,6,9) + 구분자 필수
    sample: '4123-4567-8901-2345',
  },
  {
    name: '외국인등록번호',
    // 성별 자리 5~8 (주민등록번호 1~4와 구분)
    sample: '901231-5234567',
  },
  {
    name: '건강보험번호',
    // [1257] + 구분자(- ~ . 공백) + 숫자 10자리
    sample: '2-1234567890',
  },
];

/**
 * @param {import('@playwright/test').Page} page
 */
export async function run(page) {
  const credentials = getWebCredentials();
  const getNewTimeStamp = () => getFormattedTimestamp().replace(/\s/g, '_');

  await loginWithPage(page, credentials, URLS.WEB_LOGIN.HOME);

  // autodoc 표준 양식 목록 진입
  await page.goto(URLS.AUTODOC.STANDARD, {
    waitUntil: 'domcontentloaded',
  });
  let timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_FILTERING_REGEX.png` });

  // 문서 검색
  await page.waitForSelector(SELECTORS.WEB.AUTODOC.INPUT_SEARCH);
  await page.locator(SELECTORS.WEB.AUTODOC.INPUT_SEARCH).fill('개인정보처리위탁계약서_삼성');
  await page.waitForSelector(SELECTORS.COMMON.SEARCH);
  await Promise.all([
    page.waitForURL('**/autodoc?**'),
    page.click(SELECTORS.COMMON.SEARCH),
  ]);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_FILTERING_REGEX_search.png` });
  
  await wait(1000);
  
  // 문서 테이블 클릭 (상세 진입)
  await page.goto(URLS.AUTODOC.DETAIL + '7', {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForLoadState('domcontentloaded')
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_FILTERING_REGEX_doc_detail.png` });

  // PII 샘플 데이터 입력 및 필터링 감지 확인 (전체 순회)
  const docInput = page.getByRole('textbox', { name: '로폼 주식회사' });

  for (const pii of PII_SAMPLES) {
    await docInput.waitFor();
    await docInput.fill(pii.sample);
    await wait(1000);
    timestamp = getNewTimeStamp();
    await page.screenshot({
      path: `screenshots/${timestamp}_FILTERING_REGEX_input_${pii.name}.png`,
    });

    // 다음 입력 전 필드 초기화
    await docInput.fill('');
  }

  // 전체 PII 샘플 한 번에 입력 (복합 감지 확인)
  const combinedSample = PII_SAMPLES.map((p) => p.sample).join(' / ');
  await docInput.waitFor();
  await docInput.fill(combinedSample);
  await wait(1000);
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_FILTERING_REGEX_input_combined.png` });

  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_LIST);
  page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_LIST);
  await page.waitForSelector('button:has-text("확인")');
  await Promise.all([
    page.waitForURL('**/autodoc'),
    page.click('button:has-text("확인")'),
  ]);

  await page.goto(URLS.DRIVE.DRIVE, {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_FILTERING_REGEX_drive.png` });

  await page.waitForSelector(SELECTORS.WEB.DRIVE.TABLE_LIST);
  await Promise.all([
    page.waitForURL('**/autodoc**'),
    page.click(`${SELECTORS.COMMON.TABLE} span.cursor-pointer`),
  ]);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_DRIVE_table.png` });

  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.SWITCH_EDITOR_EDIT_MODE);
  await page.click(SELECTORS.FEATURES.AUTODOC.SWITCH_EDITOR_EDIT_MODE);
  await page.waitForLoadState('domcontentloaded');
  timestamp = getNewTimeStamp();
  await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_edit.png` });
  await page.waitForSelector('[contenteditable="true"]');

  const editInput = page.locator('[contenteditable="true"]').first();
  for (const pii of PII_SAMPLES) {
    await editInput.waitFor();
    await editInput.fill(pii.sample);
    await wait(1000);
    timestamp = getNewTimeStamp();
    await page.screenshot({ path: `screenshots/${timestamp}_AUTODOC_existing_edit_input_${pii.name}.png` });

    await editInput.fill('');
  }

  await page.waitForSelector(SELECTORS.FEATURES.AUTODOC.BUTTON_LIST);
  await page.click(SELECTORS.FEATURES.AUTODOC.BUTTON_LIST);
  await page.waitForSelector('button:has-text("확인")');
  await Promise.all([
    page.waitForURL('**/autodoc'),
    page.click('button:has-text("확인")'),
  ]);
}
