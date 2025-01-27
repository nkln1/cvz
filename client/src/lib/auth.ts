import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User
} from "firebase/auth";
import { auth } from "./firebase";

// Simple sign in function
export const signIn = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: result.user };
  } catch (error: any) {
    console.error("Login error:", error);
    return { 
      success: false, 
      error: error.code === 'auth/invalid-credential' 
        ? "Email sau parolă incorecte" 
        : "Eroare la autentificare" 
    };
  }
};

// Simple sign up function
export const signUp = async (email: string, password: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return { success: true, user: result.user };
  } catch (error: any) {
    console.error("Signup error:", error);
    return { 
      success: false, 
      error: error.code === 'auth/email-already-in-use'
        ? "Această adresă de email este deja folosită"
        : "Eroare la crearea contului"
    };
  }
};

// Sign out
export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
    return { success: true };
  } catch (error) {
    console.error("Sign out error:", error);
    return { success: false, error: "Eroare la deconectare" };
  }
};

// Subscribe to auth state changes
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Get current user
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};