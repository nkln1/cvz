import { 
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  getDocs,
  DocumentData,
  QuerySnapshot,
  DocumentSnapshot
} from 'firebase/firestore';
import { db, collectionsConfig } from './firebase';

export type FirestoreCollection = keyof typeof collectionsConfig;

// Generic type for database operations
export interface DatabaseOperations {
  create: <T extends DocumentData>(
    collection: FirestoreCollection,
    id: string,
    data: T
  ) => Promise<void>;
  get: (
    collection: FirestoreCollection,
    id: string
  ) => Promise<DocumentSnapshot<DocumentData>>;
  update: <T extends DocumentData>(
    collection: FirestoreCollection,
    id: string,
    data: Partial<T>
  ) => Promise<void>;
  delete: (collection: FirestoreCollection, id: string) => Promise<void>;
  query: (
    collection: FirestoreCollection,
    field: string,
    operator: any,
    value: any
  ) => Promise<QuerySnapshot<DocumentData>>;
}

// Database operations implementation
export const dbOperations: DatabaseOperations = {
  create: async (collection, id, data) => {
    await setDoc(doc(db, collection, id), data);
  },

  get: async (collection, id) => {
    return await getDoc(doc(db, collection, id));
  },

  update: async (collection, id, data) => {
    await updateDoc(doc(db, collection, id), data);
  },

  delete: async (collection, id) => {
    await deleteDoc(doc(db, collection, id));
  },

  query: async (collection, field, operator, value) => {
    const q = query(
      collectionsConfig[collection],
      where(field, operator, value)
    );
    return await getDocs(q);
  },
};

export default dbOperations;
