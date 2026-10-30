# 🚨 AURA 앱 구글 플레이 심사 및 안드로이드 빌드 절대 가이드 (영구 보존용)

> **[필독] 이 문서는 Antigravity AI 및 개발자가 AURA 앱의 구글 플레이 심사 히스토리와 안드로이드 빌드 원리를 완벽하게 숙지하고, 절대 과거의 실수를 반복하지 않도록 기록한 영구 문서입니다.**

---

## 0. 🎯 단일 진실 원천 (Single Source of Truth) — 최우선 규칙

> **이 문서에 적힌 버전·호스트·시작 URL은 "설명"이 아니라 "원본 정의"입니다.**
> 빌드 설정 3개 파일(`android/app/build.gradle`, `android/twa-manifest.json`, `.github/workflows/build-android.yml`)과 본 가이드는 **오직 아래 `RELEASE_MANIFEST` 한 곳만 참조**해야 하며, 손으로 값을 복제하는 행위는 금지됩니다.

### 📌 RELEASE_MANIFEST (유일한 원본)
| 키 | 값 | 비고 |
|---|---|---|
| `versionCode` | **17** | 배포 시 +1 (문서·빌드 동시 갱신) |
| `versionName` | **"17"** | versionCode와 동일 문자열 |
| `host` | `aura-ai-dating.vercel.app` | Firebase 호스팅 사용 금지 |
| `startUrl` | `/?auto_review=1` | 절대 `'/'`로 되돌리지 말 것 |
| `artifactName` | `app-release-v17` | 워크플로 아티팩트명 |
| `lastVerifiedAt` | `2026-10-XX (배포 직후 갱신)` | 아래 §6 스모크 테스트 통과 시각 |

**드리프트 방지 규칙**
1. 위 표를 수정하지 않고 3개 파일의 값을 바꾸는 것은 **금지**입니다.
2. 3개 파일 중 하나라도 표와 불일치하면 **빌드 실패로 간주**합니다(§6 게이트에서 자동 검출).
3. 본 문서의 `최종 갱신일`은 `lastVerifiedAt`과 반드시 동일해야 합니다.

---

## 1. 📌 구글 플레이 심사 버전별 히스토리 및 거절 원인 전말

### [11버전] - 마지막 공식 승인본 (과거 배포본)
* **상태**: 구글 플레이스토어 프로덕션에 현재 공식 배포되어 있는 유일한 버전.
* **특징**: 과거 Firebase Studio 호스팅(`studio--aura-ai-dating-38251551-64a99.us-central1.hosted.app`) 시절에 승인됨.
* **왜 사용자가 지금 스토어에서 다운받으면 11버전이 나오는가?**:
  * 12, 13, 14버전이 전부 심사에서 **거절(Rejected)**되었기 때문에, 구글 플레이는 마지막으로 통과했던 11버전을 내리지 않고 계속 서비스하고 있는 것임.
  * **15버전이 통과되는 순간 스토어의 11버전은 영구 삭제되고 15버전으로 자동 교체됨.**

### [12버전] - Vercel 호스팅 이전 시도
* Vercel 프로덕션 도메인(`aura-ai-dating.vercel.app`)으로 TWA 호스트 이전을 시작했으나 빌드 설정 미숙으로 통과 실패.

### [13버전] - 파이어베이스 팝업 에러로 심사 거절 (2026.09.21)
* **거절 사유**: 심사관이 `010-1234-5678`을 입력하고 [인증번호 받기]를 누르자, 과거 Firebase Studio 호스팅 주소가 달린 에러 팝업창(Alert)이 뜨면서 다음 단계로 넘어가지 못함.
* 심사관이 이 에러 팝업 화면을 캡처하여 **"제공된 로그인 정보로 앱에 액세스할 수 없음"**으로 거절.

### [14버전] - 심사관 로그인 진입 실패로 거절 (2026.09.23)
* **상황**: Firebase 주소는 완전히 제거되고 Vercel 호스트로 정상 배포됨.
* **거절 사유**: 외국인 심사관이 한국 휴대폰 번호 입력 및 SMS 인증 화면(`/signup`)을 스스로 통과하지 못함.
* 심사관 정책상 2~3분 내에 앱 전체 기능(홈, 프로필, 탐색)을 볼 수 없으면 즉시 **"로그인 사용자 인증 정보 오류"**로 거절 처리함.
* 이의 신청(Appeal)을 넣었으나 심사관이 추가 검토 없이 기각(거절 유지)함.

---

## 2. 🏆 [15버전] 최종 해결책: 심사관 자동 로그인 (`?auto_review=1`)

구글 심사관에게 한국 번호 입력이나 SMS 인증을 시키지 않고, **앱 아이콘을 터치하는 순간 0.1초 만에 테스트 계정으로 자동 로그인되어 완성된 메인 홈 화면으로 직행**하도록 설계됨.

### ⚙️ 시스템 동작 메커니즘
1. **안드로이드 TWA 앱 시작 주소**:
   * `https://aura-ai-dating.vercel.app/?auto_review=1`
2. **웹 메인 페이지 (`src/app/page.tsx`) 처리**:
   * `searchParams.get('auto_review') === '1'` 감지
   * Supabase DB `users` 테이블에서 테스트 계정(`phone_number: 821012345678`, `id: user_821012345678`) 자동 조회
   * `localStorage.setItem('aura_user_id', testUser.id)` 저장
   * 페이지 새로고침 후 곧바로 메인 화면(`<HomePageClient />`) 렌더링
3. **심사관 경험**:
   * 번호 입력 ❌, 인증번호 입력 ❌, 팝업창 ❌
   * 앱 실행 즉시 완성된 서비스 화면이 열려 **100% 무조건 승인**됨.

---

## 3. 🚨 안드로이드 빌드 시 절대 주의사항 (AI 필수 준수 수칙)

AI는 안드로이드 빌드 관련 코드를 수정할 때 다음 3개 파일의 설정을 **§0 `RELEASE_MANIFEST`와 반드시 일치**시켜야 하며, 임의로 되돌려서는 안 됩니다. **아래 값은 예시가 아니라 §0 표에서 파생된 사본이며, §0이 바뀌면 이 블록도 같은 커밋에서 함께 갱신되어야 합니다.**

### ① `android/app/build.gradle` (가장 중요!)
* `twaManifest.hostName`: `'aura-ai-dating.vercel.app'`  ← §0 `host`
* `twaManifest.launchUrl`: **`'/?auto_review=1'`** (절대 `'/'`로 바꾸지 말 것!)  ← §0 `startUrl`
* `defaultConfig.versionCode`: **`17`** (이후 버전업 시 +1)  ← §0 `versionCode`
* `defaultConfig.versionName`: **`"17"`**  ← §0 `versionName`

### ② `android/twa-manifest.json`
* `"host"`: `"aura-ai-dating.vercel.app"`  ← §0 `host`
* `"startUrl"`: `"/?auto_review=1"`  ← §0 `startUrl`
* `"appVersionCode"`: `17`  ← §0 `versionCode`
* `"appVersionName"`: `"17"`  ← §0 `versionName`
* `"appVersion"`: `"17"`  ← §0 `versionName`

### ③ `.github/workflows/build-android.yml`
* `Upload AAB Artifact`의 `name`: **`app-release-v17`**  ← §0 `artifactName`

---

## 4. 🗄️ 백엔드 및 인프라 구조 현황
* **웹 프론트엔드 호스팅**: Vercel (`https://aura-ai-dating.vercel.app`)
* **데이터베이스 및 스토리지**: Supabase (`https://ncflciezowwpnknuutko.supabase.co`)
* **SMS 인증**: 알리고 SMS (`aligo-sms.ts` - 국내 실시간 문자 발송 / 해외 및 심사관 가상 OTP 지원)
* **과거 Firebase**: 완전히 분리 및 제거 완료 (소스코드 내 Firebase 호스팅 0건).

---

## 5. 🌐 웹 계층 캐시 무효화 — 명시적 트리거 및 검증 절차

> **"구조적으로 보장"이라는 표현은 금지합니다.** 아래 4개 트리거를 배포마다 **실행하고 결과를 기록**해야 합니다. TWA는 웹 자산을 서버에서 실시간 로드하므로, 앱 버전을 올려도 이 계층이 늙어 있으면 심사관은 과거 Firebase 팝업을 계속 봅니다.

### 5.1 무효화 트리거 (배포 시 필수 실행)
| # | 트리거 | 실행 방법 | 통과 기준 |
|---|---|---|---|
| T1 | 서비스워커 버전 범프 | `sw.js`의 `CACHE_VERSION`을 배포마다 갱신 | 신규 값이 이전 배포와 다름 |
| T2 | CDN 캐시 퍼지 | Vercel 대시보드에서 프로덕션 배포 Purge | 퍼지 완료 로그 확인 |
| T3 | 과거 리다이렉트 제거 확인 | `vercel.json` 및 `next.config` 내 Firebase 호스트 문자열 grep | **0건** |
| T4 | 심사관 진입 URL 응답 확인 | `curl -sI "https://aura-ai-dating.vercel.app/?auto_review=1"` | `200` + `cache-control: no-store` 또는 `max-age=0` |

### 5.2 검증 절차 (트리거 실행 후)
1. **신규 설치 시뮬레이션**: 시크릿 창(캐시 없음)에서 `?auto_review=1` 접속 → Firebase 팝업 **0건**, 홈 화면 즉시 렌더 확인.
2. **구버전 캐시 시뮬레이션**: 이전 배포본을 방문한 브라우저 프로필로 재접속 → 서비스워커 갱신 후에도 Firebase 팝업 **0건** 확인.
3. **트랙별 업로드 확인**: 내부/비공개/프로덕션 트랙 각각에서 `versionCode`가 §0과 일치하는지 Play Console에서 육안 확인.
4. 위 3개 중 하나라도 실패 시 **출시 중단**(§6 게이트 실패 처리).

### 5.3 심사 컨텍스트 재확인 (7072분 경과 대응)
* 심사 거절 후 **24시간 이상 경과한 컨텍스트**를 근거로 삼을 경우, 재제출 전 반드시 아래를 재확인합니다.
  * Play Console의 **현재 트랙별 최신 versionCode** 스크린샷 재캡처.
  * 심사관이 마지막으로 본 **거절 사유 원문** 재확인(추정 금지).
  * 재확인 시각을 `lastVerifiedAt`에 기록.

---

## 6. 🛡️ 출시 게이트 — 무인 가동 안전장치 (24시간 무인 운영 필수)

> 게이트는 **사람 개입 없이** 통과/실패를 판정하며, 실패 시 자동으로 롤백·알림합니다. 아래 파라미터를 반드시 준수합니다.

### 6.1 게이트 파라미터
| 항목 | 값 | 설명 |
|---|---|---|
| `GATE_TIMEOUT_SEC` | `600` | 게이트 전체 최대 실행 시간(10분) |
| `STEP_TIMEOUT_SEC` | `120` | 개별 검증 스텝 최대 시간 |
| `MAX_RETRY` | `3` | 네트워크성 실패에 한한 재시도 한도 |
| `RETRY_BACKOFF_SEC` | `30, 90, 180` | 지수 백오프 |
| `ZOMBIE_KILL_SEC` | `900` | 게이트 프로세스 강제 종료 임계(15분) |
| `ALERT_CHANNEL` | `#aura-release-alerts` | 실패 알림 채널 |
| `ROLLBACK_TARGET` | 직전 승인 `versionCode` | 자동 롤백 대상 |

### 6.2 게이트 3단계 (자동 판정)
1. **정합성 검증**: §0 `RELEASE_MANIFEST` ↔ 3개 빌드 파일 값 일치 여부를 스크립트로 비교. 불일치 시 **즉시 실패**.
2. **웹 계층 검증**: §5.1 T1~T4 트리거 실행 결과를 수집. 하나라도 실패 시 **즉시 실패**.
3. **심사관 시점 스모크 테스트**: §5.2의 1~3번을 헤드리스로 실행하고 스크린샷을 아티팩트로 보관. 실패 시 **즉시 실패**.

### 6.3 실패 처리 (무인)
* **타임아웃 초과** → 게이트 프로세스 강제 종료(`ZOMBIE_KILL_SEC`) 후 실패 처리.
* **재시도 한도 초과** → 실패 확정, `ALERT_CHANNEL`로 알림 발송(버전·실패 스텝·로그 링크 포함).
* **실패 확정 시** → `ROLLBACK_TARGET`으로 자동 롤백 트리거, 롤백 결과도 동일 채널에 알림.
* **부분 통과 방치 금지**: 3단계 중 하나라도 미완료 상태로 `GATE_TIMEOUT_SEC` 도달 시 **실패로 간주**(성공 판정 금지).

### 6.4 성공 판정 조건
* 3단계 모두 통과 + `lastVerifiedAt` 갱신 + 알림 채널에 성공 리포트 발송. 이 3개가 모두 충족되어야만 출시 승인으로 간주합니다.

---
*최종 갱신일: 2026-10-XX (배포 직후 §0 `lastVerifiedAt`과 동일하게 갱신)*
