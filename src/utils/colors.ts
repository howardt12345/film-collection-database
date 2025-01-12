
export const getBrandColor = (brand: string) => {
  const brandColors: { [key: string]: string } = {
    'Kodak': 'yellow darken-2',
    'Fuji': 'green darken-2',
    'Cinestill': 'red darken-2',
    'Konica': 'blue darken-2',
    'Ilford': 'grey darken-3',
    'Lomo': 'purple darken-2',
    'Harman': 'orange darken-2',
    'Popho': 'pink lighten-2'
  };

  const lowercaseBrand = brand.toLowerCase();
  for (const [key, color] of Object.entries(brandColors)) {
    if (lowercaseBrand.includes(key.toLowerCase())) {
      return color;
    }
  }
  return '';
};

export const getFilmNameColor = (name: string) => {
  const nameColors: { [key: string]: string } = {
    'ColorPlus': 'amber lighten-2',
    'Acros': 'grey lighten-3',
    'Superia': 'green lighten-2',
    'Provia': 'blue lighten-2',
    'Velvia': 'red accent-2',
    'Astia': 'orange lighten-2',
    'NPH': 'deep-purple lighten-3',
    'Ektachrome': 'cyan lighten-2',
    'Centuria': 'purple lighten-2',
    'Fujicolor': 'light-green lighten-2',
    'Pro 400H': 'teal lighten-2',
    'Ultramax': 'blue lighten-2',
    'Portra': 'pink lighten-3',
    'Ektar': 'red lighten-2',
    '800T': 'light-blue lighten-2',
    '400D': 'deep-purple lighten-2',
    'T-Max': 'blue-grey lighten-2',
    'Pan F': 'grey darken-1',
    'Kentmere': 'brown lighten-2',
    'Simply Ace': 'lime lighten-2',
    'Berlin': 'grey darken-2',
    'Metropolis': 'amber darken-2'
  };

  const lowercaseName = name.toLowerCase();
  for (const [key, color] of Object.entries(nameColors)) {
    if (lowercaseName.includes(key.toLowerCase())) {
      return color;
    }
  }
  return '';
};
