import { useState, useCallback } from 'react';
import { collection, query, where, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Request, RequestFormData } from '@/types/dashboard';

export const useRequests = (userId: string) => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchRequests = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log("Fetching requests for user:", userId);

      // Query requests for all relevant statuses including "Trimis Oferta"
      const requestsQuery = query(
        collection(db, "requests"),
        where("userId", "==", userId)
      );

      const querySnapshot = await getDocs(requestsQuery);
      const loadedRequests: Request[] = [];

      querySnapshot.forEach((doc) => {
        const request = { id: doc.id, ...doc.data() } as Request;
        loadedRequests.push(request);
        console.log("Loaded request:", {
          id: request.id,
          title: request.title,
          status: request.status,
          hasOffer: request.hasOffer
        });
      });

      console.log("Loaded requests summary:", {
        total: loadedRequests.length,
        byStatus: {
          active: loadedRequests.filter(r => r.status === "Active").length,
          trimisOferta: loadedRequests.filter(r => r.status === "Trimis Oferta").length,
          rezolvat: loadedRequests.filter(r => r.status === "Rezolvat").length,
          anulat: loadedRequests.filter(r => r.status === "Anulat").length
        }
      });

      setRequests(loadedRequests);
    } catch (error) {
      const errorMessage = "Nu s-au putut încărca cererile.";
      console.error("Error loading requests:", error);
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

  const addRequest = useCallback(async (data: RequestFormData, clientName: string) => {
    if (!userId) return false;

    setIsLoading(true);
    setError(null);

    try {
      const requestData = {
        ...data,
        userId,
        clientName,
        status: "Active" as const,
        createdAt: new Date().toISOString(),
        hasOffer: false
      };

      await addDoc(collection(db, "requests"), requestData);
      toast({
        title: "Success",
        description: "Cererea ta a fost adăugată cu succes!",
      });
      await fetchRequests();
      return true;
    } catch (error) {
      const errorMessage = "Nu s-a putut adăuga cererea.";
      console.error("Error submitting request:", error);
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
  }, [userId, fetchRequests, toast]);

  const cancelRequest = useCallback(async (requestId: string) => {
    if (!userId) return false;

    setIsLoading(true);
    setError(null);

    try {
      const requestRef = doc(db, "requests", requestId);
      await updateDoc(requestRef, {
        status: "Anulat",
        updatedAt: new Date().toISOString(),
      });
      await fetchRequests();
      toast({
        title: "Success",
        description: "Cererea a fost anulată cu succes.",
      });
      return true;
    } catch (error) {
      const errorMessage = "Nu s-a putut anula cererea.";
      console.error("Error updating request:", error);
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
  }, [userId, fetchRequests, toast]);

  return {
    requests,
    isLoading,
    error,
    fetchRequests,
    addRequest,
    cancelRequest,
  };
};