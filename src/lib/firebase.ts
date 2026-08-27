import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query,
  getDocs,
  getDocFromServer
} from 'firebase/firestore';
import { ActivityItem, AdminUser, Attendee, AuditLog, Coordinator, NewUserRegistration, SchoolStudent } from '../types';
import firebaseConfig from '../../firebase-applet-config.json';
import defaultSchoolStudentsData from '../data/schoolStudentsData.json';

const defaultSchoolStudents = (defaultSchoolStudentsData || []) as SchoolStudent[];

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

const ATTENDEES_COLLECTION = 'attendees';
const COORDINATORS_COLLECTION = 'coordinators';
const SCHOOL_STUDENTS_COLLECTION = 'school_students';
const NEW_REGISTRATIONS_COLLECTION = 'new_registrations';
const ADMINS_COLLECTION = 'admins';
const ACTIVITIES_COLLECTION = 'activities';
const AUDIT_LOGS_COLLECTION = 'audit_logs';
const MAP_BUILDINGS_COLLECTION = 'map_buildings';
const SCHEDULES_COLLECTION = 'schedules';

// --- ATTENDEES ---

/**
 * Calculates next sequential participant code in format "PCSHS-0001", "PCSHS-0002", etc.
 */
export const getNextConsecutiveParticipantCode = (attendeesList: Attendee[]): string => {
  let maxSeq = 0;
  for (const a of attendeesList) {
    if (!a.participantCode) continue;
    const match = a.participantCode.match(/PCSHS(?:2026)?[-_]?(\d+)/i);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxSeq && num < 100000) {
        maxSeq = num;
      }
    }
  }
  const nextNum = maxSeq > 0 ? maxSeq + 1 : attendeesList.length + 1;
  return `PCSHS-${String(nextNum).padStart(4, '0')}`;
};

/**
 * Normalizes Thai phone numbers: if 9 digits, prepend '0' so it becomes a valid 10-digit number (e.g. 982847738 -> 0982847738).
 */
export const formatThaiPhoneNumber = (phone: string | number | undefined | null): string => {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.length === 9) {
    return `0${digits}`;
  }
  return digits;
};

/**
 * Ensures all attendees have valid participantCode and qrCodeData without overwriting user-provided custom codes.
 */
export const resequenceAllAttendees = (attendeesList: Attendee[]): Attendee[] => {
  return attendeesList.map((att) => {
    const rawCode = (att.participantCode || '').trim();
    const rawPhone = formatThaiPhoneNumber(att.phone);
    return {
      ...att,
      phone: rawPhone,
      participantCode: rawCode || att.id,
      qrCodeData: att.qrCodeData || rawCode || att.id,
    };
  });
};

export const getDeletedAttendeeIds = (): Set<string> => {
  const set = new Set<string>();
  try {
    const stored = localStorage.getItem('pcshs_deleted_attendee_ids');
    if (stored) {
      const parsed: string[] = JSON.parse(stored);
      parsed.forEach((id) => set.add(id));
    }
  } catch (e) {
    console.error('Error reading deleted attendee ids from localStorage:', e);
  }
  return set;
};

export const markAttendeeAsDeleted = (id: string) => {
  try {
    const current = getDeletedAttendeeIds();
    current.add(id);
    localStorage.setItem('pcshs_deleted_attendee_ids', JSON.stringify(Array.from(current)));
  } catch (e) {
    console.error('Error writing deleted attendee id to localStorage:', e);
  }
};

// Local storage backup for newly created/updated attendees
export const getLocallySavedAttendees = (): Record<string, Attendee> => {
  try {
    const stored = localStorage.getItem('pcshs_locally_saved_attendees');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Error reading local attendees:', e);
  }
  return {};
};

export const saveLocalAttendeeRecord = (attendee: Attendee) => {
  try {
    const current = getLocallySavedAttendees();
    current[attendee.id] = attendee;
    localStorage.setItem('pcshs_locally_saved_attendees', JSON.stringify(current));

    // Also update main cache immediately
    const rawCache = localStorage.getItem('pcshs_attendees');
    let cacheList: Attendee[] = rawCache ? JSON.parse(rawCache) : [];
    const idx = cacheList.findIndex((a) => a.id === attendee.id);
    if (idx >= 0) {
      cacheList[idx] = attendee;
    } else {
      cacheList = [attendee, ...cacheList];
    }
    localStorage.setItem('pcshs_attendees', JSON.stringify(cacheList));
  } catch (e) {
    console.error('Error writing local attendee:', e);
  }
};

export const removeLocalAttendeeRecord = (id: string) => {
  try {
    const current = getLocallySavedAttendees();
    if (current[id]) {
      delete current[id];
      localStorage.setItem('pcshs_locally_saved_attendees', JSON.stringify(current));
    }
    const rawCache = localStorage.getItem('pcshs_attendees');
    if (rawCache) {
      const cacheList: Attendee[] = JSON.parse(rawCache);
      const filtered = cacheList.filter((a) => a.id !== id);
      localStorage.setItem('pcshs_attendees', JSON.stringify(filtered));
    }
  } catch (e) {
    console.error('Error removing local attendee:', e);
  }
};

export const subscribeAttendees = (callback: (data: Attendee[]) => void) => {
  const q = query(collection(db, ATTENDEES_COLLECTION));
  return onSnapshot(
    q,
    (snapshot) => {
      const deletedSet = getDeletedAttendeeIds();
      const localMap = getLocallySavedAttendees();
      const mergedMap = new Map<string, Attendee>();

      // 1. Load remote docs from Firestore that are not in the deleted list
      snapshot.forEach((docSnap) => {
        if (!deletedSet.has(docSnap.id)) {
          const raw = { id: docSnap.id, ...docSnap.data() } as Attendee;
          mergedMap.set(docSnap.id, raw);
        }
      });

      // 2. Merge local records so offline / quota-limited writes are preserved
      Object.values(localMap).forEach((localAtt) => {
        if (deletedSet.has(localAtt.id)) return;
        const remoteAtt = mergedMap.get(localAtt.id);
        if (!remoteAtt) {
          mergedMap.set(localAtt.id, localAtt);
        } else {
          // If local has newer update timestamp, prefer local
          const localTime = localAtt.updatedAt || localAtt.registeredAt || '';
          const remoteTime = remoteAtt.updatedAt || remoteAtt.registeredAt || '';
          if (localTime >= remoteTime) {
            mergedMap.set(localAtt.id, { ...remoteAtt, ...localAtt });
          }
        }
      });

      const list = Array.from(mergedMap.values());
      const resequenced = resequenceAllAttendees(list);

      // Keep localStorage cache updated
      try {
        localStorage.setItem('pcshs_attendees', JSON.stringify(resequenced));
      } catch {}

      callback(resequenced);
    },
    (err) => {
      console.warn('Firestore attendees subscription fallback to local cache:', err);
      const deletedSet = getDeletedAttendeeIds();
      const localMap = getLocallySavedAttendees();
      const rawCache = localStorage.getItem('pcshs_attendees');
      let fallbackList: Attendee[] = rawCache ? JSON.parse(rawCache) : Object.values(localMap);
      fallbackList = fallbackList.filter((a) => !deletedSet.has(a.id));
      const resequenced = resequenceAllAttendees(fallbackList);
      callback(resequenced);
    }
  );
};

export const saveAttendeeToFirestore = async (attendee: Attendee) => {
  const codeStr = (attendee.participantCode || '').trim();
  const nameStr = `${attendee.prefix || ''}_${attendee.firstName || ''}_${attendee.lastName || ''}`.trim();
  
  const docId =
    attendee.id ||
    (codeStr
      ? `att_${codeStr.replace(/[^a-zA-Z0-9_\u0E00-\u0E7F-]/g, '_')}`
      : `att_${nameStr.replace(/[^a-zA-Z0-9_\u0E00-\u0E7F-]/g, '_') || Date.now()}`);

  const dataToSave: Attendee = {
    ...attendee,
    id: docId,
    participantCode: codeStr || docId,
    qrCodeData: attendee.qrCodeData || codeStr || docId,
    updatedAt: new Date().toISOString(),
  };

  // 1. Immediately store to local storage so it will NEVER be lost on refresh
  saveLocalAttendeeRecord(dataToSave);

  // 2. Write to Firebase Firestore in background with error safety
  try {
    const docRef = doc(db, ATTENDEES_COLLECTION, docId);
    await setDoc(docRef, dataToSave, { merge: true });
  } catch (err) {
    console.warn('Note: Could not write attendee to Firestore remote, persisted locally:', err);
  }

  return docId;
};

export const saveAllAttendeesToFirestore = async (
  attendeesList: Attendee[],
  replaceExisting: boolean = false
) => {
  try {
    if (replaceExisting) {
      await clearAllAttendeesFromFirestore();
    }
    for (const attendee of attendeesList) {
      await saveAttendeeToFirestore(attendee);
    }
  } catch (err) {
    console.error('Error bulk saving attendees to Firestore:', err);
  }
};

export const deleteAttendeeFromFirestore = async (id: string) => {
  // 1. Mark as deleted in persistent store
  markAttendeeAsDeleted(id);

  // 2. Remove from local store
  removeLocalAttendeeRecord(id);

  // 3. Attempt Firestore deletion with error safety
  try {
    await deleteDoc(doc(db, ATTENDEES_COLLECTION, id));
  } catch (err) {
    console.warn('Note: Could not delete doc from remote Firestore, marked locally deleted:', err);
  }
};

export const clearAllAttendeesFromFirestore = async () => {
  try {
    localStorage.removeItem('pcshs_attendees');
    localStorage.removeItem('pcshs_locally_saved_attendees');
    localStorage.setItem('pcshs_deleted_attendee_ids', JSON.stringify([]));

    // Delete remote documents
    const q = query(collection(db, ATTENDEES_COLLECTION));
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map((docSnap) =>
      deleteDoc(doc(db, ATTENDEES_COLLECTION, docSnap.id)).catch(() => {})
    );
    await Promise.all(deletePromises);
  } catch (err) {
    console.error('Error clearing all attendees:', err);
  }
};

// --- ADMINS ---
export const subscribeAdmins = (callback: (data: AdminUser[]) => void) => {
  const q = query(collection(db, ADMINS_COLLECTION));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: AdminUser[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as AdminUser);
      });
      if (list.length > 0) {
        try {
          localStorage.setItem('pcshs_admins', JSON.stringify(list));
        } catch {}
      }
      callback(list);
    },
    (err) => {
      console.warn('Firestore admins subscription fallback:', err);
      try {
        const raw = localStorage.getItem('pcshs_admins');
        if (raw) callback(JSON.parse(raw));
      } catch {}
    }
  );
};

export const saveAdminToFirestore = async (admin: AdminUser) => {
  const docId = admin.id || `adm_${admin.username}`;
  const dataToSave = { ...admin, id: docId, updatedAt: new Date().toISOString() };

  try {
    const raw = localStorage.getItem('pcshs_admins');
    let list: AdminUser[] = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex((a) => a.id === docId);
    if (idx >= 0) list[idx] = dataToSave;
    else list.push(dataToSave);
    localStorage.setItem('pcshs_admins', JSON.stringify(list));
  } catch {}

  try {
    const docRef = doc(db, ADMINS_COLLECTION, docId);
    await setDoc(docRef, dataToSave, { merge: true });
    return docId;
  } catch (err) {
    console.warn('Note: Could not save admin to Firestore remote, saved locally:', err);
    return docId;
  }
};

export const saveAllAdminsToFirestore = async (adminsList: AdminUser[]) => {
  try {
    for (const admin of adminsList) {
      await saveAdminToFirestore(admin);
    }
  } catch (err) {
    console.error('Error bulk saving admins to Firestore:', err);
  }
};

export const deleteAdminFromFirestore = async (id: string) => {
  try {
    const raw = localStorage.getItem('pcshs_admins');
    if (raw) {
      const list: AdminUser[] = JSON.parse(raw);
      localStorage.setItem('pcshs_admins', JSON.stringify(list.filter((a) => a.id !== id)));
    }
  } catch {}

  try {
    await deleteDoc(doc(db, ADMINS_COLLECTION, id));
  } catch (err) {
    console.warn('Note: Could not delete admin from remote Firestore:', err);
  }
};

// --- COORDINATORS (กลุ่มที่ 2 : ผู้ประสานงาน) ---
export const subscribeCoordinators = (callback: (data: Coordinator[]) => void) => {
  const q = query(collection(db, COORDINATORS_COLLECTION));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: Coordinator[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as Coordinator);
      });
      try {
        localStorage.setItem('pcshs_coordinators', JSON.stringify(list));
      } catch {}
      callback(list);
    },
    (err) => {
      console.warn('Firestore coordinators subscription note:', err);
      try {
        const raw = localStorage.getItem('pcshs_coordinators');
        if (raw) callback(JSON.parse(raw));
      } catch {}
    }
  );
};

export const saveCoordinatorToFirestore = async (coordinator: Coordinator) => {
  const codeStr = (coordinator.code || '').trim();
  const nameStr = (coordinator.name || '').trim();
  const docId =
    coordinator.id ||
    (codeStr
      ? `coord_${codeStr.replace(/[^a-zA-Z0-9_\u0E00-\u0E7F-]/g, '_')}`
      : `coord_${nameStr.replace(/[^a-zA-Z0-9_\u0E00-\u0E7F-]/g, '_') || Date.now()}`);

  const formattedPhone = formatThaiPhoneNumber(coordinator.phone);

  const dataToSave: Coordinator = {
    ...coordinator,
    id: docId,
    code: codeStr || docId,
    phone: formattedPhone,
    updatedAt: new Date().toISOString(),
  };

  try {
    const raw = localStorage.getItem('pcshs_coordinators');
    let list: Coordinator[] = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex((c) => c.id === docId);
    if (idx >= 0) list[idx] = dataToSave;
    else list.push(dataToSave);
    localStorage.setItem('pcshs_coordinators', JSON.stringify(list));
  } catch {}

  try {
    const docRef = doc(db, COORDINATORS_COLLECTION, docId);
    await setDoc(docRef, dataToSave, { merge: true });
    return docId;
  } catch (err) {
    console.warn('Note: Could not save coordinator to Firestore remote, saved locally:', err);
    return docId;
  }
};

export const saveAllCoordinatorsToFirestore = async (
  coordinatorsList: Coordinator[],
  replaceExisting: boolean = false
) => {
  try {
    if (replaceExisting) {
      await clearAllCoordinatorsFromFirestore();
    }
    for (const coord of coordinatorsList) {
      await saveCoordinatorToFirestore(coord);
    }
  } catch (err) {
    console.error('Error bulk saving coordinators to Firestore:', err);
  }
};

export const deleteCoordinatorFromFirestore = async (id: string) => {
  try {
    const raw = localStorage.getItem('pcshs_coordinators');
    if (raw) {
      const list: Coordinator[] = JSON.parse(raw);
      localStorage.setItem('pcshs_coordinators', JSON.stringify(list.filter((c) => c.id !== id)));
    }
  } catch {}

  try {
    await deleteDoc(doc(db, COORDINATORS_COLLECTION, id));
  } catch (err) {
    console.warn('Note: Could not delete coordinator from remote Firestore:', err);
  }
};

export const clearAllCoordinatorsFromFirestore = async () => {
  try {
    localStorage.removeItem('pcshs_coordinators');
    const q = query(collection(db, COORDINATORS_COLLECTION));
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map((docSnap) =>
      deleteDoc(doc(db, COORDINATORS_COLLECTION, docSnap.id)).catch(() => {})
    );
    await Promise.all(deletePromises);
  } catch (err) {
    console.warn('Error clearing coordinators from Firestore:', err);
  }
};

export const updateCoordinatorCheckInStatus = async (id: string, checkedIn: boolean) => {
  const checkedInAt = checkedIn ? new Date().toISOString() : undefined;
  const updateData = {
    checkedIn,
    checkedInAt: checkedInAt || null,
    updatedAt: new Date().toISOString(),
  };

  try {
    const raw = localStorage.getItem('pcshs_coordinators');
    if (raw) {
      const list: Coordinator[] = JSON.parse(raw);
      const idx = list.findIndex((c) => c.id === id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...updateData } as Coordinator;
        localStorage.setItem('pcshs_coordinators', JSON.stringify(list));
      }
    }
  } catch {}

  try {
    const docRef = doc(db, COORDINATORS_COLLECTION, id);
    await setDoc(docRef, updateData, { merge: true });
  } catch (err) {
    console.warn('Note: Could not update coordinator check-in on Firestore remote:', err);
  }
};

// --- SCHOOL STUDENTS / PARTICIPANTS BY SCHOOL (รายชื่อนักเรียน/ผู้เข้าร่วมของแต่ละโรงเรียนของผู้ประสานงาน) ---
export const subscribeSchoolStudents = (callback: (data: SchoolStudent[]) => void) => {
  // 1. Immediately emit current local cache so UI is populated synchronously without blank delay
  try {
    const raw = localStorage.getItem('pcshs_school_students');
    if (raw) {
      const parsed: SchoolStudent[] = JSON.parse(raw);
      if (parsed && parsed.length > 0) {
        callback(parsed);
      } else if (defaultSchoolStudents.length > 0) {
        callback(defaultSchoolStudents);
      }
    } else if (defaultSchoolStudents.length > 0) {
      callback(defaultSchoolStudents);
    }
  } catch (e) {
    console.warn('Error reading initial school students cache:', e);
    if (defaultSchoolStudents.length > 0) {
      callback(defaultSchoolStudents);
    }
  }

  // 2. Listen to real-time updates from Firestore
  const q = query(collection(db, SCHOOL_STUDENTS_COLLECTION));
  return onSnapshot(
    q,
    (snapshot) => {
      const remoteList: SchoolStudent[] = [];
      snapshot.forEach((docSnap) => {
        remoteList.push({ id: docSnap.id, ...docSnap.data() } as SchoolStudent);
      });

      // Merge with any offline pending items in local storage
      try {
        const raw = localStorage.getItem('pcshs_school_students');
        const localList: SchoolStudent[] = raw ? JSON.parse(raw) : [];
        const map = new Map<string, SchoolStudent>();
        
        // Remote first
        remoteList.forEach((s) => map.set(s.id, s));
        // Local items that might not have reached remote yet
        localList.forEach((s) => {
          if (!map.has(s.id)) {
            map.set(s.id, s);
          }
        });

        const merged = Array.from(map.values());
        localStorage.setItem('pcshs_school_students', JSON.stringify(merged));
        callback(merged);
      } catch {
        callback(remoteList);
      }
    },
    (err) => {
      console.warn('Firestore school students subscription fallback:', err);
      try {
        const raw = localStorage.getItem('pcshs_school_students');
        if (raw) callback(JSON.parse(raw));
        else if (defaultSchoolStudents.length > 0) callback(defaultSchoolStudents);
      } catch {}
    }
  );
};

export const saveSchoolStudentToFirestore = async (student: SchoolStudent) => {
  const codeSafe = (student.code || '').replace(/[^a-zA-Z0-9_\u0E00-\u0E7F-]/g, '_');
  const nameSafe = `${student.firstName || ''}_${student.lastName || ''}`.replace(/[^a-zA-Z0-9_\u0E00-\u0E7F-]/g, '_');
  const coordSafe = (student.coordinatorId || 'gen').replace(/[^a-zA-Z0-9_\u0E00-\u0E7F-]/g, '_');
  
  const docId = student.id || `stu_${coordSafe}_${codeSafe || nameSafe || Date.now()}`;
  const dataToSave: SchoolStudent = {
    ...student,
    id: docId,
    updatedAt: new Date().toISOString(),
  };

  try {
    const raw = localStorage.getItem('pcshs_school_students');
    let list: SchoolStudent[] = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex((s) => s.id === docId);
    if (idx >= 0) list[idx] = dataToSave;
    else list.push(dataToSave);
    localStorage.setItem('pcshs_school_students', JSON.stringify(list));
  } catch {}

  try {
    const docRef = doc(db, SCHOOL_STUDENTS_COLLECTION, docId);
    await setDoc(docRef, dataToSave, { merge: true });
    return dataToSave;
  } catch (err) {
    console.warn('Note: Could not save student to Firestore remote, saved locally:', err);
    return dataToSave;
  }
};

export const saveAllSchoolStudentsToFirestore = async (
  studentsList: SchoolStudent[],
  coordinatorId?: string,
  replaceExisting: boolean = false
): Promise<SchoolStudent[]> => {
  try {
    const raw = localStorage.getItem('pcshs_school_students');
    let list: SchoolStudent[] = raw ? JSON.parse(raw) : [];
    if (replaceExisting && coordinatorId) {
      list = list.filter((s) => s.coordinatorId !== coordinatorId);
    }

    const preparedList: SchoolStudent[] = studentsList.map((stu, index) => {
      const codeSafe = (stu.code || '').replace(/[^a-zA-Z0-9_\u0E00-\u0E7F-]/g, '_');
      const nameSafe = `${stu.firstName || ''}_${stu.lastName || ''}`.replace(/[^a-zA-Z0-9_\u0E00-\u0E7F-]/g, '_');
      const coordSafe = (stu.coordinatorId || coordinatorId || 'gen').replace(/[^a-zA-Z0-9_\u0E00-\u0E7F-]/g, '_');
      const docId = stu.id || `stu_${coordSafe}_${codeSafe || nameSafe || Date.now()}_${index}`;
      return {
        ...stu,
        id: docId,
        coordinatorId: stu.coordinatorId || coordinatorId || '',
        updatedAt: new Date().toISOString(),
      };
    });

    const map = new Map<string, SchoolStudent>();
    list.forEach((item) => map.set(item.id, item));
    preparedList.forEach((item) => map.set(item.id, item));
    const merged = Array.from(map.values());
    
    // Save to local storage immediately
    try {
      localStorage.setItem('pcshs_school_students', JSON.stringify(merged));
    } catch {}

    // Parallel background write to Firestore
    if (replaceExisting && coordinatorId) {
      clearSchoolStudentsByCoordinator(coordinatorId).catch(() => {});
    }

    const promises = preparedList.map((student) => {
      const docRef = doc(db, SCHOOL_STUDENTS_COLLECTION, student.id);
      return setDoc(docRef, student, { merge: true }).catch((err) => {
        console.warn('Firestore write student fallback:', err);
      });
    });
    
    await Promise.all(promises);
    return preparedList;
  } catch (err) {
    console.error('Error bulk saving school students:', err);
    return studentsList;
  }
};

export const deleteSchoolStudentFromFirestore = async (id: string) => {
  try {
    const raw = localStorage.getItem('pcshs_school_students');
    if (raw) {
      const list: SchoolStudent[] = JSON.parse(raw);
      localStorage.setItem('pcshs_school_students', JSON.stringify(list.filter((s) => s.id !== id)));
    }
  } catch {}

  try {
    await deleteDoc(doc(db, SCHOOL_STUDENTS_COLLECTION, id));
  } catch (err) {
    console.warn('Note: Could not delete student from Firestore:', err);
  }
};

export const clearSchoolStudentsByCoordinator = async (coordinatorId: string) => {
  try {
    const raw = localStorage.getItem('pcshs_school_students');
    if (raw) {
      const list: SchoolStudent[] = JSON.parse(raw);
      localStorage.setItem(
        'pcshs_school_students',
        JSON.stringify(list.filter((s) => s.coordinatorId !== coordinatorId))
      );
    }
    const q = query(collection(db, SCHOOL_STUDENTS_COLLECTION));
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs
      .filter((d) => d.data().coordinatorId === coordinatorId)
      .map((d) => deleteDoc(doc(db, SCHOOL_STUDENTS_COLLECTION, d.id)).catch(() => {}));
    await Promise.all(deletePromises);
  } catch (err) {
    console.warn('Error clearing school students for coordinator:', err);
  }
};

export const toggleStudentAttendanceInFirestore = async (id: string, attended: boolean) => {
  const attendedAt = attended ? new Date().toISOString() : undefined;
  const updateData = {
    attended,
    attendedAt: attendedAt || null,
    updatedAt: new Date().toISOString(),
  };

  try {
    const raw = localStorage.getItem('pcshs_school_students');
    if (raw) {
      const list: SchoolStudent[] = JSON.parse(raw);
      const idx = list.findIndex((s) => s.id === id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...updateData } as SchoolStudent;
        localStorage.setItem('pcshs_school_students', JSON.stringify(list));
      }
    }
  } catch {}

  try {
    const docRef = doc(db, SCHOOL_STUDENTS_COLLECTION, id);
    await setDoc(docRef, updateData, { merge: true });
  } catch (err) {
    console.warn('Note: Could not update student attendance:', err);
  }
};

export const batchUpdateSchoolStudentsAttendance = async (studentIds: string[], attended: boolean) => {
  const attendedAt = attended ? new Date().toISOString() : undefined;
  const updateData = {
    attended,
    attendedAt: attendedAt || null,
    updatedAt: new Date().toISOString(),
  };

  try {
    const raw = localStorage.getItem('pcshs_school_students');
    if (raw) {
      const list: SchoolStudent[] = JSON.parse(raw);
      const updated = list.map((s) => (studentIds.includes(s.id) ? { ...s, ...updateData } : s));
      localStorage.setItem('pcshs_school_students', JSON.stringify(updated));
    }
  } catch {}

  try {
    const promises = studentIds.map((id) => {
      const docRef = doc(db, SCHOOL_STUDENTS_COLLECTION, id);
      return setDoc(docRef, updateData, { merge: true }).catch(() => {});
    });
    await Promise.all(promises);
  } catch (err) {
    console.warn('Error batch updating students attendance:', err);
  }
};

// --- GROUP 3 : NEW USER REGISTRATIONS (ฐานข้อมูลกลุ่มที่ 3 : ลงทะเบียนผู้ใช้ใหม่ รหัส OH47001...) ---
/**
 * Calculates next sequential code starting at OH47001 (e.g. OH47001, OH47002, ...)
 */
export const getNextNewUserCode = (list: NewUserRegistration[]): string => {
  let maxSeq = 47000;
  for (const item of list) {
    if (!item.code) continue;
    const match = item.code.match(/OH(\d+)/i);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxSeq) {
        maxSeq = num;
      }
    }
  }
  const nextNum = maxSeq + 1;
  return `OH${nextNum}`;
};

export const subscribeNewRegistrations = (callback: (data: NewUserRegistration[]) => void) => {
  const q = query(collection(db, NEW_REGISTRATIONS_COLLECTION));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: NewUserRegistration[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as NewUserRegistration);
      });
      try {
        localStorage.setItem('pcshs_new_registrations', JSON.stringify(list));
      } catch {}
      callback(list);
    },
    (err) => {
      console.warn('Firestore new_registrations subscription note:', err);
      try {
        const raw = localStorage.getItem('pcshs_new_registrations');
        if (raw) callback(JSON.parse(raw));
      } catch {}
    }
  );
};

export const saveNewRegistrationToFirestore = async (item: NewUserRegistration) => {
  const codeStr = (item.code || '').trim();
  const docId =
    item.id ||
    (codeStr
      ? `new_${codeStr.replace(/[^a-zA-Z0-9_\u0E00-\u0E7F-]/g, '_')}`
      : `new_${Date.now()}`);

  const formattedPhone = formatThaiPhoneNumber(item.phone);
  const now = new Date().toISOString();

  const dataToSave: NewUserRegistration = {
    ...item,
    id: docId,
    code: codeStr || docId,
    phone: formattedPhone,
    checkedIn: true, // สถานะเป็นเช็คอินแล้วทันทีเมื่อเพิ่ม
    checkedInAt: item.checkedInAt || now,
    registeredAt: item.registeredAt || now,
    updatedAt: now,
  };

  try {
    const raw = localStorage.getItem('pcshs_new_registrations');
    let list: NewUserRegistration[] = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex((c) => c.id === docId);
    if (idx >= 0) list[idx] = dataToSave;
    else list.push(dataToSave);
    localStorage.setItem('pcshs_new_registrations', JSON.stringify(list));
  } catch {}

  try {
    const docRef = doc(db, NEW_REGISTRATIONS_COLLECTION, docId);
    await setDoc(docRef, dataToSave, { merge: true });
    return docId;
  } catch (err) {
    console.warn('Note: Could not save new registration to Firestore remote, saved locally:', err);
    return docId;
  }
};

export const saveAllNewRegistrationsToFirestore = async (
  list: NewUserRegistration[],
  replaceExisting: boolean = false
) => {
  try {
    if (replaceExisting) {
      await clearAllNewRegistrationsFromFirestore();
    }
    for (const item of list) {
      await saveNewRegistrationToFirestore(item);
    }
  } catch (err) {
    console.error('Error bulk saving new registrations to Firestore:', err);
  }
};

export const deleteNewRegistrationFromFirestore = async (id: string) => {
  try {
    const raw = localStorage.getItem('pcshs_new_registrations');
    if (raw) {
      const list: NewUserRegistration[] = JSON.parse(raw);
      localStorage.setItem('pcshs_new_registrations', JSON.stringify(list.filter((c) => c.id !== id)));
    }
  } catch {}

  try {
    await deleteDoc(doc(db, NEW_REGISTRATIONS_COLLECTION, id));
  } catch (err) {
    console.warn('Note: Could not delete new registration from remote Firestore:', err);
  }
};

export const clearAllNewRegistrationsFromFirestore = async () => {
  try {
    localStorage.removeItem('pcshs_new_registrations');
    const q = query(collection(db, NEW_REGISTRATIONS_COLLECTION));
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map((docSnap) =>
      deleteDoc(doc(db, NEW_REGISTRATIONS_COLLECTION, docSnap.id)).catch(() => {})
    );
    await Promise.all(deletePromises);
  } catch (err) {
    console.warn('Error clearing new registrations from Firestore:', err);
  }
};

export const updateNewRegistrationCheckInStatus = async (id: string, checkedIn: boolean) => {
  const checkedInAt = checkedIn ? new Date().toISOString() : undefined;
  const updateData = {
    checkedIn,
    checkedInAt: checkedInAt || null,
    updatedAt: new Date().toISOString(),
  };

  try {
    const raw = localStorage.getItem('pcshs_new_registrations');
    if (raw) {
      const list: NewUserRegistration[] = JSON.parse(raw);
      const idx = list.findIndex((c) => c.id === id);
      if (idx >= 0) {
        list[idx] = { ...list[idx], ...updateData } as NewUserRegistration;
        localStorage.setItem('pcshs_new_registrations', JSON.stringify(list));
      }
    }
  } catch {}

  try {
    const docRef = doc(db, NEW_REGISTRATIONS_COLLECTION, id);
    await setDoc(docRef, updateData, { merge: true });
  } catch (err) {
    console.warn('Note: Could not update new registration check-in on Firestore remote:', err);
  }
};

// --- ACTIVITIES ---
export const subscribeActivities = (callback: (data: ActivityItem[]) => void) => {
  const q = query(collection(db, ACTIVITIES_COLLECTION));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: ActivityItem[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as ActivityItem);
      });
      if (list.length > 0) {
        try {
          localStorage.setItem('pcshs_activities', JSON.stringify(list));
        } catch {}
      }
      callback(list);
    },
    (err) => {
      console.warn('Firestore activities subscription fallback:', err);
      try {
        const raw = localStorage.getItem('pcshs_activities');
        if (raw) callback(JSON.parse(raw));
      } catch {}
    }
  );
};

export const saveActivityToFirestore = async (activity: ActivityItem) => {
  const docId = activity.id || `act_${Date.now()}`;
  const dataToSave = { ...activity, id: docId, updatedAt: new Date().toISOString() };

  try {
    const raw = localStorage.getItem('pcshs_activities');
    let list: ActivityItem[] = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex((a) => a.id === docId);
    if (idx >= 0) list[idx] = dataToSave;
    else list.push(dataToSave);
    localStorage.setItem('pcshs_activities', JSON.stringify(list));
  } catch {}

  try {
    const docRef = doc(db, ACTIVITIES_COLLECTION, docId);
    await setDoc(docRef, dataToSave, { merge: true });
    return docId;
  } catch (err) {
    console.warn('Note: Could not save activity to Firestore remote, saved locally:', err);
    return docId;
  }
};

export const saveAllActivitiesToFirestore = async (activitiesList: ActivityItem[]) => {
  try {
    for (const activity of activitiesList) {
      await saveActivityToFirestore(activity);
    }
  } catch (err) {
    console.error('Error bulk saving activities to Firestore:', err);
  }
};

export const deleteActivityFromFirestore = async (id: string) => {
  try {
    const raw = localStorage.getItem('pcshs_activities');
    if (raw) {
      const list: ActivityItem[] = JSON.parse(raw);
      localStorage.setItem('pcshs_activities', JSON.stringify(list.filter((a) => a.id !== id)));
    }
  } catch {}

  try {
    await deleteDoc(doc(db, ACTIVITIES_COLLECTION, id));
  } catch (err) {
    console.warn('Note: Could not delete activity from remote Firestore:', err);
  }
};

// --- AUDIT LOGS ---
export const subscribeAuditLogs = (callback: (data: AuditLog[]) => void) => {
  const q = query(collection(db, AUDIT_LOGS_COLLECTION));
  return onSnapshot(
    q,
    (snapshot) => {
      const list: AuditLog[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as AuditLog);
      });
      list.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      if (list.length > 0) {
        try {
          localStorage.setItem('pcshs_audit_logs', JSON.stringify(list));
        } catch {}
      }
      callback(list);
    },
    (err) => {
      console.warn('Firestore audit logs subscription fallback:', err);
      try {
        const raw = localStorage.getItem('pcshs_audit_logs');
        if (raw) callback(JSON.parse(raw));
      } catch {}
    }
  );
};

export const saveAuditLogToFirestore = async (log: AuditLog) => {
  const docId = log.id || `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const dataToSave = { ...log, id: docId };

  try {
    const raw = localStorage.getItem('pcshs_audit_logs');
    let list: AuditLog[] = raw ? JSON.parse(raw) : [];
    list.unshift(dataToSave);
    localStorage.setItem('pcshs_audit_logs', JSON.stringify(list.slice(0, 100)));
  } catch {}

  try {
    const docRef = doc(db, AUDIT_LOGS_COLLECTION, docId);
    await setDoc(docRef, dataToSave, { merge: true });
    return docId;
  } catch (err) {
    console.warn('Note: Could not save audit log to Firestore remote, saved locally:', err);
    return docId;
  }
};

export const saveAllAuditLogsToFirestore = async (logsList: AuditLog[]) => {
  try {
    for (const log of logsList) {
      await saveAuditLogToFirestore(log);
    }
  } catch (err) {
    console.error('Error bulk saving audit logs to Firestore:', err);
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
  freeQuotaTotalMb: number;
  freeQuotaUsedMb: number;
  freeQuotaRemainingMb: number;
  freeQuotaReadsDaily: string;
  freeQuotaWritesDaily: string;
}

export const testFirebaseConnection = async (): Promise<FirebaseConnectionTestResult> => {
  const startTime = performance.now();
  const projectId = (firebaseConfig as any).projectId || 'N/A';
  const databaseId = (firebaseConfig as any).firestoreDatabaseId || '(default)';
  const nowTh = new Date().toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'medium' });

  // Default Spark Plan Free Quota (1,024 MB / 1 GiB)
  const TOTAL_FREE_QUOTA_MB = 1024;
  let estimatedUsedMb = 0.05; // Base metadata footprint (~50 KB)

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

      const freeQuotaRemainingMb = Number((TOTAL_FREE_QUOTA_MB - estimatedUsedMb).toFixed(2));

      return {
        success: true,
        message: 'เชื่อมต่อกับระบบฐานข้อมูล Firebase Firestore สำเร็จเรียบร้อย สามารถอ่านและเขียนข้อมูลได้ตามปกติ',
        projectId,
        databaseId,
        latencyMs,
        testedAt: nowTh,
        canRead: true,
        canWrite: true,
        freeQuotaTotalMb: TOTAL_FREE_QUOTA_MB,
        freeQuotaUsedMb: estimatedUsedMb,
        freeQuotaRemainingMb: freeQuotaRemainingMb,
        freeQuotaReadsDaily: '50,000 อ่าน/วัน',
        freeQuotaWritesDaily: '20,000 เขียน/วัน',
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
        freeQuotaTotalMb: TOTAL_FREE_QUOTA_MB,
        freeQuotaUsedMb: estimatedUsedMb,
        freeQuotaRemainingMb: TOTAL_FREE_QUOTA_MB,
        freeQuotaReadsDaily: '50,000 อ่าน/วัน',
        freeQuotaWritesDaily: '20,000 เขียน/วัน',
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
      freeQuotaTotalMb: TOTAL_FREE_QUOTA_MB,
      freeQuotaUsedMb: 0,
      freeQuotaRemainingMb: TOTAL_FREE_QUOTA_MB,
      freeQuotaReadsDaily: '50,000 อ่าน/วัน',
      freeQuotaWritesDaily: '20,000 เขียน/วัน',
    };
  }
};

