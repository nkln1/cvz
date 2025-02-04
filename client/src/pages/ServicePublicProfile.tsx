import { useState, useEffect } from "react";
import { collection, query, where, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import {
  Building2,
  MapPin,
  Clock,
  Star,
  Phone,
  Mail,
  Save,
  Loader2,
  Pen,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import type { ServiceData } from "@/types/service";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { decodeSlug } from "@/lib/utils";

interface WorkingHours {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

interface ServicePublicProfileProps {
  slug: string;
}

export function ServicePublicProfile({ slug }: ServicePublicProfileProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [serviceData, setServiceData] = useState<ServiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [workingHours, setWorkingHours] = useState<WorkingHours>({
    monday: "09:00-18:00",
    tuesday: "09:00-18:00",
    wednesday: "09:00-18:00",
    thursday: "09:00-18:00",
    friday: "09:00-18:00",
    saturday: "09:00-14:00",
    sunday: "Închis",
  });

  useEffect(() => {
    async function fetchServiceData() {
      try {
        // Decode the slug to get the company name
        const decodedCompanyName = decodeSlug(slug);

        // Query services collection by company name
        const servicesRef = collection(db, "services");
        const q = query(
          servicesRef,
          where("companyName", "==", decodedCompanyName)
        );

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const serviceDoc = querySnapshot.docs[0];
          const data = serviceDoc.data() as ServiceData;
          setServiceData({ ...data, id: serviceDoc.id });
          if (data.workingHours) {
            setWorkingHours(data.workingHours as WorkingHours);
          }
        } else {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Service not found",
          });
        }
      } catch (error) {
        console.error("Error fetching service data:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load service data",
        });
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      fetchServiceData();
    }
  }, [slug, toast]);

  const isOwner = user?.uid === serviceData?.id;

  const handleSave = async () => {
    if (!serviceData?.id || !isOwner) return;

    try {
      const serviceRef = doc(db, "services", serviceData.id);
      await updateDoc(serviceRef, {
        workingHours,
      });
      toast({
        title: "Success",
        description: "Working hours updated successfully",
      });
      setEditing(false);
    } catch (error) {
      console.error("Error updating working hours:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not update working hours",
      });
    }
  };

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
        <p>Service not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Service Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#00aff5]">
                <Building2 className="h-6 w-6" />
                {serviceData.companyName}
              </CardTitle>
              <CardDescription>
                Service Auto Autorizat
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-4 w-4" />
                    {serviceData.address}, {serviceData.city}, {serviceData.county}
                  </p>
                  <p className="flex items-center gap-2 text-gray-600">
                    <Phone className="h-4 w-4" />
                    {serviceData.phone}
                  </p>
                  <p className="flex items-center gap-2 text-gray-600">
                    <Mail className="h-4 w-4" />
                    {serviceData.email}
                  </p>
                </div>

                {/* Working Hours */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Program de funcționare
                    </h3>
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditing(!editing)}
                      >
                        {editing ? (
                          <Save className="h-4 w-4" />
                        ) : (
                          <Pen className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                  <div className="space-y-1">
                    {Object.entries(workingHours).map(([day, hours]) => (
                      <div
                        key={day}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="capitalize">{day}:</span>
                        {editing && isOwner ? (
                          <Input
                            value={hours}
                            onChange={(e) =>
                              setWorkingHours((prev) => ({
                                ...prev,
                                [day]: e.target.value,
                              }))
                            }
                            className="w-32 h-7 text-sm"
                          />
                        ) : (
                          <span>{hours}</span>
                        )}
                      </div>
                    ))}
                  </div>
                  {editing && isOwner && (
                    <Button
                      onClick={handleSave}
                      className="mt-4 w-full bg-[#00aff5] hover:bg-[#0099d6]"
                    >
                      Save Changes
                    </Button>
                  )}
                </div>
              </div>

              {/* Google Maps */}
              <div>
                <h3 className="font-medium mb-2">Locație</h3>
                <div className="aspect-video bg-gray-100 rounded-lg">
                  {/* Google Maps integration will go here */}
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    Google Maps placeholder
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reviews */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#00aff5]">
                <Star className="h-6 w-6" />
                Recenzii
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-500 py-8">
                Nu există recenzii încă
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default ServicePublicProfile;