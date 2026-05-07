export type EvidenceLevel = "insufficient" | "weak" | "moderate" | "strong";

export type WorkSampleRubricCriterion = {
  id: string;
  label: string;
  description: string;
  related_question_ids: string[];
  strong_evidence: string[];
  moderate_evidence: string[];
  weak_evidence: string[];
  insufficient_evidence: string[];
  warning_signals: string[];
};

export type WorkSampleRubric = {
  rubric_id: string;
  rubric_version: string;
  target_role: string;
  scenario_id: string;
  criteria: WorkSampleRubricCriterion[];
};

export const MVP_FULLSTACK_WORK_SAMPLE_RUBRIC: WorkSampleRubric = {
  rubric_id: "mvp_fullstack_work_sample_rubric",
  rubric_version: "2026-05-07-v1",
  target_role: "MVP 제작형 풀스택 개발자",
  scenario_id: "mvp_fullstack_001",
  criteria: [
    {
      id: "requirement_understanding",
      label: "요구사항 이해력",
      description:
        "비개발 의뢰자의 모호한 요구사항을 실제 프로젝트 목표와 확인 질문으로 바꿀 수 있는지 확인합니다.",
      related_question_ids: ["requirement_understanding"],
      strong_evidence: [
        "의뢰자의 사업 목적과 사용자 관점까지 고려해 프로젝트 목표를 재정리한다.",
        "기능 목록을 그대로 반복하지 않고 실제 해결해야 할 문제를 구분한다.",
        "결제, 알림, 관리자 페이지 등 추가 확인이 필요한 기능을 질문으로 분리한다.",
        "비개발 의뢰자가 이해할 수 있는 언어로 요구사항을 정리한다."
      ],
      moderate_evidence: [
        "주요 기능과 프로젝트 목적을 대체로 정리한다.",
        "일부 추가 질문을 제시하지만 질문의 우선순위나 이유가 부족하다.",
        "기술적 설명과 의뢰자 관점 설명이 섞여 있으나 큰 방향은 이해 가능하다."
      ],
      weak_evidence: [
        "의뢰자가 말한 기능을 단순히 나열하는 데 그친다.",
        "추가 확인 질문이 거의 없거나 너무 일반적이다.",
        "프로젝트 목표보다 기술스택이나 구현 방법부터 이야기한다."
      ],
      insufficient_evidence: [
        "요구사항을 제대로 요약하지 못한다.",
        "의뢰자의 목적, 사용자, 핵심 기능을 구분하지 못한다.",
        "답변이 지나치게 짧거나 판단 근거가 없다."
      ],
      warning_signals: [
        "의뢰자가 말한 모든 기능을 그대로 수용한다.",
        "확인 질문 없이 바로 개발 가능하다고 말한다.",
        "비개발 의뢰자가 이해하기 어려운 전문용어만 사용한다."
      ]
    },
    {
      id: "mvp_prioritization",
      label: "MVP 우선순위 판단",
      description:
        "제한된 기간과 예산 안에서 먼저 만들 기능과 나중으로 미룰 기능을 현실적으로 구분하는지 확인합니다.",
      related_question_ids: ["mvp_prioritization", "work_plan"],
      strong_evidence: [
        "4주라는 제한 조건을 반영해 핵심 기능과 후순위 기능을 명확히 구분한다.",
        "회원가입, 예약, 관리자 페이지 등 MVP 검증에 필요한 기능을 우선 배치한다.",
        "결제, 알림 등 복잡하거나 외부 연동이 필요한 기능을 후순위로 둘 수 있음을 설명한다.",
        "기능 우선순위의 이유를 사업 검증, 개발 난이도, 일정 리스크와 연결해 설명한다."
      ],
      moderate_evidence: [
        "핵심 기능과 후순위 기능을 나누지만 이유가 다소 일반적이다.",
        "일정 제한을 일부 고려하지만 기능 범위 조정이 충분히 구체적이지 않다.",
        "복잡한 기능의 위험성을 일부 인식한다."
      ],
      weak_evidence: [
        "모든 기능을 한 번에 만들겠다고 한다.",
        "우선순위 기준이 명확하지 않다.",
        "기간, 예산, 의뢰자의 검증 목적을 거의 고려하지 않는다."
      ],
      insufficient_evidence: [
        "기능 우선순위를 나누지 못한다.",
        "MVP 개념을 이해하지 못한 답변을 한다.",
        "답변이 기능 목록 반복에 그친다."
      ],
      warning_signals: [
        "제한된 기간에도 모든 기능 구현을 약속한다.",
        "외부 결제/알림 연동의 난이도와 리스크를 전혀 언급하지 않는다.",
        "의뢰자의 사업 검증보다 기술적으로 멋진 기능을 우선한다."
      ]
    },
    {
      id: "technical_structuring",
      label: "기술 구조화 능력",
      description:
        "프론트엔드, 백엔드/API, DB, 배포 요소를 프로젝트 구조로 나누어 설명할 수 있는지 확인합니다.",
      related_question_ids: ["technical_structuring", "problem_solving"],
      strong_evidence: [
        "프론트엔드, 백엔드/API, DB의 역할을 구분해 설명한다.",
        "예약 중복 방지, 사용자/관리자 권한, 데이터 저장 구조 등 핵심 도메인을 고려한다.",
        "의뢰자가 이해할 수 있는 수준으로 기술 구조를 설명한다.",
        "문제 발생 시 원인을 확인하는 순서가 합리적이다."
      ],
      moderate_evidence: [
        "프론트엔드, 백엔드, DB를 대략적으로 구분한다.",
        "주요 기능의 기술 구조를 일부 설명하지만 구체성이 부족하다.",
        "문제 해결 순서는 있으나 원인 분리가 다소 약하다."
      ],
      weak_evidence: [
        "화면 구성 위주로만 설명하고 백엔드/API/DB 이해가 부족하다.",
        "기술 용어를 나열하지만 프로젝트 구조와 연결하지 못한다.",
        "버그 발생 시 원인 확인 순서가 모호하다."
      ],
      insufficient_evidence: [
        "프론트엔드, 백엔드, DB 역할을 구분하지 못한다.",
        "핵심 기능을 구현하기 위한 구조 설명이 거의 없다.",
        "문제 해결 방식이 추측이나 단정에 가깝다."
      ],
      warning_signals: [
        "DB나 API 없이 모든 기능을 화면으로만 해결하려 한다.",
        "예약 중복 같은 핵심 문제를 고려하지 않는다.",
        "비개발 의뢰자에게 설명할 수 없는 방식으로만 답변한다."
      ]
    },
    {
      id: "risk_communication",
      label: "리스크 커뮤니케이션",
      description:
        "문제 발생 시 상황, 원인, 대안, 일정 영향을 의뢰자에게 투명하고 이해 가능하게 설명할 수 있는지 확인합니다.",
      related_question_ids: [
        "risk_communication",
        "problem_solving",
        "process_reflection"
      ],
      strong_evidence: [
        "문제 상황을 숨기지 않고 현재 상태, 원인, 영향 범위를 구분해 설명한다.",
        "의뢰자에게 선택 가능한 대안을 제시한다.",
        "일정 영향과 우선순위 조정 방안을 함께 안내한다.",
        "방어적이거나 모호한 표현보다 협업 가능한 메시지로 전달한다."
      ],
      moderate_evidence: [
        "문제 상황과 대안을 설명하지만 일정 영향이나 선택지가 부족하다.",
        "의뢰자가 이해할 수 있는 표현을 일부 사용한다.",
        "책임 회피보다는 해결 방향을 제시한다."
      ],
      weak_evidence: [
        "문제가 생겼다는 사실만 말하고 대안이 부족하다.",
        "일정 영향이나 우선순위 조정을 설명하지 않는다.",
        "기술적인 이유만 길게 설명한다."
      ],
      insufficient_evidence: [
        "문제 발생 상황을 의뢰자에게 어떻게 공유할지 설명하지 못한다.",
        "대안 없이 지연 사실만 전달한다.",
        "답변이 매우 짧거나 실제 메시지 형태가 아니다."
      ],
      warning_signals: [
        "문제를 숨기거나 나중에 알리겠다는 태도를 보인다.",
        "의뢰자 탓, 외부 도구 탓으로만 설명한다.",
        "일정 지연에도 대안이나 범위 조정을 제안하지 않는다."
      ]
    },
    {
      id: "handover_readiness",
      label: "인수인계 준비도",
      description:
        "프로젝트 종료 후 유지보수와 운영을 위해 필요한 자료와 전달 항목을 인식하고 있는지 확인합니다.",
      related_question_ids: ["handover_readiness", "work_plan"],
      strong_evidence: [
        "README, 실행 방법, 환경변수, 배포 계정, DB 구조, 관리자 계정, 주요 기능 설명을 포함한다.",
        "후속 개발자나 의뢰자가 유지보수할 수 있도록 문서화 항목을 구체적으로 제시한다.",
        "코드와 서비스 운영에 필요한 권한 이전을 고려한다.",
        "인수인계를 프로젝트 완료의 일부로 인식한다."
      ],
      moderate_evidence: [
        "README, 배포 정보, 계정 정보 등 일부 인수인계 항목을 언급한다.",
        "유지보수 필요성을 인식하지만 구체성이 부족하다.",
        "문서화 범위가 제한적이다."
      ],
      weak_evidence: [
        "결과물 전달만 말하고 운영/유지보수 자료가 부족하다.",
        "계정, 환경변수, 배포, DB 구조 등을 거의 언급하지 않는다.",
        "인수인계를 부가적인 작업으로만 본다."
      ],
      insufficient_evidence: [
        "인수인계 계획이 거의 없다.",
        "어떤 자료를 남겨야 하는지 설명하지 못한다.",
        "답변이 추상적이다."
      ],
      warning_signals: [
        "코드만 넘기면 된다고 말한다.",
        "계정/배포/환경변수 등 운영 필수 정보를 고려하지 않는다.",
        "의뢰자가 이후 유지보수할 수 있는지에 관심이 없다."
      ]
    }
  ]
};
