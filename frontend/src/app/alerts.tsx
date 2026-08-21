import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { Colors } from '../constants/Colors';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppContext } from '../context/AppContext';
import { INCIDENT_CATEGORIES } from '../constants/Categories';
import { hasPermission } from '../utils/rbac';
import { computeAreaRiskAnalysis, getRiskLevelColor } from '../utils/riskDetection';

export type AlertTypeKind =
  | 'new_incident'
  | 'high_risk_area'
  | 'temporary_danger'
  | 'campus_announcement'
  | 'safety_advisory';

export type CommunityAlertItem = {
  id: string;
  alertType: AlertTypeKind;
  title: string;
  category: string;
  desc: string;
  confidence: 'Verified Event' | 'High Confidence Cluster' | 'Official Announcement' | 'High Confidence Community';
  type: 'danger' | 'warning' | 'info' | 'safe';
  time: string;
  isCommunity?: boolean;
  isAnonymous?: boolean;
  reporterName?: string;
  collegeId?: string;
  collegeName?: string;
  campusName?: string;
  read?: boolean;
  location?: string;
  reportId?: string;
  riskScore?: number;
};

// Default Official Campus Announcements & Advisories
const OFFICIAL_SAFETY_BROADCASTS: CommunityAlertItem[] = [
  {
    id: 'ANNC-101',
    alertType: 'campus_announcement',
    title: '📢 Night Escort Safety Patrol Active',
    category: 'Campus Announcement',
    desc: 'Campus security mobile patrols are active across Fort & Powai campuses between 8 PM and 4 AM. Call campus emergency desk or tap SOS.',
    confidence: 'Official Announcement',
    type: 'info',
    time: '30 mins ago',
    collegeId: 'col-uom',
    collegeName: 'University of Mumbai',
    campusName: 'Fort Campus',
    read: false,
  },
  {
    id: 'ANNC-102',
    alertType: 'safety_advisory',
    title: '🛡️ Safety Advisory: Use Guarded SafeRoute',
    category: 'Safety Advisory',
    desc: 'Due to ongoing streetlight maintenance near Hostel 3 lane, students are advised to use the Guarded SafeRoute via Main Promenade.',
    confidence: 'Official Announcement',
    type: 'safe',
    time: '2 hours ago',
    collegeId: 'col-iitb',
    collegeName: 'IIT Bombay',
    campusName: 'Powai Main Campus',
    read: false,
  },
  {
    id: 'ANNC-103',
    alertType: 'temporary_danger',
    title: '⚠️ Temporary Hazard: Power Outage at South Exit',
    category: 'Temporary Danger',
    desc: 'Temporary power outage reported at South Gate exit. Emergency floodlights deployed by electrical squad.',
    confidence: 'Verified Event',
    type: 'danger',
    time: '4 hours ago',
    collegeId: 'col-vjti',
    collegeName: 'VJTI Mumbai',
    campusName: 'Matunga Main Campus',
    read: false,
  },
  {
    id: 'ANNC-104',
    alertType: 'safety_advisory',
    title: '🛡️ Companion Check-In Recommended After 10 PM',
    category: 'Safety Advisory',
    desc: 'Active safety advisories in effect. Enable SafeRoute Companion Check-in when walking alone after hours.',
    confidence: 'Official Announcement',
    type: 'info',
    time: '6 hours ago',
    read: false,
  },
];

export default function AlertsScreen() {
  const styles = getStyles();
  const router = useRouter();
  const { reports, colleges, user } = useAppContext();

  // Filter States
  const [selectedAlertType, setSelectedAlertType] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCollegeFilter, setSelectedCollegeFilter] = useState<string>('all');
  const [showAnalytics, setShowAnalytics] = useState<boolean>(false);
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState<boolean>(false);
  const [readAlertIds, setReadAlertIds] = useState<{ [id: string]: boolean }>({});

  // Compute Area Risk Patterns
  const areaRiskAnalyses = useMemo(() => computeAreaRiskAnalysis(reports), [reports]);
  const highRiskAreas = useMemo(
    () => areaRiskAnalyses.filter(a => a.riskLevel === 'Critical' || a.riskLevel === 'High'),
    [areaRiskAnalyses]
  );

  // Generate High-Risk Area Alerts dynamically
  const generatedRiskAlerts: CommunityAlertItem[] = useMemo(() => {
    return highRiskAreas.map((area, idx) => ({
      id: `ALERT-RISK-${idx}`,
      alertType: 'high_risk_area',
      title: `🚨 High-Risk Area Detected: ${area.location}`,
      category: 'High-Risk Area',
      desc: `Area Risk Score: ${area.riskScore}/100 (${area.riskLevel} Level).\nReason: ${area.reasons.join(' • ')}`,
      confidence: 'High Confidence Cluster',
      type: 'danger',
      time: 'Real-Time Detection',
      collegeName: area.collegeName,
      read: false,
      riskScore: area.riskScore,
      location: area.location,
    }));
  }, [highRiskAreas]);

  // Generate High-Confidence / Verified Incident Alerts dynamically
  const generatedIncidentAlerts: CommunityAlertItem[] = useMemo(() => {
    return reports
      .filter(r => {
        // High Confidence Verification Filter Requirement:
        // Only trigger alerts for verified reports OR high severity/repeat categories
        const isVerifiedOrResolved = r.status === 'Verified' || r.status === 'Resolved' || (r.workflowStage && ['Verified', 'Action Taken', 'Resolved'].includes(r.workflowStage));
        const isHighSeverityCategory = ['Harassment', 'Stalking', 'Physical Threat', 'Violence', 'Sexual Harassment'].includes(r.type);
        return isVerifiedOrResolved || isHighSeverityCategory;
      })
      .map(r => {
        const isVerified = r.status === 'Verified' || r.status === 'Resolved' || (r.workflowStage && ['Verified', 'Action Taken', 'Resolved'].includes(r.workflowStage));
        const isTempDanger = r.type.includes('Lighting') || r.type.includes('Unsafe') || r.type.includes('Suspicious');

        return {
          id: `ALERT-INC-${r.id}`,
          alertType: isTempDanger ? 'temporary_danger' : 'new_incident',
          title: `${isVerified ? '🟢 Verified Alert' : '⚡ High Confidence Alert'}: ${r.type}`,
          category: r.type,
          desc: `${r.description}\n📍 Location: ${r.location}${r.assignedPersonOrTeam ? `\n🛡️ Response Unit: ${r.assignedPersonOrTeam}` : ''}`,
          confidence: isVerified ? 'Verified Event' : 'High Confidence Community',
          type: isVerified ? 'danger' : 'warning',
          time: r.dateTime || 'Just now',
          isCommunity: true,
          isAnonymous: r.isAnonymous !== false,
          reporterName: r.isAnonymous !== false ? 'Anonymous Citizen' : (r.reporterName || 'Public Identity'),
          collegeId: r.collegeId,
          collegeName: r.collegeName,
          campusName: r.campusName,
          read: false,
          reportId: r.id,
          location: r.location,
        };
      });
  }, [reports]);

  // Combined Master Alert Center List
  const allMasterAlerts: CommunityAlertItem[] = useMemo(() => {
    return [...generatedRiskAlerts, ...generatedIncidentAlerts, ...OFFICIAL_SAFETY_BROADCASTS];
  }, [generatedRiskAlerts, generatedIncidentAlerts]);

  // Filtered Alerts
  const filteredAlerts = useMemo(() => {
    return allMasterAlerts.filter(a => {
      const matchesAlertType = selectedAlertType === 'all' || a.alertType === selectedAlertType;

      const matchesCategory = selectedCategory === 'all' ||
        a.category.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        selectedCategory.toLowerCase().includes(a.category.toLowerCase());

      const matchesCollege = selectedCollegeFilter === 'all' || a.collegeId === selectedCollegeFilter;

      return matchesAlertType && matchesCategory && matchesCollege;
    });
  }, [allMasterAlerts, selectedAlertType, selectedCategory, selectedCollegeFilter]);

  // Unread Alert Count
  const unreadCount = useMemo(() => {
    return allMasterAlerts.filter(a => !readAlertIds[a.id]).length;
  }, [allMasterAlerts, readAlertIds]);

  const markAllAsRead = () => {
    const updated: { [id: string]: boolean } = {};
    allMasterAlerts.forEach(a => { updated[a.id] = true; });
    setReadAlertIds(updated);
  };

  const toggleReadAlert = (id: string) => {
    setReadAlertIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Category Analytics Calculations
  const categoryCounts: { [key: string]: number } = {};
  INCIDENT_CATEGORIES.forEach(cat => {
    categoryCounts[cat.label] = 0;
  });
  allMasterAlerts.forEach(a => {
    const matched = INCIDENT_CATEGORIES.find(c => c.label.toLowerCase() === a.category.toLowerCase());
    if (matched) {
      categoryCounts[matched.label] = (categoryCounts[matched.label] || 0) + 1;
    }
  });

  return (
    <View style={styles.container}>
      {/* Top Banner with Report Button & Notification Center Icon */}
      <View style={styles.headerBanner}>
        <View style={{ flex: 1 }}>
          <Text style={styles.bannerTitle}>Community Safety & Alerts</Text>
          <Text style={styles.bannerSub}>High-confidence verified risk intelligence</Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
          {/* Notification Center Bell Trigger */}
          <TouchableOpacity
            style={styles.bellBtn}
            onPress={() => setIsNotificationCenterOpen(true)}
          >
            <FontAwesome5 name="bell" size={16} color={Colors.primary} />
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.reportBtn, { backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.border }]}
            onPress={() => router.push('/authority-dashboard' as any)}
          >
            <FontAwesome5 name="user-shield" size={11} color={Colors.primary} style={{ marginRight: 4 }} />
            <Text style={[styles.reportBtnText, { color: Colors.primary }]}>Portal</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.reportBtn} onPress={() => router.push('/report-incident' as any)}>
            <FontAwesome5 name="plus" size={11} color={Colors.white} style={{ marginRight: 4 }} />
            <Text style={styles.reportBtnText}>Report</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* DETECTED COMMUNITY RISK PATTERNS BANNER */}
      {highRiskAreas.length > 0 && (
        <View style={styles.riskBannerCard}>
          <View style={styles.riskBannerHeader}>
            <FontAwesome5 name="shield-virus" size={16} color="#DC2626" style={{ marginRight: 8 }} />
            <Text style={styles.riskBannerTitle}>🚨 Detected High Risk Patterns ({highRiskAreas.length} Areas)</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            {highRiskAreas.map((area, idx) => {
              const styleInfo = getRiskLevelColor(area.riskLevel);
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.riskAreaChip, { borderColor: styleInfo.border, backgroundColor: styleInfo.bg }]}
                  onPress={() => router.push('/(tabs)/map' as any)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                    <Text style={[styles.riskAreaChipLoc, { color: styleInfo.color }]}>📍 {area.location}</Text>
                    <View style={[styles.riskScoreBadge, { backgroundColor: styleInfo.color }]}>
                      <Text style={styles.riskScoreBadgeText}>{area.riskScore}/100</Text>
                    </View>
                  </View>
                  <Text style={styles.riskAreaReason} numberOfLines={1}>
                    {area.reasons[0] || 'Pattern Detected'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* 5 ALERT TYPE FILTERS BAR */}
      <View style={styles.alertTypeFilterBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingHorizontal: 12 }}>
          {(
            [
              { id: 'all', label: 'All Alerts', icon: 'bell' },
              { id: 'new_incident', label: '🚨 New Incidents', icon: 'exclamation-triangle' },
              { id: 'high_risk_area', label: '📍 High-Risk Areas', icon: 'fire' },
              { id: 'temporary_danger', label: '⚠️ Temporary Hazards', icon: 'bolt' },
              { id: 'campus_announcement', label: '📢 Announcements', icon: 'bullhorn' },
              { id: 'safety_advisory', label: '🛡️ Safety Advisories', icon: 'shield-alt' },
            ] as const
          ).map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.alertTypeChip, selectedAlertType === tab.id && styles.alertTypeChipActive]}
              onPress={() => setSelectedAlertType(tab.id)}
            >
              <Text style={[styles.alertTypeChipText, selectedAlertType === tab.id && styles.alertTypeChipTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* University / College Filter Bar */}
      <View style={styles.collegeFilterBar}>
        <Text style={styles.filterTitle}>Campus Scope:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.collegeChipFilter, selectedCollegeFilter === 'all' && styles.collegeChipFilterActive]}
            onPress={() => setSelectedCollegeFilter('all')}
          >
            <FontAwesome5 name="university" size={11} color={selectedCollegeFilter === 'all' ? Colors.white : Colors.textSecondary} style={{ marginRight: 5 }} />
            <Text style={[styles.collegeChipFilterText, selectedCollegeFilter === 'all' && styles.collegeChipFilterTextActive]}>
              All Institutions
            </Text>
          </TouchableOpacity>

          {colleges.map(col => {
            const isSelected = selectedCollegeFilter === col.id;
            const count = allMasterAlerts.filter(a => a.collegeId === col.id).length;
            return (
              <TouchableOpacity
                key={col.id}
                style={[
                  styles.collegeChipFilter,
                  isSelected && { backgroundColor: col.color, borderColor: col.color }
                ]}
                onPress={() => setSelectedCollegeFilter(col.id)}
              >
                <FontAwesome5 name={col.icon} size={11} color={isSelected ? Colors.white : col.color} style={{ marginRight: 5 }} />
                <Text style={[styles.collegeChipFilterText, isSelected && { color: Colors.white, fontWeight: 'bold' }]}>
                  {col.shortName} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Category Filter Bar Header */}
      <View style={styles.filterSection}>
        <View style={styles.filterHeaderRow}>
          <Text style={styles.filterTitle}>Category Filter:</Text>
          <TouchableOpacity
            style={styles.analyticsToggleBtn}
            onPress={() => setShowAnalytics(!showAnalytics)}
          >
            <FontAwesome5 name="chart-pie" size={12} color={Colors.primary} style={{ marginRight: 5 }} />
            <Text style={styles.analyticsToggleText}>{showAnalytics ? 'Hide Analytics' : 'Category Analytics'}</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <TouchableOpacity
            style={[styles.filterChip, selectedCategory === 'all' && styles.filterChipActive]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text style={[styles.filterChipText, selectedCategory === 'all' && styles.filterChipTextActive]}>
              All Categories ({allMasterAlerts.length})
            </Text>
          </TouchableOpacity>

          {INCIDENT_CATEGORIES.map(cat => {
            const count = categoryCounts[cat.label] || 0;
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.filterChip,
                  isSelected && { backgroundColor: cat.color, borderColor: cat.color }
                ]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <FontAwesome5
                  name={cat.icon}
                  size={12}
                  color={isSelected ? Colors.white : cat.color}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.filterChipText, isSelected && { color: Colors.white, fontWeight: 'bold' }]}>
                  {cat.label} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Optional Category Analytics Summary Card */}
      {showAnalytics && (
        <View style={styles.analyticsCard}>
          <View style={styles.analyticsHeader}>
            <FontAwesome5 name="chart-bar" size={16} color={Colors.primary} style={{ marginRight: 8 }} />
            <Text style={styles.analyticsTitle}>Incident Categories Analytics</Text>
          </View>
          <Text style={styles.analyticsSub}>Breakdown of community reports across safety categories</Text>

          <View style={styles.analyticsGrid}>
            {INCIDENT_CATEGORIES.map(cat => {
              const count = categoryCounts[cat.label] || 0;
              const percentage = allMasterAlerts.length > 0 ? Math.round((count / allMasterAlerts.length) * 100) : 0;
              return (
                <View key={cat.id} style={styles.analyticsItem}>
                  <View style={styles.analyticsItemHeader}>
                    <FontAwesome5 name={cat.icon} size={12} color={cat.color} style={{ marginRight: 6 }} />
                    <Text style={styles.analyticsItemLabel} numberOfLines={1}>{cat.label}</Text>
                    <Text style={styles.analyticsItemCount}>{count}</Text>
                  </View>
                  <View style={styles.progressBarTrack}>
                    <View style={[styles.progressBarFill, { width: `${percentage}%`, backgroundColor: cat.color }]} />
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Filtered Master Alert Feed */}
      <FlatList
        data={filteredAlerts}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={() => (
          <View style={styles.emptyBox}>
            <FontAwesome5 name="info-circle" size={32} color={Colors.textSecondary} style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>No Safety Alerts Found</Text>
            <Text style={styles.emptySub}>No alerts match the selected alert type or category filters.</Text>
          </View>
        )}
        renderItem={({ item }: { item: CommunityAlertItem }) => {
          const isRead = readAlertIds[item.id];
          return (
            <View style={[styles.alertCard, isRead && { opacity: 0.75 }]}>
              <View style={[
                styles.iconBox,
                item.alertType === 'high_risk_area' || item.type === 'danger' ? styles.iconDanger :
                item.alertType === 'temporary_danger' || item.type === 'warning' ? styles.iconWarning :
                item.alertType === 'safety_advisory' ? styles.iconSafe : styles.iconInfo
              ]}>
                <FontAwesome5
                  name={
                    item.alertType === 'high_risk_area' ? 'fire' :
                    item.alertType === 'temporary_danger' ? 'bolt' :
                    item.alertType === 'campus_announcement' ? 'bullhorn' :
                    item.alertType === 'safety_advisory' ? 'shield-alt' : 'exclamation-triangle'
                  }
                  size={18}
                  color={
                    item.alertType === 'high_risk_area' || item.type === 'danger' ? Colors.danger :
                    item.alertType === 'temporary_danger' || item.type === 'warning' ? Colors.medium :
                    item.alertType === 'safety_advisory' ? Colors.safe : Colors.primary
                  }
                />
              </View>

              <View style={styles.alertInfo}>
                <View style={styles.titleRow}>
                  <Text style={styles.alertTitle}>{item.title}</Text>

                  {/* Confidence Badge */}
                  <View style={[
                    styles.confidenceBadge,
                    item.confidence === 'Verified Event' ? styles.confBadgeVerified :
                    item.confidence === 'Official Announcement' ? styles.confBadgeOfficial : styles.confBadgeCluster
                  ]}>
                    <Text style={styles.confBadgeText}>{item.confidence}</Text>
                  </View>
                </View>

                {item.collegeName && (
                  <View style={styles.collegeFeedBadge}>
                    <FontAwesome5 name="graduation-cap" size={10} color={Colors.primary} style={{ marginRight: 5 }} />
                    <Text style={styles.collegeFeedBadgeText}>
                      {item.collegeName} {item.campusName ? `(${item.campusName})` : ''}
                    </Text>
                  </View>
                )}

                <Text style={styles.alertDesc}>{item.desc}</Text>

                <View style={styles.metaRow}>
                  {item.isCommunity && (
                    <Text style={styles.reporterText}>
                      👤 By: <Text style={{ fontWeight: 'bold', color: item.isAnonymous ? Colors.primary : Colors.text }}>{item.reporterName}</Text>
                    </Text>
                  )}
                  <Text style={styles.alertTime}>{item.time}</Text>
                </View>

                {/* Card Interactive Actions */}
                <View style={styles.cardActionsRow}>
                  {item.location && (
                    <TouchableOpacity
                      style={styles.cardActionBtn}
                      onPress={() => router.push('/(tabs)/map' as any)}
                    >
                      <FontAwesome5 name="map-marked-alt" size={10} color={Colors.primary} style={{ marginRight: 4 }} />
                      <Text style={styles.cardActionBtnText}>View on Map</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.cardActionBtn, isRead && { backgroundColor: Colors.background }]}
                    onPress={() => toggleReadAlert(item.id)}
                  >
                    <FontAwesome5 name={isRead ? 'check-double' : 'check'} size={10} color={isRead ? Colors.safe : Colors.textSecondary} style={{ marginRight: 4 }} />
                    <Text style={[styles.cardActionBtnText, isRead && { color: Colors.safe }]}>
                      {isRead ? 'Acknowledged' : 'Dismiss'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        }}
      />

      {/* DEDICATED NOTIFICATION CENTER MODAL */}
      {isNotificationCenterOpen && (
        <Modal
          visible={isNotificationCenterOpen}
          transparent
          animationType="slide"
          onRequestClose={() => setIsNotificationCenterOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <FontAwesome5 name="bell" size={18} color={Colors.primary} style={{ marginRight: 8 }} />
                  <View>
                    <Text style={styles.modalTitle}>Community Notification Center</Text>
                    <Text style={styles.modalSub}>{unreadCount} unread verified safety alerts</Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setIsNotificationCenterOpen(false)}>
                  <FontAwesome5 name="times-circle" size={22} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Notification Center Quick Actions Bar */}
              <View style={styles.modalQuickActionsBar}>
                <TouchableOpacity style={styles.quickActionBtn} onPress={markAllAsRead}>
                  <FontAwesome5 name="check-double" size={11} color={Colors.primary} style={{ marginRight: 5 }} />
                  <Text style={styles.quickActionBtnText}>Mark All as Read</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.quickActionBtn}
                  onPress={() => {
                    setSelectedAlertType('all');
                    setSelectedCollegeFilter('all');
                    setSelectedCategory('all');
                  }}
                >
                  <FontAwesome5 name="undo" size={11} color={Colors.textSecondary} style={{ marginRight: 5 }} />
                  <Text style={[styles.quickActionBtnText, { color: Colors.textSecondary }]}>Clear Filters</Text>
                </TouchableOpacity>
              </View>

              {/* Notification Items List */}
              <ScrollView style={{ maxHeight: 480 }} showsVerticalScrollIndicator={false}>
                {allMasterAlerts.map(alert => {
                  const isRead = readAlertIds[alert.id];
                  return (
                    <TouchableOpacity
                      key={alert.id}
                      style={[styles.notifItemCard, isRead && styles.notifItemCardRead]}
                      onPress={() => {
                        toggleReadAlert(alert.id);
                        if (alert.location) router.push('/(tabs)/map' as any);
                      }}
                    >
                      <View style={[
                        styles.notifIconCircle,
                        alert.alertType === 'high_risk_area' || alert.type === 'danger' ? { backgroundColor: '#FEE2E2' } :
                        alert.alertType === 'temporary_danger' ? { backgroundColor: '#FEF3C7' } : { backgroundColor: Colors.primaryLight }
                      ]}>
                        <FontAwesome5
                          name={
                            alert.alertType === 'high_risk_area' ? 'fire' :
                            alert.alertType === 'temporary_danger' ? 'bolt' :
                            alert.alertType === 'campus_announcement' ? 'bullhorn' : 'shield-alt'
                          }
                          size={14}
                          color={
                            alert.alertType === 'high_risk_area' ? Colors.danger :
                            alert.alertType === 'temporary_danger' ? Colors.medium : Colors.primary
                          }
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={styles.notifItemTitle} numberOfLines={1}>{alert.title}</Text>
                          {!isRead && <View style={styles.unreadDot} />}
                        </View>

                        <Text style={styles.notifItemDesc} numberOfLines={2}>{alert.desc}</Text>

                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                          <Text style={styles.notifItemBadge}>{alert.confidence}</Text>
                          <Text style={styles.notifItemTime}>{alert.time}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setIsNotificationCenterOpen(false)}>
                <Text style={styles.modalCloseBtnText}>Close Notification Center</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const getStyles = () => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.card,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  bannerSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  bellBtn: {
    position: 'relative',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 2,
  },
  bellBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#EF4444',
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  bellBadgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: 'bold',
  },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  reportBtnText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  riskBannerCard: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EF4444',
  },
  riskBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  riskBannerTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  riskAreaChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginRight: 8,
    borderWidth: 1,
    minWidth: 150,
  },
  riskAreaChipLoc: {
    fontSize: 11,
    fontWeight: 'bold',
    flex: 1,
  },
  riskScoreBadge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  riskScoreBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: Colors.white,
  },
  riskAreaReason: {
    fontSize: 10,
    color: Colors.text,
    marginTop: 2,
  },
  alertTypeFilterBar: {
    backgroundColor: Colors.card,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  alertTypeChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  alertTypeChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  alertTypeChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text,
  },
  alertTypeChipTextActive: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  collegeFilterBar: {
    backgroundColor: Colors.card,
    paddingTop: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  collegeChipFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    marginRight: 6,
  },
  collegeChipFilterActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  collegeChipFilterText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text,
  },
  collegeChipFilterTextActive: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  collegeFeedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 6,
    marginTop: 2,
  },
  collegeFeedBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  filterSection: {
    backgroundColor: Colors.card,
    paddingVertical: 8,
  },
  filterHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 6,
  },
  filterTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    paddingHorizontal: 12,
  },
  filterScroll: {
    paddingHorizontal: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text,
  },
  filterChipTextActive: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  analyticsToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  analyticsToggleText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  analyticsCard: {
    backgroundColor: Colors.card,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  analyticsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  analyticsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
  },
  analyticsSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: 10,
  },
  analyticsGrid: {
    gap: 8,
  },
  analyticsItem: {
    marginBottom: 2,
  },
  analyticsItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  analyticsItemLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  analyticsItemCount: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  listContent: {
    padding: 16,
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  emptySub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconDanger: { backgroundColor: '#FEE2E2' },
  iconWarning: { backgroundColor: '#FEF3C7' },
  iconSafe: { backgroundColor: '#D1FAE5' },
  iconInfo: { backgroundColor: Colors.primaryLight },

  alertInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
    marginRight: 6,
  },
  confidenceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  confBadgeVerified: { backgroundColor: '#DC2626' },
  confBadgeOfficial: { backgroundColor: Colors.primary },
  confBadgeCluster: { backgroundColor: '#F59E0B' },
  confBadgeText: { fontSize: 9, fontWeight: 'bold', color: Colors.white },

  alertDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  reporterText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  alertTime: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  cardActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cardActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardActionBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.text,
  },

  /* Notification Center Modal Styles */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    backgroundColor: Colors.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  modalSub: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  modalQuickActionsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickActionBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  notifItemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notifItemCardRead: {
    opacity: 0.6,
  },
  notifIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  notifItemTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  notifItemDesc: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  notifItemBadge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  notifItemTime: {
    fontSize: 9,
    color: Colors.textSecondary,
  },
  modalCloseBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  modalCloseBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: 'bold',
  },
});
