import { LocationDef } from '../types';

export const LOCATIONS: Record<string, LocationDef> = {
  azure_cloud_village: {
    id: 'azure_cloud_village',
    name: 'Azure Cloud Village',
    description: 'A peaceful village nestled at the foot of the Cloud-Touching Mountains.',
    danger: 1,
    shenDensity: 1.0,
    neighbors: {
      whispering_forest: 900,   // 15 min
      green_jade_city: 3600,    // 1 hour
    },
    services: ['inn'],
    minTier: 0,
  },
  whispering_forest: {
    id: 'whispering_forest',
    name: 'Whispering Forest',
    description: 'Ancient woods where spirit beasts roam. The trees whisper with residual qi.',
    danger: 2,
    shenDensity: 1.2,
    neighbors: {
      azure_cloud_village: 900,
      green_jade_city: 1800,
    },
    services: [],
    minTier: 0,
  },
  green_jade_city: {
    id: 'green_jade_city',
    name: 'Green Jade City',
    description: 'A bustling trade city. The air hums with the energy of cultivators and merchants.',
    danger: 1,
    shenDensity: 1.5,
    neighbors: {
      azure_cloud_village: 3600,
      whispering_forest: 1800,
      misty_peaks: 7200,       // 2 hours
      black_wind_gorge: 10800,  // 3 hours
    },
    services: ['inn', 'merchant', 'alchemist'],
    minTier: 0,
  },
  misty_peaks: {
    id: 'misty_peaks',
    name: 'Misty Peaks',
    description: 'Jagged mountains perpetually shrouded in mist. Ancient cultivation caves dot the cliffs.',
    danger: 3,
    shenDensity: 2.0,
    neighbors: {
      green_jade_city: 7200,
      black_wind_gorge: 14400, // 4 hours
    },
    services: [],
    minTier: 1,
  },
  black_wind_gorge: {
    id: 'black_wind_gorge',
    name: 'Black Wind Gorge',
    description: 'A narrow canyon where the wind howls like vengeful spirits. Dark qi lingers here.',
    danger: 4,
    shenDensity: 1.8,
    neighbors: {
      green_jade_city: 10800,
      misty_peaks: 14400,
    },
    services: [],
    minTier: 2,
  },
};
