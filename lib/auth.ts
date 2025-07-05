import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'Staff' | 'Director';
  department: string;
  employeeId: string;
  createdAt: Date;
}

export const signUp = async (
  email: string, 
  password: string, 
  name: string, 
  role: 'Staff' | 'Director', 
  department: string,
  employeeId: string
) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Create user profile in Firestore
    const userProfile: User = {
      id: user.uid,
      email,
      name,
      role,
      department,
      employeeId,
      createdAt: new Date(),
    };

    await setDoc(doc(db, 'users', user.uid), userProfile);
    
    return userCredential;
  } catch (error) {
    throw error;
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error) {
    throw error;
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    throw error;
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const user = auth.currentUser;
    if (!user) return null;

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists()) return null;

    const userData = userDoc.data();
    return {
      ...userData,
      createdAt: userData.createdAt.toDate(),
    } as User;
  } catch (error) {
    throw error;
  }
};

export const onAuthStateChange = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(auth, callback);
};