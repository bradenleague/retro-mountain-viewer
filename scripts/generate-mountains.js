#!/usr/bin/env node
/**
 * Generate mountains.json from available heightmaps
 * Run: node scripts/generate-mountains.js
 *
 * This script scans public/ for heightmaps and generates a JSON config
 * that the app can import at build time.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectDir = path.dirname(__dirname);
const publicDir = path.join(projectDir, 'public');
const outputPath = path.join(projectDir, 'src', 'lib', 'mountains.json');

// Known mountains with their configs (elevation in meters)
const originalMountains = {
  rainier: { name: "Mt. Rainier", elevation: 4392, snowLine: 0.54, treeLine: 0.38, state: "washington", range: "Cascade Range" },
  hood: { name: "Mt. Hood", elevation: 3429, snowLine: 0.62, treeLine: 0.45, state: "oregon", range: "Cascade Range" },
  baker: { name: "Mt. Baker", elevation: 3286, snowLine: 0.60, treeLine: 0.42, state: "washington", range: "Cascade Range" },
  sthelens: { name: "Mt. St. Helens", elevation: 2549, snowLine: 0.73, treeLine: 0.50, state: "washington", range: "Cascade Range" },
  teton: { name: "Grand Teton", elevation: 4199, snowLine: 0.73, treeLine: 0.67, state: "wyoming", range: "Teton Range" },
  denali: { name: "Denali", elevation: 6190, snowLine: 0.31, treeLine: 0.12, state: "alaska", range: "Alaska Range" },
  grandcanyon: { name: "Grand Canyon", elevation: 2100, snowLine: 1.0, treeLine: 0.85, state: "arizona", range: "Colorado Plateau" },
  craterlake: { name: "Crater Lake", elevation: 2487, snowLine: 0.80, treeLine: 0.65, state: "oregon", range: "Cascade Range" },
  monumentvalley: { name: "Monument Valley", elevation: 1700, snowLine: 1.0, treeLine: 0.95, state: "arizona", range: "Colorado Plateau" },
  whitney: { name: "Mt. Whitney", elevation: 4421, snowLine: 0.72, treeLine: 0.60, state: "california", range: "Sierra Nevada" },
  shasta: { name: "Mt. Shasta", elevation: 4322, snowLine: 0.55, treeLine: 0.40, state: "california", range: "Cascade Range" },
  elbert: { name: "Mt. Elbert", elevation: 4401, snowLine: 0.68, treeLine: 0.55, state: "colorado", range: "Sawatch Range" },
};

// Calculate snow/tree lines based on latitude and range
function calculateLines(lat, range) {
  if (range?.includes('White')) {
    return { snowLine: 0.85, treeLine: 0.80 }; // Desert
  } else if (range?.includes('Cascade')) {
    return { snowLine: 0.55, treeLine: 0.40 }; // Cascades
  } else if (lat > 40) {
    return { snowLine: 0.55, treeLine: 0.40 }; // Northern
  } else if (lat > 38) {
    return { snowLine: 0.68, treeLine: 0.55 }; // Colorado central/north
  } else {
    return { snowLine: 0.72, treeLine: 0.60 }; // Southern Colorado / Sierra
  }
}

// Get image dimensions using sips (macOS) or identify (ImageMagick)
function getImageDimensions(filePath) {
  try {
    // Try sips first (macOS)
    const output = execSync(`sips -g pixelWidth -g pixelHeight "${filePath}" 2>/dev/null`, { encoding: 'utf-8' });
    const widthMatch = output.match(/pixelWidth:\s*(\d+)/);
    const heightMatch = output.match(/pixelHeight:\s*(\d+)/);
    if (widthMatch && heightMatch) {
      return { width: parseInt(widthMatch[1]), height: parseInt(heightMatch[1]) };
    }
  } catch {
    // Fallback to identify (ImageMagick)
    try {
      const output = execSync(`identify -format "%w %h" "${filePath}" 2>/dev/null`, { encoding: 'utf-8' });
      const [width, height] = output.trim().split(' ').map(Number);
      if (width && height) {
        return { width, height };
      }
    } catch {
      // Default fallback
      return { width: 1000, height: 1000 };
    }
  }
  return { width: 1000, height: 1000 };
}

// Scan for heightmaps
const heightmapFiles = fs.readdirSync(publicDir)
  .filter(f => f.endsWith('_heightmap.png'))
  .sort();

console.log(`Found ${heightmapFiles.length} heightmaps`);

const mountains = [];

for (const file of heightmapFiles) {
  const id = file.replace('_heightmap.png', '');
  const filePath = path.join(publicDir, file);
  const { width, height } = getImageDimensions(filePath);

  // Check if it's a known mountain
  const known = originalMountains[id];

  let config;

  if (known) {
    // It's a known mountain
    const elevMax = known.elevation;
    const elevMin = Math.round(elevMax * 0.3); // Estimate base at ~30% of peak
    config = {
      id,
      name: known.name,
      heightmap: `/${file}`,
      width,
      height,
      elevation: { min: elevMin, max: elevMax },
      snowLine: known.snowLine,
      treeLine: known.treeLine,
      state: known.state,
      range: known.range,
    };
  } else {
    // Unknown mountain - use defaults
    config = {
      id,
      name: id.charAt(0).toUpperCase() + id.slice(1),
      heightmap: `/${file}`,
      width,
      height,
      elevation: { min: 500, max: 4000 },
      snowLine: 0.70,
      treeLine: 0.55,
      state: 'unknown',
      range: 'Unknown',
    };
  }

  mountains.push(config);
}

// Sort alphabetically by name
mountains.sort((a, b) => a.name.localeCompare(b.name));

// Group by state for the output
const byState = {};
for (const m of mountains) {
  const state = m.state || 'other';
  if (!byState[state]) byState[state] = [];
  byState[state].push(m);
}

const output = {
  generated: new Date().toISOString(),
  total: mountains.length,
  byState,
  mountains,
};

// Ensure output directory exists
const outputDir = path.dirname(outputPath);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
console.log(`Generated ${outputPath}`);
console.log(`  Total: ${output.total} mountains`);
console.log(`  States: ${Object.keys(byState).join(', ')}`);
