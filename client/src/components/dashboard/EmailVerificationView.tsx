import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { auth } from "@/lib/firebase";
import { sendEmailVerification } from "firebase/auth";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import MainLayout from "@/components/layout/MainLayout";

export function EmailVerificationView() {
  const [isResendingVerification, setIsResendingVerification] = useState(false);
  const { toast } = useToast();

  const handleResendVerification = async () => {
    if (!auth.currentUser) return;

    setIsResendingVerification(true);
    try {
      await sendEmailVerification(auth.currentUser);
      toast({
        title: "Email trimis",
        description:
          "Un nou email de verificare a fost trimis. Te rugăm să îți verifici căsuța de email.",
      });
    } catch (error) {
      console.error("Error sending verification email:", error);
      toast({
        variant: "destructive",
        title: "Eroare",
        description:
          "Nu s-a putut trimite emailul de verificare. Te rugăm să încerci din nou mai târziu.",
      });
    } finally {
      setIsResendingVerification(false);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Email neverificat</AlertTitle>
          <AlertDescription>
            Te rugăm să îți confirmi adresa de email pentru a avea acces la
            toate funcționalitățile. Verifică-ți căsuța de email pentru
            linkul de confirmare.
          </AlertDescription>
        </Alert>
        <Button
          onClick={handleResendVerification}
          disabled={isResendingVerification}
          className="w-full max-w-md mx-auto block mt-4"
        >
          {isResendingVerification
            ? "Se trimite..."
            : "Retrimite email de verificare"}
        </Button>
      </div>
    </MainLayout>
  );
}
