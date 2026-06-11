/**
 * ICAO Standard 5x5 Aviation Safety Risk Matrix
 *
 * Probability (rows):  5=Frequent, 4=Occasional, 3=Remote, 2=Improbable, 1=Extremely Improbable
 * Severity (columns):  A=Catastrophic, B=Hazardous, C=Major, D=Minor, E=Negligible
 *
 * Risk Levels:
 *   Red    — High Risk / Unacceptable (immediate action required)
 *   Orange — Medium Risk / Tolerable  (mitigation + review)
 *   Green  — Low Risk / Acceptable    (log as safe)
 */

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

/**
 * Calculate the ICAO risk level from probability and severity.
 * @param {number} probability - Integer 1-5
 * @param {string} severity    - One of 'A','B','C','D','E'
 * @returns {string|null}      - 'Red', 'Orange', 'Green', or null if inputs are invalid
 */
export function calculateRiskLevel(probability, severity) {
  if (
    probability == null ||
    severity == null ||
    ![1, 2, 3, 4, 5].includes(Number(probability)) ||
    !["A", "B", "C", "D", "E"].includes(String(severity).toUpperCase())
  ) {
    return null;
  }

  const key = `${Number(probability)}${String(severity).toUpperCase()}`;
  return RISK_MATRIX[key] || null;
}
