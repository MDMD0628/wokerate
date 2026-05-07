import type { WorkSampleAnalysisReport } from "./workSampleAnalysisTypes";
import { MVP_FULLSTACK_WORK_SAMPLE_RUBRIC } from "./workSampleRubric";

export function createEmptyWorkSampleAnalysisReport(): WorkSampleAnalysisReport {
  return {
    report_type: "work_sample_analysis",
    report_version: MVP_FULLSTACK_WORK_SAMPLE_RUBRIC.rubric_version,
    scenario_id: MVP_FULLSTACK_WORK_SAMPLE_RUBRIC.scenario_id,
    target_role: MVP_FULLSTACK_WORK_SAMPLE_RUBRIC.target_role,
    generated_at: new Date().toISOString(),
    source: "manual_draft",
    overall_summary: "",
    criteria: MVP_FULLSTACK_WORK_SAMPLE_RUBRIC.criteria.map((criterion) => ({
      criterion_id: criterion.id,
      label: criterion.label,
      level: "insufficient",
      evidence: [],
      concerns: [],
      missing_information: []
    })),
    best_fit_project_types: [],
    potential_risks: [],
    recommended_follow_up_questions: [],
    prohibited_interpretations: [
      "이 리포트는 합격 또는 불합격 판단이 아닙니다.",
      "이 리포트는 인성, 성격, 성향을 단정하지 않습니다.",
      "이 리포트는 제출된 실무 시나리오 답변에 기반한 업무적합도 참고 자료입니다.",
      "이 리포트는 나이, 성별, 출신지역 등 직무와 무관한 정보를 사용하지 않습니다."
    ]
  };
}
