import { NotFoundPage, type NotFoundApp } from '../components/NotFoundPage';

const APP: NotFoundApp = {
  color: '#E83E8C',
  description: 'A private portrait workspace where artists can shape, inspect, compare, and export with control.',
  features: [
    'Body-Aware Portrait Shaping',
    'Waist, Hip, Bust, And Curve Controls',
    'Manual Local Warp Points',
    'Original And Edit Comparison',
    'Detection And Mesh Overlays',
    'Private High-Resolution Export',
  ],
  homeLabel: 'RETURN TO FIGUR',
  logo: '/figur-mark.svg',
  name: 'FIGUR',
  tagline: 'This portrait path ends here. Return to the canvas to open a photo and continue shaping it.',
};

export default function NotFound() {
  return <NotFoundPage app={APP} />;
}
