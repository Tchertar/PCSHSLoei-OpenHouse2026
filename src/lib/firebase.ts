import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query,
  getDocFromServer
} from 'firebase/firestore';
import { ActivityItem, AdminUser, Attendee, AuditLog } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

const ATTENDEES_COLLECTION = 'attendees';
const ADMINS_COLLECTION = 'admins';
const ACTIVITIES_COLLECTION = 'activities';
const AUDIT_LOGS_COLLECTION = 'audit_logs';
const MAP_BUILDINGS_COLLECTION = 'map_buildings';
const SCHEDULES_COLLECTION = 'schedules';

// --- ATTENDEES ---
export const subscribeAttendees = (callback: (data: Attendee[]) => void) => {
  const q = query(collection(db, ATTENDEES_COLLECTION));
  return onSnapshot(q, (snapshot) => {
    const list: Attendee[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as Attendee);
    });
    list.sort((a, b) => (b.registeredAt || '').localeCompare(a.registeredAt || ''));
    callback(list);
  }, (err) => {
    console.error("Firestore attendees subscription error:", err);
  });
};

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

export const saveAllAttendeesToFirestore = async (attendeesList: Attendee[]) => {
  try {
    for (const attendee of attendeesList) {
      await saveAttendeeToFirestore(attendee);
    }
  } catch (err) {
    console.error("Error bulk saving attendees to Firestore:", err);
  }
};

export const deleteAttendeeFromFirestore = async (id: string) => {
  try {
    await deleteDoc(doc(db, ATTENDEES_COLLECTION, id));
  } catch (err) {
    console.error("Error deleting attendee from Firestore:", err);
  }
};

// --- ADMINS ---
export const subscribeAdmins = (callback: (data: AdminUser[]) => void) => {
  const q = query(collection(db, ADMINS_COLLECTION));
  return onSnapshot(q, (snapshot) => {
    const list: AdminUser[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as AdminUser);
    });
    callback(list);
  }, (err) => {
    console.error("Firestore admins subscription error:", err);
  });
};

export const saveAdminToFirestore = async (admin: AdminUser) => {
  try {
    const docId = admin.id || `adm_${admin.username}`;
    const docRef = doc(db, ADMINS_COLLECTION, docId);
    await setDoc(docRef, { ...admin, id: docId, updatedAt: new Date().toISOString() }, { merge: true });
    return docId;
  } catch (err) {
    console.error("Error saving admin to Firestore:", err);
  }
};

export const saveAllAdminsToFirestore = async (adminsList: AdminUser[]) => {
  try {
    for (const admin of adminsList) {
      await saveAdminToFirestore(admin);
    }
  } catch (err) {
    console.error("Error bulk saving admins to Firestore:", err);
  }
};

export const deleteAdminFromFirestore = async (id: string) => {
  try {
    await deleteDoc(doc(db, ADMINS_COLLECTION, id));
  } catch (err) {
    console.error("Error deleting admin from Firestore:", err);
  }
};

// --- ACTIVITIES ---
export const subscribeActivities = (callback: (data: ActivityItem[]) => void) => {
  const q = query(collection(db, ACTIVITIES_COLLECTION));
  return onSnapshot(q, (snapshot) => {
    const list: ActivityItem[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as ActivityItem);
    });
    callback(list);
  }, (err) => {
    console.error("Firestore activities subscription error:", err);
  });
};

export const saveActivityToFirestore = async (activity: ActivityItem) => {
  try {
    const docId = activity.id || `act_${Date.now()}`;
    const docRef = doc(db, ACTIVITIES_COLLECTION, docId);
    await setDoc(docRef, { ...activity, id: docId, updatedAt: new Date().toISOString() }, { merge: true });
    return docId;
  } catch (err) {
    console.error("Error saving activity to Firestore:", err);
  }
};

export const saveAllActivitiesToFirestore = async (activitiesList: ActivityItem[]) => {
  try {
    for (const activity of activitiesList) {
      await saveActivityToFirestore(activity);
    }
  } catch (err) {
    console.error("Error bulk saving activities to Firestore:", err);
  }
};

export const deleteActivityFromFirestore = async (id: string) => {
  try {
    await deleteDoc(doc(db, ACTIVITIES_COLLECTION, id));
  } catch (err) {
    console.error("Error deleting activity from Firestore:", err);
  }
};

// --- AUDIT LOGS ---
export const subscribeAuditLogs = (callback: (data: AuditLog[]) => void) => {
  const q = query(collection(db, AUDIT_LOGS_COLLECTION));
  return onSnapshot(q, (snapshot) => {
    const list: AuditLog[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as AuditLog);
    });
    list.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
    callback(list);
  }, (err) => {
    console.error("Firestore audit logs subscription error:", err);
  });
};

export const saveAuditLogToFirestore = async (log: AuditLog) => {
  try {
    const docId = log.id || `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const docRef = doc(db, AUDIT_LOGS_COLLECTION, docId);
    await setDoc(docRef, { ...log, id: docId }, { merge: true });
    return docId;
  } catch (err) {
    console.error("Error saving audit log to Firestore:", err);
  }
};

export const saveAllAuditLogsToFirestore = async (logsList: AuditLog[]) => {
  try {
    for (const log of logsList) {
      await saveAuditLogToFirestore(log);
    }
  } catch (err) {
    console.error("Error bulk saving audit logs to Firestore:", err);
  }
};

// --- MAP BUILDINGS ---
export const subscribeMapBuildings = (callback: (data: any[]) => void) => {
  const q = query(collection(db, MAP_BUILDINGS_COLLECTION));
  return onSnapshot(q, (snapshot) => {
    const list: any[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() });
    });
    callback(list);
  }, (err) => {
    console.error("Firestore map buildings subscription error:", err);
  });
};

export const saveMapBuildingToFirestore = async (b: any) => {
  try {
    const docId = b.id || `b_${Date.now()}`;
    const docRef = doc(db, MAP_BUILDINGS_COLLECTION, docId);
    await setDoc(docRef, { ...b, id: docId }, { merge: true });
    return docId;
  } catch (err) {
    console.error("Error saving map building to Firestore:", err);
  }
};

export const deleteMapBuildingFromFirestore = async (id: string) => {
  try {
    await deleteDoc(doc(db, MAP_BUILDINGS_COLLECTION, id));
  } catch (err) {
    console.error("Error deleting map building from Firestore:", err);
  }
};

// --- SCHEDULES ---
export const subscribeSchedules = (callback: (data: any[]) => void) => {
  const q = query(collection(db, SCHEDULES_COLLECTION));
  return onSnapshot(q, (snapshot) => {
    const list: any[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() });
    });
    callback(list);
  }, (err) => {
    console.error("Firestore schedules subscription error:", err);
  });
};

export const saveScheduleToFirestore = async (item: any) => {
  try {
    const docId = item.id || `sch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const docRef = doc(db, SCHEDULES_COLLECTION, docId);
    await setDoc(docRef, { ...item, id: docId }, { merge: true });
    return docId;
  } catch (err) {
    console.error("Error saving schedule item to Firestore:", err);
  }
};

export const saveAllSchedulesToFirestore = async (scheduleList: any[]) => {
  try {
    for (const item of scheduleList) {
      await saveScheduleToFirestore(item);
    }
  } catch (err) {
    console.error("Error bulk saving schedules to Firestore:", err);
  }
};

export const deleteScheduleFromFirestore = async (id: string) => {
  try {
    await deleteDoc(doc(db, SCHEDULES_COLLECTION, id));
  } catch (err) {
    console.error("Error deleting schedule item from Firestore:", err);
  }
};

// --- FIREBASE CONNECTION TEST ---
export interface FirebaseConnectionTestResult {
  success: boolean;
  message: string;
  projectId: string;
  databaseId: string;
  latencyMs: number;
  testedAt: string;
  canRead: boolean;
  canWrite: boolean;
  errorDetail?: string;
}

export const testFirebaseConnection = async (): Promise<FirebaseConnectionTestResult> => {
  const startTime = performance.now();
  const projectId = (firebaseConfig as any).projectId || 'N/A';
  const databaseId = (firebaseConfig as any).firestoreDatabaseId || '(default)';
  const nowTh = new Date().toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'medium' });

  try {
    const testDocRef = doc(db, '_connection_test_', 'status');
    const testData = {
      pingAt: new Date().toISOString(),
      agent: 'PCSHS Loei Admin Test',
    };

    // Test Write
    await setDoc(testDocRef, testData, { merge: true });

    // Test Read directly from server (bypassing offline cache)
    const snap = await getDocFromServer(testDocRef);

    const endTime = performance.now();
    const latencyMs = Math.round(endTime - startTime);

    if (snap.exists()) {
      // Clean up test doc
      deleteDoc(testDocRef).catch(() => {});

      return {
        success: true,
        message: 'เชื่อมต่อกับระบบฐานข้อมูล Firebase Firestore สำเร็จเรียบร้อย สามารถอ่านและเขียนข้อมูลได้ตามปกติ',
        projectId,
        databaseId,
        latencyMs,
        testedAt: nowTh,
        canRead: true,
        canWrite: true,
      };
    } else {
      return {
        success: false,
        message: 'ไม่พบการตอบสนองของเอกสารทดสอบจาก Firebase Firestore บนเซิร์ฟเวอร์',
        projectId,
        databaseId,
        latencyMs,
        testedAt: nowTh,
        canRead: false,
        canWrite: true,
      };
    }
  } catch (err: any) {
    const endTime = performance.now();
    const latencyMs = Math.round(endTime - startTime);
    console.error("Firebase connection test error:", err);
    return {
      success: false,
      message: err?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อกับ Firebase Firestore',
      projectId,
      databaseId,
      latencyMs,
      testedAt: nowTh,
      canRead: false,
      canWrite: false,
      errorDetail: err?.toString() || String(err),
    };
  }
};

