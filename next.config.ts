import type { NextConfig } from 'next';

const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  // Désactivé pour éviter que la PWA ne sature en mettant en cache vos gros GeoJSON
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: true,
  swcMinify: true,
  register: true,
  handlePendingNotifications: false,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Exclure les gros fichiers de données des fonctions Serverless de Vercel
  experimental: {
    outputFileTracingExcludes: {
      '**/*': [
        'public/balade/Plandeau_*.geojson',
        'public/balade/espaces-verts-Toulouse.json',
        'public/balade/equipements-sportifs-Toulouse.json',
        'public/visites/Montpellier',
        'public/visites/Narbonne',
        'public/visites/Montauban',
      ],
    },
  },

  // Webpack est conservé pour la compatibilité PWA
  webpack: (config) => {
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
    ],
  },
};

export default withPWA(nextConfig);