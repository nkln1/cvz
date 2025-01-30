import { useState, useCallback, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { useAppSelector } from '@/hooks/useAppSelector';
import { setProfile, updateProfile } from '@/store/slices/profileSlice';
import type { UserProfile } from '@/types/dashboard';

export const useProfile = (userId: string) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const profile = useAppSelector((state) => state.profile.profile);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const userDoc = await getDoc(doc(db, "clients", userId));
      if (userDoc.exists()) {
        const userData = userDoc.data() as UserProfile;
        dispatch(setProfile(userData));
      }
    } catch (error) {
      const errorMessage = "Nu s-au putut încărca datele profilului.";
      console.error("Error fetching user profile:", error);
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, dispatch, toast]);

  const updateUserProfile = useCallback(async (updatedProfile: Partial<UserProfile>) => {
    if (!userId) return false;

    setIsLoading(true);
    setError(null);

    try {
      await updateDoc(doc(db, "clients", userId), updatedProfile);
      dispatch(updateProfile(updatedProfile));
      toast({
        title: "Succes",
        description: "Profilul a fost actualizat cu succes!",
      });
      return true;
    } catch (error) {
      const errorMessage = "Nu s-a putut actualiza profilul.";
      console.error("Error updating profile:", error);
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId, dispatch, toast]);

  // Automatically fetch profile when userId changes
  useEffect(() => {
    fetchProfile();
  }, [userId, fetchProfile]);

  return {
    profile,
    isLoading,
    error,
    fetchProfile,
    updateUserProfile,
  };
};