import { useState } from "react";
import { z } from "zod";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserCog } from "lucide-react";
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
  [key: string]: string;
}

interface ValidationErrors {
  [key: string]: string;
}

interface EditableField {
  label: string;
  key: keyof ServiceData;
  editable: boolean;
  type?: "text" | "select";
  options?: string[];
}

const serviceDataSchema = z.object({
  companyName: z
    .string()
    .min(3, "Numele companiei trebuie să aibă cel puțin 3 caractere"),
  representativeName: z
    .string()
    .min(3, "Numele reprezentantului trebuie să aibă cel puțin 3 caractere"),
  email: z.string().email("Adresa de email nu este validă"),
  phone: z
    .string()
    .regex(
      /^(\+4|)?(07[0-8]{1}[0-9]{1}|02[0-9]{2}|03[0-9]{2}){1}?(\s|\.|\-)?([0-9]{3}(\s|\.|\-|)){2}$/,
      "Numărul de telefon nu este valid",
    ),
  cui: z.string(),
  tradeRegNumber: z.string(),
  address: z.string().min(5, "Adresa trebuie să aibă cel puțin 5 caractere"),
  county: z.string().min(2, "Selectați județul"),
  city: z.string().min(2, "Selectați orașul"),
});

interface ServiceProfileSectionProps {
  userId: string;
  serviceData: ServiceData | null;
  setServiceData: (data: ServiceData | null) => void;
  romanianCities: { [key: string]: string[] };
}

export function ServiceProfileSection({
  userId,
  serviceData,
  setServiceData,
  romanianCities,
}: ServiceProfileSectionProps) {
  const { toast } = useToast();
  const [editedData, setEditedData] = useState<ServiceData | null>(serviceData);
  const [editingFields, setEditingFields] = useState<Record<string, boolean>>({});
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [saving, setSaving] = useState(false);
  const [availableCities, setAvailableCities] = useState<string[]>(
    serviceData?.county ? romanianCities[serviceData.county] || [] : [],
  );

  const romanianCounties = Object.keys(romanianCities);

  const fields: EditableField[] = [
    { label: "Nume Companie", key: "companyName", editable: true },
    { label: "Nume Reprezentant", key: "representativeName", editable: true },
    { label: "Email", key: "email", editable: false },
    { label: "Telefon", key: "phone", editable: true },
    { label: "CUI", key: "cui", editable: false },
    { label: "Nr. Înregistrare", key: "tradeRegNumber", editable: false },
    { label: "Adresă", key: "address", editable: true },
    {
      label: "Județ",
      key: "county",
      editable: true,
      type: "select",
      options: romanianCounties,
    },
    {
      label: "Oraș",
      key: "city",
      editable: true,
      type: "select",
      options: availableCities,
    },
  ];

  const validateField = (field: keyof ServiceData, value: string) => {
    try {
      const schema = z.object({
        [field]: serviceDataSchema.shape[field as keyof typeof serviceDataSchema.shape],
      });
      schema.parse({ [field]: value });
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldError = error.errors[0]?.message;
        setValidationErrors((prev) => ({
          ...prev,
          [field]: fieldError,
        }));
        return false;
      }
      return false;
    }
  };

  const handleEdit = (field: keyof ServiceData) => {
    setEditingFields((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleChange = (field: keyof ServiceData, value: string) => {
    if (editedData) {
      const newData = { ...editedData, [field]: value };

      if (field === "county") {
        setAvailableCities(romanianCities[value] || []);
        newData.city = "";
      }

      setEditedData(newData);
      validateField(field, value);
    }
  };

  const handleSave = async () => {
    if (!userId || !editedData) return;

    let isValid = true;
    const newErrors: ValidationErrors = {};

    fields.forEach(({ key, editable }) => {
      if (editable && editingFields[key]) {
        try {
          const schema = z.object({
            [key]: serviceDataSchema.shape[key as keyof typeof serviceDataSchema.shape],
          });
          schema.parse({ [key]: editedData[key] });
        } catch (error) {
          if (error instanceof z.ZodError) {
            isValid = false;
            newErrors[key] = error.errors[0]?.message || `${key} is invalid`;
          }
        }
      }
    });

    setValidationErrors(newErrors);

    if (!isValid) {
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
      await updateDoc(serviceRef, editedData);
      setServiceData(editedData);
      setEditingFields({});
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

  const hasChanges = JSON.stringify(serviceData) !== JSON.stringify(editedData);

  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b bg-gray-50">
        <CardTitle className="text-[#00aff5] flex items-center gap-2">
          <UserCog className="h-5 w-5" />
          Datele Serviciului
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {fields.map(({ label, key, editable, type, options }) => (
            <div key={key} className="grid grid-cols-1 gap-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">{label}</label>
                {editable && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(key)}
                    className="h-8 px-2 text-[#00aff5]"
                  >
                    {editingFields[key] ? "Salvează" : "Editează"}
                  </Button>
                )}
              </div>
              {type === "select" ? (
                <Select
                  disabled={!editingFields[key]}
                  value={editedData?.[key] || ""}
                  onValueChange={(value) => handleChange(key, value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {options?.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={editedData?.[key] || ""}
                  onChange={(e) => handleChange(key, e.target.value)}
                  disabled={!editingFields[key]}
                  className={
                    validationErrors[key] ? "border-red-500" : undefined
                  }
                />
              )}
              {validationErrors[key] && (
                <p className="text-sm text-red-500">{validationErrors[key]}</p>
              )}
            </div>
          ))}
          {hasChanges && Object.keys(editingFields).some((key) => editingFields[key]) && (
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setEditedData(serviceData);
                  setEditingFields({});
                  setValidationErrors({});
                }}
              >
                Anulează
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Se salvează..." : "Salvează toate modificările"}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}