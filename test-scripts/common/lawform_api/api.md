# Lawform API 명세

> 마지막 업데이트: 2026-09-02

## 인증 미들웨어

| 미들웨어 | 설명 |
|---------|------|
| requireServiceAuth | 일반 사용자 필수 인증 |
| requireServiceAuth_Business | 비즈니스(팀) 사용자 필수 인증 |
| requireBusinessServiceAuth | 비즈니스 서비스 필수 인증 |
| requireAdminAuth | 관리자 필수 인증 |
| requireDevelopAuth | 개발자 필수 인증 |
| requireThirdpartyAuth | 서드파티 API키 필수 인증 |
| requireThirdpartySessionAuth | 서드파티 세션 필수 인증 |
| requireServiceLawyer | 변호사 계정 필수 인증 |
| optionalServiceAuth | 선택적 사용자 인증 |
| optionalAdminAuth | 선택적 관리자 인증 |
| - | 인증 없음 (공개) |

---

## 1. Admin API (`/api/admin/`)

### 1.1 Admin Permission
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /api/admin/admin_permission/ | requireDevelopAuth | 관리자 권한 목록 |
| GET | /api/admin/admin_permission/:id | requireDevelopAuth | 관리자 권한 상세 |
| PUT | /api/admin/admin_permission/:id | requireDevelopAuth | 관리자 권한 수정 |
| DELETE | /api/admin/admin_permission/:id | requireDevelopAuth | 관리자 권한 삭제 |

### 1.2 Banner
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| PUT | /api/admin/banner/update/dev_id | requireAdminAuth | 배너 dev_id 수정 |
| GET | /api/admin/banner/find/dev_id/:dev_id | requireAdminAuth | dev_id로 배너 조회 |
| GET | /api/admin/banner/group/:group_id | requireAdminAuth | group_id로 배너 조회 |
| POST | /api/admin/banner/create/ | requireAdminAuth | 배너 생성 |
| PUT | /api/admin/banner/update/ | requireAdminAuth | 배너 수정 |
| PUT | /api/admin/banner/delete/:id | requireAdminAuth | 배너 삭제 |

### 1.3 Blog
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| POST | /api/admin/blog/create | requireAdminAuth | 블로그 생성 |
| GET | /api/admin/blog/detail/:id | requireAdminAuth | 블로그 상세 |
| PUT | /api/admin/blog/update | requireAdminAuth | 블로그 수정 |
| GET | /api/admin/blog/list | requireAdminAuth | 블로그 목록 |

### 1.4 CFS File
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| POST | /api/admin/cfs_file/ | requireAdminAuth | CFS 파일 생성 |

### 1.5 Coupon V2
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /api/admin/coupon_v2/ | requireAdminAuth | 쿠폰 목록 |
| GET | /api/admin/coupon_v2/:id | requireAdminAuth | 쿠폰 상세 |
| POST | /api/admin/coupon_v2/create | requireAdminAuth | 쿠폰 생성 |
| PUT | /api/admin/coupon_v2/update | requireAdminAuth | 쿠폰 수정 |
| PUT | /api/admin/coupon_v2/delete | requireAdminAuth | 쿠폰 삭제 |

### 1.6 Document Sample
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| POST | /api/admin/document_sample/create | optionalAdminAuth | 샘플 문서 지정 |

### 1.7 Documents
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /api/admin/documents/ | optionalAdminAuth | 문서 전체 조회 |
| GET | /api/admin/documents/find | optionalAdminAuth | documents 테이블 조회 |
| POST | /api/admin/documents/create | optionalAdminAuth | 문서 생성 |
| POST | /api/admin/documents/update | optionalAdminAuth | 문서 수정 |
| POST | /api/admin/documents/duplicate | requireAdminAuth | 문서 복제 |

### 1.8 Documents Contact
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /api/admin/documents_contact/:document_id | optionalAdminAuth | 문서 인적정보 설정 조회 |
| POST | /api/admin/documents_contact/delete | optionalAdminAuth | 문서 인적정보 설정 삭제 |
| POST | /api/admin/documents_contact/create | optionalAdminAuth | 문서 인적정보 설정 저장 |

### 1.9 Documents Info
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| POST | /api/admin/documents_info/list | optionalAdminAuth | 문서 정보 목록 |
| GET | /api/admin/documents_info/:document_id | optionalAdminAuth | 문서 상세 정보 |
| POST | /api/admin/documents_info/docs_info | optionalAdminAuth | 문서 docs_info 업데이트 |

### 1.10 Documents Template
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /api/admin/documents_template/list | requireAdminAuth | 문서 템플릿 목록 |
| POST | /api/admin/documents_template/ | requireAdminAuth | 문서 템플릿 생성 |
| GET | /api/admin/documents_template/:id | requireAdminAuth | 문서 템플릿 상세 |

### 1.11 Email Template
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| POST | /api/email_template/testsend | - | 이메일 테스트 전송 |
| GET | /api/email_template/:id | - | 이메일 템플릿 상세 |
| GET | /api/email_template/ | - | 이메일 템플릿 목록 |
| POST | /api/email_template/update/devid | - | dev_id로 이메일 템플릿 수정 |

### 1.12 Esign
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /api/admin/esign/ | requireAdminAuth | 전자서명 목록 |

### 1.13 FAQ Category
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /api/admin/faq_category/ | requireAdminAuth | FAQ 대카테고리 목록 |
| GET | /api/admin/faq_category/:id | requireAdminAuth | FAQ 대카테고리 상세 |
| POST | /api/admin/faq_category/ | requireAdminAuth | FAQ 대카테고리 등록 |
| PUT | /api/admin/faq_category/ | requireAdminAuth | FAQ 대카테고리 수정 |
| DELETE | /api/admin/faq_category/:id | requireAdminAuth | FAQ 대카테고리 삭제 |

### 1.14 FAQ Subcategory
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /api/admin/faq_subcategory/ | requireAdminAuth | FAQ 소카테고리 목록 |
| GET | /api/admin/faq_subcategory/:id | requireAdminAuth | FAQ 소카테고리 상세 |
| POST | /api/admin/faq_subcategory/ | requireAdminAuth | FAQ 소카테고리 등록 |
| PUT | /api/admin/faq_subcategory/ | requireAdminAuth | FAQ 소카테고리 수정 |
| DELETE | /api/admin/faq_subcategory/:id | requireAdminAuth | FAQ 소카테고리 삭제 |

### 1.15 FAQ
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /api/admin/faq/ | requireAdminAuth | FAQ 목록 |
| GET | /api/admin/faq/:id | requireAdminAuth | FAQ 상세 |
| POST | /api/admin/faq/ | requireAdminAuth | FAQ 등록 |
| PUT | /api/admin/faq/ | requireAdminAuth | FAQ 수정 |
| DELETE | /api/admin/faq/:id | requireAdminAuth | FAQ 삭제 |

### 1.16 Inquiry
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| PUT | /api/admin/inquiry/update | - | 문의 수정 |

### 1.17 Law Information
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /api/admin/law_information/initialize | requireAdminAuth | 법령 초기 데이터 적재 |

### 1.18 Lawdoc
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /api/admin/lawdoc/ | requireAdminAuth | 변호사첨삭 목록 |

### 1.19 Login
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| POST | /api/admin/login/force | - | 관리자 강제 로그인 |
| POST | /api/admin/login/email | - | 관리자 이메일 로그인 |

### 1.20 Magazine V2
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /api/admin/magazine_v2/ | requireAdminAuth | 매거진 목록 |
| GET | /api/admin/magazine_v2/find | requireAdminAuth | 매거진 전체 목록 |
| GET | /api/admin/magazine_v2/:id | requireAdminAuth | 매거진 상세 |
| POST | /api/admin/magazine_v2/create | requireAdminAuth | 매거진 등록 |
| PUT | /api/admin/magazine_v2/update | requireAdminAuth | 매거진 수정 |
| PUT | /api/admin/magazine_v2/update/recommended | requireAdminAuth | 추천 매거진 설정 |
| PUT | /api/admin/magazine_v2/remove | requireAdminAuth | 매거진 삭제 |

### 1.21 Multi Team
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| POST | /api/admin/multi_team/member | requireAdminAuth | 팀 멤버 등록 |
| POST | /api/admin/multi_team/ | requireAdminAuth | 기업/부서/팀 생성 |
| POST | /api/admin/multi_team/upload/structure | - | 조직도 엑셀 업로드 |
| POST | /api/admin/multi_team/upload/members | - | 멤버 엑셀 업로드 |
| PUT | /api/admin/multi_team/member | requireAdminAuth | 팀 멤버 권한 업데이트 |
| PUT | /api/admin/multi_team/member/cancel | requireAdminAuth | 팀 멤버 취소 |
| PUT | /api/admin/multi_team/ | requireAdminAuth | 멀티팀 수정 |
| DELETE | /api/admin/multi_team/member/:delete_user_id/:multi_team_id | - | 팀 멤버 삭제 |
| DELETE | /api/admin/multi_team/:multi_team_id | requireAdminAuth | 멀티팀 삭제 |

### 1.22 News Board
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| POST | /api/admin/news_board | requireAdminAuth | 뉴스 생성 |
| PUT | /api/admin/news_board | requireAdminAuth | 뉴스 수정 |
| DELETE | /api/admin/news_board | requireAdminAuth | 뉴스 삭제 |

### 1.23 Notice
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /api/admin/notice/ | requireAdminAuth | 공지사항 목록 |
| GET | /api/admin/notice/:id | requireAdminAuth | 공지사항 상세 |
| POST | /api/admin/notice/ | requireAdminAuth | 공지사항 등록 |
| PUT | /api/admin/notice/ | requireAdminAuth | 공지사항 수정 |
| DELETE | /api/admin/notice/:id | requireAdminAuth | 공지사항 삭제 |

### 1.24 Notification Template
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /api/admin/notification_template/ | requireAdminAuth | 알림 템플릿 목록 |
| GET | /api/admin/notification_template/:id | requireAdminAuth | 알림 템플릿 상세 |
| POST | /api/admin/notification_template/ | requireAdminAuth | 알림 템플릿 생성 |
| PUT | /api/admin/notification_template/ | requireAdminAuth | 알림 템플릿 수정 |
| DELETE | /api/admin/notification_template/:id | requireAdminAuth | 알림 템플릿 삭제 |

### 1.25 Notify
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| POST | /api/admin/notify/github_action_failed | - | Github Action 실패 알림 |
| POST | /api/admin/notify/github_action_deploy | - | Github Action 배포 알림 |
| POST | /api/admin/notify/attorney_register | - | 변호사 계정 신청 알림 |

### 1.26 Permission
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /api/admin/permission/ | requireAdminAuth | 권한 목록 |

### 1.27 Preliminary Startup Request
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /api/admin/preliminary_startup_request/ | requireAdminAuth | 예비창업 신청 목록 |
| GET | /api/admin/preliminary_startup_request/:id | requireAdminAuth | 예비창업 신청 상세 |
| PUT | /api/admin/preliminary_startup_request/:id | requireAdminAuth | 예비창업 신청서 수정 |

### 1.28 Purchase
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /api/admin/purchase/ | requireAdminAuth | 구매/환불 목록 |

### 1.29 Push Queue / Push Template
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /api/admin/push_queue/ | requireAdminAuth | 푸시 큐 목록 |
| GET | /api/admin/push_template/ | requireAdminAuth | 푸시 템플릿 목록 |
| GET | /api/admin/push_template/:id | requireAdminAuth | 푸시 템플릿 상세 |
| POST | /api/admin/push_template/ | requireAdminAuth | 푸시 템플릿 등록 |
| PUT | /api/admin/push_template/ | requireAdminAuth | 푸시 템플릿 수정 |

### 1.30 Recommendation Board
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| PUT | /api/admin/recommendation_board | requireAdminAuth | 추천 게시판 수정 |

### 1.31 RURL
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /api/admin/rurl/ | requireAdminAuth | 단축 URL 목록 |
| GET | /api/admin/rurl/:id | requireAdminAuth | 단축 URL 상세 |
| POST | /api/admin/rurl/ | requireAdminAuth | 단축 URL 생성 |
| PUT | /api/admin/rurl/:id | requireAdminAuth | 단축 URL 수정 |
| DELETE | /api/admin/rurl/:id | requireAdminAuth | 단축 URL 삭제 |

### 1.32 SMS Template
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /api/admin/sms_template/ | requireAdminAuth | SMS 템플릿 목록 |
| GET | /api/admin/sms_template/:dev_id | requireAdminAuth | SMS 템플릿 상세 |
| PUT | /api/admin/sms_template/ | requireAdminAuth | SMS 템플릿 수정 |
| POST | /api/admin/sms_template/testsend/:dev_id | requireAdminAuth | SMS 템플릿 테스트 전송 |

### 1.33 Startup
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /api/admin/startup/list | requireAdminAuth | 스타트업 목록 |
| GET | /api/admin/startup/:id | requireAdminAuth | 스타트업 상세 |
| POST | /api/admin/startup/create | requireAdminAuth | 스타트업 생성 |
| PUT | /api/admin/startup/update | requireAdminAuth | 스타트업 수정 |

### 1.34 Team
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| POST | /api/admin/team/create | requireAdminAuth | 팀 생성 |
| GET | /api/admin/team/find/:id | requireAdminAuth | 팀 상세 |
| GET | /api/admin/team/list | requireAdminAuth | 팀 목록 |
| GET | /api/admin/team/member/list | requireAdminAuth | 팀 멤버 목록 |
| PUT | /api/admin/team/update/permission | requireAdminAuth | 팀 권한 업데이트 |

### 1.35 Theme / Theme Sub
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /api/admin/theme/ | requireAdminAuth | 테마 목록 |
| GET | /api/admin/theme/detail/:theme_id | requireAdminAuth | 테마 상세 |
| POST | /api/admin/theme/create | requireAdminAuth | 테마 등록 |
| PUT | /api/admin/theme/update | requireAdminAuth | 테마 수정 |
| GET | /api/admin/theme_sub/:document_id | optionalAdminAuth | 하위 테마 조회 |
| DELETE | /api/admin/theme_sub/remove/:id | requireAdminAuth | 하위 테마 삭제 |

### 1.36 User
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /api/admin/user/ | requireAdminAuth | 회원 목록 |
| DELETE | /api/admin/user/:user_id | requireAdminAuth | 회원 탈퇴 처리 |
| GET | /api/admin/user/drive_filter | requireAdminAuth | 이용권 필터 회원 목록 |
| GET | /api/admin/user/drive_csv | requireAdminAuth | 이용권 필터 회원 CSV |

### 1.37 User Favorite / User Login / User Money Log / User Permission
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /api/admin/user_favorite/ | requireServiceAuth | 문서 즐겨찾기 목록 |
| GET | /api/admin/user_login/list | requireAdminAuth | 회원 로그인 기록 |
| POST | /api/admin/user_money_log/create | requireAdminAuth | 포인트 기록 생성 |
| GET | /api/admin/user_money_log/ | requireAdminAuth | 포인트 사용 기록 |
| GET | /api/admin/user_permission/ | requireAdminAuth | 이용권 목록 |
| GET | /api/admin/user_permission/:id | requireAdminAuth | 이용권 상세 |
| PUT | /api/admin/user_permission/update | requireAdminAuth | 이용권 수정 |
| PUT | /api/admin/user_permission/update/cloud_action | requireAdminAuth | 이용권 클라우드 액션 수정 |
| PUT | /api/admin/user_permission/update/duration_date | requireAdminAuth | 이용권 기간 수정 |

### 1.38 User Signup Path / Writing Preview / Writing Temp
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /api/admin/user_signup_path/ | requireAdminAuth | 가입 경로 목록 |
| POST | /api/admin/user_signup_path/create | requireAdminAuth | 가입 경로 생성 |
| PUT | /api/admin/user_signup_path/update | requireAdminAuth | 가입 경로 수정 |
| GET | /api/admin/writing_preview/group_list | requireAdminAuth | 작성 미리보기 그룹 목록 |
| POST | /api/admin/writing_temp/create | - | 임시 작성 문서 생성 |

---

## 2. Lawform API (`/api/`)

### 2.1 Advice (법률 자문)
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /api/advice/cron/deadline | - | 마감 임박 자문 크론 |
| GET | /api/advice/cron/over_deadline | - | 마감 초과 자문 크론 |
| POST | /api/advice/create/draft | requireServiceAuth_Business | 자문 초안 생성 |
| GET | /api/advice/list | requireServiceAuth_Business | 자문 목록 |
| GET | /api/advice/counts | requireServiceAuth_Business | 자문 상태별 수 |
| GET | /api/advice/statistics | requireServiceAuth_Business | 자문 통계 |
| GET | /api/advice/:id | requireServiceAuth_Business | 자문 상세 |
| PUT | /api/advice/update/is_editor_used_disable | requireServiceAuth_Business | 편집기 사용 안함 |
| GET | /api/advice/history/list | requireServiceAuth_Business | 계약서 변경내역 |
| PUT | /api/advice/update/:id | requireServiceAuth_Business | 자문 수정 |
| PUT | /api/advice/update/progress_status/:id/review_request | requireServiceAuth_Business | 자문 검토 요청 |
| PUT | /api/advice/update/progress_status/:id/advice_reviewer_to_requester | requireServiceAuth_Business | 요청자에게 보내기 |
| PUT | /api/advice/update/progress_status/:id/requester_to_advice_reviewer | requireServiceAuth_Business | 자문 담당자에게 보내기 |
| PUT | /api/advice/update/progress_status/:id/cancel | requireServiceAuth_Business | 자문 취소 |
| PUT | /api/advice/update/progress_status/:id/complete | requireServiceAuth_Business | 자문 완료 |
| PUT | /api/advice/update/progress_status/:id/pause | requireServiceAuth_Business | 자문 중단 |
| POST | /api/advice/delete/draft | requireServiceAuth_Business | 자문 초안 삭제 |
| PUT | /api/advice/update/progress_status/recipient_resent | requireServiceAuth_Business | 재수신 |
| POST | /api/advice/excel | requireServiceAuth_Business | 엑셀 다운로드 |
| POST | /api/advice/file/download | requireServiceAuth_Business | 첨부파일 다운로드 |
| PUT | /api/advice/update/watermark/:advice_id | requireServiceAuth_Business | 워터마크 업데이트 |

### 2.2 Advice Approval User
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| PUT | /api/advice_approval_user/update/legal_advice_users | requireServiceAuth_Business | 자문 담당자 배정 |
| PUT | /api/advice_approval_user/update/approval_users/approved | requireServiceAuth_Business | 결재 승인/반려 |
| PUT | /api/advice_approval_user/:advice_id/referrer | requireServiceAuth_Business | 참조자 업데이트 |

### 2.3 Advice Attachment
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| POST | /api/advice_attachment/upload/ | requireServiceAuth_Business | 자문 첨부파일 업로드 |
| POST | /api/advice_attachment/download/ | requireServiceAuth_Business | 자문 첨부파일 다운로드 |
| PUT | /api/advice_attachment/remove | requireServiceAuth_Business | 자문 첨부파일 삭제 |

### 2.4 Advice Category
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /api/advice_category/list | requireServiceAuth_Business | 카테고리 목록 |
| POST | /api/advice_category/ | requireServiceAuth_Business | 카테고리 생성 |
| DELETE | /api/advice_category/:id | requireServiceAuth_Business | 카테고리 삭제 |

### 2.5 Advice Log / Advice Log Attachment
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| POST | /api/advice_log/create | requireServiceAuth_Business | 자문 로그 생성 |
| POST | /api/advice_log/update/:advice_id/:advice_log_id | requireServiceAuth_Business | 자문 로그 수정 |
| GET | /api/advice_log/list/ | requireServiceAuth_Business | 자문 로그 목록 |
| PUT | /api/advice_log/remove | requireServiceAuth_Business | 자문 로그 삭제 |
| POST | /api/advice_log_attachment/download | requireServiceAuth_Business | 로그 첨부파일 다운로드 |

### 2.6 Article / Article Comment
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /api/article/ | requireServiceAuth | 게시글 목록 |
| GET | /api/article/:id | requireServiceAuth | 게시글 상세 |
| POST | /api/article/ | requireServiceAuth | 게시글 생성 |
| PUT | /api/article/ | requireServiceAuth | 게시글 수정 |
| PUT | /api/article/heart_count | requireServiceAuth | 게시글 좋아요 |
| DELETE | /api/article/:id | requireAdminAuth | 게시글 삭제 |
| POST | /api/article_comment/ | requireServiceAuth | 댓글 생성 |
| PUT | /api/article_comment/ | requireServiceAuth | 댓글 수정 |
| PUT | /api/article_comment/heart_count | requireServiceAuth | 댓글 좋아요 |
| DELETE | /api/article_comment/:id | requireAdminAuth | 댓글 삭제 |

### 2.7 Autodoc (자동작성)
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /api/autodoc/:id | requireServiceAuth | 자동작성 문서 상세 |
| GET | /api/autodoc/ | requireServiceAuth | 자동작성 문서 목록 |
| POST | /api/autodoc/create | requireServiceAuth | 자동작성 문서 생성 |
| POST | /api/autodoc/duplicate | requireServiceAuth | 자동작성 문서 복제 |
| POST | /api/autodoc/duplicate/v2 | requireServiceAuth | 자동작성 문서 복제 v2 |
| POST | /api/autodoc/email/send | requireServiceAuth | PDF 이메일 공유 |
| POST | /api/autodoc/send/email/v2 | requireServiceAuth | PDF 이메일 공유 v2 |
| POST | /api/autodoc/update/editormode | requireServiceAuth | 편집기 모드 전환 |
| POST | /api/autodoc/save/editorhtml | requireServiceAuth | 편집기 내용 저장 |
| PUT | /api/autodoc/update/editorhtml/v2 | optionalServiceAuth | 편집기 내용 저장 v2 |
| PUT | /api/autodoc/update/binddata | optionalServiceAuth | bind data 업데이트 |
| POST | /api/autodoc/generate/pdf | requireServiceAuth | PDF 생성 |

### 2.8 Blog
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /api/blog/list | - | 블로그 목록 |
| GET | /api/blog/detail/:id | - | 블로그 상세 |
| GET | /api/blog/recommend | - | 추천 블로그 |
| PUT | /api/blog/update/view-count/:id | - | 블로그 조회수 업데이트 |

### 2.9 Business Active Log
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| POST | /api/business_active_log/ | requireServiceAuth_Business | 활동 로그 생성 |
| GET | /api/business_active_log/list/:clm_id | requireServiceAuth_Business | 활동 로그 목록 |
| GET | /api/business_active_log/clm/:id | requireServiceAuth_Business | CLM 활동 로그 상세 |

### 2.10 Business Email Message
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /api/business_email_message/detail | requireServiceAuth_Business | 이메일 상세 |
| POST | /api/business_email_message/create | optionalServiceAuth | 이메일 답장 기록 생성 |
| POST | /api/business_email_message/attachment/download | requireServiceAuth_Business | 이메일 첨부파일 다운로드 |
| PUT | /api/business_email_message/update/message_key | - | 이메일 메시지 키 업데이트 |
| POST | /api/business_email_message/create/testcase | requireServiceAuth_Business | 테스트 케이스 메일 생성 |

### 2.11 Business Inquiry / Internal Notice / Notice / Partner Team
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| POST | /api/business_inquiry/ | optionalServiceAuth | 비즈니스 도입 문의 |
| GET | /api/business_internal_notice | requireServiceAuth_Business | 내부 공지사항 목록 |
| GET | /api/business_internal_notice/latest | requireServiceAuth_Business | 내부 공지사항 최근 |
| GET | /api/business_internal_notice/:id | requireServiceAuth_Business | 내부 공지사항 상세 |
| POST | /api/business_internal_notice | requireServiceAuth_Business | 내부 공지사항 생성 |
| PUT | /api/business_internal_notice/:id | requireServiceAuth_Business | 내부 공지사항 수정 |
| DELETE | /api/business_internal_notice/:id | requireServiceAuth_Business | 내부 공지사항 삭제 |
| GET | /api/business_notice/ | requireServiceAuth_Business | 비즈니스 공지사항 목록 |
| GET | /api/business_notice/:id | requireServiceAuth_Business | 비즈니스 공지사항 상세 |
| GET | /api/business_partner_team/ | requireAdminAuth | 파트너 팀 목록 |
| POST | /api/business_partner_team/ | requireAdminAuth | 파트너 팀 생성 |
| DELETE | /api/business_partner_team/:id | requireAdminAuth | 파트너 팀 삭제 |

### 2.12 CFS (Cloud File System)
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /api/cfs/drive | requireServiceAuth | 마이로폼 드라이브 조회 |
| GET | /api/cfs/ | requireServiceAuth | CFS 목록 |
| GET | /api/cfs/guest | optionalServiceAuth | CFS 목록 (guest_id) |
| GET | /api/cfs/:id | optionalServiceAuth | CFS 상세 |
| POST | /api/cfs/find/share | optionalServiceAuth | CFS 공유 상세 |
| GET | /api/cfs/html/:clm_id | requireServiceAuth | CFS HTML (CLM) |
| GET | /api/cfs/cfs_html/:cfs_id | requireServiceAuth | CFS HTML |
| GET | /api/cfs/html/advice/:advice_id | requireServiceAuth | CFS HTML (자문) |
| POST | /api/cfs/create/autodoc | requireServiceAuth | 자동작성 CFS 생성 |
| POST | /api/cfs/create/esign | requireServiceAuth | 전자서명 CFS 생성 |
| POST | /api/cfs/create/folder | requireServiceAuth | CFS 폴더 생성 |
| POST | /api/cfs/create/file | requireServiceAuth | CFS 파일 생성 |
| POST | /api/cfs/create/link | requireServiceAuth | CFS 링크 생성 |
| POST | /api/cfs/remove | requireServiceAuth | CFS 삭제 |
| PUT | /api/cfs/update | requireServiceAuth | CFS 업데이트 |
| POST | /api/cfs/breadcrumb | optionalServiceAuth | CFS 브레드크럼 |
| POST | /api/cfs/move | requireServiceAuth | CFS 폴더 이동 |
| PUT | /api/cfs/folder/rename | requireServiceAuth | CFS 폴더 이름 변경 |
| POST | /api/cfs/doc/download | requireServiceAuth | 워드 파일 다운로드 |
| POST | /api/cfs/pdf/download | requireServiceAuth | PDF 다운로드 |
| POST | /api/cfs/create/standard_contract | requireServiceAuth | 표준계약서 CFS 생성 |
| POST | /api/cfs/file/download | requireServiceAuth | CFS 파일 다운로드 |

### 2.13 CFS Collaborator
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| POST | /api/cfs_collaborator/create/invite | requireServiceAuth | 협업자 초대 |
| DELETE | /api/cfs_collaborator/remove/:cfs_id/:cfs_collaborator_id/:remove_id | requireServiceAuth | 협업자 삭제 |
| PUT | /api/cfs_collaborator/update/access | requireServiceAuth | 협업자 접근 권한 변경 |
| PUT | /api/cfs_collaborator/update/owner | requireServiceAuth | 소유자 변경 |
| POST | /api/cfs_collaborator/request/permission | requireServiceAuth | 접근 권한 요청 |
| GET | /api/cfs_collaborator/request/permission/approve/:cfs_id/:owner_collaborator_id/:requester_user_id/:checksum | - | 접근 권한 요청 승인 |
| GET | /api/cfs_collaborator/file/access/:cfs_file_id/:cfs_id/:cfs_collaborator_id | optionalServiceAuth | 파일 접근 권한 확인 |
| POST | /api/cfs_collaborator/token | requireServiceAuth | 협업자 토큰 생성 |

### 2.14 CLM (계약 관리)
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| POST | /api/clm/create | requireServiceAuth_Business | CLM 생성 |
| POST | /api/clm/create/plain | requireServiceAuth_Business | 문서 지정 없이 CLM 생성 |
| POST | /api/clm/create/seal | requireServiceAuth_Business | 인감증명 신청 |
| POST | /api/clm/create/separately | requireServiceAuth_Business | 별도 등록 CLM |
| POST | /api/clm/create/standard | requireServiceAuth_Business | 표준계약서 CLM 생성 |
| GET | /api/clm/ | requireServiceAuth_Business | CLM 목록 |
| GET | /api/clm/review_status | requireServiceAuth_Business | CLM 대시보드 통계 |
| GET | /api/clm/counts | requireServiceAuth_Business | CLM 진행 현황 |
| GET | /api/clm/:id | requireServiceAuth_Business | CLM 상세 |
| GET | /api/clm/:clmId/cfsFileHistory | requireServiceAuth_Business | 파일 변경 이력 |
| POST | /api/clm/excel | requireServiceAuth_Business | CLM 엑셀 다운로드 |
| POST | /api/clm/draft/remove | requireServiceAuth_Business | CLM draft 삭제 |
| PUT | /api/clm/update/draft | requireServiceAuth_Business | CLM draft 업데이트 |
| PUT | /api/clm/update/legal_user_id | requireServiceAuth_Business | 법무 담당자 변경 |
| PUT | /api/clm/update/change/cfs | requireServiceAuth_Business | 계약서 문서 교체 |
| PUT | /api/clm/update/cancel/ | requireServiceAuth_Business | CLM 취소 |
| PUT | /api/clm/update/progress_status/legal_review | requireServiceAuth_Business | 법무 검토 중으로 변경 |
| PUT | /api/clm/update/progress_status/legalAction | requireServiceAuth_Business | 법무 액션 처리 |
| PUT | /api/clm/update/progress_status/financial_review | requireServiceAuth_Business | 재무 검토 중으로 변경 |
| PUT | /api/clm/update/progress_status/financial_review_complete | requireServiceAuth_Business | 재무 검토 완료 |
| PUT | /api/clm/update/progress_status/final_review | requireServiceAuth_Business | 최종 결재 요청 |
| PUT | /api/clm/update/progress_status/review/cancel | requireServiceAuth_Business | 검토 신청 취소 |
| PUT | /api/clm/update/progress_status/rollback | requireServiceAuth_Business | 진행 단계 되돌리기 |
| PUT | /api/clm/update/progress_status/recipient_resent | requireServiceAuth_Business | 수신자 재발송 |
| PUT | /api/clm/update/auto_extend_status | requireServiceAuth_Business | 자동연장 상태 업데이트 |
| PUT | /api/clm/update/pause | requireServiceAuth_Business | CLM 일시중지 |
| PUT | /api/clm/update/legal_review_approval/request | requireServiceAuth_Business | 법무 검토 완료 승인 요청 |
| PUT | /api/clm/update/legal_review_approval | requireServiceAuth_Business | 법무 검토 완료 승인 |
| PUT | /api/clm/update/watermark/:clm_id | requireServiceAuth_Business | 워터마크 업데이트 |
| DELETE | /api/clm/cfsFileHistory | requireServiceAuth_Business | 파일 변경 이력 삭제 |

### 2.15 CLM Approval Flow / Approval User / Attachment / Category / Customer
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /api/clm_approval_flow/ | requireServiceAuth_Business | 결재선 목록 |
| POST | /api/clm_approval_flow/ | requireServiceAuth_Business | 결재선 생성 |
| PUT | /api/clm_approval_flow/ | requireServiceAuth_Business | 결재선 수정 |
| PUT | /api/clm_approval_flow/upsert | requireServiceAuth_Business | 결재선 upsert |
| DELETE | /api/clm_approval_flow/:id | requireServiceAuth_Business | 결재선 삭제 |
| GET | /api/clm_approval_user/list/ | requireServiceAuth_Business | 결재자 목록 |
| POST | /api/clm_approval_user/create/ | requireServiceAuth_Business | 결재자 추가 |
| PUT | /api/clm_approval_user/submit | requireServiceAuth_Business | 결재 상신 |
| PUT | /api/clm_approval_user/update/approved | requireServiceAuth_Business | 결재 승인 |
| PUT | /api/clm_approval_user/update/legal_users | requireServiceAuth_Business | 법무 검토 담당자 변경 |
| POST | /api/clm_attachment/create/ | requireServiceAuth_Business | 첨부파일 업로드 |
| POST | /api/clm_attachment/download | requireServiceAuth_Business | 첨부파일 다운로드 |
| PUT | /api/clm_attachment/remove | requireServiceAuth_Business | 첨부파일 삭제 |
| GET | /api/clm_category/ | requireServiceAuth_Business | 카테고리 목록 |
| POST | /api/clm_category/ | requireServiceAuth_Business | 카테고리 생성 |
| PUT | /api/clm_category/ | requireServiceAuth_Business | 카테고리 수정 |
| DELETE | /api/clm_category/:type/:id | requireServiceAuth_Business | 카테고리 삭제 |
| GET | /api/clm_customer/list/ | requireServiceAuth_Business | 계약 상대방 목록 |
| POST | /api/clm_customer/create/ | requireServiceAuth_Business | 계약 상대방 추가 |
| PUT | /api/clm_customer/remove | requireServiceAuth_Business | 계약 상대방 삭제 |

### 2.16 CLM Log / CLM Notification / CLM Thirdparty Approval
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /api/clm_log/list | requireServiceAuth_Business | 업무 일지 목록 |
| POST | /api/clm_log/create | requireServiceAuth_Business | 업무 일지 생성 |
| POST | /api/clm_log/update/:clm_log_id | requireServiceAuth_Business | 업무 일지 수정 |
| PUT | /api/clm_log/remove | requireServiceAuth_Business | 업무 일지 삭제 |
| GET | /api/clm_notification/ | requireServiceAuth_Business | 알림 목록 |
| POST | /api/clm_notification/read | requireServiceAuth_Business | 알림 읽음 처리 |
| GET | /api/clm_thirdparty_approval/ | requireServiceAuth_Business | 서드파티 기안 목록 |
| POST | /api/clm_thirdparty_approval/ | requireServiceAuth_Business | 서드파티 기안 생성 |

### 2.17 Comment / Coupon V2 / Curation Bookmark
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /api/comment/ | optionalServiceAuth | 댓글 목록 |
| POST | /api/comment/create | requireServiceAuth | 댓글 생성 |
| PUT | /api/comment/update/content | requireServiceAuth | 댓글 수정 |
| DELETE | /api/comment/remove/:id | requireServiceAuth | 댓글 삭제 |
| POST | /api/coupon_v2/register | requireServiceAuth | 쿠폰 등록 |
| POST | /api/coupon_v2/woorievent | requireServiceAuth | 우리은행 이벤트 쿠폰 |
| POST | /api/curation_bookmark/create | requireServiceAuth | 큐레이션 북마크 생성 |
| DELETE | /api/curation_bookmark/remove/:id | requireServiceAuth | 큐레이션 북마크 삭제 |

### 2.18 Document / Document Compare / Document Contact / Document Sample / Documents Info
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /api/v2/document/find/category | optionalServiceAuth | 문서 카테고리 목록 |
| GET | /api/v2/document/find/theme | optionalServiceAuth | 문서 테마 목록 |
| GET | /api/v2/document/ranking | - | 인기 문서 |
| POST | /api/document_compare/compare | requireServiceAuth | 문서 비교 |
| GET | /api/documents_contact/:document_id | requireServiceAuth | 문서 인적정보 설정 |
| POST | /api/document_sample/find/:document_id | - | 샘플 문서 단건 |
| POST | /api/document_sample/list | - | 샘플 문서 목록 |
| GET | /api/documents_info/ | optionalServiceAuth | 문서 정보 목록 |
| GET | /api/documents_info/:document_id | optionalServiceAuth | 문서 상세 정보 |

### 2.19 Diningbrands / Education / Events
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /api/diningbrands/download/contract | - | 계약서 다운로드 |
| GET | /api/diningbrands/check/approval | requireServiceAuth | 기안 내역 확인 |
| POST | /api/diningbrands/approval | requireServiceAuth | 그룹웨어 기안 상신 |
| GET | /api/education/ | requireServiceAuth | 교육 섹션 목록 |
| GET | /api/education/:id | requireServiceAuth | 교육 상세 |
| GET | /api/events/ | optionalAdminAuth | 이벤트 목록 |
| GET | /api/events/:id | optionalAdminAuth | 이벤트 상세 |
| POST | /api/events/ | requireAdminAuth | 이벤트 생성 |
| PUT | /api/events/ | requireAdminAuth | 이벤트 수정 |
| DELETE | /api/events/:id | requireAdminAuth | 이벤트 삭제 |

### 2.20 Esign (전자서명)
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /api/v2/esign/signer/:id | - | 서명자 정보 조회 |
| GET | /api/v2/esign/signer_enc/:id | - | 서명자 정보 조회 (암호화) |
| GET | /api/v2/esign/signer_token/:token | - | 토큰으로 서명자 정보 조회 |
| GET | /api/v2/esign/ | requireServiceAuth | 전자서명 목록 |
| GET | /api/v2/esign/possible/documents | requireServiceAuth | 전자서명 가능 문서 |
| GET | /api/v2/esign/pending/signer/ | requireServiceAuth | 본인 서명 대기 목록 |
| GET | /api/v2/esign/:id | requireServiceAuth | 전자서명 단건 |
| POST | /api/v2/esign/ | requireServiceAuth | 전자서명 생성 |
| POST | /api/v2/esign/clm | requireServiceAuth | CLM 전자서명 생성 |
| POST | /api/v2/esign/register/complete | requireServiceAuth | 전자서명 등록 완료 |
| POST | /api/v2/esign/signer/sign/complete/esign/:id | requireServiceAuth | 서명자 서명 완료 (esign 방식) |
| POST | /api/v2/esign/signer/sign/complete | - | 서명자 서명 완료 |
| POST | /api/v2/esign/resend/invitation | requireServiceAuth | 참여 메시지 재발송 |
| POST | /api/v2/esign/generate/pdf/:id | optionalServiceAuth | 전자서명 PDF |
| POST | /api/v2/esign/generate/certificate/:id | - | 인증서 생성 |
| POST | /api/v2/esign/buy/action | requireServiceAuth | 전자서명 구매 액션 |
| POST | /api/v2/esign/upload/attachment | requireServiceAuth | 첨부파일 업로드 |
| PUT | /api/v2/esign/ | requireServiceAuth | 전자서명 업데이트 |
| PUT | /api/v2/esign/deadline | requireServiceAuth | 마감일 업데이트 |
| PUT | /api/v2/esign/progress_status | requireServiceAuth | 진행 상태 업데이트 |
| PUT | /api/v2/esign/cancel | - | 서명 취소 |
| PUT | /api/v2/esign/bulk_cancel | - | 서명 일괄 취소 |
| DELETE | /api/v2/esign/:id | requireServiceAuth | 전자서명 삭제 |
| DELETE | /api/v2/esign/attachment/:id | requireServiceAuth | 첨부파일 삭제 |
| DELETE | /api/v2/esign/signer/sign | requireServiceAuth | 사인박스 삭제 |

### 2.21 FAQ / FAQ Category / FAQ Subcategory
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /api/faq/ | optionalAdminAuth | FAQ 목록 |
| GET | /api/faq/external | optionalServiceAuth | 외부 FAQ |
| GET | /api/faq/:id | optionalAdminAuth | FAQ 상세 |
| POST | /api/faq/ | requireAdminAuth | FAQ 생성 |
| PUT | /api/faq/ | requireAdminAuth | FAQ 수정 |
| DELETE | /api/faq/:id | requireAdminAuth | FAQ 삭제 |
| GET | /api/faq_category/ | optionalServiceAuth | FAQ 대카테고리 목록 |
| GET | /api/faq_category/:id | optionalServiceAuth | FAQ 대카테고리 상세 |
| GET | /api/faq_subcategory/ | optionalServiceAuth | FAQ 소카테고리 목록 |
| GET | /api/faq_subcategory/:id | optionalServiceAuth | FAQ 소카테고리 상세 |

### 2.22 Inquiry / Kwork / Law Information / Lawdoc
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /api/inquiry/ | requireServiceAuth | 문의 목록 |
| GET | /api/inquiry/:id | requireServiceAuth | 문의 상세 |
| POST | /api/inquiry/create | requireServiceAuth | 문의 생성 |
| POST | /api/kwork/github/action/failed | - | GitHub 빌드 실패 알림 |
| POST | /api/kwork/github/action/deploy | - | GitHub 배포 알림 |
| GET | /api/law_information/list | requireServiceAuth_Business | 법령 목록 |
| GET | /api/law_information/detail/:id | requireServiceAuth_Business | 법령 상세 |
| GET | /api/law_information/date/list | requireServiceAuth_Business | 날짜별 법령 목록 |
| GET | /api/law_information/nearest_enforcement | requireServiceAuth_Business | 가장 가까운 시행일 법령 |
| GET | /api/lawdoc/ | requireServiceAuth | 변호사첨삭 목록 |
| GET | /api/lawdoc/:id | requireServiceAuth | 변호사첨삭 상세 |
| POST | /api/lawdoc/create | requireServiceAuth | 변호사첨삭 등록 |
| PUT | /api/lawdoc/update/lawyer_html | requireServiceAuth | 변호사 수정 HTML |
| PUT | /api/lawdoc/update/accept_review | requireServiceAuth | 검토 요청 수락 |
| PUT | /api/lawdoc/update/complete_review | requireServiceAuth | 검토 완료 |

### 2.23 Litigation (송무)
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /api/litigation/list | requireBusinessServiceAuth | 송무 목록 |
| GET | /api/litigation/statistics | requireBusinessServiceAuth | 담당자별 통계 |
| GET | /api/litigation/:id | requireBusinessServiceAuth | 송무 상세 |
| GET | /api/litigation/cron/coming_command_schedule | - | 크론: 기일 알림 |
| GET | /api/litigation/cron/delivery_of_response_schedule | - | 크론: 답변서 송달 알림 |
| GET | /api/litigation/cron/auto_complete | - | 크론: 자동 종결 |
| GET | /api/litigation/cron/appeal | - | 크론: 항소 알림 |
| GET | /api/litigation/cron/generate | - | 크론: 법원 스크랩 큐 생성 |
| GET | /api/litigation/cron/court-scrap | - | 크론: 법원 스크랩 실행 |
| POST | /api/litigation/excel | requireBusinessServiceAuth | 송무 엑셀 다운로드 |
| POST | /api/litigation/create/draft | requireBusinessServiceAuth | 송무 draft 생성 |
| PUT | /api/litigation/update/:id | requireBusinessServiceAuth | 송무 수정 |
| PUT | /api/litigation/update/progress_status/:id/wait_designation | requireBusinessServiceAuth | 송무 등록 |
| PUT | /api/litigation/update/progress_status/:id/pause | requireBusinessServiceAuth | 송무 중단 |
| PUT | /api/litigation/update/progress_status/:id/complete | requireBusinessServiceAuth | 송무 종결 |
| PUT | /api/litigation_approval_user/update/legal_users | requireBusinessServiceAuth | 송무 담당자 배정 |
| POST | /api/litigation_attachment/upload/ | requireBusinessServiceAuth | 송무 첨부파일 업로드 |
| POST | /api/litigation_log/create | requireBusinessServiceAuth | 송무 일지 생성 |
| GET | /api/litigation_log/list | requireBusinessServiceAuth | 송무 일지 목록 |
| PUT | /api/litigation_log/update/:id | requireBusinessServiceAuth | 송무 일지 수정 |
| POST | /api/litigation_schedule/create | requireBusinessServiceAuth | 송무 일정 생성 |
| GET | /api/litigation_schedule/list/ | requireBusinessServiceAuth | 송무 일정 목록 |
| GET | /api/litigation_schedule/calendar | requireBusinessServiceAuth | 송무 캘린더 |

### 2.24 Login / Logo / Magazine V2
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| POST | /api/login/email | - | 이메일 로그인 |
| POST | /api/login/otp | - | OTP 로그인 |
| POST | /api/login/google | - | 구글 로그인 |
| POST | /api/login/dining | - | 다이닝브랜즈 SSO |
| GET | /api/logo/ | requireServiceAuth | 로고 조회 |
| POST | /api/logo/ | requireServiceAuth | 로고 생성 |
| PUT | /api/logo/ | requireServiceAuth | 로고 수정 |
| DELETE | /api/logo/:id | requireServiceAuth | 로고 삭제 |
| GET | /api/magazine_v2/ | - | 매거진 목록 |
| GET | /api/magazine_v2/:id | optionalServiceAuth | 매거진 상세 |
| GET | /api/magazine_v2/top/list | - | 매거진 TOP 목록 |
| PUT | /api/magazine_v2/update/heart_count | - | 매거진 좋아요 |

### 2.25 Multi Team
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| POST | /api/multi_team/invite/member | requireServiceAuth_Business | 멤버 초대 |
| GET | /api/multi_team/member/count | requireServiceAuth_Business | 팀 인원수 |
| GET | /api/multi_team/low/company/list | requireServiceAuth_Business | 하위 기업 목록 |
| GET | /api/multi_team/all/company/list | requireServiceAuth_Business | 상하위 기업 목록 |
| GET | /api/multi_team/tree/list | requireServiceAuth_Business | 기업 트리 구조 |
| GET | /api/multi_team/list/member | requireServiceAuth_Business | 팀 멤버 조회 |
| GET | /api/multi_team/list/team | requireServiceAuth_Business | 기업 팀 조회 |
| GET | /api/multi_team/detail/member/:detail_user_id | requireServiceAuth_Business | 멤버 상세 |
| GET | /api/multi_team/detail/member/:detail_user_id/clm | requireServiceAuth_Business | 멤버 CLM 문서 |
| PUT | /api/multi_team/member/permission | requireServiceAuth_Business | 멤버 권한 업데이트 |
| DELETE | /api/multi_team/remove/member/:remove_user_id | requireServiceAuth_Business | 멤버 제외 |

### 2.26 Notice / PDF / Permission
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /api/notice/ | optionalServiceAuth | 공지사항 목록 |
| GET | /api/notice/:id | optionalServiceAuth | 공지사항 상세 |
| POST | /api/pdf/team/autodoc/:type | requireServiceAuth | 자동작성 PDF 생성 |
| POST | /api/pdf/team/esign | requireServiceAuth | 전자서명 PDF 생성 |
| GET | /api/pdf/tlimit/:type/:start/:end/:writing_id/:hash | - | TLimit PDF |
| POST | /api/pdf/permission/:type/:item_id/:action | requireServiceAuth | 권한 검증 PDF 다운로드 |
| POST | /api/pdf/html | optionalServiceAuth | HTML -> PDF 변환 |
| POST | /api/permission/give | requireServiceAuth | 이용권 지급 |
| POST | /api/permission/check | requireServiceAuth | 이용권 확인 |

### 2.27 Polaris
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| PUT | /api/polaris/advice/update/:id | requireServiceAuth_Business | Advice 수정 |
| POST | /api/polaris/comparison/ | requireServiceAuth | 문서 비교 요청 |
| GET | /api/polaris/comparison/ | requireServiceAuth | 문서 비교 결과 (polling) |
| POST | /api/polaris/cfs/get | optionalServiceAuth | 편집기 데이터 조회 |
| PUT | /api/polaris/cfs/save | optionalServiceAuth | 편집기 데이터 저장 |
| GET | /api/polaris/cfs/history/list | optionalServiceAuth | 히스토리 목록 |
| GET | /api/polaris/cfs/download/file | optionalServiceAuth | CFS 파일 다운로드 |
| POST | /api/polaris/cfs/create/file | requireServiceAuth | CFS 파일 생성 |
| POST | /api/polaris/clm/create | requireServiceAuth_Business | CLM 생성 |
| PUT | /api/polaris/clm/update/change/cfs | requireServiceAuth_Business | CLM 계약서 교체 |
| PUT | /api/polaris/esign/ | requireServiceAuth | Esign 생성 |
| PUT | /api/polaris/esign/clm | requireServiceAuth | CLM Esign 생성 |
| GET | /api/polaris/lawdoc/list | requireServiceLawyer | 변호사첨삭 목록 |
| POST | /api/polaris/lawdoc/create | requireServiceAuth | 변호사첨삭 등록 |
| GET | /api/polaris/team_standard_contract/list | requireServiceAuth | 표준계약서 목록 |
| POST | /api/polaris/team_standard_contract/create/ | requireServiceAuth | 표준계약서 생성 |
| POST | /api/polaris/watermark/create | requireServiceAuth | 워터마크 생성 |
| GET | /api/polaris/watermark/list | requireServiceAuth | 워터마크 목록 |

### 2.28 Press / Project / Purchase / Pusher / Quiz
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /api/press/ | optionalAdminAuth | 보도자료 목록 |
| POST | /api/press/ | requireAdminAuth | 보도자료 생성 |
| PUT | /api/press/ | requireAdminAuth | 보도자료 수정 |
| DELETE | /api/press/:id | requireAdminAuth | 보도자료 삭제 |
| GET | /api/project/list | requireServiceAuth | 프로젝트 목록 |
| POST | /api/project/ | requireServiceAuth | 프로젝트 생성 |
| PUT | /api/project/ | requireServiceAuth | 프로젝트 수정 |
| POST | /api/project/log | requireServiceAuth | 프로젝트 로그 생성 |
| DELETE | /api/project_clm/:id | requireServiceAuth | 프로젝트 CLM 삭제 |
| POST | /api/purchase/ | requireServiceAuth | 결제 신청 |
| PUT | /api/purchase/update/fe_log | requireServiceAuth | 결제 완료 (FE) |
| POST | /api/purchase/update/be_log | - | 결제 완료 (BE) |
| POST | /api/purchase/toss/confirm | requireServiceAuth | 토스 결제 승인 |
| POST | /api/pusher/auth | - | Pusher 인증 |
| POST | /api/pusher/webhook | - | Pusher 웹훅 |
| GET | /api/quiz/today | requireServiceAuth | 오늘의 퀴즈 |
| POST | /api/quiz/submit | requireServiceAuth | 퀴즈 정답 제출 |

### 2.29 Register / RURL / Search
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| POST | /api/register/email | - | 이메일 회원가입 |
| POST | /api/register/kakaosync | - | 카카오 회원가입 |
| POST | /api/register/naver | - | 네이버 회원가입 |
| POST | /api/register/google | - | 구글 회원가입 |
| PUT | /api/register/clm/invited | - | CLM 초대 가입 |
| POST | /api/register/email/duplicate/check | - | 이메일 중복 확인 |
| POST | /api/register/trial | requireAdminAuth | 시험 사용 계정 생성 |
| POST | /api/rurl/code | optionalServiceAuth | 단축 URL 조회 |
| POST | /api/search/ | optionalServiceAuth | 검색 |
| GET | /api/search/ | requireServiceAuth_Business | 통합 검색 |
| POST | /api/search_v2/ | - | 통합 검색 V2 |

### 2.30 Shareholder Meeting / SSO / Stamps / Startup
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /api/shareholder_meeting/ | requireServiceAuth | 주주총회 목록 |
| GET | /api/shareholder_meeting/:id | optionalServiceAuth | 주주총회 상세 |
| POST | /api/shareholder_meeting/ | optionalServiceAuth | 주주총회 생성 |
| PUT | /api/shareholder_meeting/progress | requireServiceAuth | 주주총회 진행 |
| DELETE | /api/shareholder_meeting/:id | requireServiceAuth | 주주총회 삭제 |
| POST | /api/sso/vessl-ai | - | Okta SAML ACS |
| GET | /api/stamps/ | optionalServiceAuth | 직인 목록 |
| POST | /api/stamps/ | requireServiceAuth | 직인 생성 |
| DELETE | /api/stamps/:id | requireServiceAuth | 직인 삭제 |
| GET | /api/startup/list | optionalServiceAuth | 스타트업 목록 |
| GET | /api/startup/:id | optionalServiceAuth | 스타트업 상세 |

### 2.31 Statistics
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /api/statistics/individual | requireServiceAuth | 개인 현황 |
| GET | /api/statistics/department-team | requireServiceAuth | 부서 현황 |
| GET | /api/statistics/clm-trend | requireServiceAuth | 계약 체결 추이 |
| GET | /api/statistics/count-by-type/:type | requireServiceAuth | 유형별 건수 |
| GET | /api/statistics/upcoming-schedule/:type | requireServiceAuth | 다가오는 일정 |
| GET | /api/statistics_banners_click/redirect_id/:id | optionalServiceAuth | 배너 클릭 (리다이렉트) |
| POST | /api/statistics_banners_click/create | optionalServiceAuth | 배너 클릭 기록 |
| POST | /api/statistics_tracker/create | optionalServiceAuth | 페이지 방문 기록 |

### 2.32 Team
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /api/team/:id | optionalServiceAuth | 팀 상세 |
| POST | /api/team/create | requireServiceAuth | 팀 생성 |
| DELETE | /api/team/remove/master | requireServiceAuth | 팀 삭제 |
| PUT | /api/team/ | requireServiceAuth | 팀 수정 |
| PUT | /api/team/invite/member | requireServiceAuth | 멤버 초대 |
| PUT | /api/team/update/member | requireServiceAuth | 멤버 정보 수정 |
| GET | /api/team/list/members | requireServiceAuth | 멤버 목록 |
| GET | /api/team/detail/member/:detail_user_id | requireServiceAuth | 멤버 상세 |
| GET | /api/team/detail/member/:detail_user_id/clm | requireServiceAuth | 멤버 CLM 문서 |
| DELETE | /api/team/remove/member/:remove_user_id | requireServiceAuth | 멤버 제거 |
| POST | /api/team/logo | requireServiceAuth | 팀 로고 등록 |
| PUT | /api/team/login_option | requireServiceAuth_Business | 팀 로그인 설정 |
| GET | /api/team_flex/ | requireServiceAuth_Business | Team Flex 조회 |
| POST | /api/team_flex/ | requireServiceAuth_Business | Team Flex 생성/수정 |
| GET | /api/team_member_category/list | requireServiceAuth | 멤버 카테고리 목록 |
| POST | /api/team_member_category/create | requireServiceAuth | 멤버 카테고리 생성 |
| GET | /api/team_organization/ | requireServiceAuth | 조직도 목록 |
| POST | /api/team_organization/ | requireServiceAuth | 조직도 생성 |
| PUT | /api/team_organization/update/tree | requireServiceAuth | 조직도 위치 이동 |
| DELETE | /api/team_organization/ | requireServiceAuth | 조직도 삭제 |
| GET | /api/team_standard_contract/list | requireServiceAuth | 표준계약서 목록 |
| POST | /api/team_standard_contract/create/ | requireServiceAuth | 표준계약서 생성 |
| POST | /api/team_watermark/create | requireServiceAuth_Business | 팀 워터마크 생성 |
| GET | /api/team_watermark/list | requireServiceAuth_Business | 팀 워터마크 목록 |

### 2.33 User
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| PUT | /api/user/update/two_fa/otp | requireServiceAuth | OTP 2FA 설정 |
| PUT | /api/user/update/two_fa/sms | requireServiceAuth | SMS 2FA 설정 |
| GET | /api/user/business/notification | requireServiceAuth | CLM 알림 설정 조회 |
| PUT | /api/user/business/notification | requireServiceAuth | CLM 알림 설정 수정 |
| PUT | /api/user/ | requireServiceAuth | 회원 정보 수정 |
| PUT | /api/user/update/password | - | 비밀번호 변경 |
| PUT | /api/user/update/business | requireServiceAuth | 비즈니스 정보 수정 |
| PUT | /api/user/update/user_to_lawyer | requireServiceAuth | 변호사 전환 |
| POST | /api/user/update/profile_img | requireServiceAuth | 프로필 사진 업데이트 |
| PUT | /api/user/mobile_number | requireServiceAuth | 휴대폰 번호 저장 |
| POST | /api/user/change_team | requireServiceAuth | 팀 전환 |
| POST | /api/user/business_number | requireServiceAuth | 사업자번호 인증 |
| POST | /api/user/send/auth_code | - | 인증 코드 발송 |
| POST | /api/user/check/auth_code | - | 인증 코드 확인 |
| PUT | /api/user/locale | requireServiceAuth | 언어 설정 변경 |

### 2.34 User Bookmark / Contact / Contents / Coupon / Favorite / Law Information
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| POST | /api/user_bookmark/ | requireServiceAuth | 북마크 등록 |
| GET | /api/user_bookmark/ | requireServiceAuth | 북마크 목록 |
| DELETE | /api/user_bookmark/:magazine_id | requireServiceAuth | 북마크 삭제 |
| GET | /api/user_contact/ | optionalServiceAuth | 인적정보 목록 |
| POST | /api/user_contact/ | optionalServiceAuth | 인적정보 등록 |
| POST | /api/user_contact/my | requireServiceAuth | 본인 인적정보 등록 |
| GET | /api/user_contents/ | optionalServiceAuth | 맞춤 컨텐츠 조회 |
| GET | /api/user_coupon_log_v2/ | requireServiceAuth | 쿠폰 목록 |
| POST | /api/user_coupon_log_v2/use | requireServiceAuth | 쿠폰 사용 |
| GET | /api/user_favorite/ | requireServiceAuth | 즐겨찾기 목록 |
| POST | /api/user_favorite/create | requireServiceAuth | 즐겨찾기 등록 |
| DELETE | /api/user_favorite/delete/:id | requireServiceAuth | 즐겨찾기 삭제 |
| PUT | /api/user_law_information/upsert | requireServiceAuth_Business | 법률 정보 생성/수정 |
| GET | /api/user_law_information/list | requireServiceAuth_Business | 법률 정보 목록 |

### 2.35 User Login / Permission / Education / Event / Signup Path
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /api/user_login/ | requireServiceAuth | 로그인 세션 목록 |
| PUT | /api/user_login/remote_logout | requireServiceAuth | 원격 로그아웃 |
| PUT | /api/user_login/logout | requireServiceAuth | 로그아웃 시간 기록 |
| GET | /api/user_permission/count | optionalServiceAuth | 이용권 수 |
| GET | /api/user_permission_log/ | requireServiceAuth | 이용권 사용 로그 |
| GET | /api/user_education/:education_id | requireServiceAuth | 교육 상세 |
| POST | /api/user_education/quiz | requireServiceAuth | 교육 퀴즈 제출 |
| GET | /api/user_signup_path/ | optionalServiceAuth | 회원가입 경로 목록 |

### 2.36 Writing 관련
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /api/writing/ | - | 자동작성 문서 수 |
| GET | /api/writing_bulk_document/list | requireServiceAuth | 대량 문서 목록 |
| POST | /api/writing_bulk_document/create | requireServiceAuth | 대량 문서 생성 |
| DELETE | /api/writing_bulk_document/ | requireServiceAuth | 대량 문서 삭제 |
| GET | /api/writing_bulk_meta_info/ | requireServiceAuth | Bulk Meta Info 목록 |
| POST | /api/writing_bulk_meta_info/upload | requireServiceAuth | 사용자 데이터 Excel 업로드 |
| PUT | /api/writing_logo/ | requireServiceAuth | 자동작성 로고 수정 |
| POST | /api/writing_preview/ | optionalServiceAuth | 자동작성 미리보기 |
| GET | /api/writing_saved_log/ | requireServiceAuth | 자동작성 저장 로그 |
| GET | /api/writing_temp/list | - | 임시저장 문서 목록 |

### 2.37 Webhook / Waypoint
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| POST | /api/webhook/action/slack | - | Slack Action 처리 |
| POST | /api/waypoint_progress/create | requireServiceAuth | 웨이포인트 진행 상황 생성 |

---

## 3. Thirdparty API (`/thirdparty/`)

### 3.1 Autodoc
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| PUT | /thirdparty/autodoc/update/binddata | requireThirdpartyAuth + requireThirdpartySessionAuth | bind data 업데이트 |
| PUT | /thirdparty/autodoc/ | requireThirdpartyAuth + requireThirdpartySessionAuth | 자동작성문서 업데이트 |
| POST | /thirdparty/autodoc/doc/download | requireThirdpartyAuth + requireThirdpartySessionAuth | 워드파일 다운로드 |
| POST | /thirdparty/autodoc/update/editor_mode | requireThirdpartyAuth + requireThirdpartySessionAuth | 편집기 모드 전환 |

### 3.2 Banner / CFS / CFS Collaborator / CFS Meta
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /thirdparty/banner/group/:group_id | requireThirdpartyAuth | group_id로 배너 조회 |
| GET | /thirdparty/cfs/list | requireThirdpartyAuth + requireThirdpartySessionAuth | CFS 목록 |
| GET | /thirdparty/cfs/detail | requireThirdpartyAuth + requireThirdpartySessionAuth | CFS 상세 |
| POST | /thirdparty/cfs/autodoc/create | requireThirdpartyAuth + requireThirdpartySessionAuth | 자동작성 문서 생성 |
| POST | /thirdparty/cfs/esign/create | requireThirdpartyAuth + requireThirdpartySessionAuth | 전자서명 생성 |
| POST | /thirdparty/cfs/folder/create | requireThirdpartyAuth + requireThirdpartySessionAuth | CFS 폴더 생성 |
| PUT | /thirdparty/cfs/remove | requireThirdpartyAuth + requireThirdpartySessionAuth | CFS 삭제 |
| POST | /thirdparty/cfs_collaborator/create/invite | requireThirdpartyAuth + requireThirdpartySessionAuth | 협업자 초대 |
| DELETE | /thirdparty/cfs_collaborator/remove/:cfs_id/:remove_id | requireThirdpartyAuth + requireThirdpartySessionAuth | 협업자 삭제 |
| GET | /thirdparty/cfs_meta/ | requireThirdpartyAuth + requireThirdpartySessionAuth | CFS 메타 목록 |

### 3.3 CFS Poison Pill / CFS Request
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /thirdparty/cfs_poison_pill/list | requireThirdpartyAuth + requireThirdpartySessionAuth | 독소조항 조회 |
| DELETE | /thirdparty/cfs_poison_pill/ | requireThirdpartyAuth + requireThirdpartySessionAuth | 독소조항 삭제 |
| PUT | /thirdparty/cfs_poison_pill/poison_pill_review | requireThirdpartyAuth + requireThirdpartySessionAuth | 독소조항 재평가 |
| POST | /thirdparty/cfs_request/ | requireThirdpartyAuth + requireThirdpartySessionAuth | CFS 요청 생성 |
| GET | /thirdparty/cfs_request/ | requireThirdpartyAuth + requireThirdpartySessionAuth | CFS 요청 목록 |
| PUT | /thirdparty/cfs_request/ | requireThirdpartyAuth + requireThirdpartySessionAuth | CFS 요청 수정 |

### 3.4 CIMS
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| POST | /thirdparty/cims/login | - | CIMS 로그인 |
| POST | /thirdparty/cims/send/auth_code | - | CIMS 인증번호 전송 |
| POST | /thirdparty/cims/check/auth_code | - | CIMS 인증번호 확인 |
| GET | /thirdparty/cims/user/list | requireThirdpartyAuth + requireThirdpartySessionAuth | CIMS 유저 목록 |
| GET | /thirdparty/cims/activity/log/list | requireThirdpartyAuth + requireThirdpartySessionAuth | CIMS 활동 로그 |
| GET | /thirdparty/cims/login/statistics | requireThirdpartyAuth + requireThirdpartySessionAuth | CIMS 로그인 통계 |

### 3.5 Document / Esign / GLD
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /thirdparty/document/list | requireThirdpartyAuth | 문서 목록 |
| GET | /thirdparty/document/search | requireThirdpartyAuth | 문서 검색 |
| POST | /thirdparty/esign/register/complete | requireThirdpartyAuth + requireThirdpartySessionAuth | 전자서명 최종요청 |
| PUT | /thirdparty/esign/update/signer/sign | requireThirdpartyAuth + requireThirdpartySessionAuth | 서명 업데이트 |
| POST | /thirdparty/esign/send/auth_code | requireThirdpartyAuth | 전자서명 인증번호 전송 |
| PUT | /thirdparty/esign/cancel | requireThirdpartyAuth + requireThirdpartySessionAuth | 전자서명 거절 |
| POST | /thirdparty/esign/generate/pdf/:id | - | 전자서명 PDF 생성 |
| GET | /thirdparty/esign/progress | requireThirdpartyAuth + requireThirdpartySessionAuth | 전자서명 진행상태 |
| POST | /thirdparty/gld_document/ | requireThirdpartyAuth + requireThirdpartySessionAuth | GLD bind data 결과 |
| GET | /thirdparty/gld_thread/ | optionalThirdpartySessionAuth | GLD 스레드 목록 |
| POST | /thirdparty/gld_thread/ | optionalThirdpartySessionAuth | GLD 스레드 생성 |
| POST | /thirdparty/gld_thread_message/ | - | GLD 스레드 메시지 생성 |

### 3.6 Magazine / PDF / Recommend / Register / User
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /thirdparty/magazine/list | requireThirdpartyAuth | 매거진 목록 |
| GET | /thirdparty/magazine/detail/:id | requireThirdpartyAuth | 매거진 상세 |
| POST | /thirdparty/pdf/generate | requireThirdpartyAuth + requireThirdpartySessionAuth | PDF 생성 |
| GET | /thirdparty/recommend/list | requireThirdpartyAuth + requireThirdpartySessionAuth | AI 추천 문서 |
| POST | /thirdparty/register/signup | requireThirdpartyAuth | 회원가입 (암호화) |
| POST | /thirdparty/register/login | requireThirdpartyAuth | 로그인 |
| POST | /thirdparty/register/kakaosync | requireThirdpartyAuth | 카카오 로그인 |
| POST | /thirdparty/register/google | requireThirdpartyAuth | 구글 로그인 |
| GET | /thirdparty/user/detail | requireThirdpartyAuth + requireThirdpartySessionAuth | 내 정보 조회 |
| POST | /thirdparty/user/sso | requireThirdpartyAuth | SSO 세션 키 생성 |
| GET | /thirdparty/user/token | requireThirdpartyAuth + requireThirdpartySessionAuth | 토큰 변환 |
| PUT | /thirdparty/user/update | requireThirdpartyAuth + requireThirdpartySessionAuth | 유저 정보 업데이트 |
| DELETE | /thirdparty/user/quit | requireThirdpartyAuth + requireThirdpartySessionAuth | 유저 탈퇴 |

### 3.7 User QNA / User History / Writing Log
| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /thirdparty/user_qna/list | requireThirdpartyAuth + requireThirdpartySessionAuth | 1대1 문의 목록 |
| POST | /thirdparty/user_qna/create | requireThirdpartyAuth + requireThirdpartySessionAuth | 1대1 문의 등록 |
| GET | /thirdparty/user_history/list | requireThirdpartyAuth + requireThirdpartySessionAuth | 활동내역 목록 |
| GET | /thirdparty/writing_editor_log/ | requireThirdpartyAuth + requireThirdpartySessionAuth | 편집기 저장 로그 목록 |
| GET | /thirdparty/writing_saved_log/ | requireThirdpartyAuth + requireThirdpartySessionAuth | 저장 로그 목록 |

---

## 4. AI API (`/api/ai/`)

| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| POST | /api/ai/azure/chat | optionalServiceAuth | Azure AI 채팅 |
| POST | /api/ai/azure/checklist | requireServiceAuth | Azure AI 체크리스트 |
| POST | /api/ai/azure/comparison | requireServiceAuth | Azure AI 문서 비교 |
| GET | /api/ai/azure/comparison | requireServiceAuth | 문서 비교 결과 (polling) |
| POST | /api/ai/chat/create_room | - | 채팅방 생성 |
| POST | /api/ai/chat/create_message | - | 채팅 메시지 생성 |
| POST | /api/ai/chat/ask | - | AI 질문 |
| POST | /api/ai/checklist/create | - | 체크리스트 생성 |
| POST | /api/gld/ai_gld_thread_message_create | - | GLD 스레드 메시지 AI 생성 |
| POST | /api/gld/ai_gld_thread_message_file_create | - | GLD 스레드 메시지 파일 AI 생성 |
| GET | /api/ai/log/find | requireAdminAuth | AI 로그 목록 |
| GET | /api/ai/meta/find | requireAdminAuth | AI 메타 목록 |
| GET | /api/ai/setting/find/current | - | 현재 AI 설정 |
| POST | /api/ai/setting/create | - | AI 설정 생성 |

---

## 5. IMS API (`/api/ims/`)

| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| POST | /api/ims/curation/create | requireAdminAuth | 큐레이션 생성 |
| PUT | /api/ims/curation/update | requireAdminAuth | 큐레이션 수정 |
| GET | /api/ims/curation/list | requireAdminAuth | 큐레이션 목록 |
| GET | /api/ims/curation/:id | requireAdminAuth | 큐레이션 상세 |
| PUT | /api/ims/document/update | requireAdminAuth | 문서 업데이트 |
| POST | /api/ims/document_ai_question/create | requireAdminAuth | 문서 AI 질문 생성 |
| PUT | /api/ims/document_ai_question/update | requireAdminAuth | 문서 AI 질문 수정 |
| DELETE | /api/ims/document_ai_question/remove/:id | requireAdminAuth | 문서 AI 질문 삭제 |
| POST | /api/ims/ims/create | requireAdminAuth | IMS 등록 |
| PUT | /api/ims/ims/update | requireAdminAuth | IMS 수정 |
| PUT | /api/ims/ims/connect_user/:id | requireAdminAuth | IMS 회원 연결 |
| POST | /api/ims/ims_consult/create | requireAdminAuth | IMS 상담내용 등록 |
| POST | /api/ims/ims_memos/create | requireAdminAuth | IMS 메모 등록 |
| POST | /api/ims/upload/ai_test_c | - | AI 문서 테스트 업로드 |
| PUT | /api/ims/user/update_business | requireAdminAuth | 유저 기업정보 업데이트 |

---

## 6. AWS API

| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| GET | /aws/lb | - | AWS Load Balancer 헬스체크 |
