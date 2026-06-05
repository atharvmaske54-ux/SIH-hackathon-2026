import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Colors } from '../constants/Colors';
import { FontAwesome5 } from '@expo/vector-icons';
import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { useRouter } from 'expo-router';

export default function ContactsScreen() {
  const styles = getStyles();
  const router = useRouter();
  const { contacts, addContact, removeContact, editContact } = useAppContext();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relation, setRelation] = useState('');

  const handleEdit = (contact: any) => {
    setEditingId(contact.id);
    setName(contact.name);
    setPhone(contact.phone);
    setRelation(contact.relation);
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!name || !phone) {
      Alert.alert('Error', 'Name and Phone are required');
      return;
    }
    if (editingId) {
      editContact(editingId, { name, phone, relation });
    } else {
      addContact({ name, phone, relation });
    }
    setName('');
    setPhone('');
    setRelation('');
    setEditingId(null);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addBtn} onPress={() => {
        setEditingId(null);
        setName('');
        setPhone('');
        setRelation('');
        setModalVisible(true);
      }}>
        <FontAwesome5 name="user-plus" size={16} color={Colors.white} />
        <Text style={styles.addBtnText}>Add Trusted Contact</Text>
      </TouchableOpacity>

      {contacts.length === 0 ? (
        <Text style={{textAlign: 'center', marginTop: 20, color: Colors.textSecondary}}>No contacts added yet.</Text>
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
          <View style={styles.contactCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{item.name[0]}</Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{item.name}</Text>
              <Text style={styles.contactPhone}>{item.phone}</Text>
            </View>
            <TouchableOpacity style={styles.actionIcon}>
              <FontAwesome5 name="phone" size={18} color={Colors.safe} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionIcon} onPress={() => handleEdit(item)}>
              <FontAwesome5 name="edit" size={18} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionIcon} onPress={() => removeContact(item.id)}>
              <FontAwesome5 name="trash" size={18} color={Colors.danger} />
            </TouchableOpacity>
          </View>
        )}
      />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingId ? 'Edit Contact' : 'Add Contact'}</Text>
            
            <TextInput style={styles.input} placeholder="Name" placeholderTextColor={Colors.textSecondary} value={name} onChangeText={setName} />
            <TextInput style={styles.input} placeholder="Phone Number" placeholderTextColor={Colors.textSecondary} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <TextInput style={styles.input} placeholder="Relation (e.g. Family)" placeholderTextColor={Colors.textSecondary} value={relation} onChangeText={setRelation} />

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: Colors.border }]} onPress={() => setModalVisible(false)}>
                <Text style={{ color: Colors.text }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: Colors.primary }]} onPress={handleSave}>
                <Text style={{ color: Colors.white }}>{editingId ? 'Save' : 'Add'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const getStyles = () => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  addBtnText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  contactCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  contactPhone: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  actionIcon: {
    padding: 10,
    marginLeft: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.card,
    padding: 24,
    borderRadius: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    color: Colors.text,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 10,
  },
  modalBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  }
});
