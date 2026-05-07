# Workerate Candidate Intake MVP

풀스택 개발자 후보자가 자발적으로 참여해 개인정보 수집·이용 및 AI 분석에 동의한 뒤, GitHub, 포트폴리오, 프로젝트 경험, 협업 경험, 문제 해결 경험을 분석 가능한 JSON으로 구조화하는 첫 MVP입니다.

## 필수 입력과 심화 입력

후보자 입력 폼은 필수 입력과 심화 입력으로 분리되어 있습니다. 이름 또는 닉네임, 이메일, GitHub URL, 주요 기술스택, 희망 업무 유형, 첫 번째 대표 프로젝트의 핵심 정보, 실무 시나리오 테스트 필수 4문항만 작성해도 제출할 수 있습니다.

선택 항목은 더 정확한 업무적합도 분석을 위한 참고 자료입니다. 포트폴리오, 배포 서비스, 블로그, LinkedIn, 프로젝트의 배포·DB·협업 정보, 협업 경험, AI 추가 질문 답변은 비어 있어도 제출이 막히지 않습니다.

실무 시나리오 테스트는 필수 4문항과 선택 4문항으로 구성됩니다. 필수 문항은 요구사항 이해, MVP 우선순위 판단, 리스크 커뮤니케이션, 인수인계 준비도에 대한 답변이며, 선택 문항은 향후 AI 분석 리포트의 근거를 풍부하게 하기 위한 정보입니다.

## 관리자 리포트 초안

관리자 리포트 초안 화면은 공개 후보자 입력 폼과 분리된 `/admin/reports` 경로에서 확인합니다. 현재 단계에서는 Supabase 데이터를 자동 조회하지 않고, `candidate_profile` JSON을 붙여넣어 표준 리포트 양식과 미리보기를 검증합니다.

```bash
ADMIN_ACCESS_KEY=your_admin_access_key
```

`ADMIN_ACCESS_KEY`는 서버의 `/api/admin/validate-key` Route에서만 비교합니다. Cloudflare 배포 시에는 코드에 하드코딩하지 말고 Dashboard 변수 또는 Wrangler secret으로 등록합니다.

## 실무 시나리오 테스트

후보자 입력 흐름에 MVP 제작형 풀스택 개발자를 위한 업무상황 기반 테스트가 추가되었습니다. 이 테스트는 코딩 실력을 단정하기 위한 시험이 아니라, 비개발 의뢰자의 요구사항을 이해하고 기능 우선순위를 정하며 리스크 커뮤니케이션과 인수인계 준비 방식을 수집하기 위한 기능입니다.

테스트 답변은 `candidate_profile.work_sample_test`에 저장됩니다. 최종 제출 시 기존 `/api/submit-candidate`를 통해 Supabase `candidate_submissions.candidate_profile` JSONB 안에 함께 저장됩니다.

## 실무 테스트 분석 루브릭

실무 시나리오 테스트 분석 루브릭이 추가되었습니다. 현재 단계에서는 AI 분석을 수행하지 않고, 향후 AI가 일관된 기준으로 답변을 분석하기 위한 기준표와 리포트 출력 구조만 준비합니다.

- 루브릭 파일: `lib/workSampleRubric.ts`
- 분석 리포트 타입: `lib/workSampleAnalysisTypes.ts`
- 빈 리포트 초안 생성: `lib/createEmptyWorkSampleAnalysisReport.ts`
- 내부 검토 페이지: `/admin/work-sample-rubric`

루브릭은 채용 여부 결정이나 사람 자체에 대한 단정이 아니라, 업무상황 답변에서 확인 가능한 근거를 분류하기 위한 기준입니다.

## 실행

```bash
npm.cmd install
npm.cmd run dev
```

PowerShell에서 `npm` 실행 정책 오류가 나면 `npm.cmd`를 사용하세요.

## OpenAI API

OpenAI API 호출은 `app/api/generate-followups/route.ts`에서만 일어납니다.

```bash
OPENAI_API_KEY=your_api_key
OPENAI_MODEL=gpt-4o-mini
```

`OPENAI_API_KEY`가 없으면 로컬 테스트를 위해 기본 추가 질문 JSON을 반환합니다.

## Supabase 저장

Supabase 저장은 `app/api/submit-candidate/route.ts` 서버 라우트에서만 처리합니다.

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

`SUPABASE_SERVICE_ROLE_KEY`는 클라이언트 컴포넌트에서 import하지 않습니다. 공개 저장소에는 `.env.local.example`만 올리고, 실제 값은 `.env.local` 또는 배포 환경변수에만 넣어야 합니다.

`/api/submit-candidate`는 서버에서도 필수 동의, 이름 또는 닉네임, 이메일, GitHub URL, 주요 기술스택, 희망 업무 유형, 첫 번째 대표 프로젝트의 필수 정보, 실무 테스트 필수 답변을 다시 검증합니다. 요청 본문 크기 제한, same-origin 브라우저 요청 확인, 기본 rate limit도 적용합니다.

## Cloudflare Workers 배포

이 프로젝트는 Cloudflare Workers + OpenNext 방식으로 배포할 수 있도록 설정되어 있습니다.

Next.js 16은 기본 빌드가 Turbopack으로 동작할 수 있어 OpenNext/Cloudflare Worker 런타임에서 chunk loading 문제가 생길 수 있습니다. 이 프로젝트는 `next build --webpack`을 사용해 Webpack 기반 빌드를 강제합니다.

```bash
npm.cmd run build
npm.cmd run preview
npm.cmd run deploy
npm.cmd run cf-typegen
```

Windows PowerShell 환경에서는 OpenNext build가 동작하더라도 런타임 또는 파일 경로 이슈가 생길 수 있습니다. Cloudflare 배포 검증은 WSL 환경에서 실행하는 것을 권장합니다.

배포 설정 파일:

- `open-next.config.ts`
- `wrangler.jsonc`

`wrangler.jsonc`는 Workers 런타임을 위해 `nodejs_compat`를 사용하고, `.open-next/worker.js`와 `.open-next/assets`를 기준으로 배포합니다. API Route가 있으므로 `output: "export"`는 사용하지 않습니다.

로컬 Cloudflare build 안정화를 위해 루트 `.env`에는 아래 값만 둘 수 있습니다. 이 파일은 git에 커밋하지 않습니다.

```env
WRANGLER_BUILD_CONDITIONS=""
WRANGLER_BUILD_PLATFORM="node"
```

Cloudflare에는 아래 환경변수를 코드에 커밋하지 말고 Dashboard 또는 Wrangler secret으로 등록합니다.

```bash
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put OPENAI_MODEL
npx wrangler secret put NEXT_PUBLIC_SUPABASE_URL
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
npx wrangler secret put ADMIN_ACCESS_KEY
```

Cloudflare Dashboard를 사용할 경우:

`Workers & Pages` -> `workerate` -> `Settings` -> `Variables and Secrets`

등록해야 하는 값:

```env
OPENAI_API_KEY=
OPENAI_MODEL=
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_ACCESS_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY`는 서버 라우트에서만 사용합니다. `.env.local`, `.dev.vars`, Cloudflare secret에는 실제 값을 넣을 수 있지만 공개 저장소에는 커밋하지 않습니다.

## 포함된 기능

- 커뮤니티 유입용 랜딩 페이지
- 개인정보 수집·이용 필수 동의
- 후보자 제출자료 AI 분석 필수 동의
- 기업 매칭 활용 및 제3자 제공 선택 동의
- 후속 실험 및 서비스 안내 수신 선택 동의
- 단계별 후보자 데이터 입력
- 필수 입력과 심화 입력 분리
- 대표 프로젝트 최소 1개, 최대 3개 입력
- 협업 경험 선택 입력
- MVP 제작형 실무 시나리오 테스트 답변 저장
- 실무 시나리오 테스트 필수 4문항 및 선택 4문항 구성
- 실무 시나리오 테스트 분석 루브릭 및 내부 검토 페이지
- localStorage 자동 저장
- `/api/generate-followups` API Route 기반 추가 질문 생성
- 공개 API Route 요청 크기 제한 및 기본 rate limit
- AI 추가 질문 답변 저장
- 최종 요약 확인
- `candidate_profile.json` 다운로드
- `consent_log.json` 다운로드
- Supabase `candidate_submissions` 테이블 저장

현재 버전은 localStorage와 JSON Export를 유지하면서, 환경변수가 설정된 경우 Supabase 저장도 사용할 수 있습니다. 채용 여부 결정, 사람 자체에 대한 단정, 기업 제공 기능은 포함하지 않습니다.
