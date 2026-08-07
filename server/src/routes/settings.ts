import { Hono } from 'hono'
import { db } from '../lib/db.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'

export const settingsRouter = new Hono()

const TC_PROMPT_CONFIG_KEY = 'tc_default_prompt'

const DEFAULT_TC_PROMPT = `###############################################
공용 단위 테스트케이스(TC) 생성 프롬프트
###############################################
# 목적
# - 여러 소프트웨어가 섞인 환경에서도
# 테스트케이스 구조를 일관되게 생성하기 위한
# "구조 중심" 프롬프트 예시
# - 실제 제품, UI, 내부 정책은 포함하지 않음
################################################
# [0] 글로벌 공통 설정 (Global Context)
################################################
/context.global
TC_ID_PREFIX = "TC"
TC_ID_PAD = 3
################################################
# [1] 테스트케이스 생성 공통 규칙
################################################
/tc.rules
A. 사전 조건은 "준비 상태"만 포함한다
B. 테스트 과정는 반드시 1 → N 순서로 작성한다
C. 한 단계에는 하나의 사용자 행동만 포함한다
D. 각 단계는 완전한 문장으로 끝난다
E. 예상 결과는 검증 포인트 1개만 작성한다
F. 우선순위는 P1, P2, P3 중 하나만 선택한다
G. 하나의 문장에 기능이 2개 이상 포함되면 TC를 분리한다
H. 입력에 없는 내용을 임의로 추정하지 않는다
################################################
# [2] 우선순위 정의 (Priority Policy)
################################################
/tc.priority
P1 = 핵심 기능 (미동작 시 서비스 사용 불가)
P2 = 주요 기능 (업무 품질에 영향)
P3 = 부가 기능 (편의/UI 요소)
################################################
# [3] 출력 컬럼 고정
################################################
/tc.columns
- TC No.
- 카테고리
- 1 Depth
- 2 Depth
- 3 Depth
- 4 Depth
- 확인기능
- 사전 조건
- 테스트 과정
- 기대결과
- priority
- result
- 비고`

// ──────────────────────────────────────────────
// GET /settings/tc-prompt
// ──────────────────────────────────────────────
settingsRouter.get('/tc-prompt', requireAuth, async (c) => {
  try {
    const row = await db.systemConfig.findUnique({ where: { key: TC_PROMPT_CONFIG_KEY } })
    const content = row?.value ?? DEFAULT_TC_PROMPT
    return c.json({ content })
  } catch (e) {
    return c.json({ error: String(e) }, 500)
  }
})

// ──────────────────────────────────────────────
// PUT /settings/tc-prompt  (관리자 전용)
// ──────────────────────────────────────────────
settingsRouter.put('/tc-prompt', requireAuth, requireAdmin, async (c) => {
  try {
    const data = await c.req.json()
    const content = (data.content ?? '').trim()

    const existing = await db.systemConfig.findUnique({ where: { key: TC_PROMPT_CONFIG_KEY } })
    let row
    if (existing) {
      row = await db.systemConfig.update({
        where: { key: TC_PROMPT_CONFIG_KEY },
        data: { value: content || null },
      })
    } else {
      row = await db.systemConfig.create({
        data: { key: TC_PROMPT_CONFIG_KEY, value: content || null },
      })
    }
    return c.json({ message: '저장되었습니다.', content: row.value ?? '' })
  } catch (e) {
    return c.json({ error: String(e) }, 500)
  }
})
