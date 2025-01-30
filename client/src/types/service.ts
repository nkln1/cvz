import { z } from "zod";

export interface Car {
  id: string;
  brand: string;
  model: string;
  year: string;
  vin?: string;
  licensePlate?: string;
}

export interface Request {
  id: string;
  title: string;
  description: string;
  carId: string;
  car?: Car;
  preferredDate: string;
  county: string;
  cities: string[];
  status: "Active" | "Rezolvat" | "Anulat";
  createdAt: string;
  userId: string;
  clientName: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  numeComplet?: string;
  nume?: string;
  prenume?: string;
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

export interface MessageGroup {
  requestId: string;
  requestTitle: string;
  lastMessage: Message;
  unreadCount: number;
  clientName: string;
}

export interface ServiceData {
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

export interface EditableField {
  label: string;
  key: keyof ServiceData;
  editable: boolean;
  type?: "text" | "select";
  options?: string[];
}

export interface ValidationErrors {
  [key: string]: string;
}

export const serviceDataSchema = z.object({
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