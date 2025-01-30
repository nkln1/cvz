import { useState, useEffect } from "react";
import { collection, query, where, doc, getDoc, updateDoc, onSnapshot } from "firebase/firestore";
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
    const saved = localStorage.getItem("viewedRequests");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  useEffect(() => {
    if (!userId || !serviceData) {
      console.log("Missing userId or serviceData");
      return;
    }

    const requestsQuery = query(
      collection(db, "requests"),
      where("status", "==", "Active"),
      where("county", "==", serviceData.county)
    );

    const unsubscribe = onSnapshot(requestsQuery, async (snapshot) => {
      const requests: Request[] = [];
      const carsData: Record<string, Car> = {};

      for (const doc of snapshot.docs) {
        const data = doc.data() as Omit<Request, 'id'>;

        // Only include requests for the service's city
        if (data.cities.includes(serviceData.city)) {
          try {
            const carDoc = await getDoc(doc(db, "cars", data.carId));
            if (carDoc.exists()) {
              const carData = carDoc.data() as Car;
              carsData[data.carId] = { ...carData, id: data.carId };
            }

            requests.push({
              ...data,
              id: doc.id,
            });
          } catch (error) {
            console.error("Error fetching car data:", error);
          }
        }
      }

      setClientRequests(requests);
      setCars(carsData);
    });

    return () => unsubscribe();
  }, [userId, serviceData]);

  const handleViewDetails = async (request: Request) => {
    try {
      markRequestAsViewed(request.id);

      if (selectedRequest?.id === request.id) {
        setSelectedRequest(null);
        setRequestClient(null);
        return;
      }

      setSelectedRequest(request);
      const userDoc = await getDoc(doc(db, "users", request.userId));

      if (userDoc.exists()) {
        const userData = userDoc.data();
        setRequestClient({
          id: userDoc.id,
          name: userData.name || "",
          email: userData.email || "",
        } as User);
      }
    } catch (error) {
      console.error("Error fetching client details:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load client details",
      });
    }
  };

  const markRequestAsViewed = (requestId: string) => {
    setViewedRequests(prev => {
      const newSet = new Set(prev);
      newSet.add(requestId);
      localStorage.setItem("viewedRequests", JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  };

  const handleRejectRequest = async (requestId: string) => {
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