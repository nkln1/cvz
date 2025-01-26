// Romanian counties and their cities
import citiesData from '../../../attached_assets/municipii_orase_romania.json';

// Extract counties from the data
export const romanianCounties = Object.keys(citiesData);

// Helper function to get cities for a specific county
export const getCitiesForCounty = (county: string): string[] => {
  return citiesData[county] || [];
};