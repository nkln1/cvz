tsx
import { FC, ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/context/NotificationsContext";
import {
  Car,
  MessageSquare,
  Calendar,
  Star,
  User,
  SendHorizonal,
  ClipboardList,
  Store
} from "lucide-react";

interface ServiceLayoutProps {
  children: ReactNode;
}

const navigation = [
  {
    name: "Cererile Clienților",
    href: "/dashboard/service/requests",
    icon: ClipboardList
  },
  {
    name: "Ofertele Trimise",
    href: "/dashboard/service/offers",
    icon: SendHorizonal
  },
  {
    name: "Mesaje",
    href: "/dashboard/service/messages",
    icon: MessageSquare
  },
  {
    name: "Programări",
    href: "/dashboard/service/appointments",
    icon: Calendar
  },
  {
    name: "Recenzii și Feedback",
    href: "/dashboard/service/reviews",
    icon: Star
  },
  {
    name: "Cont",
    href: "/dashboard/service/account",
    icon: User
  },
  {
    name: "Profil Public",
    href: "/dashboard/service/public-profile",
    icon: Store
  }
];

export const ServiceLayout: FC<ServiceLayoutProps> = ({ children }) => {
  const [location] = useLocation();
  const { notifications, clearNotifications } = useNotifications();

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r">
        <div className="h-full px-3 py-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4 px-2">
            <h2 className="text-xl font-semibold">Service Dashboard</h2>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuGroup>
                  {notifications.length === 0 ? (
                    <DropdownMenuItem>Nu există notificări noi</DropdownMenuItem>
                  ) : (
                    notifications.map((notification, index) => (
                      <DropdownMenuItem key={index} className="flex flex-col items-start">
                        <span className="font-medium">{notification.message}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(notification.timestamp).toLocaleString()}
                        </span>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuGroup>
                {notifications.length > 0 && (
                  <Button 
                    variant="ghost" 
                    className="w-full mt-2"
                    onClick={clearNotifications}
                  >
                    Marchează ca citite
                  </Button>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <ul className="space-y-2 font-medium">
            {navigation.map((item) => {
              const isActive = location === item.href;
              const Icon = item.icon;

              return (
                <li key={item.name}>
                  <Link href={item.href}>
                    <a
                      className={cn(
                        "flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100",
                        isActive && "bg-gray-100"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="ml-3">{item.name}</span>
                    </a>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-8 bg-gray-50">
        {children}
      </div>
    </div>
  );
};