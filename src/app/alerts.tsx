import { useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Colors } from '../constants/Colors';
import { FontAwesome5 } from '@expo/vector-icons';

const MOCK_ALERTS = [
  { id: '1', title: 'Approaching Risky Area', desc: 'You are 500m away from an area reported as unsafe at night.', type: 'danger', time: '10 mins ago' },
  { id: '2', title: 'Contact Safely Reached', desc: 'Alice Smith has reached their destination safely.', type: 'safe', time: '1 hour ago' },
  { id: '3', title: 'Route Updated', desc: 'A faster and safer route has been found.', type: 'info', time: '2 hours ago' },
];

export default function AlertsScreen() {
  const styles = getStyles();
  const [alerts, setAlerts] = useState(MOCK_ALERTS);

  return (
    <View style={styles.container}>
      <FlatList
        data={alerts}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.alertCard}>
            <View style={[
              styles.iconBox,
              item.type === 'danger' ? styles.iconDanger :
              item.type === 'safe' ? styles.iconSafe : styles.iconInfo
            ]}>
              <FontAwesome5 
                name={item.type === 'danger' ? 'exclamation-triangle' : item.type === 'safe' ? 'check-circle' : 'info-circle'} 
                size={20} 
                color={
                  item.type === 'danger' ? Colors.danger :
                  item.type === 'safe' ? Colors.safe : Colors.primary
                } 
              />
            </View>
            <View style={styles.alertInfo}>
              <Text style={styles.alertTitle}>{item.title}</Text>
              <Text style={styles.alertDesc}>{item.desc}</Text>
              <Text style={styles.alertTime}>{item.time}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const getStyles = () => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    padding: 16,
  },
  alertCard: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  iconDanger: {
    backgroundColor: Colors.dangerLight,
  },
  iconSafe: {
    backgroundColor: Colors.safeLight,
  },
  iconInfo: {
    backgroundColor: Colors.primaryLight,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  alertDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  alertTime: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  }
});
