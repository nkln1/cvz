// Romanian counties and their major cities
export const romanianCounties = [
  "Alba",
  "Arad",
  "Argeș",
  "Bacău",
  "Bihor",
  "Bistrița-Năsăud",
  "Botoșani",
  "Brașov",
  "Brăila",
  "București",
  "Buzău",
  "Caraș-Severin",
  "Călărași",
  "Cluj",
  "Constanța",
  "Covasna",
  "Dâmbovița",
  "Dolj",
  "Galați",
  "Giurgiu",
  "Gorj",
  "Harghita",
  "Hunedoara",
  "Ialomița",
  "Iași",
  "Ilfov",
  "Maramureș",
  "Mehedinți",
  "Mureș",
  "Neamț",
  "Olt",
  "Prahova",
  "Satu Mare",
  "Sălaj",
  "Sibiu",
  "Suceava",
  "Teleorman",
  "Timiș",
  "Tulcea",
  "Vaslui",
  "Vâlcea",
  "Vrancea"
];

// Example city data for each county
export const citiesByCounty: Record<string, string[]> = {
  "București": ["Sector 1", "Sector 2", "Sector 3", "Sector 4", "Sector 5", "Sector 6"],
  "Cluj": ["Cluj-Napoca", "Turda", "Dej", "Câmpia Turzii", "Gherla", "Huedin"],
  "Timiș": ["Timișoara", "Lugoj", "Sânnicolau Mare", "Jimbolia", "Deta", "Făget"],
  "Constanța": ["Constanța", "Medgidia", "Mangalia", "Năvodari", "Cernavodă", "Ovidiu"],
  "Iași": ["Iași", "Pașcani", "Hârlău", "Târgu Frumos", "Podu Iloaiei"],
  // Add more cities for other counties
  // This is a simplified list. In production, you would want a complete list of cities
  // Default cities for counties without specific data
  "default": ["Oraș reședință", "Alte localități"]
};

export const getCitiesForCounty = (county: string): string[] => {
  return citiesByCounty[county] || citiesByCounty["default"];
};
