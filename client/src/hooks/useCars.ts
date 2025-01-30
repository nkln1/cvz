import { useState, useCallback } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

interface Car {
  id: string;
  userId: string;
  brand: string;
  model: string;
  year: number;
  [key: string]: any;
}

export const useCars = (userId: string) => {
  const [cars, setCars] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchCars = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      const carsQuery = query(
        collection(db, "cars"),
        where("userId", "==", userId)
      );
      const querySnapshot = await getDocs(carsQuery);
      const loadedCars: Car[] = [];
      querySnapshot.forEach((doc) => {
        loadedCars.push({ id: doc.id, ...doc.data() } as Car);
      });
      setCars(loadedCars);
    } catch (error) {
      const errorMessage = "Nu s-au putut încărca mașinile.";
      console.error("Error loading cars:", error);
      setError(errorMessage);
      toast({
        variant: "destructive",
        title: "Error",
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }, [userId, toast]);

  return {
    cars,
    isLoading,
    error,
    fetchCars,
  };
};
