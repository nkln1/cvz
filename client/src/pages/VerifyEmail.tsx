import { useEffect, useState } from "react";
import { useLocation, useLocation as useWouterLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifyEmail() {
  const [isVerifying, setIsVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const [, params] = useWouterLocation("/verify-email");
  const token = new URLSearchParams(window.location.search).get("token");

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setError("Token de verificare lipsă");
        setIsVerifying(false);
        return;
      }

      try {
        const response = await fetch("/api/verify-email", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ token }),
        });

        if (!response.ok) {
          throw new Error(await response.text());
        }

        setIsVerifying(false);
      } catch (error) {
        setError(error instanceof Error ? error.message : "Eroare la verificare");
        setIsVerifying(false);
      }
    };

    verifyEmail();
  }, [token]);

  const handleReturn = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Verificare Email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isVerifying ? (
            <p className="text-center text-gray-600">Se verifică emailul...</p>
          ) : error ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <p>{error}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                <p>Email verificat cu succes!</p>
              </div>
            </div>
          )}
          
          <Button
            onClick={handleReturn}
            className="w-full bg-[#00aff5] hover:bg-[#0099d6]"
          >
            Înapoi la pagina principală
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
