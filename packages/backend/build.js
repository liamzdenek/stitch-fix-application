#!/usr/bin/env node
const { build } = require('esbuild');
const path = require('path');
const fs = require('fs');

function bundle() {
  console.log('Bundling Backend API with esbuild...');
  
  // Create dist directory if it doesn't exist
  const distDir = path.join(__dirname, '../../dist/packages/backend');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  try {
    // Bundle the Backend API handler
    build({
      entryPoints: [path.join(__dirname, 'src/main.ts')],
      bundle: true,
      platform: 'node',
      target: 'node20',
      outfile: path.join(distDir, 'main.js'),
      external: [],
      format: 'cjs', // Use CommonJS format instead of ESM
      banner: {
        js: '// Generated with esbuild',
      },
      minify: false,
      sourcemap: 'external',
      define: {
        'process.env.NODE_ENV': '"production"'
      },
      mainFields: ['main', 'module'],
      nodePaths: [path.join(__dirname, '../../node_modules')],
    }).then(() => {
      // Create a minimal package.json for the bundle
      const packageJson = {
        name: '@stitch-fix/backend-bundle',
        version: '0.0.1',
        private: true,
        main: 'main.js',
      };

      fs.writeFileSync(
        path.join(distDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      console.log('Bundle created successfully at:', distDir);
    }).catch(error => {
      console.error('Bundling failed:', error);
      process.exit(1);
    });
  } catch (error) {
    console.error('Bundling failed:', error);
    process.exit(1);
  }
}

bundle();