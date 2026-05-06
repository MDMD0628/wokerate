# Workerate Candidate Intake MVP

풀스택 개발자 후보자가 자발적으로 참여해 개인정보 수집·이용 및 AI 분석에 동의한 뒤, GitHub, 포트폴리오, 프로젝트 경험, 협업 경험, 문제 해결 경험을 분석 가능한 JSON으로 구조화하는 첫 MVP입니다.

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

## Cloudflare Workers 배포

이 프로젝트는 Cloudflare Workers + OpenNext 방식으로 배포할 수 있도록 설정되어 있습니다.

```bash
npm.cmd run preview
npm.cmd run deploy
npm.cmd run cf-typegen
```

배포 설정 파일:

- `open-next.config.ts`
- `wrangler.jsonc`

Cloudflare에는 아래 환경변수를 코드에 커밋하지 말고 Dashboard 또는 Wrangler secret으로 등록합니다.

```bash
npx wrangler secret put OPENAI_API_KEY
npx wrangler secret put OPENAI_MODEL
npx wrangler secret put NEXT_PUBLIC_SUPABASE_URL
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY
```

Cloudflare Dashboard를 사용할 경우:

`Workers & Pages` -> `workerate` -> `Settings` -> `Variables and Secrets`

등록해야 하는 값:

```env
OPENAI_API_KEY=
OPENAI_MODEL=
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY`는 서버 라우트에서만 사용합니다. `.env.local`, `.dev.vars`, Cloudflare secret에는 실제 값을 넣을 수 있지만 공개 저장소에는 커밋하지 않습니다.

## 포함된 기능

- 커뮤니티 유입용 랜딩 페이지
- 개인정보 수집·이용 필수 동의
- 후보자 제출자료 AI 분석 필수 동의
- 기업 매칭 활용 및 제3자 제공 선택 동의
- 후속 실험 및 서비스 안내 수신 선택 동의
- 단계별 후보자 데이터 입력
- 대표 프로젝트 최소 1개, 최대 3개 입력
- 협업 경험 입력
- localStorage 자동 저장
- `/api/generate-followups` API Route 기반 추가 질문 생성
- AI 추가 질문 답변 저장
- 최종 요약 확인
- `candidate_profile.json` 다운로드
- `consent_log.json` 다운로드
- Supabase `candidate_submissions` 테이블 저장

현재 버전은 localStorage와 JSON Export를 유지하면서, 환경변수가 설정된 경우 Supabase 저장도 사용할 수 있습니다. 채용 합격/탈락, 사람에 대한 평가, 기업 제공 기능은 포함하지 않습니다.
