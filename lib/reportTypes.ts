export type ReportLevel = "insufficient" | "basic" | "moderate" | "strong";

export type ReportEvidenceSection = {
  level: ReportLevel;
  evidence: string[];
  concerns: string[];
};

export type CandidateAnalysisReport = {
  candidate_summary: {
    name_or_nickname: string;
    headline: string;
    overall_observation: string;
  };
  verified_experience: {
    tech_stack: string[];
    project_count: number;
    deployment_experience: string;
    fullstack_scope: string;
    collaboration_evidence: string;
  };
  technical_fit: {
    frontend: ReportEvidenceSection;
    backend_api: ReportEvidenceSection;
    database: ReportEvidenceSection;
    deployment_operations: ReportEvidenceSection;
  };
  mvp_execution_fit: {
    requirement_breakdown: string;
    prioritization: string;
    completion_evidence: string;
    risk: string;
  };
  non_developer_collaboration_fit: {
    communication_clarity: string;
    requirement_change_response: string;
    progress_sharing: string;
    handover_readiness: string;
  };
  best_fit_project_types: string[];
  potential_risks: string[];
  missing_information: string[];
  recommended_follow_up_questions: string[];
  report_meta: {
    generated_at: string;
    source_submission_id: string;
    ai_generated: false;
  };
};
