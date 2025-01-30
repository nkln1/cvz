import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { User, Pencil, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { romanianCounties, getCitiesForCounty } from "@/lib/romaniaData";
import type { UserProfile } from "@/types/dashboard";
import { useAppDispatch } from "@/hooks/useAppDispatch";
import { useAppSelector } from "@/hooks/useAppSelector";
import { setProfile, updateProfile } from "@/store/slices/profileSlice";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ProfileSectionProps {
  userId: string;
}

function ProfileSectionContent({ userId }: ProfileSectionProps) {
  const dispatch = useAppDispatch();
  const userProfile = useAppSelector((state) => state.profile.profile);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfile>(userProfile);
  const [selectedCounty, setSelectedCounty] = useState<string>(userProfile.county || "");
  const { toast } = useToast();

  const handleEditClick = () => setIsEditing(true);

  const handleSave = async () => {
    if (!userId) return;

    try {
      await updateDoc(doc(db, "clients", userId), editedProfile);
      dispatch(setProfile(editedProfile));
      setIsEditing(false);
      toast({
        title: "Succes",
        description: "Profilul a fost actualizat cu succes!",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Nu s-a putut actualiza profilul.",
      });
    }
  };

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setEditedProfile((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (field === "county") {
      setSelectedCounty(value);
      setEditedProfile((prev) => ({
        ...prev,
        county: value,
        city: "",
      }));
    }
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="border-b bg-gray-50">
        <CardTitle className="text-[#00aff5] flex items-center gap-2">
          <User className="h-5 w-5" />
          Profilul Meu
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#00aff5]">Nume</label>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <Input
                    value={editedProfile.name || ""}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Nume complet"
                    className="border-gray-300 focus:border-[#00aff5] focus:ring-[#00aff5]"
                  />
                ) : (
                  <p className="text-gray-900">
                    {userProfile.name || "Nespecificat"}
                  </p>
                )}
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleEditClick}
                    className="h-8 w-8 hover:text-[#00aff5]"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#00aff5]">Email</label>
              <p className="text-gray-900">{userProfile.email}</p>
            </div>

            {/* Phone Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#00aff5]">Telefon</label>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <Input
                    value={editedProfile.phone || ""}
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                    placeholder="Număr de telefon"
                    className="border-gray-300 focus:border-[#00aff5] focus:ring-[#00aff5]"
                  />
                ) : (
                  <p className="text-gray-900">
                    {userProfile.phone || "Nespecificat"}
                  </p>
                )}
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleEditClick}
                    className="h-8 w-8 hover:text-[#00aff5]"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* County Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#00aff5]">Județ</label>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <Select
                    value={editedProfile.county || ""}
                    onValueChange={(value) => handleInputChange("county", value)}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-[#00aff5] focus:ring-[#00aff5]">
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
                ) : (
                  <p className="text-gray-900">
                    {userProfile.county || "Nespecificat"}
                  </p>
                )}
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleEditClick}
                    className="h-8 w-8 hover:text-[#00aff5]"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* City Field */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#00aff5]">
                Localitate
              </label>
              <div className="flex items-center gap-2">
                {isEditing ? (
                  <Select
                    value={editedProfile.city || ""}
                    onValueChange={(value) => handleInputChange("city", value)}
                    disabled={!selectedCounty}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-[#00aff5] focus:ring-[#00aff5]">
                      <SelectValue placeholder="Selectează localitatea" />
                    </SelectTrigger>
                    <SelectContent>
                      {selectedCounty &&
                        getCitiesForCounty(selectedCounty).map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-gray-900">
                    {userProfile.city || "Nespecificat"}
                  </p>
                )}
                {!isEditing && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleEditClick}
                    className="h-8 w-8 hover:text-[#00aff5]"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditedProfile(userProfile);
                }}
                className="hover:bg-gray-100"
              >
                Anulează
              </Button>
              <Button
                onClick={handleSave}
                className="bg-[#00aff5] hover:bg-[#0099d6]"
              >
                Salvează
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function ProfileSection(props: ProfileSectionProps) {
  return (
    <ErrorBoundary
      fallback={
        <Card className="shadow-lg">
          <CardHeader className="border-b bg-gray-50">
            <CardTitle className="text-[#00aff5] flex items-center gap-2">
              <User className="h-5 w-5" />
              Profilul Meu
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                Nu s-au putut încărca datele profilului. Vă rugăm să reîncărcați pagina.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      }
    >
      <ProfileSectionContent {...props} />
    </ErrorBoundary>
  );
}