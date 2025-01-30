import { useState, useEffect, useCallback } from "react";
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
  const [loading, setLoading] = useState<boolean>(false);

  const fetchRequestClient = useCallback(async (userId: string) => {
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
  }, []);

  useEffect(() => {
    let mounted = true;
    let unsubscribe: (() => void) | undefined;

    const setupRequestListener = async () => {
      if (!userId || !serviceData) {
        console.log("Missing userId or serviceData", { userId, serviceData });
        return;
      }

      try {
        setLoading(true);
        console.log("Setting up request listener for:", {
          county: serviceData.county,
          city: serviceData.city
        });

        const requestsQuery = query(
          collection(db, "requests"),
          where("status", "==", "Active"),
          where("county", "==", serviceData.county)
        );

        unsubscribe = onSnapshot(
          requestsQuery,
          async (querySnapshot) => {
            if (!mounted) return;

            try {
              console.log("Received snapshot with", querySnapshot.size, "documents");
              const newRequests: Request[] = [];
              const newCars: Record<string, Car> = {};

              const processPromises = querySnapshot.docs.map(async (docSnapshot) => {
                const requestData = docSnapshot.data() as Omit<Request, 'id'>;

                if (!requestData.cities.includes(serviceData.city)) {
                  return;
                }

                try {
                  const carDoc = await getDoc(doc(db, "cars", requestData.carId));
                  const carData = carDoc.exists() ? carDoc.data() as Car : undefined;

                  if (mounted) {
                    const request: Request = {
                      ...requestData,
                      id: docSnapshot.id,
                      car: carData
                    };

                    newRequests.push(request);
                    if (carData) {
                      newCars[requestData.carId] = { ...carData, id: requestData.carId };
                    }
                  }
                } catch (error) {
                  console.error("Error fetching car data:", error);
                }
              });

              await Promise.all(processPromises);

              if (mounted) {
                console.log("Processed requests:", newRequests.length);
                setClientRequests(newRequests);
                setCars(newCars);
                setLoading(false);
              }
            } catch (error) {
              console.error("Error processing request updates:", error);
              if (mounted) {
                setLoading(false);
                toast({
                  variant: "destructive",
                  title: "Error",
                  description: "Could not load client requests. Please try again.",
                });
              }
            }
          },
          (error) => {
            console.error("Error in real-time request sync:", error);
            if (mounted) {
              setLoading(false);
              toast({
                variant: "destructive",
                title: "Sync Error",
                description: "Could not sync request updates in real-time.",
              });
            }
          }
        );
      } catch (error) {
        console.error("Error setting up request listener:", error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    setupRequestListener();

    return () => {
      mounted = false;
      if (unsubscribe) {
        console.log("Cleaning up request listener");
        unsubscribe();
      }
    };
  }, [userId, serviceData, toast]);

  const handleViewDetails = useCallback(async (request: Request) => {
    markRequestAsViewed(request.id);
    if (selectedRequest?.id === request.id) {
      setSelectedRequest(null);
      setRequestClient(null);
    } else {
      setSelectedRequest(request);
      const client = await fetchRequestClient(request.userId);
      setRequestClient(client);
    }
  }, [selectedRequest, fetchRequestClient]);

  const markRequestAsViewed = useCallback((requestId: string) => {
    setViewedRequests((prev) => {
      const newSet = new Set(prev);
      newSet.add(requestId);
      localStorage.setItem("viewedRequests", JSON.stringify(Array.from(newSet)));
      return newSet;
    });
  }, []);

  const handleRejectRequest = useCallback(async (requestId: string) => {
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
  }, [toast, markRequestAsViewed]);

  return {
    clientRequests,
    selectedRequest,
    requestClient,
    cars,
    viewedRequests,
    loading,
    handleViewDetails,
    handleRejectRequest,
    markRequestAsViewed,
  };
}