import type { EvidenceLevel } from "./workSampleRubric";

export type WorkSampleCriterionAnalysis = {
  criterion_id: string;
  label: string;
  level: EvidenceLevel;
  evidence: string[];
  concerns: string[];
  missing_information: string[];
};

export type WorkSampleAnalysisReport = {
  report_type: "work_sample_analysis";
  report_version: string;
  scenario_id: string;
  target_role: string;
  generated_at: string;
  source: "manual_draft" | "ai_generated";
  overall_summary: string;
  criteria: WorkSampleCriterionAnalysis[];
  best_fit_project_types: string[];
  potential_risks: string[];
  recommended_follow_up_questions: string[];
  prohibited_interpretations: string[];
};
