import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import type { Request, Car, User, ServiceData } from "@/types/service";

export function useServiceRequests(userId: string, serviceData: ServiceData | null) {
  const { toast } = useToast();
  const [clientRequests, setClientRequests] = useState<Request[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [requestClient, setRequestClient] = useState<User | null>(null);
  const [cars, setCars] = useState<Record<string, Car>>({});
  const [viewedRequests, setViewedRequests] = useState<Set<string>>(() => {
    const savedViewedRequests = localStorage.getItem("viewedRequests");
    return new Set(savedViewedRequests ? JSON.parse(savedViewedRequests) : []);
  });

  const fetchClientRequests = async () => {
    if (!userId || !serviceData) return;

    try {
      let requestsQuery = query(
        collection(db, "requests"),
        where("status", "==", "Active"),
        where("county", "==", serviceData.county),
        where("cities", "array-contains", serviceData.city),
      );

      const querySnapshot = await getDocs(requestsQuery);
      const allRequests: Request[] = [];
      const allCars: Record<string, Car> = {};

      for (const doc of querySnapshot.docs) {
        const requestData = doc.data() as Request;
        const carDoc = await getDoc(doc(db, "cars", requestData.carId));
        const carData = carDoc.exists() ? (carDoc.data() as Car) : undefined;

        allRequests.push({
          id: doc.id,
          ...requestData,
          car: carData,
        } as Request);
        if (carData) allCars[requestData.carId] = carData;
      }

      setClientRequests(allRequests);
      setCars(allCars);
    } catch (error) {
      console.error("Error fetching client requests:", error);
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "Nu s-au putut încărca cererile clienților.",
      });
    }
  };

  const fetchRequestClient = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          id: userDoc.id,
          name: userData.name || "",
          email: userData.email || "",
        } as User;
      }
      return null;
    } catch (error) {
      console.error("Error fetching client details:", error);
      return null;
    }
  };

  const handleViewDetails = async (request: Request) => {
    markRequestAsViewed(request.id);
    if (selectedRequest?.id === request.id) {
      setSelectedRequest(null);
      setRequestClient(null);
    } else {
      setSelectedRequest(request);
      const client = await fetchRequestClient(request.userId);
      setRequestClient(client);
    }
  };

  const markRequestAsViewed = (requestId: string) => {
    setViewedRequests((prev) => {
      const newSet = new Set(prev);
      newSet.add(requestId);
      return newSet;
    });
    localStorage.setItem(
      "viewedRequests",
      JSON.stringify([...viewedRequests, requestId]),
    );
  };

  const handleRejectRequest = async (requestId: string) => {
    markRequestAsViewed(requestId);
    try {
      const requestRef = doc(db, "requests", requestId);
      await updateDoc(requestRef, {
        status: "Anulat",
      });
      await fetchClientRequests();
      toast({
        title: "Succes",
        description: "Cererea a fost respinsă.",
      });
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "Nu s-a putut respinge cererea. Încercați din nou.",
      });
    }
  };

  useEffect(() => {
    if (serviceData) {
      fetchClientRequests();
    }
  }, [serviceData]);

  useEffect(() => {
    const savedViewedRequests = localStorage.getItem("viewedRequests");
    if (savedViewedRequests) {
      setViewedRequests(new Set(JSON.parse(savedViewedRequests)));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("viewedRequests", JSON.stringify([...viewedRequests]));
  }, [viewedRequests]);

  return {
    clientRequests,
    selectedRequest,
    requestClient,
    cars,
    viewedRequests,
    fetchClientRequests,
    handleViewDetails,
    handleRejectRequest,
    markRequestAsViewed,
  };
}
