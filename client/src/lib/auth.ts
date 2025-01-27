import { 
  signInWithPopup, 
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  type User
} from "firebase/auth";
import { auth } from "./firebase";

// Create Google Auth Provider with custom parameters
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Sign in with Google
export const signInWithGoogle = async () => {
  try {
    console.log("Attempting Google sign in...");
    // Add scopes for additional access if needed
    googleProvider.addScope('email');
    googleProvider.addScope('profile');

    const result = await signInWithPopup(auth, googleProvider);
    console.log("Google sign in successful:", result.user);
    return result.user;
  } catch (error: any) {
    console.error("Error signing in with Google:", {
      code: error.code,
      message: error.message,
      email: error.customData?.email,
      credential: error.credential
    });

    if (error.code === 'auth/popup-blocked') {
      throw new Error('Popup was blocked by the browser. Please allow popups and try again.');
    } else if (error.code === 'auth/cancelled-popup-request') {
      throw new Error('Authentication cancelled.');
    } else if (error.code === 'auth/unauthorized-domain') {
      throw new Error('This domain is not authorized for OAuth operations.');
    }
    throw error;
  }
};

// Sign out
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Get current user
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Subscribe to auth state changes
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};