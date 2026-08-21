export type CategoryItem = {
  id: string;
  label: string;
  icon: string;
  color: string;
};

export const INCIDENT_CATEGORIES: CategoryItem[] = [
  { id: 'harassment', label: 'Harassment', icon: 'user-slash', color: '#EC4899' },
  { id: 'stalking', label: 'Stalking', icon: 'user-secret', color: '#D97706' },
  { id: 'suspicious', label: 'Suspicious Activity', icon: 'eye', color: '#8B5CF6' },
  { id: 'unsafe_area', label: 'Unsafe Area', icon: 'map-marked-alt', color: '#EF4444' },
  { id: 'poor_lighting', label: 'Poor Lighting', icon: 'lightbulb', color: '#6366F1' },
  { id: 'physical_threat', label: 'Physical Threat', icon: 'fist-raised', color: '#DC2626' },
  { id: 'verbal_abuse', label: 'Verbal Abuse', icon: 'comments', color: '#F59E0B' },
  { id: 'sexual_harassment', label: 'Sexual Harassment', icon: 'hand-paper', color: '#E11D48' },
  { id: 'violence', label: 'Violence', icon: 'shield-virus', color: '#B91C1C' },
  { id: 'other', label: 'Other', icon: 'question-circle', color: '#6B7280' },
];
