export interface Filter {
  id: string;
  name: string;
  tintColor?: string;
  opacity?: number;
  saturation?: number;
  brightness?: number;
  contrast?: number;
  blendMode?: 'multiply' | 'overlay' | 'saturation';
}

export type FilterType = 'original' | 'bw' | 'sepia' | 'cool' | 'warm' | 'contrast';

export const FILTERS: Filter[] = [
  {
    id: 'original',
    name: 'Original',
  },
  {
    id: 'bw',
    name: 'B&W',
    blendMode: 'saturation',
    tintColor: '#000000',
    opacity: 1,
  },
  {
    id: 'sepia',
    name: 'Sepia',
    tintColor: '#DEB887',
    opacity: 0.4,
  },
  {
    id: 'cool',
    name: 'Cool',
    tintColor: '#87CEEB',
    opacity: 0.3,
  },
  {
    id: 'warm',
    name: 'Warm',
    tintColor: '#FFB347',
    opacity: 0.3,
  },
  {
    id: 'contrast',
    name: 'Contrast',
    brightness: 1.2,
    contrast: 1.5,
  }
];