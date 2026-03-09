# TMS Design System

프로젝트 전반에서 **통일된 UI/UX**를 위해 사용하는 디자인 토큰과 재사용 컴포넌트입니다.

## 디자인 토큰 (CSS Variables)

`src/index.css`에 정의된 `--tms-*` 변수를 사용합니다.

| 구분 | 변수 예 |
|------|--------|
| **색상** | `--tms-primary`, `--tms-accent`, `--tms-success`, `--tms-error`, `--tms-text`, `--tms-border` |
| **간격** | `--tms-space-1` ~ `--tms-space-10` (4px 단위) |
| **타이포** | `--tms-text-xs` ~ `--tms-text-2xl`, `--tms-font-sans`, `--tms-font-semibold` |
| **모서리** | `--tms-radius-sm`, `--tms-radius-md`, `--tms-radius-lg`, `--tms-radius-full` |
| **그림자** | `--tms-shadow-sm`, `--tms-shadow-md`, `--tms-shadow-primary` |

커스텀 스타일을 줄 때는 하드코딩 대신 이 토큰을 사용하면 테마 변경 시 일관성이 유지됩니다.

---

## React 컴포넌트 사용법

앱 전역에서 디자인 시스템 CSS는 `src/index.js`에서 이미 로드됩니다. 컴포넌트만 import 하면 됩니다.

```js
import { Button, Input, Card, Badge } from '@tms/design-system';
```

### Button

| prop | 설명 | 기본값 |
|------|------|--------|
| `variant` | primary, secondary, accent, success, danger, warning, info, ghost | `'primary'` |
| `size` | sm, md, lg | `'md'` |
| `icon` | true 시 정사각형 아이콘 버튼 | `false` |
| `disabled` | 비활성화 | `false` |

```jsx
<Button variant="primary">저장</Button>
<Button variant="danger" size="sm">삭제</Button>
<Button variant="ghost" icon><IconComponent /></Button>
```

### Input

| prop | 설명 |
|------|------|
| `label` | 라벨 텍스트 |
| `error` | 에러 메시지 (표시 시 빨간색) |
| `as` | `'input'` \| `'textarea'` \| `'select'` |

```jsx
<Input label="이메일" type="email" placeholder="email@example.com" />
<Input label="설명" as="textarea" rows={4} />
<Input label="역할" as="select"><option>관리자</option></Input>
<Input label="이름" error="필수 입력입니다." />
```

### Card

| prop | 설명 |
|------|------|
| `header` | 카드 상단 헤더 (텍스트 또는 노드) |
| `footer` | 카드 하단 푸터 (예: 버튼 그룹) |
| `children` | 본문 내용 |

```jsx
<Card header="제목" footer={<Button variant="primary">확인</Button>}>
  카드 본문 내용
</Card>
```

### Badge

| prop | 설명 | 기본값 |
|------|------|--------|
| `variant` | primary, accent, success, error, warning, neutral | `'neutral'` |

```jsx
<Badge variant="success">완료</Badge>
<Badge variant="error">실패</Badge>
```

---

## CSS 클래스만 사용하기

React 컴포넌트 없이 클래스명만 써도 됩니다. (디자인 시스템 CSS는 앱에서 이미 로드됨)

- **버튼**: `tms-btn` + `tms-btn--primary` / `tms-btn--danger` / `tms-btn--sm` / `tms-btn--icon` 등
- **입력**: `tms-input-wrap`, `tms-input-label`, `tms-input`, `tms-textarea`, `tms-select`
- **폼**: `tms-form-group`, `tms-form-row`
- **카드**: `tms-card`, `tms-card__header`, `tms-card__body`, `tms-card__footer`
- **배지**: `tms-badge` + `tms-badge--primary` / `tms-badge--success` 등
- **레이아웃**: `tms-stack`, `tms-row`, `tms-row--end`, `tms-row--between`

```html
<button class="tms-btn tms-btn--primary">저장</button>
<div class="tms-card"><div class="tms-card__header">제목</div><div class="tms-card__body">내용</div></div>
```

---

## 기존 화면에 적용하는 방법

1. **새로 만드는 화면**: 위 컴포넌트/클래스를 사용해 구현.
2. **기존 화면**:  
   - 점진적으로 `btn-primary` → `<Button variant="primary">` 또는 `tms-btn tms-btn--primary`로 교체.  
   - 색상/간격은 CSS에서 `#007bff` 등 하드코딩을 `var(--tms-primary)` 등 토큰으로 교체.

이렇게 하면 단계적으로 통일된 UI로 옮길 수 있습니다.
