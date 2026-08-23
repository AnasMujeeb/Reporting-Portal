
const RISK_MATRIX = {
  "5A": "Red",
  "5B": "Red",
  "5C": "Red",
  "5D": "Orange",
  "5E": "Orange",
  "4A": "Red",
  "4B": "Red",
  "4C": "Orange",
  "4D": "Orange",
  "4E": "Orange",
  "3A": "Red",
  "3B": "Orange",
  "3C": "Orange",
  "3D": "Orange",
  "3E": "Green",
  "2A": "Orange",
  "2B": "Orange",
  "2C": "Orange",
  "2D": "Green",
  "2E": "Green",
  "1A": "Orange",
  "1B": "Green",
  "1C": "Green",
  "1D": "Green",
  "1E": "Green",
};

const REVIEW_RISK_MAP = {
  Red: "Red",
  Orange: "Yellow",
  Green: "Green",
};

function normalizeInputs(probability, severity) {
  if (probability == null || severity == null) return null;

  const prob = Number(probability);
  const sev = String(severity).toUpperCase();

  if (![1, 2, 3, 4, 5].includes(prob)) return null;
  if (!["A", "B", "C", "D", "E"].includes(sev)) return null;

  return { prob, sev };
}

export function calculateRiskLevel(probability, severity) {
  const inputs = normalizeInputs(probability, severity);
  if (!inputs) return null;

  const key = `${inputs.prob}${inputs.sev}`;
  return RISK_MATRIX[key] || null;
}

export function getMatrixCode(probability, severity) {
  const inputs = normalizeInputs(probability, severity);
  if (!inputs) return null;

  return `${inputs.prob}${inputs.sev}`;
}

export function getRiskDetails(probability, severity) {
  const inputs = normalizeInputs(probability, severity);
  if (!inputs) return null;

  const matrixCode = `${inputs.prob}${inputs.sev}`;
  const rawLevel = RISK_MATRIX[matrixCode];
  if (!rawLevel) return null;

  return {
    matrixCode,
    rawLevel,
    riskLevel: REVIEW_RISK_MAP[rawLevel],
  };
}
