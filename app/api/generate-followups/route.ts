import { NextResponse } from "next/server";

type ProjectPayload = {
  name?: string;
  purpose?: string;
  role?: string;
  tech_stack?: string[];
  implemented_features?: string[];
  frontend_scope?: string;
  backend_scope?: string;
  database_scope?: string;
  auth_experience?: string;
  deployment_experience?: string;
  real_user_or_client?: string;
  collaboration_people?: string;
  collaboration_type?: string;
  difficulty?: string;
  solution_process?: string;
  result?: string;
};

type FollowUpQuestion = {
  project_name: string;
  category: string;
  question: string;
};

const categories = [
  "본인 기여도",
  "풀스택 범위",
  "문제 해결 과정",
  "배포/운영 경험",
  "협업 경험",
  "요구사항 이해와 커뮤니케이션"
];

function getOptionalEnv(name: string) {
  const rawValue = process.env[name];

  if (typeof rawValue !== "string") {
    return "";
  }

  const value = rawValue
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/[\r\n]/g, "");

  if (!value || value === "undefined" || value === "null") {
    return "";
  }

  return value;
}

function safeProjectName(project: ProjectPayload, index: number) {
  const trimmed = project.name?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : `대표 프로젝트 ${index + 1}`;
}

function createFallbackQuestions(projects: ProjectPayload[]): FollowUpQuestion[] {
  return projects.flatMap((project, index) => {
    const name = safeProjectName(project, index);
    return [
      {
        project_name: name,
        category: categories[0],
        question:
          "이 프로젝트에서 본인이 직접 구현한 기능과 다른 사람이 담당한 기능을 구분해서 설명해주세요."
      },
      {
        project_name: name,
        category: categories[1],
        question:
          "프론트엔드, 백엔드/API, 데이터베이스 중 본인이 직접 설계하거나 구현한 범위를 각각 구체적으로 적어주세요."
      },
      {
        project_name: name,
        category: categories[2],
        question:
          "가장 어려웠던 문제를 발견한 과정, 시도한 방법, 최종 해결 방식을 순서대로 설명해주세요."
      },
      {
        project_name: name,
        category: categories[3],
        question:
          "배포 이후 환경 변수, 오류 로그, 성능, 사용자 피드백처럼 운영 과정에서 직접 다룬 일이 있었나요?"
      },
      {
        project_name: name,
        category: categories[4],
        question:
          "함께 작업한 사람이 있었다면 역할 분담, 의사결정 방식, 충돌 조율 경험을 설명해주세요."
      },
      {
        project_name: name,
        category: categories[5],
        question:
          "요구사항이 모호하거나 바뀌었을 때 어떤 질문을 했고, 결과물을 어떻게 조정했는지 알려주세요."
      }
    ];
  });
}

function normalizeQuestions(value: unknown): FollowUpQuestion[] {
  if (
    !value ||
    typeof value !== "object" ||
    !Array.isArray((value as { follow_up_questions?: unknown }).follow_up_questions)
  ) {
    return [];
  }

  return (value as { follow_up_questions: unknown[] }).follow_up_questions
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const question = item as Partial<FollowUpQuestion>;
      if (
        typeof question.project_name !== "string" ||
        typeof question.category !== "string" ||
        typeof question.question !== "string"
      ) {
        return null;
      }

      return {
        project_name: question.project_name.trim(),
        category: question.category.trim(),
        question: question.question.trim()
      };
    })
    .filter((item): item is FollowUpQuestion => {
      return Boolean(item?.project_name && item.category && item.question);
    });
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as {
      candidate_basic_info?: unknown;
      tech_stack?: unknown;
      preferred_work_type?: unknown;
      projects?: ProjectPayload[];
    };

    const projects = Array.isArray(payload.projects) ? payload.projects.slice(0, 3) : [];

    if (projects.length === 0) {
      return NextResponse.json(
        { error: "대표 프로젝트 정보가 필요합니다." },
        { status: 400 }
      );
    }

    const openAiApiKey = getOptionalEnv("OPENAI_API_KEY");
    const openAiModel = getOptionalEnv("OPENAI_MODEL") || "gpt-4o-mini";

    if (!openAiApiKey) {
      return NextResponse.json({
        follow_up_questions: createFallbackQuestions(projects),
        fallback_used: true
      });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openAiApiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: openAiModel,
        response_format: { type: "json_object" },
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "너는 풀스택 개발자 후보자의 비정형 프로젝트 설명을 분석용 데이터로 보완하기 위한 추가 질문만 생성한다. 사람 자체를 평가하거나 합격 가능성, 점수, 인성 평가를 언급하지 않는다. 반드시 JSON 객체만 출력한다."
          },
          {
            role: "user",
            content: JSON.stringify({
              instruction:
                "각 대표 프로젝트별로 부족한 정보를 보완할 추가 질문을 4~6개 생성해줘. 질문 유형은 본인 기여도, 실제 풀스택 범위, 문제 해결 과정, 배포/운영 경험, 협업 경험, 요구사항 이해와 커뮤니케이션을 균형 있게 포함한다. 출력 형식은 {\"follow_up_questions\":[{\"project_name\":\"\",\"category\":\"\",\"question\":\"\"}]}만 사용한다.",
              candidate_basic_info: payload.candidate_basic_info,
              tech_stack: payload.tech_stack,
              preferred_work_type: payload.preferred_work_type,
              projects: projects.map((project, index) => ({
                ...project,
                name: safeProjectName(project, index)
              }))
            })
          }
        ]
      })
    });

    if (!response.ok) {
      const detail = await response.text();

      if (detail.includes("unsupported_country_region_territory")) {
        return NextResponse.json({
          follow_up_questions: createFallbackQuestions(projects),
          fallback_used: true,
          fallback_reason: "openai_unavailable_from_worker_region"
        });
      }

      return NextResponse.json(
        {
          error: "OpenAI API 요청에 실패했습니다.",
          detail
        },
        { status: 502 }
      );
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content ?? "";
    const parsed = JSON.parse(content) as unknown;
    const questions = normalizeQuestions(parsed);

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "AI 응답에서 추가 질문 JSON을 찾지 못했습니다." },
        { status: 502 }
      );
    }

    return NextResponse.json({ follow_up_questions: questions });
  } catch (error) {
    return NextResponse.json(
      {
        error: "추가 질문 생성 중 오류가 발생했습니다.",
        detail: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
