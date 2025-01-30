import { useState, useEffect } from "react";
import { z } from "zod";
import { doc, updateDoc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserCog, Save, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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

const serviceDataSchema = z.object({
  companyName: z.string().min(3, "Numele companiei trebuie să aibă cel puțin 3 caractere"),
  representativeName: z.string().min(3, "Numele reprezentantului trebuie să aibă cel puțin 3 caractere"),
  email: z.string().email("Adresa de email nu este validă"),
  phone: z.string().regex(/^(\+4|)?(07[0-8]{1}[0-9]{1}|02[0-9]{2}|03[0-9]{2}){1}?(\s|\.|\-)?([0-9]{3}(\s|\.|\-|)){2}$/, "Numărul de telefon nu este valid"),
  cui: z.string(),
  tradeRegNumber: z.string(),
  address: z.string().min(5, "Adresa trebuie să aibă cel puțin 5 caractere"),
  county: z.string().min(2, "Selectați județul"),
  city: z.string().min(2, "Selectați orașul"),
});

interface ServiceProfileSectionProps {
  userId: string;
  serviceData: ServiceData | null;
  setServiceData: (data: ServiceData) => void;
  romanianCities: { [key: string]: string[] };
}

export function ServiceProfileSection({
  userId,
  serviceData,
  setServiceData,
  romanianCities,
}: ServiceProfileSectionProps) {
  const { toast } = useToast();
  const [formData, setFormData] = useState<ServiceData>(serviceData || {} as ServiceData);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const romanianCounties = Object.keys(romanianCities);

  // Set up real-time listener for profile changes
  useEffect(() => {
    if (!userId) return;

    const serviceRef = doc(db, "services", userId);
    const unsubscribe = onSnapshot(
      serviceRef,
      (doc) => {
        if (doc.exists()) {
          const data = doc.data() as ServiceData;
          setFormData(data);
          setServiceData(data);
        }
      },
      (error) => {
        console.error("Error in real-time profile sync:", error);
        toast({
          variant: "destructive",
          title: "Eroare de sincronizare",
          description: "Nu s-au putut sincroniza datele profilului în timp real.",
        });
      }
    );

    // Cleanup listener on component unmount
    return () => unsubscribe();
  }, [userId, setServiceData]);

  // Update formData when serviceData prop changes
  useEffect(() => {
    if (serviceData) {
      setFormData(serviceData);
    }
  }, [serviceData]);

  const validateForm = () => {
    try {
      serviceDataSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const field = err.path[0] as string;
          newErrors[field] = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleChange = (field: keyof ServiceData, value: string) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };
      if (field === 'county') {
        newData.city = '';
      }
      return newData;
    });
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast({
        variant: "destructive",
        title: "Eroare de validare",
        description: "Verificați câmpurile cu erori și încercați din nou.",
      });
      return;
    }

    setSaving(true);
    try {
      const serviceRef = doc(db, "services", userId);
      await updateDoc(serviceRef, formData);
      toast({
        title: "Succes",
        description: "Datele au fost actualizate cu succes.",
      });
    } catch (error) {
      console.error("Error updating service data:", error);
      toast({
        variant: "destructive",
        title: "Eroare",
        description: "Nu am putut actualiza datele. Vă rugăm încercați din nou.",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!serviceData) return null;

  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b bg-gray-50">
        <CardTitle className="text-[#00aff5] flex items-center gap-2">
          <UserCog className="h-5 w-5" />
          Datele Serviciului
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium">Nume Companie</label>
            <Input
              value={formData.companyName || ''}
              onChange={(e) => handleChange('companyName', e.target.value)}
              className={errors.companyName ? "border-red-500" : ""}
            />
            {errors.companyName && <p className="text-xs text-red-500 mt-1">{errors.companyName}</p>}
          </div>

          <div>
            <label className="text-sm font-medium">Nume Reprezentant</label>
            <Input
              value={formData.representativeName || ''}
              onChange={(e) => handleChange('representativeName', e.target.value)}
              className={errors.representativeName ? "border-red-500" : ""}
            />
            {errors.representativeName && <p className="text-xs text-red-500 mt-1">{errors.representativeName}</p>}
          </div>

          <div>
            <label className="text-sm font-medium">Email</label>
            <Input
              value={formData.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              className={errors.email ? "border-red-500" : ""}
              disabled
            />
            {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="text-sm font-medium">Telefon</label>
            <Input
              value={formData.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
              className={errors.phone ? "border-red-500" : ""}
            />
            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
          </div>

          <div>
            <label className="text-sm font-medium">CUI</label>
            <Input
              value={formData.cui || ''}
              disabled
              className="bg-gray-50"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Nr. Înregistrare</label>
            <Input
              value={formData.tradeRegNumber || ''}
              disabled
              className="bg-gray-50"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Adresă</label>
            <Input
              value={formData.address || ''}
              onChange={(e) => handleChange('address', e.target.value)}
              className={errors.address ? "border-red-500" : ""}
            />
            {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address}</p>}
          </div>

          <div>
            <label className="text-sm font-medium">Județ</label>
            <Select
              value={formData.county}
              onValueChange={(value) => handleChange('county', value)}
            >
              <SelectTrigger className={errors.county ? "border-red-500" : ""}>
                <SelectValue placeholder="Selectează județul" />
              </SelectTrigger>
              <SelectContent>
                {romanianCounties.map((county) => (
                  <SelectItem key={county} value={county}>
                    {county}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.county && <p className="text-xs text-red-500 mt-1">{errors.county}</p>}
          </div>

          <div>
            <label className="text-sm font-medium">Oraș</label>
            <Select
              value={formData.city}
              onValueChange={(value) => handleChange('city', value)}
              disabled={!formData.county}
            >
              <SelectTrigger className={errors.city ? "border-red-500" : ""}>
                <SelectValue placeholder="Selectează orașul" />
              </SelectTrigger>
              <SelectContent>
                {(formData.county ? romanianCities[formData.county] : []).map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Se salvează...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvează modificările
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}