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

// Add new interfaces for task summary page
export interface Section {
  name: string;
  size: number;
  vsize: number;
  perm: string;
  flags: number;
  paddr: number;
  vaddr: number;
}

export interface Import {
  ordinal: number;
  bind: string;
  type: string;
  name: string;
  libname: string;
  plt: number;
}

export interface Function {
  offset: number;
  name: string;
  size: number;
  type: string;
  cost: number;
  cc: number;
  bits: number;
  nbbs: number;
  ninstrs: number;
}

export interface TaskInfo {
  fileName: string;
  status: string;
  amsiResult: string;
  defenderResult: string;
  yara: number;
  timeSent: string;
  timeUpdated: string;
}

export interface PayloadData {
  file_name: string;
  file_size?: number;
  file_type?: string;
  timestamp?: string;
  entropy?: number;
  sha256?: string;
  tlsh?: string;
  architecture?: string;
  signed?: boolean;
  internal_name?: string;
  sections?: Section[];
  imports?: Import[];
  functions?: Function[];
  exports?: unknown[];
  task?: TaskInfo;
  // Fields from tasks collection
  uuid?: string;
  task_status?: string;
  time_sent?: string | number;
  time_sent_str?: string;
  time_updated?: string | number;
  time_updated_str?: string;
  file_sha256?: string;
  enable_static_analysis?: boolean;
  enable_dynamic_analysis?: boolean;
  enable_thorough_defender?: boolean;
  amsi_result?: string;
  defender_result?: string;
  threat_names?: unknown[];
  zero_x_malicious_bytes?: MaliciousBytes;
  x_y_malicious_bytes?: MaliciousBytes;
  thorough_malicious_bytes?: unknown[];
  function_mappings?: unknown[];
  capa_reports?: unknown[];
  similar_tlsh_hashes?: unknown[];
  yara_matches?: unknown[];
  ember_result?: EmberResult;
  // Add missing fields for technical details
  entrypoint?: unknown[];
  certificates?: unknown[];
  optional_headers?: unknown[];
  compilers?: unknown[];
  libraries?: unknown[];
  linkers?: unknown[];
  packers?: unknown[];
  sign_tools?: unknown[];
  tools?: unknown[];
}

export interface SectionDataItem {
  name: string;
  size: number;
  vsize: number;
  permissions: string;
}

export interface SimilarTLSHHash {
  tlsh: string;
  sha256: string;
  distance: number;
}

export interface RawFunctionMapping {
  dll: string;
  function: string;
  description: string;
  category: string;
} 