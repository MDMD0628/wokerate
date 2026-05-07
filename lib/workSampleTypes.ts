export type WorkSampleAnswer = {
  question_id: string;
  question: string;
  answer: string;
  process_note: string;
};

export type WorkSampleTest = {
  scenario_id: string;
  scenario_title: string;
  scenario_description: string;
  target_role: string;
  estimated_time_minutes: number;
  started_at: string;
  submitted_at: string;
  self_reported_time_minutes: string;
  answers: WorkSampleAnswer[];
};

type WorkSampleAnalysisSection = {
  level: "insufficient" | "basic" | "moderate" | "strong";
  evidence: string[];
  concerns: string[];
};

export type WorkSampleAnalysis = {
  requirement_understanding: WorkSampleAnalysisSection;
  mvp_prioritization: WorkSampleAnalysisSection;
  technical_structuring: WorkSampleAnalysisSection;
  risk_communication: WorkSampleAnalysisSection;
  handover_readiness: WorkSampleAnalysisSection;
};
