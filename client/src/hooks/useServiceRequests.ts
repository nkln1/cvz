import { useState, useEffect } from "react";
import { collection, query, where, doc, getDoc, updateDoc, onSnapshot, getDocs, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import type { Request, Car, ServiceData } from "@/types/service";

interface User {
  id: string;
  name: string;
  email: string;
}

interface OfferData {
  title: string;
  details: string;
  availableDate: string;
  price: number;
  notes?: string;
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

  const fetchRequests = async () => {
    if (!userId || !serviceData) {
      console.log("Missing userId or serviceData");
      return;
    }

    console.log("Fetching requests for service:", {
      county: serviceData.county,
      city: serviceData.city
    });

    // Query requests with either Active or Rezolvat status
    const requestsQuery = query(
      collection(db, "requests"),
      where("status", "in", ["Active", "Rezolvat"]),
      where("county", "==", serviceData.county)
    );

    try {
      const snapshot = await getDocs(requestsQuery);
      console.log(`Found ${snapshot.docs.length} total requests`);

      const requests: Request[] = [];
      const carsData: Record<string, Car> = {};

      for (const docSnapshot of snapshot.docs) {
        const data = docSnapshot.data() as Omit<Request, 'id'>;

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

            console.log(`Request ${docSnapshot.id}:`, {
              title: data.title,
              status: data.status,
              hasOffer,
              offersCount: offersSnapshot.docs.length
            });

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
              hasOffer,
            });
          } catch (error) {
            console.error("Error processing request:", docSnapshot.id, error);
          }
        }
      }

      console.log("Processed requests summary:", {
        total: requests.length,
        withOffers: requests.filter(r => r.hasOffer).length,
        withoutOffers: requests.filter(r => !r.hasOffer).length
      });

      setClientRequests(requests);
      setCars(carsData);
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not load requests. Please refresh the page.",
      });
    }
  };

  useEffect(() => {
    fetchRequests();

    const requestsQuery = query(
      collection(db, "requests"),
      where("status", "in", ["Active", "Rezolvat"]),
      where("county", "==", serviceData?.county || '')
    );

    const unsubscribe = onSnapshot(requestsQuery, async () => {
      console.log("Received snapshot update, refreshing requests...");
      await fetchRequests();
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

  const handleSubmitOffer = async (request: Request, offerData: OfferData) => {
    try {
      console.log("Submitting offer for request:", request.id);

      const newOffer = {
        ...offerData,
        requestId: request.id,
        serviceId: userId,
        clientId: request.userId,
        status: "Active",
        createdAt: new Date().toISOString(),
      };

      // Update request status to Rezolvat
      const requestRef = doc(db, "requests", request.id);
      await updateDoc(requestRef, {
        status: "Rezolvat",
        hasOffer: true
      });

      const offerRef = await addDoc(collection(db, "offers"), newOffer);
      console.log("Offer submitted successfully:", offerRef.id);

      // Explicitly refresh the requests to update the UI
      await fetchRequests();

      toast({
        title: "Success",
        description: "Offer has been sent successfully.",
      });

      return true;
    } catch (error) {
      console.error("Error submitting offer:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not submit the offer. Please try again.",
      });
      return false;
    }
  };

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
        });
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

      await fetchRequests();

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
    fetchRequests,
    handleSubmitOffer,
  };
}