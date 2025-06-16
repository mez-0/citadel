export interface Task {
  _id: {
    $oid: string;
  };
  uuid: string;
  task_status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'RUNNING';
  time_sent: number;
  time_sent_str: string;
  time_updated_str: string;
  time_updated: number;
  file_sha256: string;
  file_name: string;
  enable_static_analysis: boolean;
  enable_dynamic_analysis: boolean;
  enable_thorough_defender: boolean;
  amsi_result: string;
  defender_result: string;
  threat_names: string[];
  zero_x_malicious_bytes?: MaliciousBytes;
  x_y_malicious_bytes?: MaliciousBytes;
  thorough_malicious_bytes: unknown[];
  function_mappings: FunctionMapping[];
  capa_reports: CapaReport[];
  similar_tlsh_hashes: SimilarHash[];
  yara_matches: unknown[];
}

export interface FunctionMapping {
  dll: string;
  function: string;
  description: string;
  category: string;
}

export interface SimilarHash {
  tlsh: string;
  sha256: string;
  distance: number;
}

// CAPA Report interfaces matching Python models
export interface MitreTechnique {
  parts: string[];
  tactic: string;
  technique: string;
  subtechnique: string;
  tid: string;
}

export interface MalwareBehaviourCatalog {
  parts: string[];
  objective: string;
  behavior: string;
  method: string;
  mid: string;
}

export interface CapaReport {
  name: string;
  namespace: string;
  description: string;
  mitre_techniques: MitreTechnique[];
  malware_behaviour_catalogs: MalwareBehaviourCatalog[];
  references: string[];
  rule: string;
}

export interface EmberResult {
  file_path: string;
  score: number;
  prediction: string;
  model_name: string;
}

// Dashboard aggregated data types
export interface ThreatData {
  name: string;
  value: number;
  color: string;
}

export interface DefenderData {
  status: string;
  count: number;
}

export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  failedTasks: number;
  threatsDetected: number;
  cleanFiles: number;
}

// Add new interface for malicious bytes data
export interface MaliciousBytes {
  base64_bytes: string;
  ascii_byte_representation: string;
  entropy: number;
} 