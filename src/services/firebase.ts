import { initializeApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, signOut as firebaseSignOut, onAuthStateChanged, type User } from "firebase/auth";
import { getFirestore, collection, doc, getDocs, getDoc, addDoc, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp, type DocumentData } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyD2IdmKMuIoJ6Dv6Cu9ZGS3ahUC_cFTS",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "pharmacy-chodavaram.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "pharmacy-chodavaram",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "pharmacy-chodavaram.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "197057944260",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:197057944260:web:b936d6c1085df233e48791",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Auth helpers
export const setupRecaptcha = (containerId: string) => {
  return new RecaptchaVerifier(auth, containerId, {
    size: "invisible",
  });
};

export const sendOTP = async (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => {
  return signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
};

export const logOut = () => firebaseSignOut(auth);

// Firestore helpers
export const getCollection = async (collectionName: string) => {
  const snapshot = await getDocs(collection(db, collectionName));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const getDocument = async (collectionName: string, docId: string) => {
  const docRef = doc(db, collectionName, docId);
  const docSnap = await getDoc(docRef);
  return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};

export const addDocument = async (collectionName: string, data: DocumentData) => {
  return addDoc(collection(db, collectionName), { ...data, createdAt: serverTimestamp() });
};

export const updateDocument = async (collectionName: string, docId: string, data: DocumentData) => {
  return updateDoc(doc(db, collectionName, docId), data);
};

export const deleteDocument = async (collectionName: string, docId: string) => {
  return deleteDoc(doc(db, collectionName, docId));
};

export const queryCollection = async (collectionName: string, field: string, operator: any, value: any) => {
  const q = query(collection(db, collectionName), where(field, operator, value));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Storage helpers
export const uploadFile = async (path: string, file: File) => {
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
};

export const deleteFile = async (fileUrl: string) => {
  try {
    const storageRef = ref(storage, fileUrl);
    await deleteObject(storageRef);
  } catch (error) {
    console.warn("Failed to delete file from storage:", error);
  }
};

export { onAuthStateChanged, type User };
