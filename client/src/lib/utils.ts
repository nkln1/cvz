import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateSlug(companyName: string): string {
  return companyName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
    .replace(/[^a-z0-9]+/g, '-')     // Replace non-alphanumeric chars with hyphens
    .replace(/^-+|-+$/g, '')         // Remove leading/trailing hyphens
    .replace(/-+/g, '-');            // Replace multiple hyphens with single hyphen
}

export function decodeSlug(slug: string): string {
  return slug.replace(/-/g, ' ');
}