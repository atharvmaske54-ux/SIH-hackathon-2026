import { IncidentReport } from '../context/AppContext';

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface AreaRiskAnalysis {
  location: string;
  collegeName?: string;
  campusName?: string;
  latitude: number;
  longitude: number;
  incidentCount: number;
  riskScore: number; // 0 - 100
  riskLevel: RiskLevel;
  primaryCategory: string;
  reasons: string[];
  hasPattern: boolean;
  recentCount24h: number;
  nightCount: number;
  reports: IncidentReport[];
}

export function computeAreaRiskAnalysis(reports: IncidentReport[]): AreaRiskAnalysis[] {
  const grouped: { [key: string]: IncidentReport[] } = {};

  reports.forEach(r => {
    const locKey = (r.location || 'General Campus').trim();
    if (!grouped[locKey]) grouped[locKey] = [];
    grouped[locKey].push(r);
  });

  const nowTime = Date.now();

  const results: AreaRiskAnalysis[] = Object.keys(grouped).map(locKey => {
    const cluster = grouped[locKey];
    const count = cluster.length;

    let baseScore = 0;
    let recentCount24h = 0;
    let nightCount = 0;
    const categoryCounts: { [cat: string]: number } = {};
    const reasons: string[] = [];

    cluster.forEach(r => {
      // 1. Category Base Points
      const typeLower = r.type.toLowerCase();
      let itemScore = 15;

      if (
        typeLower.includes('threat') ||
        typeLower.includes('sexual') ||
        typeLower.includes('violence') ||
        typeLower.includes('harassment')
      ) {
        itemScore = 30;
      } else if (
        typeLower.includes('stalking') ||
        typeLower.includes('suspicious') ||
        typeLower.includes('unsafe')
      ) {
        itemScore = 20;
      } else if (typeLower.includes('lighting') || typeLower.includes('verbal')) {
        itemScore = 12;
      }

      // 2. Recency Analysis (last 24 hours vs 7 days vs older)
      const reportDate = new Date(r.createdAt || r.dateTime || Date.now()).getTime();
      const ageHours = (nowTime - reportDate) / (1000 * 60 * 60);

      if (ageHours <= 24) {
        recentCount24h += 1;
        itemScore *= 1.4;
      } else if (ageHours <= 24 * 7) {
        itemScore *= 1.1;
      } else {
        itemScore *= 0.8;
      }

      // 3. Time-of-Day Risk Analysis (Night time 18:00 - 05:00)
      const hour = new Date(reportDate).getHours();
      if (hour >= 18 || hour < 5) {
        nightCount += 1;
        itemScore *= 1.25;
      }

      categoryCounts[r.type] = (categoryCounts[r.type] || 0) + 1;
      baseScore += itemScore;
    });

    // 4. Repeated-Incident Pattern Multiplier
    const hasPattern = count >= 2;
    let patternMultiplier = 1.0;
    if (count === 2) patternMultiplier = 1.35;
    else if (count >= 3) patternMultiplier = 1.75;

    let finalScore = Math.min(100, Math.round(baseScore * patternMultiplier));

    // Formulate Clear Explanations / Reasons for Risk Score
    if (count >= 3) {
      reasons.push(`Pattern Detected: ${count} repeated incident reports in close proximity.`);
    } else if (count === 2) {
      reasons.push(`Repeated Incident Pattern: 2 reports logged in this location.`);
    } else {
      reasons.push(`Single incident report registered in this location.`);
    }

    if (recentCount24h > 0) {
      reasons.push(`Recency Surge: ${recentCount24h} report(s) submitted within the last 24 hours.`);
    }

    if (nightCount > 0) {
      reasons.push(`Night-time Risk: ${nightCount} incident(s) reported during evening/night hours (6 PM - 5 AM).`);
    }

    // Determine primary category
    const topCategory =
      Object.keys(categoryCounts).sort((a, b) => categoryCounts[b] - categoryCounts[a])[0] || 'General Incident';

    if (
      topCategory.toLowerCase().includes('harassment') ||
      topCategory.toLowerCase().includes('threat') ||
      topCategory.toLowerCase().includes('violence')
    ) {
      reasons.push(`High Severity Category: Includes ${topCategory}.`);
    }

    // 5. Classify Risk Level: Low (0-29), Medium (30-59), High (60-84), Critical (85-100)
    let riskLevel: RiskLevel = 'Low';
    if (finalScore >= 85 || (count >= 3 && recentCount24h >= 1)) {
      riskLevel = 'Critical';
    } else if (finalScore >= 60 || count >= 2) {
      riskLevel = 'High';
    } else if (finalScore >= 30) {
      riskLevel = 'Medium';
    }

    // Coordinates and college/campus meta
    const firstWithCoords = cluster.find(r => r.latitude && r.longitude);
    const lat = firstWithCoords?.latitude || 19.0486;
    const lon = firstWithCoords?.longitude || 72.9393;

    return {
      location: locKey,
      collegeName: cluster[0].collegeName,
      campusName: cluster[0].campusName,
      latitude: lat,
      longitude: lon,
      incidentCount: count,
      riskScore: finalScore,
      riskLevel,
      primaryCategory: topCategory,
      reasons,
      hasPattern,
      recentCount24h,
      nightCount,
      reports: cluster,
    };
  });

  return results.sort((a, b) => b.riskScore - a.riskScore);
}

export function getRiskLevelColor(level: RiskLevel): { color: string; bg: string; border: string } {
  switch (level) {
    case 'Critical':
      return { color: '#DC2626', bg: '#FEE2E2', border: '#EF4444' };
    case 'High':
      return { color: '#EA580C', bg: '#FFEDD5', border: '#F97316' };
    case 'Medium':
      return { color: '#D97706', bg: '#FEF3C7', border: '#F59E0B' };
    case 'Low':
    default:
      return { color: '#16A34A', bg: '#DCFCE7', border: '#22C55E' };
  }
}
