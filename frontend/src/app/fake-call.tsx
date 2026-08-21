import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView } from 'react-native';
import { Colors } from '../constants/Colors';
import { FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function FakeCallSetup() {
  const [callerName, setCallerName] = useState('Dad');
  const router = useRouter();

  const handleTrigger = (delaySeconds: number) => {
    if (delaySeconds === 0) {
      router.push(`/incoming-call?callerName=${encodeURIComponent(callerName)}`);
    } else {
      alert(`Fake call scheduled in ${delaySeconds} seconds. You can leave this app in the background.`);
      setTimeout(() => {
        router.push(`/incoming-call?callerName=${encodeURIComponent(callerName)}`);
      }, delaySeconds * 1000);
      router.push('/(tabs)');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Fake Call Settings</Text>
      <Text style={styles.subtitle}>Trigger a simulated incoming call to gracefully exit uncomfortable or dangerous situations.</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Caller Name</Text>
        <TextInput 
          style={styles.input}
          value={callerName}
          onChangeText={setCallerName}
          placeholder="e.g. Mom, Police, Boss"
          placeholderTextColor={Colors.textSecondary}
        />
      </View>

      <View style={styles.optionsContainer}>
        <Text style={styles.label}>Trigger Timing</Text>
        
        <Pressable style={styles.optionButton} onPress={() => handleTrigger(0)}>
          <FontAwesome5 name="bolt" size={20} color={Colors.primary} style={styles.icon} />
          <Text style={styles.optionText}>Trigger Now</Text>
        </Pressable>

        <Pressable style={styles.optionButton} onPress={() => handleTrigger(10)}>
          <FontAwesome5 name="clock" size={20} color={Colors.primary} style={styles.icon} />
          <Text style={styles.optionText}>In 10 Seconds</Text>
        </Pressable>

        <Pressable style={styles.optionButton} onPress={() => handleTrigger(60)}>
          <FontAwesome5 name="hourglass-half" size={20} color={Colors.primary} style={styles.icon} />
          <Text style={styles.optionText}>In 1 Minute</Text>
        </Pressable>

        <Pressable style={styles.optionButton} onPress={() => handleTrigger(300)}>
          <FontAwesome5 name="stopwatch" size={20} color={Colors.primary} style={styles.icon} />
          <Text style={styles.optionText}>In 5 Minutes</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 32,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 12,
  },
  input: {
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionsContainer: {
    flex: 1,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  icon: {
    width: 30,
  },
  optionText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  }
});
