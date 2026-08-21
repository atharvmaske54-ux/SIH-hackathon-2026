import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
  TextInput,
  Alert,
  Linking,
  ScrollView,
  Modal,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { INCIDENT_CATEGORIES } from '../../constants/Categories';
import { useAppContext, IncidentReport } from '../../context/AppContext';
import {
  computeAreaRiskAnalysis,
  getRiskLevelColor,
  AreaRiskAnalysis,
  RiskLevel,
} from '../../utils/riskDetection';

let MapView: any = null;
let Marker: any = null;
let Circle: any = null;
let Polyline: any = null;
let PROVIDER_GOOGLE: any = null;

if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default || Maps;
  Marker = Maps.Marker;
  Circle = Maps.Circle;
  Polyline = Maps.Polyline;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
}

let globalDangerWarningTriggered = false;

const MOCK_GROUP_MEMBERS = [
  { id: 'g1', name: 'Alex (Friend)', latOffset: 0.002, lonOffset: 0.001 },
  { id: 'g2', name: 'Sarah (Sister)', latOffset: -0.001, lonOffset: 0.003 },
  { id: 'g3', name: 'Mom', latOffset: -0.003, lonOffset: -0.002 },
];

const KNOWN_ZONES = [
  { id: 'm1', name: 'Kurla West (High Transit Crime Area)', latitude: 19.0650, longitude: 72.8794, type: 'danger', radius: 1500 },
  { id: 'm2', name: 'Malabar Hill (High Security Zone)', latitude: 18.9548, longitude: 72.7985, type: 'safe', radius: 1500 },
  { id: 'm3', name: 'Mankhurd Station Surroundings (Watchlist)', latitude: 19.0486, longitude: 72.9393, type: 'danger', radius: 1200 },
];

export default function MapScreen() {
  const styles = getStyles();
  const { reports, colleges, selectedCollegeId, selectedCampusId, setSelectedCollegeId, setSelectedCampusId } = useAppContext();

  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [destinationCoords, setDestinationCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [destinationName, setDestinationName] = useState<string>('');

  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [selectedRouteType, setSelectedRouteType] = useState<'safest' | 'fastest'>('safest');
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [nearbySafePlaces, setNearbySafePlaces] = useState<any[]>([]);

  // MAP FILTERS STATE
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'community' | 'verified' | 'resolved'>('all');
  const [filterCampus, setFilterCampus] = useState<string>(selectedCampusId || 'all');
  const [filterDate, setFilterDate] = useState<'all' | 'today' | '7days' | 'older'>('all');
  const [filterRisk, setFilterRisk] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // MAP DISPLAY TOGGLE MODES
  const [showHeatmap, setShowHeatmap] = useState<boolean>(true);
  const [showHighRiskZones, setShowHighRiskZones] = useState<boolean>(true);
  const [showCommunityIncidents, setShowCommunityIncidents] = useState<boolean>(true);
  const [showVerifiedIncidents, setShowVerifiedIncidents] = useState<boolean>(true);
  const [showFilterDrawer, setShowFilterDrawer] = useState<boolean>(false);

  // Inspector Modal States
  const [selectedRiskAnalysis, setSelectedRiskAnalysis] = useState<AreaRiskAnalysis | null>(null);
  const [focusedReport, setFocusedReport] = useState<IncidentReport | null>(null);

  // Sync campus selection
  useEffect(() => {
    if (selectedCampusId) {
      setFilterCampus(selectedCampusId);
    }
  }, [selectedCampusId]);

  // 1. FILTERED INCIDENTS COMPUTATION
  const filteredReports = useMemo(() => {
    const nowTime = Date.now();

    return reports.filter(r => {
      // 1. Status Filter
      if (filterStatus === 'community') {
        if (r.status !== 'Pending' && r.workflowStage !== 'Submitted' && r.workflowStage !== 'Under Review') return false;
      } else if (filterStatus === 'verified') {
        if (r.status !== 'Verified' && r.workflowStage !== 'Verified' && r.workflowStage !== 'Action Taken') return false;
      } else if (filterStatus === 'resolved') {
        if (r.status !== 'Resolved' && r.workflowStage !== 'Resolved') return false;
      }

      // Quick Toggles
      if (!showCommunityIncidents && (r.status === 'Pending' || r.workflowStage === 'Submitted')) return false;
      if (!showVerifiedIncidents && (r.status === 'Verified' || r.workflowStage === 'Verified' || r.workflowStage === 'Action Taken')) return false;

      // 2. Category Filter
      if (filterCategory !== 'all') {
        if (r.type.toLowerCase() !== filterCategory.toLowerCase()) return false;
      }

      // 3. Campus Filter
      if (filterCampus !== 'all') {
        if (r.campusId !== filterCampus) return false;
      }

      // 4. Date Filter
      if (filterDate !== 'all') {
        const reportTime = new Date(r.createdAt || Date.now()).getTime();
        const diffHours = (nowTime - reportTime) / (1000 * 60 * 60);
        if (filterDate === 'today' && diffHours > 24) return false;
        if (filterDate === '7days' && diffHours > 24 * 7) return false;
        if (filterDate === 'older' && diffHours <= 24 * 7) return false;
      }

      return true;
    });
  }, [reports, filterStatus, filterCategory, filterCampus, filterDate, showCommunityIncidents, showVerifiedIncidents]);

  // 2. COMMUNITY-BASED RISK DETECTION ENGINE COMPUTATION
  const areaRiskAnalyses = useMemo(() => {
    let analyses = computeAreaRiskAnalysis(filteredReports);

    if (filterRisk !== 'all') {
      analyses = analyses.filter(a => a.riskLevel.toLowerCase() === filterRisk.toLowerCase());
    }

    return analyses;
  }, [filteredReports, filterRisk]);

  // Destination / Route Risk Impact Check
  const destinationRisk = useMemo(() => {
    if (!destinationName || areaRiskAnalyses.length === 0) return null;
    return areaRiskAnalyses.find(
      a =>
        a.location.toLowerCase().includes(destinationName.toLowerCase()) ||
        destinationName.toLowerCase().includes(a.location.toLowerCase())
    ) || areaRiskAnalyses[0]; // fallback top risk zone if active destination set
  }, [destinationName, areaRiskAnalyses]);

  // Handle select campus focus
  const handleSelectCampus = (campusId: string, collegeId: string, lat: number, lon: number, name: string) => {
    if (collegeId !== 'custom') setSelectedCollegeId(collegeId);
    if (campusId !== 'custom') {
      setSelectedCampusId(campusId);
      setFilterCampus(campusId);
    }
    setDestinationCoords({ latitude: lat, longitude: lon });
    setDestinationName(name);

    // Open risk analysis if matches location
    const matchedAnalysis = areaRiskAnalyses.find(a => a.location.toLowerCase().includes(name.toLowerCase()));
    if (matchedAnalysis) {
      setSelectedRiskAnalysis(matchedAnalysis);
    }
  };

  // Group members simulation
  useEffect(() => {
    if (!location) return;
    const interval = setInterval(() => {
      const updatedMembers = MOCK_GROUP_MEMBERS.map(member => {
        const jitterLat = (Math.random() - 0.5) * 0.0005;
        const jitterLon = (Math.random() - 0.5) * 0.0005;
        return {
          ...member,
          latitude: location.coords.latitude + member.latOffset + jitterLat,
          longitude: location.coords.longitude + member.lonOffset + jitterLon,
        };
      });
      setGroupMembers(updatedMembers);
    }, 3000);
    return () => clearInterval(interval);
  }, [location]);

  // Nearby safe places API / Fallback
  useEffect(() => {
    if (!location || nearbySafePlaces.length > 0) return;
    const lat = location.coords.latitude;
    const lon = location.coords.longitude;

    const fetchPlaces = async () => {
      try {
        const query = `[out:json];(node["amenity"="police"](around:3000,${lat},${lon});node["amenity"="hospital"](around:3000,${lat},${lon});node["shop"="mall"](around:3000,${lat},${lon}););out body 15;`;
        const res = await fetch(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.elements && data.elements.length > 0) {
          const places = data.elements.map((el: any) => ({
            id: el.id.toString(),
            title: el.tags?.name || (el.tags?.amenity === 'police' ? 'Police Station' : el.tags?.amenity === 'hospital' ? 'Hospital' : 'Public Mall'),
            type: el.tags?.amenity === 'police' ? 'police' : el.tags?.amenity === 'hospital' ? 'hospital' : 'public',
            latitude: el.lat,
            longitude: el.lon,
            description: 'Verified Safe Location'
          }));
          setNearbySafePlaces(places);
        } else {
          throw new Error('No elements');
        }
      } catch (err) {
        setNearbySafePlaces([
          { id: 'p1', title: 'Local Police Station', type: 'police', latitude: lat + 0.005, longitude: lon + 0.002, description: '24/7 Police Help Desk' },
          { id: 'p2', title: 'City Hospital', type: 'hospital', latitude: lat - 0.004, longitude: lon + 0.006, description: 'Emergency Ward Available' },
          { id: 'p3', title: 'Central Mall (Safe Area)', type: 'public', latitude: lat + 0.007, longitude: lon - 0.005, description: 'Crowded place with heavy CCTV' },
          { id: 'p4', title: 'Shatabdi Hospital', type: 'hospital', latitude: lat - 0.002, longitude: lon - 0.006, description: 'First aid and basic emergency' },
          { id: 'p5', title: 'Metro Station', type: 'public', latitude: lat + 0.001, longitude: lon + 0.008, description: 'Guarded public transit' },
        ]);
      }
    };
    fetchPlaces();
  }, [location]);

  // Search location logic
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    try {
      const geocoded = await Location.geocodeAsync(searchQuery);
      if (geocoded.length > 0) {
        const dest = {
          latitude: geocoded[0].latitude,
          longitude: geocoded[0].longitude,
        };
        setDestinationCoords(dest);
        setDestinationName(searchQuery);

        if (location) {
          try {
            const start = location.coords;
            const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${start.longitude},${start.latitude};${dest.longitude},${dest.latitude}?geometries=geojson`);
            const data = await res.json();
            if (data.routes && data.routes.length > 0) {
              const coords = data.routes[0].geometry.coordinates.map((c: any) => ({
                latitude: c[1],
                longitude: c[0]
              }));
              setRouteCoords(coords);
            }
          } catch (err) {
            console.log('Failed to fetch route', err);
          }
        }
      } else {
        Alert.alert('Not Found', 'Could not find that destination.');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to search destination.');
    }
  };

  const handleGo = () => {
    if (!destinationCoords || !location) {
      Alert.alert('No Destination', 'Please search for a destination first.');
      return;
    }
    const url = `https://maps.google.com/?saddr=${location.coords.latitude},${location.coords.longitude}&daddr=${destinationCoords.latitude},${destinationCoords.longitude}`;
    if (Platform.OS !== 'web') {
      Linking.openURL(url);
    } else {
      window.open(url, '_blank');
    }
  };

  // Request & Watch Location
  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      // PROTOTYPE OVERRIDE: Force location to Mankhurd, Mumbai
      loc.coords.latitude = 19.0486;
      loc.coords.longitude = 72.9393;
      setLocation(loc);

      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 2000,
          distanceInterval: 1,
        },
        (newLocation) => {
          newLocation.coords.latitude = 19.0486;
          newLocation.coords.longitude = 72.9393;
          setLocation(newLocation);

          const lat = newLocation.coords.latitude;
          const lon = newLocation.coords.longitude;
          let inDanger = false;
          let dangerZoneName = '';

          for (const zone of KNOWN_ZONES) {
            if (zone.type === 'danger') {
              const dist = Math.sqrt(Math.pow(zone.latitude - lat, 2) + Math.pow(zone.longitude - lon, 2)) * 111320;
              if (dist < zone.radius) {
                inDanger = true;
                dangerZoneName = zone.name;
                break;
              }
            }
          }

          if (inDanger) {
            if (!globalDangerWarningTriggered) {
              Alert.alert('⚠️ RISK ALERT', `Community risk engine detected a high-risk area: ${dangerZoneName}. Keep SOS ready.`);
              globalDangerWarningTriggered = true;
            }
          } else {
            globalDangerWarningTriggered = false;
          }
        }
      );
    })();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  // Web Fallback render with rich Interactive Safety Map Overlay
  if (Platform.OS === 'web' || !MapView) {
    const lat = destinationCoords ? destinationCoords.latitude : (location ? location.coords.latitude : 19.0486);
    const lon = destinationCoords ? destinationCoords.longitude : (location ? location.coords.longitude : 72.9393);

    const iframeSrc = destinationCoords
      ? `https://maps.google.com/maps?saddr=${location?.coords.latitude || 19.0486},${location?.coords.longitude || 72.9393}&daddr=${destinationCoords.latitude},${destinationCoords.longitude}&output=embed`
      : `https://maps.google.com/maps?q=${lat},${lon}&z=15&output=embed`;

    return (
      <View style={styles.container}>
        <View style={{ flex: 1 }}>
          <iframe
            src={iframeSrc}
            style={{ width: '100%', height: '100%', border: 0 }}
            allowFullScreen
            loading="lazy"
          />
        </View>
        <MapOverlays
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          handleSearch={handleSearch}
          destinationName={destinationName}
          handleGo={handleGo}
          handleSelectCampus={handleSelectCampus}
          selectedCampusId={selectedCampusId}
          filteredReports={filteredReports}
          areaRiskAnalyses={areaRiskAnalyses}
          destinationRisk={destinationRisk}
          selectedRouteType={selectedRouteType}
          setSelectedRouteType={setSelectedRouteType}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          filterCampus={filterCampus}
          setFilterCampus={setFilterCampus}
          filterDate={filterDate}
          setFilterDate={setFilterDate}
          filterRisk={filterRisk}
          setFilterRisk={setFilterRisk}
          showHeatmap={showHeatmap}
          setShowHeatmap={setShowHeatmap}
          showHighRiskZones={showHighRiskZones}
          setShowHighRiskZones={setShowHighRiskZones}
          showCommunityIncidents={showCommunityIncidents}
          setShowCommunityIncidents={setShowCommunityIncidents}
          showVerifiedIncidents={showVerifiedIncidents}
          setShowVerifiedIncidents={setShowVerifiedIncidents}
          showFilterDrawer={showFilterDrawer}
          setShowFilterDrawer={setShowFilterDrawer}
          selectedRiskAnalysis={selectedRiskAnalysis}
          setSelectedRiskAnalysis={setSelectedRiskAnalysis}
          setFocusedReport={setFocusedReport}
        />
      </View>
    );
  }

  // Native react-native-maps render
  return (
    <View style={styles.container}>
      <MapView
        style={styles.realMap}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: destinationCoords ? destinationCoords.latitude : (location ? location.coords.latitude : 19.0486),
          longitude: destinationCoords ? destinationCoords.longitude : (location ? location.coords.longitude : 72.9393),
          latitudeDelta: destinationCoords ? 0.03 : 0.0922,
          longitudeDelta: destinationCoords ? 0.03 : 0.0421,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
        customMapStyle={mapStyle}
      >
        {/* Render University & Campus Geofences */}
        {colleges.map((col: any) =>
          (col.campuses || []).map((campus: any) => {
            const campusReports = filteredReports.filter(r => r.campusId === campus.id);
            return (
              <React.Fragment key={campus.id}>
                <Circle
                  center={{ latitude: campus.latitude, longitude: campus.longitude }}
                  radius={campus.radius}
                  fillColor={col.color + '20'}
                  strokeColor={col.color}
                  strokeWidth={2}
                />
                <Marker
                  coordinate={{ latitude: campus.latitude, longitude: campus.longitude }}
                  title={`🎓 ${campus.name}`}
                  description={`${col.name} Security Geofence (${campusReports.length} Incidents)`}
                  pinColor={col.color}
                />
              </React.Fragment>
            );
          })
        )}

        {/* COMMUNITY-BASED RISK DETECTION SAFETY HEATMAP LAYER */}
        {showHeatmap && areaRiskAnalyses.map((analysis, idx) => {
          const styleInfo = getRiskLevelColor(analysis.riskLevel);
          const radius = 500 + analysis.riskScore * 10;

          return (
            <React.Fragment key={`risk-heat-${idx}`}>
              <Circle
                center={{ latitude: analysis.latitude, longitude: analysis.longitude }}
                radius={radius}
                fillColor={styleInfo.bg + '70'}
                strokeColor={styleInfo.border}
                strokeWidth={2}
              />
              <Marker
                coordinate={{ latitude: analysis.latitude, longitude: analysis.longitude }}
                title={`🔥 Area Risk Score: ${analysis.riskScore}/100 (${analysis.riskLevel} Risk)`}
                description={`${analysis.location} - ${analysis.incidentCount} Reports. Tap to view pattern reasons.`}
                pinColor={styleInfo.color}
                onPress={() => setSelectedRiskAnalysis(analysis)}
              />
            </React.Fragment>
          );
        })}

        {/* FILTERED INCIDENT REPORTS MARKERS */}
        {filteredReports.filter(r => r.latitude && r.longitude).map(report => {
          const isVerified = report.status === 'Verified' || report.workflowStage === 'Verified' || report.workflowStage === 'Action Taken';
          const isResolved = report.status === 'Resolved' || report.workflowStage === 'Resolved';

          let pinColor = Colors.medium;
          let labelPrefix = '👥 Community';

          if (isResolved) {
            pinColor = Colors.safe;
            labelPrefix = '✅ Resolved';
          } else if (isVerified) {
            pinColor = Colors.primary;
            labelPrefix = '🛡️ Verified';
          }

          return (
            <Marker
              key={report.id}
              coordinate={{ latitude: report.latitude!, longitude: report.longitude! }}
              title={`${labelPrefix}: ${report.type}`}
              description={`${report.location} - ${report.description}`}
              pinColor={pinColor}
              onPress={() => setFocusedReport(report)}
            />
          );
        })}

        {location && (
          <>
            {KNOWN_ZONES.map(zone => (
              <React.Fragment key={zone.id}>
                <Circle
                  center={{ latitude: zone.latitude, longitude: zone.longitude }}
                  radius={zone.radius}
                  fillColor={zone.type === 'danger' ? Colors.dangerLight : Colors.safeLight}
                  strokeColor={zone.type === 'danger' ? Colors.danger : Colors.safe}
                  strokeWidth={2}
                />
                <Marker
                  coordinate={{ latitude: zone.latitude, longitude: zone.longitude }}
                  title={zone.name}
                  description={zone.type === 'danger' ? 'Identified High Risk Area' : 'Highly Guarded Area'}
                  pinColor={zone.type === 'danger' ? Colors.danger : Colors.safe}
                />
              </React.Fragment>
            ))}

            {destinationCoords && (
              <Marker
                coordinate={destinationCoords}
                title={destinationName}
                pinColor={Colors.primary}
              />
            )}

            {groupMembers.map(member => (
              <Marker
                key={member.id}
                coordinate={{ latitude: member.latitude, longitude: member.longitude }}
                title={member.name}
                description="Live safety sharing active"
                pinColor={Colors.primary}
              />
            ))}

            {routeCoords.length > 0 && Polyline && (
              <Polyline
                coordinates={routeCoords}
                strokeColor={selectedRouteType === 'safest' ? Colors.safe : Colors.primary}
                strokeWidth={6}
                lineDashPattern={[1]}
              />
            )}
          </>
        )}
      </MapView>

      <MapOverlays
        colleges={colleges}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleSearch={handleSearch}
        destinationName={destinationName}
        handleGo={handleGo}
        handleSelectCampus={handleSelectCampus}
        selectedCampusId={selectedCampusId}
        filteredReports={filteredReports}
        areaRiskAnalyses={areaRiskAnalyses}
        destinationRisk={destinationRisk}
        selectedRouteType={selectedRouteType}
        setSelectedRouteType={setSelectedRouteType}
        filterCategory={filterCategory}
        setFilterCategory={setFilterCategory}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterCampus={filterCampus}
        setFilterCampus={setFilterCampus}
        filterDate={filterDate}
        setFilterDate={setFilterDate}
        filterRisk={filterRisk}
        setFilterRisk={setFilterRisk}
        showHeatmap={showHeatmap}
        setShowHeatmap={setShowHeatmap}
        showHighRiskZones={showHighRiskZones}
        setShowHighRiskZones={setShowHighRiskZones}
        showCommunityIncidents={showCommunityIncidents}
        setShowCommunityIncidents={setShowCommunityIncidents}
        showVerifiedIncidents={showVerifiedIncidents}
        setShowVerifiedIncidents={setShowVerifiedIncidents}
        showFilterDrawer={showFilterDrawer}
        setShowFilterDrawer={setShowFilterDrawer}
        selectedRiskAnalysis={selectedRiskAnalysis}
        setSelectedRiskAnalysis={setSelectedRiskAnalysis}
        setFocusedReport={setFocusedReport}
      />
    </View>
  );
}

// Extracted shared Overlays for Web & Native
const MapOverlays = ({
  colleges = [],
  searchQuery,
  setSearchQuery,
  handleSearch,
  destinationName,
  handleGo,
  handleSelectCampus,
  selectedCampusId,
  filteredReports,
  areaRiskAnalyses,
  destinationRisk,
  selectedRouteType,
  setSelectedRouteType,
  filterCategory,
  setFilterCategory,
  filterStatus,
  setFilterStatus,
  filterCampus,
  setFilterCampus,
  filterDate,
  setFilterDate,
  filterRisk,
  setFilterRisk,
  showHeatmap,
  setShowHeatmap,
  showHighRiskZones,
  setShowHighRiskZones,
  showCommunityIncidents,
  setShowCommunityIncidents,
  showVerifiedIncidents,
  setShowVerifiedIncidents,
  showFilterDrawer,
  setShowFilterDrawer,
  selectedRiskAnalysis,
  setSelectedRiskAnalysis,
  setFocusedReport,
}: any) => {
  const styles = getStyles();

  const communityCount = filteredReports.filter((r: any) => r.status === 'Pending' || r.workflowStage === 'Submitted').length;
  const verifiedCount = filteredReports.filter((r: any) => r.status === 'Verified' || r.workflowStage === 'Verified' || r.workflowStage === 'Action Taken').length;
  const resolvedCount = filteredReports.filter((r: any) => r.status === 'Resolved' || r.workflowStage === 'Resolved').length;

  return (
    <>
      {/* Top Search Bar Overlay */}
      <View style={styles.searchBar}>
        <FontAwesome5 name="search" size={16} color={Colors.textSecondary} style={{ marginRight: 12 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search campus or destination..."
          placeholderTextColor={Colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.voiceIcon} onPress={handleSearch}>
          <FontAwesome5 name="arrow-right" size={16} color={Colors.primary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterToggleBtn, showFilterDrawer && styles.filterToggleBtnActive]}
          onPress={() => setShowFilterDrawer(!showFilterDrawer)}
        >
          <FontAwesome5 name="sliders-h" size={14} color={showFilterDrawer ? Colors.white : Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Quick Campus Focus Bar Overlay */}
      <View style={styles.campusMapOverlay}>
        <Text style={styles.campusOverlayTitle}>🎓 Campus Safety Maps:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 10 }}>
          <TouchableOpacity
            style={[styles.campusMapChip, filterCampus === 'all' && styles.campusMapChipActive]}
            onPress={() => setFilterCampus('all')}
          >
            <FontAwesome5 name="globe" size={10} color={filterCampus === 'all' ? Colors.white : Colors.textSecondary} style={{ marginRight: 4 }} />
            <Text style={[styles.campusMapChipText, filterCampus === 'all' && styles.campusMapChipTextActive]}>
              All Campuses ({filteredReports.length})
            </Text>
          </TouchableOpacity>

          {(colleges || []).flatMap((col: any) => (col.campuses || []).map((cp: any) => ({ ...cp, colName: col.shortName, colColor: col.color, colId: col.id }))).map((cp: any) => {
            const isSelected = selectedCampusId === cp.id || filterCampus === cp.id;
            const count = filteredReports.filter((r: any) => r.campusId === cp.id).length;
            return (
              <TouchableOpacity
                key={cp.id}
                style={[
                  styles.campusMapChip,
                  isSelected && { backgroundColor: cp.colColor, borderColor: cp.colColor }
                ]}
                onPress={() => handleSelectCampus(cp.id, cp.colId, cp.latitude, cp.longitude, cp.name)}
              >
                <FontAwesome5 name="graduation-cap" size={10} color={isSelected ? Colors.white : cp.colColor} style={{ marginRight: 4 }} />
                <Text style={[styles.campusMapChipText, isSelected && { color: Colors.white, fontWeight: 'bold' }]}>
                  {cp.colName} - {cp.name} ({count})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* ADVANCED SAFETY MAP FILTERS DRAWER */}
      {showFilterDrawer && (
        <View style={styles.filterDrawerCard}>
          <View style={styles.filterDrawerHeader}>
            <FontAwesome5 name="filter" size={14} color={Colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.filterDrawerTitle}>Risk Detection & Map Filters</Text>
            <View style={{ flex: 1 }} />
            <TouchableOpacity onPress={() => setShowFilterDrawer(false)}>
              <FontAwesome5 name="times" size={14} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Quick Display Layer Toggles */}
          <View style={styles.layerToggleRow}>
            <TouchableOpacity
              style={[styles.layerChip, showHeatmap && styles.layerChipActive]}
              onPress={() => setShowHeatmap(!showHeatmap)}
            >
              <FontAwesome5 name="fire" size={11} color={showHeatmap ? Colors.white : Colors.danger} style={{ marginRight: 4 }} />
              <Text style={[styles.layerChipText, showHeatmap && { color: Colors.white }]}>Heatmap</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.layerChip, showHighRiskZones && styles.layerChipActive]}
              onPress={() => setShowHighRiskZones(!showHighRiskZones)}
            >
              <FontAwesome5 name="exclamation-triangle" size={11} color={showHighRiskZones ? Colors.white : Colors.danger} style={{ marginRight: 4 }} />
              <Text style={[styles.layerChipText, showHighRiskZones && { color: Colors.white }]}>Hotspots</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.layerChip, showCommunityIncidents && styles.layerChipActive]}
              onPress={() => setShowCommunityIncidents(!showCommunityIncidents)}
            >
              <FontAwesome5 name="users" size={11} color={showCommunityIncidents ? Colors.white : Colors.medium} style={{ marginRight: 4 }} />
              <Text style={[styles.layerChipText, showCommunityIncidents && { color: Colors.white }]}>Community</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.layerChip, showVerifiedIncidents && styles.layerChipActive]}
              onPress={() => setShowVerifiedIncidents(!showVerifiedIncidents)}
            >
              <FontAwesome5 name="shield-alt" size={11} color={showVerifiedIncidents ? Colors.white : Colors.primary} style={{ marginRight: 4 }} />
              <Text style={[styles.layerChipText, showVerifiedIncidents && { color: Colors.white }]}>Verified</Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
            {/* Risk Classification Level Filter */}
            <View style={styles.filterChipGroup}>
              <Text style={styles.filterChipGroupLabel}>Risk Level:</Text>
              {(['all', 'critical', 'high', 'medium', 'low'] as const).map(rk => (
                <TouchableOpacity
                  key={rk}
                  style={[styles.miniChip, filterRisk === rk && styles.miniChipActive]}
                  onPress={() => setFilterRisk(rk)}
                >
                  <Text style={[styles.miniChipText, filterRisk === rk && styles.miniChipTextActive]}>
                    {rk === 'all' ? 'All Risks' : rk === 'critical' ? '🚨 Critical' : rk === 'high' ? '🟧 High' : rk === 'medium' ? '🟡 Medium' : '🟢 Low'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Status Filter */}
            <View style={styles.filterChipGroup}>
              <Text style={styles.filterChipGroupLabel}>Status:</Text>
              {(['all', 'community', 'verified', 'resolved'] as const).map(st => (
                <TouchableOpacity
                  key={st}
                  style={[styles.miniChip, filterStatus === st && styles.miniChipActive]}
                  onPress={() => setFilterStatus(st)}
                >
                  <Text style={[styles.miniChipText, filterStatus === st && styles.miniChipTextActive]}>
                    {st === 'all' ? 'All Status' : st === 'community' ? '👥 Community' : st === 'verified' ? '🛡️ Verified' : '✅ Resolved'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Category Filter */}
            <View style={styles.filterChipGroup}>
              <Text style={styles.filterChipGroupLabel}>Category:</Text>
              <TouchableOpacity
                style={[styles.miniChip, filterCategory === 'all' && styles.miniChipActive]}
                onPress={() => setFilterCategory('all')}
              >
                <Text style={[styles.miniChipText, filterCategory === 'all' && styles.miniChipTextActive]}>All Categories</Text>
              </TouchableOpacity>
              {INCIDENT_CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.miniChip, filterCategory === cat.id && { backgroundColor: cat.color, borderColor: cat.color }]}
                  onPress={() => setFilterCategory(filterCategory === cat.id ? 'all' : cat.id)}
                >
                  <Text style={[styles.miniChipText, filterCategory === cat.id && { color: Colors.white, fontWeight: 'bold' }]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* MAP LEGEND OVERLAY */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#DC2626' }]} />
          <Text style={styles.legendText}>Critical Risk (85+)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#EA580C' }]} />
          <Text style={styles.legendText}>High Risk (60-84)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#D97706' }]} />
          <Text style={styles.legendText}>Medium Risk (30-59)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: '#16A34A' }]} />
          <Text style={styles.legendText}>Low Risk (0-29)</Text>
        </View>
      </View>

      {/* BOTTOM INSIGHTS & SAFE ROUTE RECOMMENDATIONS SHEET */}
      <View style={styles.bottomSheet}>
        <View style={styles.dragHandle} />

        {/* COMMUNITY-BASED RISK DETECTION HOTSPOTS CAROUSEL */}
        <Text style={styles.hotspotsSectionTitle}>🔥 Community Area Risk Scores & Patterns:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {areaRiskAnalyses.length === 0 ? (
            <Text style={{ fontSize: 11, color: Colors.textSecondary }}>No risk patterns detected for current filters.</Text>
          ) : (
            areaRiskAnalyses.map((analysis: AreaRiskAnalysis, idx: number) => {
              const styleInfo = getRiskLevelColor(analysis.riskLevel);
              return (
                <TouchableOpacity
                  key={idx}
                  style={[styles.hotspotCardMini, { borderColor: styleInfo.border, backgroundColor: styleInfo.bg + '40' }]}
                  onPress={() => setSelectedRiskAnalysis(analysis)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
                    <Text style={styles.hotspotMiniTitle} numberOfLines={1}>📍 {analysis.location}</Text>
                    <View style={[styles.riskBadgeMini, { backgroundColor: styleInfo.bg }]}>
                      <Text style={[styles.riskBadgeMiniText, { color: styleInfo.color }]}>
                        {analysis.riskScore}/100
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.hotspotMiniSub, { color: styleInfo.color }]}>
                    {analysis.riskLevel.toUpperCase()} RISK • {analysis.incidentCount} Report(s)
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>

        {/* RISK INFLUENCE ON SAFE ROUTE RECOMMENDATION */}
        {destinationRisk && (destinationRisk.riskLevel === 'High' || destinationRisk.riskLevel === 'Critical') && (
          <View style={styles.riskRouteWarningBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <FontAwesome5 name="exclamation-triangle" size={14} color="#DC2626" style={{ marginRight: 6 }} />
              <Text style={styles.riskRouteWarningTitle}>
                AREA RISK WARNING: {destinationRisk.location} ({destinationRisk.riskScore}/100 Risk Score)
              </Text>
            </View>
            <Text style={styles.riskRouteWarningBody}>
              ⚠️ Pattern Detected: {destinationRisk.reasons[0]} We strongly recommend taking the Guarded Safest Route.
            </Text>
          </View>
        )}

        <View style={styles.routeHeaderRow}>
          <Text style={styles.sheetTitle}>Safe Route Recommendations</Text>
          <View style={styles.routeToggleBox}>
            <TouchableOpacity
              style={[styles.routeToggleBtn, selectedRouteType === 'safest' && styles.routeToggleBtnActive]}
              onPress={() => setSelectedRouteType('safest')}
            >
              <FontAwesome5 name="shield-alt" size={10} color={selectedRouteType === 'safest' ? Colors.white : Colors.safe} style={{ marginRight: 4 }} />
              <Text style={[styles.routeToggleText, selectedRouteType === 'safest' && { color: Colors.white }]}>Safest</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.routeToggleBtn, selectedRouteType === 'fastest' && { backgroundColor: Colors.primary }]}
              onPress={() => setSelectedRouteType('fastest')}
            >
              <FontAwesome5 name="bolt" size={10} color={selectedRouteType === 'fastest' ? Colors.white : Colors.primary} style={{ marginRight: 4 }} />
              <Text style={[styles.routeToggleText, selectedRouteType === 'fastest' && { color: Colors.white }]}>Fastest</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.routeOption}>
          <View style={styles.routeInfo}>
            <View style={styles.routeHeader}>
              <Text style={styles.routeTime}>{selectedRouteType === 'safest' ? '15 min' : '11 min'}</Text>
              <View style={[styles.badge, { backgroundColor: selectedRouteType === 'safest' ? Colors.safeLight : Colors.primaryLight }]}>
                <Text style={[styles.badgeText, { color: selectedRouteType === 'safest' ? Colors.safe : Colors.primary }]}>
                  {selectedRouteType === 'safest' ? '🛡️ Guarded Safest Route' : '⚡ Direct Route'}
                </Text>
              </View>
            </View>
            <Text style={styles.routeDesc}>
              {destinationName ? `To: ${destinationName}` : 'via Main Guarded Corridor & Police Checkpoints'}
            </Text>
          </View>
          <TouchableOpacity style={styles.goButton} onPress={handleGo}>
            <Text style={styles.goButtonText}>GO</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* COMMUNITY RISK REASON & PATTERN ANALYSIS MODAL */}
      {selectedRiskAnalysis && (
        <Modal
          visible={!!selectedRiskAnalysis}
          transparent
          animationType="slide"
          onRequestClose={() => setSelectedRiskAnalysis(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeaderRow}>
                <FontAwesome5 name="shield-virus" size={22} color={getRiskLevelColor(selectedRiskAnalysis.riskLevel).color} style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>Community Risk Analysis</Text>
                  <Text style={styles.modalSub}>{selectedRiskAnalysis.location}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedRiskAnalysis(null)}>
                  <FontAwesome5 name="times" size={18} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.scoreDisplayCard}>
                <View style={styles.scoreGaugeBox}>
                  <Text style={[styles.scoreGaugeNum, { color: getRiskLevelColor(selectedRiskAnalysis.riskLevel).color }]}>
                    {selectedRiskAnalysis.riskScore}
                  </Text>
                  <Text style={styles.scoreGaugeDenom}>/100</Text>
                </View>

                <View style={{ flex: 1, marginLeft: 14 }}>
                  <View style={[styles.riskLevelBadge, { backgroundColor: getRiskLevelColor(selectedRiskAnalysis.riskLevel).bg }]}>
                    <Text style={[styles.riskLevelBadgeText, { color: getRiskLevelColor(selectedRiskAnalysis.riskLevel).color }]}>
                      CLASSIFIED RISK: {selectedRiskAnalysis.riskLevel.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.scoreMetaText}>
                    📊 Aggregated Reports: <Text style={{ fontWeight: 'bold', color: Colors.text }}>{selectedRiskAnalysis.incidentCount}</Text>
                  </Text>
                  <Text style={styles.scoreMetaText}>
                    🕒 Last 24h Reports: <Text style={{ fontWeight: 'bold', color: Colors.text }}>{selectedRiskAnalysis.recentCount24h}</Text>
                  </Text>
                </View>
              </View>

              {/* Score Reasons & Pattern Explanations */}
              <Text style={styles.reasonsTitle}>🔍 Risk Score Breakdown & Pattern Reasons:</Text>
              <View style={styles.reasonsBox}>
                {selectedRiskAnalysis.reasons.map((reason: string, idx: number) => (
                  <View key={idx} style={styles.reasonItemRow}>
                    <FontAwesome5 name="angle-right" size={12} color={Colors.primary} style={{ marginRight: 8, marginTop: 2 }} />
                    <Text style={styles.reasonText}>{reason}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setSelectedRiskAnalysis(null)}
              >
                <Text style={styles.modalCloseBtnText}>Close Risk Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
};

const getStyles = () =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    realMap: {
      width: '100%',
      height: '100%',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    searchBar: {
      position: 'absolute',
      top: 20,
      left: 16,
      right: 16,
      backgroundColor: Colors.card,
      height: 50,
      borderRadius: 25,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      elevation: 4,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    searchInput: {
      flex: 1,
      color: Colors.text,
      fontSize: 14,
      height: '100%',
    },
    voiceIcon: {
      padding: 8,
    },
    filterToggleBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: Colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 6,
    },
    filterToggleBtnActive: {
      backgroundColor: Colors.primary,
    },
    campusMapOverlay: {
      position: 'absolute',
      top: 78,
      left: 12,
      right: 12,
      backgroundColor: Colors.card + 'F2',
      paddingVertical: 8,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: Colors.border,
      elevation: 3,
    },
    campusOverlayTitle: {
      fontSize: 11,
      fontWeight: 'bold',
      color: Colors.text,
      marginLeft: 12,
      marginBottom: 6,
    },
    campusMapChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.background,
      borderWidth: 1,
      borderColor: Colors.border,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 12,
      marginRight: 6,
    },
    campusMapChipActive: {
      backgroundColor: Colors.primary,
      borderColor: Colors.primary,
    },
    campusMapChipText: {
      fontSize: 11,
      fontWeight: '600',
      color: Colors.text,
    },
    campusMapChipTextActive: {
      color: Colors.white,
      fontWeight: 'bold',
    },
    filterDrawerCard: {
      position: 'absolute',
      top: 140,
      left: 12,
      right: 12,
      backgroundColor: Colors.card + 'F8',
      padding: 12,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: Colors.primary,
      elevation: 5,
    },
    filterDrawerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    filterDrawerTitle: {
      fontSize: 12,
      fontWeight: 'bold',
      color: Colors.text,
    },
    layerToggleRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6,
      marginBottom: 8,
    },
    layerChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.background,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    layerChipActive: {
      backgroundColor: Colors.primary,
      borderColor: Colors.primary,
    },
    layerChipText: {
      fontSize: 10,
      fontWeight: 'bold',
      color: Colors.text,
    },
    filterChipGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.background,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    filterChipGroupLabel: {
      fontSize: 10,
      fontWeight: 'bold',
      color: Colors.textSecondary,
      marginRight: 6,
    },
    miniChip: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      backgroundColor: Colors.card,
      marginRight: 4,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    miniChipActive: {
      backgroundColor: Colors.primary,
      borderColor: Colors.primary,
    },
    miniChipText: {
      fontSize: 10,
      color: Colors.text,
    },
    miniChipTextActive: {
      color: Colors.white,
      fontWeight: 'bold',
    },
    legendContainer: {
      position: 'absolute',
      top: 145,
      right: 16,
      backgroundColor: Colors.card + 'EC',
      padding: 10,
      borderRadius: 12,
      elevation: 4,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    legendColor: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 6,
    },
    legendText: {
      fontSize: 10,
      color: Colors.text,
      fontWeight: '600',
    },
    bottomSheet: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: Colors.card,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      padding: 16,
      elevation: 10,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    dragHandle: {
      width: 36,
      height: 4,
      backgroundColor: Colors.border,
      borderRadius: 2,
      alignSelf: 'center',
      marginBottom: 12,
    },
    hotspotsSectionTitle: {
      fontSize: 12,
      fontWeight: 'bold',
      color: Colors.text,
      marginBottom: 6,
    },
    hotspotCardMini: {
      backgroundColor: Colors.background,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 10,
      marginRight: 8,
      borderWidth: 1,
      borderColor: Colors.border,
      minWidth: 140,
    },
    hotspotMiniTitle: {
      fontSize: 11,
      fontWeight: 'bold',
      color: Colors.text,
      flex: 1,
    },
    riskBadgeMini: {
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: 4,
    },
    riskBadgeMiniText: {
      fontSize: 9,
      fontWeight: 'bold',
    },
    hotspotMiniSub: {
      fontSize: 10,
      fontWeight: 'bold',
    },
    riskRouteWarningBox: {
      backgroundColor: '#FEE2E2',
      borderWidth: 1,
      borderColor: '#EF4444',
      padding: 10,
      borderRadius: 10,
      marginBottom: 10,
    },
    riskRouteWarningTitle: {
      fontSize: 11,
      fontWeight: 'bold',
      color: '#DC2626',
    },
    riskRouteWarningBody: {
      fontSize: 11,
      color: Colors.text,
      lineHeight: 15,
    },
    routeHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    sheetTitle: {
      fontSize: 15,
      fontWeight: 'bold',
      color: Colors.primary,
    },
    routeToggleBox: {
      flexDirection: 'row',
      backgroundColor: Colors.background,
      borderRadius: 8,
      padding: 2,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    routeToggleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    routeToggleBtnActive: {
      backgroundColor: Colors.safe,
    },
    routeToggleText: {
      fontSize: 10,
      fontWeight: 'bold',
    },
    routeOption: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: Colors.background,
      padding: 14,
      borderRadius: 14,
    },
    routeInfo: {
      flex: 1,
    },
    routeHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 2,
    },
    routeTime: {
      fontSize: 16,
      fontWeight: 'bold',
      color: Colors.primary,
      marginRight: 10,
    },
    badge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
    },
    badgeText: {
      fontSize: 11,
      fontWeight: 'bold',
    },
    routeDesc: {
      fontSize: 12,
      color: Colors.textSecondary,
    },
    goButton: {
      backgroundColor: Colors.safe,
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 12,
    },
    goButtonText: {
      color: Colors.white,
      fontWeight: 'bold',
      fontSize: 14,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    modalContent: {
      width: '100%',
      backgroundColor: Colors.card,
      borderRadius: 20,
      padding: 18,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    modalHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      color: Colors.text,
    },
    modalSub: {
      fontSize: 12,
      color: Colors.textSecondary,
    },
    scoreDisplayCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: Colors.background,
      padding: 12,
      borderRadius: 12,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    scoreGaugeBox: {
      flexDirection: 'row',
      alignItems: 'baseline',
      backgroundColor: Colors.card,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    scoreGaugeNum: {
      fontSize: 24,
      fontWeight: '900',
    },
    scoreGaugeDenom: {
      fontSize: 12,
      color: Colors.textSecondary,
      fontWeight: 'bold',
    },
    riskLevelBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      alignSelf: 'flex-start',
      marginBottom: 4,
    },
    riskLevelBadgeText: {
      fontSize: 10,
      fontWeight: 'bold',
    },
    scoreMetaText: {
      fontSize: 11,
      color: Colors.textSecondary,
    },
    reasonsTitle: {
      fontSize: 12,
      fontWeight: 'bold',
      color: Colors.text,
      marginBottom: 6,
    },
    reasonsBox: {
      backgroundColor: Colors.background,
      padding: 12,
      borderRadius: 12,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    reasonItemRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 6,
    },
    reasonText: {
      fontSize: 12,
      color: Colors.text,
      lineHeight: 16,
      flex: 1,
    },
    modalCloseBtn: {
      backgroundColor: Colors.primary,
      paddingVertical: 12,
      borderRadius: 12,
      alignItems: 'center',
    },
    modalCloseBtnText: {
      color: Colors.white,
      fontSize: 13,
      fontWeight: 'bold',
    },
  });

const mapStyle = [
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#747474' }],
  },
  {
    featureType: 'poi.business',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'road',
    elementType: 'geometry.fill',
    stylers: [{ color: '#ffffff' }],
  },
  {
    featureType: 'water',
    elementType: 'geometry.fill',
    stylers: [{ color: '#c8d7d4' }],
  },
];
