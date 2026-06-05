import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Dimensions, TextInput, Alert, Linking } from 'react-native';
import { Colors } from '../../constants/Colors';
import { FontAwesome5 } from '@expo/vector-icons';
import * as Location from 'expo-location';

let MapView: any = null;
let Marker: any = null;
let Circle: any = null;
let Polyline: any = null;
if (Platform.OS !== 'web') {
  const Maps = require('react-native-maps');
  MapView = Maps.default;
  Marker = Maps.Marker;
  Circle = Maps.Circle;
  Polyline = Maps.Polyline;
}

let globalDangerWarningTriggered = false;

const MOCK_GROUP_MEMBERS = [
  { id: 'g1', name: 'Alex (Friend)', latOffset: 0.002, lonOffset: 0.001 },
  { id: 'g2', name: 'Sarah (Sister)', latOffset: -0.001, lonOffset: 0.003 },
  { id: 'g3', name: 'Mom', latOffset: -0.003, lonOffset: -0.002 },
];

// Real-world reference data based on crime databases and public reports
const KNOWN_ZONES = [
  // Delhi, India
  { id: 'd1', name: 'Bawana (High Crime Rate)', latitude: 28.7997, longitude: 77.0328, type: 'danger', radius: 1500 },
  { id: 'd2', name: 'Seelampur (High Incident Area)', latitude: 28.6640, longitude: 77.2714, type: 'danger', radius: 1200 },
  { id: 's1', name: 'Chanakyapuri (Diplomatic/Safe)', latitude: 28.5941, longitude: 77.1891, type: 'safe', radius: 2000 },
  { id: 's2', name: 'Hauz Khas (Monitored/Safe)', latitude: 28.5494, longitude: 77.2001, type: 'safe', radius: 1000 },
  
  // Mumbai, India
  { id: 'm1', name: 'Kurla West (High Transit Crime)', latitude: 19.0650, longitude: 72.8794, type: 'danger', radius: 1500 },
  { id: 'm2', name: 'Malabar Hill (High Security)', latitude: 18.9548, longitude: 72.7985, type: 'safe', radius: 1500 },
  
  // New York, USA
  { id: 'ny1', name: 'Brownsville (Historical High Crime)', latitude: 40.6609, longitude: -73.9083, type: 'danger', radius: 1000 },
  { id: 'ny2', name: 'Upper East Side (Low Crime)', latitude: 40.7736, longitude: -73.9566, type: 'safe', radius: 1500 }
];

export default function MapScreen() {
  const styles = getStyles();
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [destinationCoords, setDestinationCoords] = useState<{latitude: number, longitude: number} | null>(null);
  const [destinationName, setDestinationName] = useState<string>('');

  const [routeCoords, setRouteCoords] = useState<{latitude: number, longitude: number}[]>([]);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);

  useEffect(() => {
    if (!location) return;
    // Simulate real-time group tracking by updating their positions relative to user
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

        // Fetch the driving route using the free OSRM Directions API
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

  useEffect(() => {
    let locationSubscription: Location.LocationSubscription | null = null;
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      // Initial fast fetch
      let loc = await Location.getCurrentPositionAsync({});
      
      // PROTOTYPE OVERRIDE: Force location to Mhada Colony, Mankhurd, Mumbai
      loc.coords.latitude = 19.0486;
      loc.coords.longitude = 72.9393;
      
      setLocation(loc);

      // Setup continuous live tracking
      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 2000, // Update every 2 seconds
          distanceInterval: 1, // Or every 1 meter moved
        },
        (newLocation) => {
          // PROTOTYPE OVERRIDE: Keep it forced to Mankhurd
          newLocation.coords.latitude = 19.0486;
          newLocation.coords.longitude = 72.9393;
          setLocation(newLocation);
          
          // Unsafe Zone Detection Logic
          const lat = newLocation.coords.latitude;
          const lon = newLocation.coords.longitude;
          let inDanger = false;
          let dangerZoneName = '';

          for (const zone of KNOWN_ZONES) {
            if (zone.type === 'danger') {
              // Flat-earth distance approximation in meters
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
              Alert.alert('⚠️ WARNING', `You have entered a known high-risk area: ${dangerZoneName}. Stay alert and keep your SOS ready.`);
              globalDangerWarningTriggered = true;
            }
          } else {
            globalDangerWarningTriggered = false; // Reset when leaving danger zone
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

  // Web Fallback: Render an actual Google Maps iframe for web browsers
  if (Platform.OS === 'web' || !MapView) {
    const lat = location ? location.coords.latitude : 40.7128;
    const lon = location ? location.coords.longitude : -74.0060;
    
    // If destination exists, show directions
    const iframeSrc = destinationCoords 
      ? `https://maps.google.com/maps?saddr=${lat},${lon}&daddr=${destinationCoords.latitude},${destinationCoords.longitude}&output=embed`
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
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.realMap}
        initialRegion={{
          latitude: destinationCoords ? destinationCoords.latitude : (location ? location.coords.latitude : 37.78825),
          longitude: destinationCoords ? destinationCoords.longitude : (location ? location.coords.longitude : -122.4324),
          latitudeDelta: destinationCoords ? 0.05 : 0.0922,
          longitudeDelta: destinationCoords ? 0.05 : 0.0421,
        }}
        showsUserLocation={true}
        showsMyLocationButton={false}
        customMapStyle={mapStyle} // Optional dark/custom style
      >
        {location && (
          <>
            {/* Render Real-World Known Zones */}
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
                  description={zone.type === 'danger' ? 'Identified as a high-risk area' : 'Identified as a highly secure area'}
                  pinColor={zone.type === 'danger' ? Colors.danger : Colors.safe}
                />
              </React.Fragment>
            ))}

            {/* Render Local Simulated Zones relative to User GPS for Prototype Testing */}
            <Circle
              center={{
                latitude: location.coords.latitude + 0.006,
                longitude: location.coords.longitude + 0.005,
              }}
              radius={800}
              fillColor={Colors.safeLight}
              strokeColor={Colors.safe}
              strokeWidth={2}
            />
            <Marker 
              coordinate={{ latitude: location.coords.latitude + 0.006, longitude: location.coords.longitude + 0.005 }}
              title="Local Verified Safe Zone"
              description="Heavy CCTV and police patrol in your area"
              pinColor={Colors.safe}
            />

            <Circle
              center={{
                latitude: location.coords.latitude - 0.008,
                longitude: location.coords.longitude - 0.004,
              }}
              radius={600}
              fillColor={Colors.dangerLight}
              strokeColor={Colors.danger}
              strokeWidth={2}
            />
            <Marker 
              coordinate={{ latitude: location.coords.latitude - 0.008, longitude: location.coords.longitude - 0.004 }}
              title="Recent Incident Area"
              description="Multiple reports of petty theft recently"
              pinColor={Colors.danger}
            />

            {destinationCoords && (
              <Marker 
                coordinate={destinationCoords} 
                title={destinationName} 
                pinColor={Colors.danger}
              />
            )}

            {/* Render Group Members */}
            {groupMembers.map(member => (
              <Marker 
                key={member.id}
                coordinate={{ latitude: member.latitude, longitude: member.longitude }}
                title={member.name}
                description="Live location sharing active"
                pinColor={Colors.primary} 
              />
            ))}

            {/* Render the actual route path if available */}
            {routeCoords.length > 0 && Polyline && (
              <Polyline 
                coordinates={routeCoords}
                strokeColor={Colors.primary}
                strokeWidth={6}
                lineDashPattern={[1]}
              />
            )}
          </>
        )}
      </MapView>
      
      <MapOverlays 
        searchQuery={searchQuery} 
        setSearchQuery={setSearchQuery} 
        handleSearch={handleSearch} 
        destinationName={destinationName}
        handleGo={handleGo}
      />
    </View>
  );
}

// Extracted overlays so both Web and Mobile share the same UI components
const MapOverlays = ({ searchQuery, setSearchQuery, handleSearch, destinationName, handleGo }: any) => {
  const styles = getStyles();
  return (
  <>
    {/* Top Search Bar Overlay */}
    <View style={styles.searchBar}>
      <FontAwesome5 name="search" size={16} color={Colors.textSecondary} style={{ marginRight: 12 }} />
      <TextInput 
        style={styles.searchInput}
        placeholder="Search destination..."
        placeholderTextColor={Colors.textSecondary}
        value={searchQuery}
        onChangeText={setSearchQuery}
        onSubmitEditing={handleSearch}
        returnKeyType="search"
      />
      <TouchableOpacity style={styles.voiceIcon} onPress={handleSearch}>
        <FontAwesome5 name="arrow-right" size={16} color={Colors.primary} />
      </TouchableOpacity>
    </View>

    {/* Legend Overlay */}
    <View style={styles.legendContainer}>
      <View style={styles.legendItem}>
        <View style={[styles.legendColor, { backgroundColor: Colors.safe }]} />
        <Text style={styles.legendText}>Safe</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendColor, { backgroundColor: Colors.medium }]} />
        <Text style={styles.legendText}>Medium</Text>
      </View>
      <View style={styles.legendItem}>
        <View style={[styles.legendColor, { backgroundColor: Colors.danger }]} />
        <Text style={styles.legendText}>Risky</Text>
      </View>
    </View>

    {/* Bottom Route Suggestion Sheet */}
    <View style={styles.bottomSheet}>
      <View style={styles.dragHandle} />
      <Text style={styles.sheetTitle}>Suggested Routes</Text>
      
      <View style={styles.routeOption}>
        <View style={styles.routeInfo}>
          <View style={styles.routeHeader}>
            <Text style={styles.routeTime}>15 min</Text>
            <View style={[styles.badge, { backgroundColor: Colors.safeLight }]}>
              <Text style={[styles.badgeText, { color: Colors.safe }]}>Safest Route</Text>
            </View>
          </View>
          <Text style={styles.routeDesc}>
            {destinationName ? `To: ${destinationName}` : 'via Main St & 5th Ave'}
          </Text>
        </View>
        <TouchableOpacity style={styles.goButton} onPress={handleGo}>
          <Text style={styles.goButtonText}>GO</Text>
        </TouchableOpacity>
      </View>
    </View>
  </>
  );
};

const getStyles = () => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  realMap: {
    ...StyleSheet.absoluteFillObject,
  },
  mapMock: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeZone: {
    position: 'absolute',
    top: '20%',
    left: '10%',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: Colors.safeLight,
    borderWidth: 1,
    borderColor: Colors.safeMedium,
  },
  dangerZone: {
    position: 'absolute',
    bottom: '30%',
    right: '5%',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: Colors.dangerMedium,
  },
  userMarker: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    borderWidth: 3,
    borderColor: Colors.white,
    zIndex: 2,
  },
  markerPulse: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primaryMedium,
    zIndex: 1,
  },
  searchBar: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    backgroundColor: Colors.card,
    height: 50,
    borderRadius: 25,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 16,
    height: '100%',
  },
  voiceIcon: {
    padding: 8,
  },
  legendContainer: {
    position: 'absolute',
    top: 90,
    right: 20,
    backgroundColor: Colors.card,
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: '500',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  dragHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 16,
  },
  routeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: 16,
  },
  routeInfo: {
    flex: 1,
  },
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  routeTime: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
    marginRight: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  routeDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  goButton: {
    backgroundColor: Colors.safe,
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 16,
  },
  goButtonText: {
    color: Colors.white,
    fontWeight: 'bold',
    fontSize: 16,
  }
});

// Optional map styling to match the clean aesthetic
const mapStyle = [
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#747474"}]
  },
  {
    "featureType": "poi.business",
    "stylers": [{"visibility": "off"}]
  },
  {
    "featureType": "road",
    "elementType": "geometry.fill",
    "stylers": [{"color": "#ffffff"}]
  },
  {
    "featureType": "water",
    "elementType": "geometry.fill",
    "stylers": [{"color": "#c8d7d4"}]
  }
];
