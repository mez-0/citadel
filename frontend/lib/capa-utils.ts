import { CapaReport, MitreTechnique, MalwareBehaviourCatalog } from './types';

// Helper functions to safely parse CAPA data
export const parseCapaReport = (report: any): CapaReport => {
  return {
    name: typeof report.name === 'string' ? report.name : String(report.name || 'Unnamed Capability'),
    namespace: typeof report.namespace === 'string' ? report.namespace : String(report.namespace || ''),
    description: typeof report.description === 'string' ? report.description : String(report.description || ''),
    mitre_techniques: Array.isArray(report.mitre_techniques) ? report.mitre_techniques.map(parseMitreTechnique) : [],
    malware_behaviour_catalogs: Array.isArray(report.malware_behaviour_catalogs) ? report.malware_behaviour_catalogs.map(parseMalwareBehaviourCatalog) : [],
    references: Array.isArray(report.references) ? report.references.map((ref: any) => typeof ref === 'string' ? ref : String(ref)) : [],
    rule: typeof report.rule === 'string' ? report.rule : String(report.rule || '')
  };
};

export const parseMitreTechnique = (technique: any): MitreTechnique => {
  return {
    parts: Array.isArray(technique.parts) ? technique.parts.map((p: any) => String(p)) : [],
    tactic: typeof technique.tactic === 'string' ? technique.tactic : String(technique.tactic || ''),
    technique: typeof technique.technique === 'string' ? technique.technique : String(technique.technique || ''),
    subtechnique: typeof technique.subtechnique === 'string' ? technique.subtechnique : String(technique.subtechnique || ''),
    tid: typeof technique.tid === 'string' ? technique.tid : String(technique.tid || '')
  };
};

export const parseMalwareBehaviourCatalog = (mbc: any): MalwareBehaviourCatalog => {
  return {
    parts: Array.isArray(mbc.parts) ? mbc.parts.map((p: any) => String(p)) : [],
    objective: typeof mbc.objective === 'string' ? mbc.objective : String(mbc.objective || ''),
    behavior: typeof mbc.behavior === 'string' ? mbc.behavior : String(mbc.behavior || ''),
    method: typeof mbc.method === 'string' ? mbc.method : String(mbc.method || ''),
    mid: typeof mbc.mid === 'string' ? mbc.mid : String(mbc.mid || '')
  };
};

export const formatMitreTechnique = (technique: MitreTechnique): string => {
  const parts = [];
  if (technique.tid) parts.push(technique.tid);
  if (technique.technique) parts.push(technique.technique);
  if (technique.subtechnique) parts.push(technique.subtechnique);
  return parts.length > 0 ? parts.join(' - ') : 'Unknown Technique';
};

// Helper for dynamic grid height calculation
export const getGridHeight = (rowCount: number, rowHeight = 44, headerHeight = 48, pagination = false) => {
  if (pagination && rowCount > 10) {
    return rowHeight * 10 + headerHeight + 56; // 56px for pagination controls
  }
  return rowHeight * Math.max(rowCount, 1) + headerHeight;
}; 