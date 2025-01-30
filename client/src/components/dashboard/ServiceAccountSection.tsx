import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserCog, Save, Pen, Loader2 } from "lucide-react";
import type { ServiceData, EditableField, ValidationErrors } from "@/types/service";
import { serviceDataSchema } from "@/types/service";

interface ServiceAccountSectionProps {
  userId: string;
  serviceData: ServiceData;
  fields: EditableField[];
  validationErrors: ValidationErrors;
}

export function ServiceAccountSection({
  userId,
  serviceData,
  fields,
  validationErrors: initialValidationErrors,
}: ServiceAccountSectionProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [editingFields, setEditingFields] = useState<Record<string, boolean>>({});
  const [localServiceData, setLocalServiceData] = useState(serviceData);
  const [validationErrors, setValidationErrors] = useState(initialValidationErrors);

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
    setLocalServiceData((prev) => ({
      ...prev,
      [field]: value,
    }));
    validateField(field, value);
  };

  const handleSave = async () => {
    if (!userId) return;

    let isValid = true;
    const newErrors: ValidationErrors = {};

    fields.forEach(({ key, editable }) => {
      if (editable) {
        try {
          const schema = z.object({
            [key]: serviceDataSchema.shape[key as keyof typeof serviceDataSchema.shape],
          });
          schema.parse({ [key]: localServiceData[key] });
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

    setLoading(true);
    try {
      const serviceRef = doc(db, "services", userId);
      await updateDoc(serviceRef, localServiceData);
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
      setLoading(false);
    }
  };

  return (
    <Card className="border-[#00aff5]/20">
      <CardHeader>
        <CardTitle className="text-[#00aff5] flex items-center gap-2">
          <UserCog className="h-5 w-5" />
          Cont
        </CardTitle>
        <CardDescription>
          Gestionează informațiile contului și setările
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fields.map(({ label, key, editable, type, options }) => (
            <div key={key}>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium">{label}</label>
                {editable && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(key)}
                    className="px-2 h-7"
                  >
                    {editingFields[key] ? (
                      <Save className="h-4 w-4" />
                    ) : (
                      <Pen className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>
              {type === "select" ? (
                <Select
                  value={localServiceData[key]}
                  onValueChange={(value) => handleChange(key, value)}
                  disabled={!editingFields[key]}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(options || []).map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={localServiceData[key]}
                  onChange={(e) => handleChange(key, e.target.value)}
                  disabled={!editable || !editingFields[key]}
                  className={validationErrors[key] ? "border-red-500" : ""}
                />
              )}
              {validationErrors[key] && (
                <p className="text-xs text-red-500 mt-1">{validationErrors[key]}</p>
              )}
            </div>
          ))}
        </div>
        <div className="mt-6">
          <Button
            onClick={handleSave}
            className="bg-[#00aff5] hover:bg-[#0099d6] text-white"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Se salvează...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvează modificările
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
