import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Switch,
  Modal,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { useAppContext, IncidentReport } from '../context/AppContext';
import { INCIDENT_CATEGORIES } from '../constants/Categories';
import { College } from '../constants/Colleges';

const LIFECYCLE_STAGES: Array<{
  stage: 'Submitted' | 'Under Review' | 'Verified' | 'Action Taken' | 'Resolved';
  label: string;
  icon: string;
}> = [
  { stage: 'Submitted', label: 'Submitted', icon: 'paper-plane' },
  { stage: 'Under Review', label: 'Under Review', icon: 'search' },
  { stage: 'Verified', label: 'Verified', icon: 'shield-alt' },
  { stage: 'Action Taken', label: 'Action Taken', icon: 'bolt' },
  { stage: 'Resolved', label: 'Resolved', icon: 'check-circle' },
];

const getStageIndex = (stage?: string, status?: string): number => {
  const s = stage || (status === 'Resolved' ? 'Resolved' : status === 'Verified' ? 'Verified' : 'Submitted');
  switch (s) {
    case 'Submitted': return 0;
    case 'Under Review': return 1;
    case 'Verified': return 2;
    case 'Action Taken': return 3;
    case 'Resolved': return 4;
    case 'Rejected': return 1;
    default: return 0;
  }
};

export default function ReportIncidentScreen() {
  const styles = getStyles();
  const router = useRouter();
  const { reports, addReport, colleges } = useAppContext();

  // Mode Switcher Tab State: 'new_report' | 'track_reports'
  const [activeModeTab, setActiveModeTab] = useState<'new_report' | 'track_reports'>('new_report');

  // Form State
  const [incidentType, setIncidentType] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [locationText, setLocationText] = useState<string>('');
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [dateTime, setDateTime] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(true);

  // College & Campus State
  const [collegeId, setCollegeId] = useState<string>('');
  const [campusId, setCampusId] = useState<string>('');

  // Media Attachments State
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [videoName, setVideoName] = useState<string | null>(null);
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [audioName, setAudioName] = useState<string | null>(null);

  // Validation & UI States
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [locationStatus, setLocationStatus] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedReport, setSubmittedReport] = useState<IncidentReport | null>(null);

  // Status Tracking States
  const [trackingFilter, setTrackingFilter] = useState<'all' | 'Submitted' | 'Under Review' | 'Verified' | 'Action Taken' | 'Resolved'>('all');
  const [selectedTrackingReport, setSelectedTrackingReport] = useState<IncidentReport | null>(null);

  useEffect(() => {
    // Populate default date & time on mount
    const now = new Date();
    const formatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setDateTime(formatted);

    // Auto detect GPS on open
    handleAutoFetchLocation();
  }, []);

  // Automatic GPS Location Fetch
  const handleAutoFetchLocation = async () => {
    setIsLocating(true);
    setLocationStatus('Requesting GPS permissions...');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationStatus('GPS permission denied. Please enter location manually.');
        setIsLocating(false);
        return;
      }

      setLocationStatus('Acquiring high-accuracy location...');
      const loc = await Location.getCurrentPositionAsync({});
      
      const currentLat = loc.coords.latitude || 19.0486;
      const currentLon = loc.coords.longitude || 72.9393;
      
      setLatitude(currentLat);
      setLongitude(currentLon);

      if (Platform.OS === 'web') {
        try {
          const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${currentLat}&lon=${currentLon}`);
          if (resp.ok) {
            const data = await resp.json();
            if (data && data.display_name) {
              const parts = data.display_name.split(', ').slice(0, 3).join(', ');
              setLocationText(parts);
              setLocationStatus('GPS location acquired');
            } else {
              setLocationText(`Lat: ${currentLat.toFixed(4)}, Lon: ${currentLon.toFixed(4)}`);
              setLocationStatus('GPS coordinates acquired');
            }
          } else {
            setLocationText(`Lat: ${currentLat.toFixed(4)}, Lon: ${currentLon.toFixed(4)}`);
            setLocationStatus('GPS coordinates acquired');
          }
        } catch (webErr) {
          setLocationText(`Lat: ${currentLat.toFixed(4)}, Lon: ${currentLon.toFixed(4)}`);
          setLocationStatus('GPS coordinates acquired');
        }
      } else {
        try {
          const reverseGeocode = await Location.reverseGeocodeAsync({ latitude: currentLat, longitude: currentLon });
          if (reverseGeocode && reverseGeocode.length > 0) {
            const item = reverseGeocode[0];
            const addressParts = [item.name, item.street, item.subregion || item.city, item.region].filter(Boolean);
            const fullAddress = addressParts.length > 0 ? addressParts.join(', ') : `Lat: ${currentLat.toFixed(4)}, Lon: ${currentLon.toFixed(4)}`;
            setLocationText(fullAddress);
            setLocationStatus('GPS location acquired');
          } else {
            setLocationText(`Lat: ${currentLat.toFixed(4)}, Lon: ${currentLon.toFixed(4)}`);
            setLocationStatus('GPS coordinates acquired');
          }
        } catch (geocodeErr) {
          setLocationText(`Lat: ${currentLat.toFixed(4)}, Lon: ${currentLon.toFixed(4)}`);
          setLocationStatus('GPS coordinates acquired');
        }
      }
    } catch (e) {
      setLocationStatus('Failed to retrieve GPS location');
    } finally {
      setIsLocating(false);
    }
  };

  // Photo Upload Handler
  const handlePickPhoto = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Needed', 'Please allow access to your photos to attach a picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert('Error', 'Could not select photo.');
    }
  };

  // Take Photo via Camera
  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Needed', 'Please allow access to camera to take a photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert('Error', 'Could not open camera.');
    }
  };

  // Video Upload Handler
  const handlePickVideo = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Needed', 'Please allow access to videos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setVideoUri(asset.uri);
        setVideoName(asset.fileName || 'incident_video.mp4');
      }
    } catch (err) {
      Alert.alert('Error', 'Could not select video.');
    }
  };

  // Audio Upload Handler
  const handlePickAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setAudioUri(asset.uri);
        setAudioName(asset.name || 'incident_audio.mp3');
      }
    } catch (err) {
      Alert.alert('Error', 'Could not select audio file.');
    }
  };

  // Form Validation
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!incidentType) {
      newErrors.incidentType = 'Please select an incident type.';
    }
    if (!locationText.trim()) {
      newErrors.locationText = 'Please provide or detect incident location.';
    }
    if (!description.trim()) {
      newErrors.description = 'Please describe the incident.';
    } else if (description.trim().length < 5) {
      newErrors.description = 'Description must be at least 5 characters.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit Handler
  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Incomplete Form', 'Please fix highlighted errors before submitting.');
      return;
    }

    setIsSubmitting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const typeLabel = INCIDENT_CATEGORIES.find(t => t.id === incidentType)?.label || incidentType;
      const matchedCollege = colleges.find(c => c.id === collegeId);
      const matchedCampus = matchedCollege?.campuses.find(cp => cp.id === campusId);

      const report = await addReport({
        type: typeLabel,
        description: description.trim(),
        location: locationText.trim(),
        latitude,
        longitude,
        dateTime: dateTime || new Date().toLocaleString(),
        photoUri,
        videoUri,
        audioUri,
        isAnonymous,
        collegeId: matchedCollege?.id,
        collegeName: matchedCollege?.name,
        campusId: matchedCampus?.id,
        campusName: matchedCampus?.name,
      });

      setSubmittedReport(report);
    } catch (err) {
      Alert.alert('Submission Error', 'Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter user reports for status tracking
  const trackedReportsList = reports.filter(r => {
    if (trackingFilter === 'all') return true;
    const stage = r.workflowStage || (r.status === 'Resolved' ? 'Resolved' : r.status === 'Verified' ? 'Verified' : 'Submitted');
    return stage === trackingFilter;
  });

  // Recent Status Change Notifications for reporters
  const statusNotifications = reports.filter(r => {
    return (r.workflowStage && r.workflowStage !== 'Submitted') || (r.history && r.history.length > 1) || r.remarks || r.responseNotes;
  });

  // Render Horizontal 5-Step Stepper Line
  const renderLifecycleStepper = (currentStage?: string, currentStatus?: string) => {
    const activeIdx = getStageIndex(currentStage, currentStatus);
    const isRejected = currentStage === 'Rejected';

    return (
      <View style={styles.stepperContainer}>
        <View style={styles.stepperTrackRow}>
          {LIFECYCLE_STAGES.map((item, idx) => {
            const isPassed = idx <= activeIdx;
            const isCurrent = idx === activeIdx;

            let iconColor = isPassed ? Colors.white : Colors.textSecondary;
            let circleBg = isPassed ? (item.stage === 'Resolved' ? Colors.safe : isCurrent ? Colors.primary : '#3B82F6') : Colors.border;

            if (isRejected && idx === 1) {
              circleBg = Colors.danger;
              iconColor = Colors.white;
            }

            return (
              <React.Fragment key={item.stage}>
                <View style={styles.stepperNodeCol}>
                  <View style={[
                    styles.stepperCircle,
                    { backgroundColor: circleBg },
                    isCurrent && styles.stepperCircleCurrent
                  ]}>
                    <FontAwesome5 name={isRejected && idx === 1 ? 'times' : item.icon} size={11} color={iconColor} />
                  </View>
                  <Text style={[
                    styles.stepperLabelText,
                    isPassed && { color: Colors.text, fontWeight: 'bold' },
                    isCurrent && { color: Colors.primary }
                  ]} numberOfLines={1}>
                    {isRejected && idx === 1 ? 'Rejected' : item.label}
                  </Text>
                </View>

                {idx < LIFECYCLE_STAGES.length - 1 && (
                  <View style={[
                    styles.stepperLine,
                    { backgroundColor: idx < activeIdx ? Colors.primary : Colors.border }
                  ]} />
                )}
              </React.Fragment>
            );
          })}
        </View>
      </View>
    );
  };

  // If submitted successfully, display Confirmation Card with direct "Track Status" action
  if (submittedReport) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.successContent}>
        <View style={styles.successCard}>
          <View style={styles.successIconBox}>
            <FontAwesome5 name="check-circle" size={56} color={Colors.safe} />
          </View>

          <Text style={styles.successTitle}>Report Submitted!</Text>
          <Text style={styles.successSub}>
            Your incident report has been securely registered and broadcasted to local safety alerts.
          </Text>

          <View style={styles.idBox}>
            <Text style={styles.idLabel}>AUTO-GENERATED REPORT ID</Text>
            <Text style={styles.idCode}>{submittedReport.id}</Text>
          </View>

          {/* Stepper Preview */}
          <Text style={{ fontSize: 12, fontWeight: 'bold', color: Colors.text, marginTop: 10, marginBottom: 4 }}>
            REPORT LIFECYCLE TRACKER:
          </Text>
          {renderLifecycleStepper(submittedReport.workflowStage, submittedReport.status)}

          <View style={styles.summaryBox}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Incident Type:</Text>
              <Text style={styles.summaryVal}>{submittedReport.type}</Text>
            </View>
            {submittedReport.collegeName && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>College & Campus:</Text>
                <Text style={styles.summaryVal} numberOfLines={2}>
                  {submittedReport.collegeName} ({submittedReport.campusName || 'Main Campus'})
                </Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Location:</Text>
              <Text style={styles.summaryVal} numberOfLines={2}>{submittedReport.location}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Reporter Privacy:</Text>
              <View style={submittedReport.isAnonymous ? styles.anonBadge : styles.publicBadge}>
                <FontAwesome5 name={submittedReport.isAnonymous ? "user-secret" : "user"} size={10} color={submittedReport.isAnonymous ? Colors.primary : Colors.safe} style={{ marginRight: 4 }} />
                <Text style={submittedReport.isAnonymous ? styles.anonBadgeText : styles.publicBadgeText}>
                  {submittedReport.isAnonymous ? 'Anonymous Citizen (Protected)' : (submittedReport.reporterName || 'Public Identity')}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: '#3B82F6', marginBottom: 8 }]}
            onPress={() => {
              const rep = submittedReport;
              setSubmittedReport(null);
              setActiveModeTab('track_reports');
              setSelectedTrackingReport(rep);
            }}
          >
            <FontAwesome5 name="route" size={14} color={Colors.white} style={{ marginRight: 8 }} />
            <Text style={styles.primaryButtonText}>Track Status of This Report</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => router.replace('/alerts' as any)}
          >
            <Text style={styles.primaryButtonText}>View Community Alerts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => {
              setSubmittedReport(null);
              setIncidentType('');
              setDescription('');
              setPhotoUri(null);
              setVideoUri(null);
              setAudioUri(null);
              handleAutoFetchLocation();
            }}
          >
            <Text style={styles.secondaryButtonText}>Report Another Incident</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Main Header Banner & Top Tab Switcher */}
      <View style={styles.headerBox}>
        <View style={styles.headerIconCircle}>
          <FontAwesome5 name="bullhorn" size={24} color={Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Community Incident Center</Text>
          <Text style={styles.headerSubtitle}>
            Report safety hazards or track live authority status & action response.
          </Text>
        </View>
      </View>

      {/* Top Mode Tab Bar */}
      <View style={styles.topTabBar}>
        <TouchableOpacity
          style={[styles.topTabBtn, activeModeTab === 'new_report' && styles.topTabBtnActive]}
          onPress={() => setActiveModeTab('new_report')}
        >
          <FontAwesome5 name="plus-circle" size={13} color={activeModeTab === 'new_report' ? Colors.white : Colors.textSecondary} style={{ marginRight: 6 }} />
          <Text style={[styles.topTabText, activeModeTab === 'new_report' && styles.topTabTextActive]}>
            Report Incident
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.topTabBtn, activeModeTab === 'track_reports' && styles.topTabBtnActive]}
          onPress={() => setActiveModeTab('track_reports')}
        >
          <FontAwesome5 name="tasks" size={13} color={activeModeTab === 'track_reports' ? Colors.white : Colors.textSecondary} style={{ marginRight: 6 }} />
          <Text style={[styles.topTabText, activeModeTab === 'track_reports' && styles.topTabTextActive]}>
            Track Status ({reports.length})
          </Text>
          {statusNotifications.length > 0 && (
            <View style={styles.notificationBadgeDot}>
              <Text style={styles.notificationBadgeDotText}>{statusNotifications.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* MODE 2: REPORT STATUS TRACKING FOR REPORTERS */}
      {activeModeTab === 'track_reports' ? (
        <View style={{ marginTop: 10 }}>
          {/* Notifications on Status Changes Banner */}
          {statusNotifications.length > 0 && (
            <View style={styles.statusNotifyBannerCard}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <FontAwesome5 name="bell" size={14} color="#D97706" style={{ marginRight: 6 }} />
                <Text style={styles.statusNotifyTitle}>🔔 Status Updates & Notifications ({statusNotifications.length})</Text>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
                {statusNotifications.map((notif, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.notifChip}
                    onPress={() => {
                      const found = reports.find(r => r.id === notif.id);
                      if (found) setSelectedTrackingReport(found);
                    }}
                  >
                    <Text style={styles.notifChipId}>{notif.id} ({notif.type})</Text>
                    <Text style={styles.notifChipText} numberOfLines={1}>
                      Status: <Text style={{ fontWeight: 'bold' }}>{notif.workflowStage || notif.status}</Text> • {notif.remarks || notif.responseNotes || 'Updated'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Status Filter Bar */}
          <Text style={styles.sectionTitle}>Filter Reports by Stage:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingBottom: 10 }}>
            {(['all', 'Submitted', 'Under Review', 'Verified', 'Action Taken', 'Resolved'] as const).map(st => (
              <TouchableOpacity
                key={st}
                style={[styles.filterChip, trackingFilter === st && styles.filterChipActive]}
                onPress={() => setTrackingFilter(st)}
              >
                <Text style={[styles.filterChipText, trackingFilter === st && styles.filterChipTextActive]}>
                  {st === 'all' ? `All Reports (${reports.length})` : st}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Tracked Reports List */}
          {trackedReportsList.length === 0 ? (
            <View style={styles.emptyTrackingBox}>
              <FontAwesome5 name="folder-open" size={36} color={Colors.textSecondary} style={{ marginBottom: 10 }} />
              <Text style={styles.emptyTrackingTitle}>No Reports Found</Text>
              <Text style={styles.emptyTrackingSub}>No incident reports match the selected lifecycle stage.</Text>
            </View>
          ) : (
            trackedReportsList.map(report => {
              const currentStage = report.workflowStage || (report.status === 'Resolved' ? 'Resolved' : report.status === 'Verified' ? 'Verified' : 'Submitted');
              return (
                <TouchableOpacity
                  key={report.id}
                  style={styles.trackingCard}
                  onPress={() => setSelectedTrackingReport(report)}
                >
                  <View style={styles.trackingCardHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.trackingReportId}>{report.id}</Text>
                        {report.isAnonymous !== false ? (
                          <View style={styles.anonBadgeMini}>
                            <FontAwesome5 name="user-secret" size={9} color={Colors.primary} style={{ marginRight: 3 }} />
                            <Text style={styles.anonBadgeMiniText}>Anonymous (You)</Text>
                          </View>
                        ) : (
                          <View style={styles.publicBadgeMini}>
                            <Text style={styles.publicBadgeMiniText}>Public</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.trackingReportType}>
                        {report.type} • <Text style={{ color: Colors.textSecondary }}>📍 {report.location}</Text>
                      </Text>
                    </View>

                    <View style={[
                      styles.stagePill,
                      currentStage === 'Resolved' ? styles.stagePillResolved :
                      currentStage === 'Action Taken' ? styles.stagePillAction :
                      currentStage === 'Verified' ? styles.stagePillVerified :
                      currentStage === 'Under Review' ? styles.stagePillReview : styles.stagePillSubmitted
                    ]}>
                      <Text style={styles.stagePillText}>{currentStage}</Text>
                    </View>
                  </View>

                  {/* 5-Step Stepper Progress Bar */}
                  {renderLifecycleStepper(report.workflowStage, report.status)}

                  {/* Authority Remarks & Assigned Officer Preview */}
                  {report.assignedPersonOrTeam && (
                    <View style={styles.assignedPreviewBox}>
                      <FontAwesome5 name="user-shield" size={11} color={Colors.primary} style={{ marginRight: 6 }} />
                      <Text style={styles.assignedPreviewText}>
                        Assigned Unit: <Text style={{ fontWeight: 'bold', color: Colors.text }}>{report.assignedPersonOrTeam}</Text>
                      </Text>
                    </View>
                  )}

                  {report.remarks && (
                    <Text style={styles.remarksPreviewText} numberOfLines={2}>
                      💬 <Text style={{ fontWeight: 'bold' }}>Authority Note:</Text> {report.remarks}
                    </Text>
                  )}

                  <View style={styles.trackingCardFooter}>
                    <Text style={styles.trackingDate}>🕒 Reported: {report.dateTime}</Text>
                    <Text style={styles.inspectBtnText}>Inspect Full History →</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      ) : (
        /* MODE 1: REPORT INCIDENT FORM */
        <View style={{ marginTop: 10 }}>
          {/* 1. Incident Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              1. Select Incident Type <Text style={styles.required}>*</Text>
            </Text>

            <View style={styles.typeGrid}>
              {INCIDENT_CATEGORIES.map(type => {
                const isSelected = incidentType === type.id;
                return (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.typeCard,
                      isSelected && { borderColor: Colors.primary, backgroundColor: Colors.primaryLight }
                    ]}
                    onPress={() => {
                      setIncidentType(type.id);
                      if (errors.incidentType) setErrors({ ...errors, incidentType: '' });
                    }}
                  >
                    <View style={[styles.typeIconBox, { backgroundColor: type.color + '20' }]}>
                      <FontAwesome5 name={type.icon} size={18} color={type.color} />
                    </View>
                    <Text style={[styles.typeLabel, isSelected && { color: Colors.primary, fontWeight: 'bold' }]}>
                      {type.label}
                    </Text>
                    {isSelected && (
                      <View style={styles.checkBadge}>
                        <FontAwesome5 name="check" size={10} color={Colors.white} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
            {errors.incidentType ? <Text style={styles.errorText}>{errors.incidentType}</Text> : null}
          </View>

          {/* 2. College & Campus Association (Optional) */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Associated College / Campus (Optional)</Text>
            <Text style={styles.mediaHint}>Link this safety report to your university or campus for targeted safety alerts.</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
              <TouchableOpacity
                style={[
                  styles.collegeChip,
                  !collegeId && styles.collegeChipActive
                ]}
                onPress={() => {
                  setCollegeId('');
                  setCampusId('');
                }}
              >
                <FontAwesome5 name="globe" size={12} color={!collegeId ? Colors.white : Colors.textSecondary} style={{ marginRight: 6 }} />
                <Text style={[styles.collegeChipText, !collegeId && styles.collegeChipTextActive]}>General Community</Text>
              </TouchableOpacity>

              {colleges.map(col => {
                const isSelected = collegeId === col.id;
                return (
                  <TouchableOpacity
                    key={col.id}
                    style={[
                      styles.collegeChip,
                      isSelected && { backgroundColor: col.color, borderColor: col.color }
                    ]}
                    onPress={() => {
                      setCollegeId(col.id);
                      setCampusId('');
                    }}
                  >
                    <FontAwesome5 name={col.icon} size={12} color={isSelected ? Colors.white : col.color} style={{ marginRight: 6 }} />
                    <Text style={[styles.collegeChipText, isSelected && { color: Colors.white, fontWeight: 'bold' }]}>
                      {col.shortName}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {collegeId ? (
              <View style={styles.campusContainer}>
                <Text style={styles.campusSubTitle}>Select Campus:</Text>
                <View style={styles.campusGrid}>
                  {colleges.find(c => c.id === collegeId)?.campuses.map(campus => {
                    const isSelected = campusId === campus.id;
                    return (
                      <TouchableOpacity
                        key={campus.id}
                        style={[
                          styles.campusCard,
                          isSelected && styles.campusCardActive
                        ]}
                        onPress={() => {
                          setCampusId(campus.id);
                          setLocationText(`${campus.name}, ${campus.location}`);
                          setLatitude(campus.latitude);
                          setLongitude(campus.longitude);
                          setLocationStatus(`Campus Auto-Selected: ${campus.name}`);
                          if (errors.locationText) setErrors({ ...errors, locationText: '' });
                        }}
                      >
                        <FontAwesome5 name="map-pin" size={12} color={isSelected ? Colors.primary : Colors.textSecondary} style={{ marginRight: 8 }} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.campusName, isSelected && styles.campusNameActive]}>{campus.name}</Text>
                          <Text style={styles.campusLoc}>{campus.location}</Text>
                        </View>
                        {isSelected && <FontAwesome5 name="check" size={12} color={Colors.primary} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            ) : null}
          </View>

          {/* 3. Location & GPS Verification */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              3. Incident Location <Text style={styles.required}>*</Text>
            </Text>

            <View style={styles.locationInputBox}>
              <FontAwesome5 name="map-marker-alt" size={16} color={Colors.primary} style={{ marginRight: 10 }} />
              <TextInput
                style={styles.locationInput}
                placeholder="Street address, campus building or landmark..."
                placeholderTextColor={Colors.textSecondary}
                value={locationText}
                onChangeText={text => {
                  setLocationText(text);
                  if (errors.locationText) setErrors({ ...errors, locationText: '' });
                }}
              />
              <TouchableOpacity style={styles.gpsButton} onPress={handleAutoFetchLocation} disabled={isLocating}>
                {isLocating ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <FontAwesome5 name="crosshairs" size={16} color={Colors.primary} />
                )}
              </TouchableOpacity>
            </View>

            {locationStatus ? (
              <View style={styles.locationStatusBox}>
                <FontAwesome5 name="info-circle" size={11} color={Colors.primary} style={{ marginRight: 5 }} />
                <Text style={styles.locationStatusText}>{locationStatus}</Text>
              </View>
            ) : null}
            {errors.locationText ? <Text style={styles.errorText}>{errors.locationText}</Text> : null}
          </View>

          {/* 4. Incident Description & Timestamp */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              4. Incident Details <Text style={styles.required}>*</Text>
            </Text>

            <TextInput
              style={styles.textArea}
              placeholder="Describe what happened, individuals involved, or immediate dangers..."
              placeholderTextColor={Colors.textSecondary}
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={text => {
                setDescription(text);
                if (errors.description) setErrors({ ...errors, description: '' });
              }}
            />
            {errors.description ? <Text style={styles.errorText}>{errors.description}</Text> : null}

            <Text style={[styles.sectionTitle, { marginTop: 14 }]}>Date & Time of Incident</Text>
            <View style={styles.dateTimeBox}>
              <FontAwesome5 name="clock" size={14} color={Colors.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.dateTimeInput}
                value={dateTime}
                onChangeText={setDateTime}
                placeholder="YYYY-MM-DD HH:MM"
                placeholderTextColor={Colors.textSecondary}
              />
            </View>
          </View>

          {/* 5. Media Attachments */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>5. Evidence & Media Attachments (Optional)</Text>
            <Text style={styles.mediaHint}>Attach photos, video recordings or audio notes for investigation.</Text>

            <View style={styles.mediaButtonsRow}>
              <TouchableOpacity style={styles.mediaBtn} onPress={handlePickPhoto}>
                <FontAwesome5 name="image" size={18} color={Colors.primary} />
                <Text style={styles.mediaBtnText}>Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.mediaBtn} onPress={handleTakePhoto}>
                <FontAwesome5 name="camera" size={18} color={Colors.primary} />
                <Text style={styles.mediaBtnText}>Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.mediaBtn} onPress={handlePickVideo}>
                <FontAwesome5 name="video" size={18} color={Colors.primary} />
                <Text style={styles.mediaBtnText}>Video</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.mediaBtn} onPress={handlePickAudio}>
                <FontAwesome5 name="microphone" size={18} color={Colors.primary} />
                <Text style={styles.mediaBtnText}>Audio</Text>
              </TouchableOpacity>
            </View>

            {/* Media Previews */}
            {photoUri ? (
              <View style={styles.previewCard}>
                <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                <View style={styles.previewMeta}>
                  <Text style={styles.previewTitle}>Photo Attached</Text>
                  <TouchableOpacity onPress={() => setPhotoUri(null)}>
                    <Text style={styles.removeMediaText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            {videoUri ? (
              <View style={styles.previewCard}>
                <FontAwesome5 name="file-video" size={24} color={Colors.primary} style={{ marginRight: 10 }} />
                <View style={styles.previewMeta}>
                  <Text style={styles.previewTitle}>{videoName || 'Video File Attached'}</Text>
                  <TouchableOpacity onPress={() => { setVideoUri(null); setVideoName(null); }}>
                    <Text style={styles.removeMediaText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}

            {audioUri ? (
              <View style={styles.previewCard}>
                <FontAwesome5 name="file-audio" size={24} color={Colors.primary} style={{ marginRight: 10 }} />
                <View style={styles.previewMeta}>
                  <Text style={styles.previewTitle}>{audioName || 'Audio Recording Attached'}</Text>
                  <TouchableOpacity onPress={() => { setAudioUri(null); setAudioName(null); }}>
                    <Text style={styles.removeMediaText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : null}
          </View>

          {/* 6. Reporter Identity & Anonymous Toggle */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>6. Reporter Privacy Settings</Text>

            <View style={styles.switchRow}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <FontAwesome5 name="user-secret" size={16} color={Colors.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.switchLabel}>Submit Report Anonymously</Text>
                </View>
                <Text style={styles.switchSub}>
                  Your personal identity will be encrypted and hidden from community alerts and public feeds.
                </Text>
              </View>

              <Switch
                value={isAnonymous}
                onValueChange={setIsAnonymous}
                trackColor={{ false: Colors.border, true: Colors.primaryLight }}
                thumbColor={isAnonymous ? Colors.primary : Colors.textSecondary}
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <ActivityIndicator color={Colors.white} />
            ) : (
              <>
                <FontAwesome5 name="paper-plane" size={16} color={Colors.white} style={{ marginRight: 8 }} />
                <Text style={styles.submitBtnText}>Submit Safety Incident Report</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* DETAILED REPORT STATUS TRACKING MODAL */}
      {selectedTrackingReport && (
        <Modal
          visible={!!selectedTrackingReport}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedTrackingReport(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.modalReportId}>{selectedTrackingReport.id}</Text>
                    {selectedTrackingReport.isAnonymous !== false ? (
                      <View style={styles.anonBadgeMini}>
                        <FontAwesome5 name="user-secret" size={9} color={Colors.primary} style={{ marginRight: 3 }} />
                        <Text style={styles.anonBadgeMiniText}>Anonymous (Protected)</Text>
                      </View>
                    ) : (
                      <View style={styles.publicBadgeMini}>
                        <Text style={styles.publicBadgeMiniText}>Public Reporter</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.modalReportType}>{selectedTrackingReport.type}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedTrackingReport(null)}>
                  <FontAwesome5 name="times-circle" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 520 }} showsVerticalScrollIndicator={false}>
                {/* 5-Step Lifecycle Stepper */}
                <Text style={styles.trackingSectionTitle}>📊 Real-Time Status Lifecycle Stepper:</Text>
                {renderLifecycleStepper(selectedTrackingReport.workflowStage, selectedTrackingReport.status)}

                {/* Current Response Status Card */}
                <View style={styles.statusOverviewBox}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={styles.statusBoxLabel}>Current Authority Status:</Text>
                    <View style={styles.statusBadgePending}>
                      <Text style={styles.statusBadgeText}>
                        {selectedTrackingReport.workflowStage || selectedTrackingReport.status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.statusOverviewText}>
                    📍 Location: <Text style={{ color: Colors.text, fontWeight: 'bold' }}>{selectedTrackingReport.location}</Text>
                  </Text>
                  <Text style={styles.statusOverviewText}>
                    🕒 Reported At: <Text style={{ color: Colors.text }}>{selectedTrackingReport.dateTime}</Text>
                  </Text>
                  {selectedTrackingReport.assignedPersonOrTeam && (
                    <Text style={styles.statusOverviewText}>
                      🛡️ Assigned Unit: <Text style={{ color: Colors.primary, fontWeight: 'bold' }}>{selectedTrackingReport.assignedPersonOrTeam}</Text>
                    </Text>
                  )}
                  {selectedTrackingReport.responseStatus && (
                    <Text style={styles.statusOverviewText}>
                      ⚡ Response Status: <Text style={{ color: Colors.safe, fontWeight: 'bold' }}>{selectedTrackingReport.responseStatus}</Text>
                    </Text>
                  )}
                </View>

                {/* Authority Remarks & Action Notes */}
                {(selectedTrackingReport.remarks || selectedTrackingReport.actionTaken || selectedTrackingReport.responseNotes) && (
                  <View style={styles.remarksCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                      <FontAwesome5 name="comment-alt" size={12} color={Colors.primary} style={{ marginRight: 6 }} />
                      <Text style={styles.remarksCardTitle}>Official Authority Notes & Actions:</Text>
                    </View>
                    {selectedTrackingReport.remarks && (
                      <Text style={styles.remarksCardBody}>
                        💬 <Text style={{ fontWeight: 'bold' }}>Remarks:</Text> {selectedTrackingReport.remarks}
                      </Text>
                    )}
                    {selectedTrackingReport.actionTaken && (
                      <Text style={styles.remarksCardBody}>
                        ⚡ <Text style={{ fontWeight: 'bold' }}>Action Taken:</Text> {selectedTrackingReport.actionTaken}
                      </Text>
                    )}
                    {selectedTrackingReport.responseNotes && (
                      <Text style={styles.remarksCardBody}>
                        📝 <Text style={{ fontWeight: 'bold' }}>Desk Response Notes:</Text> {selectedTrackingReport.responseNotes}
                      </Text>
                    )}
                  </View>
                )}

                {/* Resolution Details Card (if resolved) */}
                {selectedTrackingReport.status === 'Resolved' && (
                  <View style={styles.resolutionCard}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                      <FontAwesome5 name="check-circle" size={14} color={Colors.safe} style={{ marginRight: 6 }} />
                      <Text style={styles.resolutionTitle}>Resolved Case Summary</Text>
                    </View>
                    <Text style={styles.resolutionText}>
                      {selectedTrackingReport.resolutionDetails || 'Incident verified, safety measures implemented and confirmed resolved by authority command desk.'}
                    </Text>
                    {selectedTrackingReport.resolutionDate && (
                      <Text style={styles.resolutionDate}>Resolved Date: {selectedTrackingReport.resolutionDate}</Text>
                    )}
                  </View>
                )}

                {/* Audit History Timeline Log */}
                <Text style={styles.trackingSectionTitle}>📜 Complete Audit History Timeline:</Text>
                {selectedTrackingReport.history && selectedTrackingReport.history.length > 0 ? (
                  selectedTrackingReport.history.map((hist, hIdx) => (
                    <View key={hist.id || hIdx} style={styles.timelineItem}>
                      <View style={styles.timelineDot} />
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={styles.timelineAction}>{hist.actionName || hist.stage}</Text>
                          <Text style={styles.timelineTime}>{hist.timestamp}</Text>
                        </View>
                        <Text style={styles.timelineActor}>By: {hist.performedBy}</Text>
                        {hist.remarks && <Text style={styles.timelineRemarks}>"{hist.remarks}"</Text>}
                      </View>
                    </View>
                  ))
                ) : (
                  <View style={styles.timelineItem}>
                    <View style={styles.timelineDot} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.timelineAction}>Report Submitted</Text>
                      <Text style={styles.timelineTime}>{selectedTrackingReport.dateTime}</Text>
                      <Text style={styles.timelineRemarks}>Initial submission logged securely in SafeRoute system.</Text>
                    </View>
                  </View>
                )}
              </ScrollView>

              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setSelectedTrackingReport(null)}>
                <Text style={styles.modalCloseBtnText}>Close Status Tracker</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}

const getStyles = () => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
  },
  headerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  topTabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    padding: 4,
    borderRadius: 14,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  topTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  topTabBtnActive: {
    backgroundColor: Colors.primary,
  },
  topTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  topTabTextActive: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  notificationBadgeDot: {
    backgroundColor: '#EF4444',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 5,
  },
  notificationBadgeDotText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: 'bold',
  },
  statusNotifyBannerCard: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F59E0B',
    marginBottom: 12,
  },
  statusNotifyTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#B45309',
  },
  notifChip: {
    backgroundColor: Colors.white,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#FCD34D',
    maxWidth: 220,
  },
  notifChipId: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  notifChipText: {
    fontSize: 10,
    color: Colors.text,
    marginTop: 2,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
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
  emptyTrackingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTrackingTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
  },
  emptyTrackingSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  trackingCard: {
    backgroundColor: Colors.card,
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  trackingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  trackingReportId: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  trackingReportType: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 2,
  },
  stagePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stagePillSubmitted: { backgroundColor: '#F3F4F6' },
  stagePillReview: { backgroundColor: '#FEF3C7' },
  stagePillVerified: { backgroundColor: '#DBEAFE' },
  stagePillAction: { backgroundColor: '#EDE9FE' },
  stagePillResolved: { backgroundColor: '#D1FAE5' },
  stagePillText: { fontSize: 10, fontWeight: 'bold', color: Colors.text },
  assignedPreviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 8,
    borderRadius: 8,
    marginVertical: 6,
  },
  assignedPreviewText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  remarksPreviewText: {
    fontSize: 11,
    color: Colors.text,
    fontStyle: 'italic',
    marginTop: 4,
  },
  trackingCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  trackingDate: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  inspectBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Colors.primary,
  },

  /* Stepper Component Styles */
  stepperContainer: {
    marginVertical: 10,
    paddingHorizontal: 4,
  },
  stepperTrackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepperNodeCol: {
    alignItems: 'center',
    width: 50,
  },
  stepperCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperCircleCurrent: {
    borderWidth: 2,
    borderColor: Colors.white,
  },
  stepperLabelText: {
    fontSize: 9,
    color: Colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  stepperLine: {
    flex: 1,
    height: 3,
    marginTop: -14,
  },

  /* Modal Styles */
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
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalReportId: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  modalReportType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 2,
  },
  trackingSectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 10,
    marginBottom: 6,
  },
  statusOverviewBox: {
    backgroundColor: Colors.background,
    padding: 12,
    borderRadius: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusBoxLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.text,
  },
  statusOverviewText: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 3,
  },
  remarksCard: {
    backgroundColor: Colors.primaryLight,
    padding: 12,
    borderRadius: 12,
    marginVertical: 8,
  },
  remarksCardTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  remarksCardBody: {
    fontSize: 11,
    color: Colors.text,
    marginTop: 4,
  },
  resolutionCard: {
    backgroundColor: '#D1FAE5',
    padding: 12,
    borderRadius: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: Colors.safe,
  },
  resolutionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.safe,
  },
  resolutionText: {
    fontSize: 12,
    color: Colors.text,
    marginTop: 4,
  },
  resolutionDate: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    marginTop: 6,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 10,
    paddingLeft: 4,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginTop: 4,
    marginRight: 10,
  },
  timelineAction: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.text,
  },
  timelineTime: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  timelineActor: {
    fontSize: 10,
    color: Colors.primary,
    marginTop: 1,
  },
  timelineRemarks: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
  modalCloseBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  modalCloseBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: 'bold',
  },

  /* Existing Form Styles */
  section: {
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 10,
  },
  required: {
    color: Colors.danger,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 10,
    borderRadius: 12,
  },
  typeIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
  },
  checkBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  collegeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    marginRight: 8,
  },
  collegeChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  collegeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
  },
  collegeChipTextActive: {
    color: Colors.white,
    fontWeight: 'bold',
  },
  campusContainer: {
    marginTop: 12,
  },
  campusSubTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  campusGrid: {
    gap: 6,
  },
  campusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderWidth: 1.5,
    borderColor: Colors.border,
    padding: 10,
    borderRadius: 10,
  },
  campusCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  campusName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: Colors.text,
  },
  campusNameActive: {
    color: Colors.primary,
  },
  campusLoc: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  locationInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  locationInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  gpsButton: {
    padding: 6,
  },
  locationStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  locationStatusText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '500',
  },
  textArea: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  dateTimeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dateTimeInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
  },
  mediaHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  mediaButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  mediaBtn: {
    width: '23%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    borderRadius: 12,
  },
  mediaBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 4,
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    padding: 8,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  photoPreview: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 10,
  },
  previewMeta: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.text,
  },
  removeMediaText: {
    fontSize: 12,
    color: Colors.danger,
    fontWeight: 'bold',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.text,
  },
  switchSub: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  errorText: {
    fontSize: 11,
    color: Colors.danger,
    marginTop: 4,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 24,
    marginVertical: 16,
  },
  submitBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: 'bold',
  },
  successContent: {
    padding: 20,
    justifyContent: 'center',
  },
  successCard: {
    backgroundColor: Colors.card,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  successIconBox: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 6,
  },
  successSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  idBox: {
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
    width: '100%',
  },
  idLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.textSecondary,
    letterSpacing: 1,
  },
  idCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginTop: 2,
  },
  summaryBox: {
    width: '100%',
    backgroundColor: Colors.background,
    padding: 14,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.textSecondary,
  },
  summaryVal: {
    fontSize: 12,
    fontWeight: 'bold',
    color: Colors.text,
    flex: 1,
    textAlign: 'right',
  },
  anonBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  anonBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  publicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.safeLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  publicBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.safe,
  },
  statusBadgePending: {
    backgroundColor: Colors.mediumLight,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: Colors.medium,
  },
  primaryButton: {
    width: '100%',
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  primaryButtonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  secondaryButton: {
    width: '100%',
    backgroundColor: Colors.background,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  secondaryButtonText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  anonBadgeMini: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  anonBadgeMiniText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  publicBadgeMini: {
    backgroundColor: Colors.safeLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  publicBadgeMiniText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: Colors.safe,
  },
});
