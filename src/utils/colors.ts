export const getBrandColor = (brand: string) => {
  const brandColors: { [key: string]: string } = {
    // Film Manufacturers
    Kodak: "yellow darken-4",
    Fuji: "green darken-2",
    Cinestill: "red darken-2",
    Konica: "blue darken-2",
    Ilford: "grey darken-3",
    Lomo: "purple accent-2",
    Harman: "grey darken-4",
    Popho: "pink lighten-2",
    Foma: "blue-grey darken-2",
    Rollei: "black",
    Adox: "grey darken-2",
    AgfaPhoto: "orange darken-3",
    Shanghai: "deep-orange darken-2",
    Kentmere: "brown darken-2",

    // Camera Manufacturers
    Canon: "red darken-4",
    Nikon: "deep-orange darken-3",
    Sony: "indigo darken-2",
    Hasselblad: "grey darken-4",
    PhaseOne: "blue-grey darken-4",
    Panasonic: "cyan darken-2",
    Leica: "black",
    Olympus: "blue darken-3",
    Pentax: "deep-purple darken-3",
    Sigma: "grey darken-2",
    Ricoh: "orange darken-3",

    // Additional Legacy Brands
    Minolta: "red darken-3",
    Mamiya: "blue-grey darken-3",
    Bronica: "brown darken-3",
    Yashica: "teal darken-2",
    Contax: "amber darken-3",
    Voigtlander: "grey darken-3",
    Zeiss: "blue darken-4",
  };

  const lowercaseBrand = brand.toLowerCase();
  for (const [key, color] of Object.entries(brandColors)) {
    if (lowercaseBrand.includes(key.toLowerCase())) {
      return color;
    }
  }
  return "";
};

export const getFilmNameColor = (name: string) => {
  const nameColors: { [key: string]: string } = {
    ColorPlus: "amber lighten-2",
    Acros: "grey lighten-3",
    Superia: "green accent-2",
    Provia: "blue lighten-2",
    Velvia: "red accent-2",
    Astia: "orange lighten-2",
    NPH: "deep-purple lighten-3",
    Ektachrome: "blue accent-2",
    Centuria: "purple lighten-2",
    Fujicolor: "light-green lighten-2",
    "Pro 400H": "teal lighten-2",
    Ultramax: "deep-orange lighten-2",
    Portra: "pink lighten-2",
    Ektar: "red lighten-2",
    "800T": "light-blue lighten-2",
    "400D": "deep-purple accent-2",
    "T-Max": "blue-grey lighten-2",
    "Pan F": "grey darken-1",
    Kentmere: "grey lighten-2",
    "Simply Ace": "lime lighten-2",
    Berlin: "grey darken-2",
    Metropolis: "brown darken-2",
    Gold: "yellow lighten-2",
    "Pro Image": "deep-orange lighten-3",
    "Lomo 800": "purple lighten-1",
    "Vision3 250D": "orange accent-2",
    "Vision3 500T": "blue-grey lighten-1",
    HP5: "grey lighten-2",
    Delta: "grey darken-2",
    "Double-X": "blue-grey darken-1",
    Fomapan: "grey lighten-1",
    Luminar: "teal darken-4",
  };

  const lowercaseName = name.toLowerCase();
  for (const [key, color] of Object.entries(nameColors)) {
    if (lowercaseName.includes(key.toLowerCase())) {
      return color;
    }
  }
  return "";
};
