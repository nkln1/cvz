import { Button } from "@/components/ui/button";
import { UserCog, Building2 } from "lucide-react";

interface RoleSelectionProps {
  onSelect: (role: "client" | "service") => void;
}

export default function RoleSelection({ onSelect }: RoleSelectionProps) {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-center">Alege tipul de cont</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Button
          variant="outline"
          className="p-6 h-auto flex flex-col items-center space-y-2 hover:border-[#00aff5] hover:text-[#00aff5] transition-all"
          onClick={() => onSelect("client")}
        >
          <UserCog className="h-8 w-8" />
          <span className="text-sm font-medium">Client</span>
          <span className="text-xs text-muted-foreground text-center">
            Caută și programează servicii auto
          </span>
        </Button>
        <Button
          variant="outline"
          className="p-6 h-auto flex flex-col items-center space-y-2 hover:border-[#00aff5] hover:text-[#00aff5] transition-all"
          onClick={() => onSelect("service")}
        >
          <Building2 className="h-8 w-8" />
          <span className="text-sm font-medium">Service Auto</span>
          <span className="text-xs text-muted-foreground text-center">
            Oferă servicii și primește programări
          </span>
        </Button>
      </div>
    </div>
  );
}
