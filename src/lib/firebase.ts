import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query 
} from 'firebase/firestore';
import { Attendee } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

const ATTENDEES_COLLECTION = 'attendees';

// Subscribe to real-time list of attendees from Firestore
export const subscribeAttendees = (callback: (data: Attendee[]) => void) => {
  const q = query(collection(db, ATTENDEES_COLLECTION));
  return onSnapshot(q, (snapshot) => {
    const list: Attendee[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as Attendee);
    });
    // Sort by registeredAt desc
    list.sort((a, b) => (b.registeredAt || '').localeCompare(a.registeredAt || ''));
    callback(list);
  }, (err) => {
    console.error("Firestore attendees subscription error:", err);
  });
};

// Save single attendee to Firestore
export const saveAttendeeToFirestore = async (attendee: Attendee) => {
  try {
    const docId = attendee.id || `att_${attendee.participantCode.replace(/[^a-zA-Z0-9]/g, '_')}`;
    const docRef = doc(db, ATTENDEES_COLLECTION, docId);
    const dataToSave = {
      ...attendee,
      id: docId,
      updatedAt: new Date().toISOString()
    };
    await setDoc(docRef, dataToSave, { merge: true });
    return docId;
  } catch (err) {
    console.error("Error saving attendee to Firestore:", err);
  }
};

// Batch seed or bulk save attendees
export const saveAllAttendeesToFirestore = async (attendeesList: Attendee[]) => {
  try {
    for (const attendee of attendeesList) {
      await saveAttendeeToFirestore(attendee);
    }
  } catch (err) {
    console.error("Error bulk saving attendees to Firestore:", err);
  }
};

// Delete attendee from Firestore
export const deleteAttendeeFromFirestore = async (id: string) => {
  try {
    await deleteDoc(doc(db, ATTENDEES_COLLECTION, id));
  } catch (err) {
    console.error("Error deleting attendee from Firestore:", err);
  }
};
