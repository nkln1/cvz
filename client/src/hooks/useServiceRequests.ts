import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import type { Request, Car, User, ServiceData } from "@/types/service";

export function useServiceRequests(userId: string, serviceData: ServiceData | null) {
  const { toast } = useToast();
  const [clientRequests, setClientRequests] = useState<Request[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [requestClient, setRequestClient] = useState<User | null>(null);
  const [cars, setCars] = useState<Record<string, Car>>({});
  const [viewedRequests, setViewedRequests] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userId || !serviceData) return;

    // Create a query for active requests in the service's area
    const requestsQuery = query(
      collection(db, "requests"),
      where("status", "==", "Active"),
      where("county", "==", serviceData.county),
      where("cities", "array-contains", serviceData.city)
    );

    // Set up real-time listener
    const unsubscribe = onSnapshot(requestsQuery, 
      async (querySnapshot) => {
        try {
          const allRequests: Request[] = [];
          const allCars: Record<string, Car> = {};

          // Process each request document
          await Promise.all(querySnapshot.docs.map(async (doc) => {
            const requestData = doc.data() as Omit<Request, 'id'>;
            const carDoc = await getDoc(doc(db, "cars", requestData.carId));
            const carData = carDoc.exists() ? carDoc.data() as Car : undefined;

            const request: Request = {
              ...requestData,
              id: doc.id,
              car: carData
            };

            allRequests.push(request);
            if (carData) {
              allCars[requestData.carId] = { ...carData, id: requestData.carId };
            }
          }));

          setClientRequests(allRequests);
          setCars(allCars);
        } catch (error) {
          console.error("Error processing request updates:", error);
        }
      },
      (error) => {
        console.error("Error in real-time request sync:", error);
        toast({
          variant: "destructive",
          title: "Sync Error",
          description: "Could not sync request updates in real-time.",
        });
      }
    );

    return () => unsubscribe();
  }, [userId, serviceData]);

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
      localStorage.setItem("viewedRequests", JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  };

  const handleRejectRequest = async (requestId: string) => {
    markRequestAsViewed(requestId);
    try {
      const requestRef = doc(db, "requests", requestId);
      await updateDoc(requestRef, {
        status: "Anulat",
      });
      toast({
        title: "Success",
        description: "Request has been rejected.",
      });
    } catch (error) {
      console.error("Error rejecting request:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not reject the request. Please try again.",
      });
    }
  };

  useEffect(() => {
    const savedViewedRequests = localStorage.getItem("viewedRequests");
    if (savedViewedRequests) {
      setViewedRequests(new Set(JSON.parse(savedViewedRequests)));
    }
  }, []);

  return {
    clientRequests,
    selectedRequest,
    requestClient,
    cars,
    viewedRequests,
    handleViewDetails,
    handleRejectRequest,
    markRequestAsViewed,
  };
}