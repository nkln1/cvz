import { useAuth } from "@/context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

interface ServiceData {
  companyName: string;
  representativeName: string;
  email: string;
  phone: string;
  cui: string;
  tradeRegNumber: string;
  address: string;
  county: string;
  city: string;
}

export default function ServiceDashboard() {
  const { user } = useAuth();
  const [serviceData, setServiceData] = useState<ServiceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchServiceData() {
      if (!user) return;

      try {
        const serviceDoc = await getDoc(doc(db, "services", user.uid));
        if (serviceDoc.exists()) {
          setServiceData(serviceDoc.data() as ServiceData);
        }
      } catch (error) {
        console.error("Error fetching service data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchServiceData();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#00aff5]" />
      </div>
    );
  }

  if (!serviceData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Error loading service data</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-lg rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Dashboard Service Auto
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-700">
                  Informații Service
                </h2>
                <div className="mt-2 space-y-2">
                  <p>
                    <span className="font-medium">Nume Service:</span>{" "}
                    {serviceData.companyName}
                  </p>
                  <p>
                    <span className="font-medium">Reprezentant:</span>{" "}
                    {serviceData.representativeName}
                  </p>
                  <p>
                    <span className="font-medium">Email:</span> {serviceData.email}
                  </p>
                  <p>
                    <span className="font-medium">Telefon:</span>{" "}
                    {serviceData.phone}
                  </p>
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-700">
                  Date Juridice
                </h2>
                <div className="mt-2 space-y-2">
                  <p>
                    <span className="font-medium">CUI:</span> {serviceData.cui}
                  </p>
                  <p>
                    <span className="font-medium">Nr. Înregistrare:</span>{" "}
                    {serviceData.tradeRegNumber}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-700">
                  Adresă și Locație
                </h2>
                <div className="mt-2 space-y-2">
                  <p>
                    <span className="font-medium">Adresă:</span>{" "}
                    {serviceData.address}
                  </p>
                  <p>
                    <span className="font-medium">Județ:</span>{" "}
                    {serviceData.county}
                  </p>
                  <p>
                    <span className="font-medium">Localitate:</span>{" "}
                    {serviceData.city}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
