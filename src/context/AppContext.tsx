import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setGlobalTheme } from '../constants/Colors';

export type Contact = {
  id: string;
  name: string;
  phone: string;
  relation: string;
};

export type User = {
  name: string;
  email: string;
  phone: string;
  address?: string;
};

type AppContextType = {
  user: User | null;
  setUser: (user: User | null) => void;
  contacts: Contact[];
  addContact: (contact: Omit<Contact, 'id'>) => void;
  editContact: (id: string, contact: Omit<Contact, 'id'>) => void;
  removeContact: (id: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    // Load data from async storage
    const loadData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        const storedContacts = await AsyncStorage.getItem('contacts');
        const storedTheme = await AsyncStorage.getItem('appTheme') as 'light' | 'dark';
        
        if (storedUser) setUser(JSON.parse(storedUser));
        if (storedContacts) setContacts(JSON.parse(storedContacts));
        
        if (storedTheme) {
          setTheme(storedTheme);
          setGlobalTheme(storedTheme);
        } else {
          setGlobalTheme('dark');
        }
      } catch (e) {
        console.error('Failed to load data', e);
      }
    };
    loadData();
  }, []);

  const saveUser = async (newUser: User | null) => {
    setUser(newUser);
    if (newUser) {
      await AsyncStorage.setItem('user', JSON.stringify(newUser));
    } else {
      await AsyncStorage.removeItem('user');
    }
  };

  const addContact = async (contactInfo: Omit<Contact, 'id'>) => {
    const newContact = { ...contactInfo, id: Date.now().toString() };
    const updated = [...contacts, newContact];
    setContacts(updated);
    await AsyncStorage.setItem('contacts', JSON.stringify(updated));
  };

  const removeContact = async (id: string) => {
    const updated = contacts.filter(c => c.id !== id);
    setContacts(updated);
    await AsyncStorage.setItem('contacts', JSON.stringify(updated));
  };

  const editContact = async (id: string, contactInfo: Omit<Contact, 'id'>) => {
    const updated = contacts.map(c => c.id === id ? { ...contactInfo, id } : c);
    setContacts(updated);
    await AsyncStorage.setItem('contacts', JSON.stringify(updated));
  };

  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    setGlobalTheme(newTheme);
    await AsyncStorage.setItem('appTheme', newTheme);
  };

  return (
    <AppContext.Provider value={{ user, setUser: saveUser, contacts, addContact, editContact, removeContact, theme, toggleTheme }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
