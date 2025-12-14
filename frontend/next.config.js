/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    // Fix for pdf-parse and pdfjs-dist compatibility with Next.js
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        'canvas': 'commonjs canvas',
        'utf-8-validate': 'commonjs utf-8-validate',
        'bufferutil': 'commonjs bufferutil',
      });
      
      // Externalize pdf-parse for server-side to avoid webpack bundling issues
      config.externals.push('pdf-parse');
    }
    
    // Handle pdf-parse module resolution
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    
    // Ignore pdfjs-dist warnings in development
    if (process.env.NODE_ENV === 'development') {
      config.ignoreWarnings = [
        { module: /pdfjs-dist/ },
        { file: /pdfjs-dist/ },
      ];
    }
    
    return config;
  },
}

module.exports = nextConfig

