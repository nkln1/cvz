import { z } from "zod";

export interface UserProfile {
  name?: string;
  email?: string;
  phone?: string;
  county?: string;
  city?: string;
}

export interface Car {
  id: string;
  brand: string;
  model: string;
  year: string;
  vin?: string;
  licensePlate?: string;
  fuelType: string;
  transmission: "Manuală" | "Automată";
  mileage: number;
}

export interface Request {
  id: string;
  title: string;
  description: string;
  carId: string;
  preferredDate: string;
  county: string;
  cities: string[];
  status: "Active" | "Rezolvat" | "Anulat";
  createdAt: string;
  userId: string;
  clientName?: string;
}

export interface Message {
  id: string;
  requestId: string;
  fromId: string;
  toId: string;
  content: string;
  createdAt: string;
  read: boolean;
}

export interface RequestFormData {
  title: string;
  description: string;
  carId: string;
  preferredDate: string;
  county: string;
  cities: string[];
}

export type TabType = "requests" | "offers" | "messages" | "profile" | "car";