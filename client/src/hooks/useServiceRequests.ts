import { useState, useEffect } from "react";
import { collection, query, where, doc, getDoc, updateDoc, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import type { Request, Car, ServiceData } from "@/types/service";

interface User {
  id: string;
  name: string;
  email: string;
}

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

    console.log("Starting request listener for service:", {
      county: serviceData.county,
      city: serviceData.city
    });

    const requestsQuery = query(
      collection(db, "requests"),
      where("status", "==", "Active"),
      where("county", "==", serviceData.county)
    );

    const unsubscribe = onSnapshot(requestsQuery, async (snapshot) => {
      console.log("Received snapshot with", snapshot.docs.length, "documents");
      const requests: Request[] = [];
      const carsData: Record<string, Car> = {};

      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data() as Omit<Request, 'id'>;
        console.log("Processing request:", docSnapshot.id, data);

        if (Array.isArray(data.cities) && data.cities.includes(serviceData.city)) {
          try {
            // Check if request has an offer
            const offersQuery = query(
              collection(db, "offers"),
              where("requestId", "==", docSnapshot.id),
              where("serviceId", "==", userId)
            );
            const offersSnapshot = await getDocs(offersQuery);
            const hasOffer = !offersSnapshot.empty;

            // Fetch car data
            const carRef = doc(db, "cars", data.carId);
            const carDoc = await getDoc(carRef);

            if (carDoc.exists()) {
              const carData = carDoc.data() as Car;
              carsData[data.carId] = { ...carData, id: data.carId };
            }

            requests.push({
              ...data,
              id: docSnapshot.id,
              hasOffer, // Add hasOffer property
            });
          } catch (error) {
            console.error("Error fetching car data for request:", docSnapshot.id, error);
          }
        }
      }

      console.log("Processed requests:", requests.length);
      setClientRequests(requests);
      setCars(carsData);
    }, (error) => {
      console.error("Error in requests listener:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load requests. Please refresh the page.",
      });
    });

    return () => unsubscribe();
  }, [userId, serviceData, toast]);

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