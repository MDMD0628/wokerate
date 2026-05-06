# Workerate Candidate Intake MVP

풀스택 개발자 후보자의 비정형 프로젝트 경험을 분석 가능한 `candidate_profile.json`으로 구조화하는 첫 MVP입니다.

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

## 포함된 기능

- 단계별 후보자 데이터 입력
- 대표 프로젝트 최소 2개, 최대 3개 입력
- localStorage 자동 저장
- `/api/generate-followups` API Route 기반 추가 질문 생성
- AI 추가 질문 답변 저장
- 최종 요약 확인
- `candidate_profile.json` 다운로드

현재 버전은 분석을 위한 데이터 수집만 다루며 매칭, 점수, 합격/탈락, 사람에 대한 평가는 포함하지 않습니다.
