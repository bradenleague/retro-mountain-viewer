# Fetching Real Elevation Data with GDAL

This guide explains how to pull real elevation data from USGS 3DEP directly using GDAL's virtual file system — no manual downloads required.

## Prerequisites

Install GDAL:

```bash
# macOS
brew install gdal

# Ubuntu/Debian
sudo apt install gdal-bin

# Windows (via OSGeo4W or conda)
conda install -c conda-forge gdal
```

## How It Works

USGS hosts their 3DEP (3D Elevation Program) data as Cloud Optimized GeoTIFFs (COGs) on AWS S3. GDAL's `/vsicurl/` driver can read these files directly over HTTPS, fetching only the tiles needed for your area of interest.

**The magic URL:**
```
/vsicurl/https://prd-tnm.s3.amazonaws.com/StagedProducts/Elevation/13/TIFF/USGS_Seamless_DEM_13.vrt
```

This VRT (Virtual Raster) file acts as a seamless mosaic of all 1/3 arc-second (~10m resolution) DEM tiles across the US.

## Quick Start: Fetch Any Mountain

### 1. Find the Bounding Box

Look up your mountain's coordinates and create a bounding box around it:

| Mountain | Latitude | Longitude | Suggested Bounds (W, S, E, N) |
|----------|----------|-----------|-------------------------------|
| Mt. Rainier | 46.8523 | -121.7603 | -121.95, 46.70, -121.55, 47.00 |
| Mt. Hood | 45.3735 | -121.6959 | -121.85, 45.25, -121.55, 45.50 |
| Mt. St. Helens | 46.1912 | -122.1944 | -122.35, 46.05, -122.05, 46.35 |
| Mt. Shasta | 41.4092 | -122.1949 | -122.35, 41.25, -122.05, 41.55 |
| Grand Teton | 43.7412 | -110.8024 | -110.95, 43.60, -110.65, 43.90 |
| Mt. Whitney | 36.5785 | -118.2923 | -118.45, 36.45, -118.15, 36.75 |
| Denali | 63.0692 | -151.0070 | -151.20, 62.90, -150.80, 63.20 |

### 2. Fetch the DEM

```bash
# Replace bounds with your mountain's bounding box
gdalwarp -t_srs EPSG:4326 \
  -te <west> <south> <east> <north> \
  -tr 0.0003 0.0003 \
  -r bilinear \
  /vsicurl/https://prd-tnm.s3.amazonaws.com/StagedProducts/Elevation/13/TIFF/USGS_Seamless_DEM_13.vrt \
  mountain_dem.tif
```

**Parameters:**
- `-t_srs EPSG:4326` — Output in WGS84 lat/lon coordinates
- `-te W S E N` — Target extent (bounding box)
- `-tr 0.0003 0.0003` — Target resolution (~30m per pixel)
- `-r bilinear` — Resampling method (bilinear is good for terrain)

### 3. Check Elevation Range

```bash
gdalinfo -stats mountain_dem.tif | grep -E "Minimum|Maximum"
```

Note the min/max values for the next step.

### 4. Convert to PNG Heightmap

```bash
# Scale elevation to 0-255 grayscale
# Adjust the scale range based on your mountain's elevation
gdal_translate -ot Byte \
  -scale <min_elev> <max_elev> 0 255 \
  -of PNG \
  mountain_dem.tif \
  mountain_heightmap.png
```

**Recommended scale ranges:**

| Region | Scale Range | Notes |
|--------|-------------|-------|
| Cascades (Rainier, Hood) | 0-5000 | Summits ~4000-4400m |
| Sierra Nevada (Whitney) | 0-5000 | Summit at 4421m |
| Rockies (Grand Teton) | 1500-4500 | Higher base elevation |
| Alaska (Denali) | 0-6500 | Summit at 6190m |
| General US | 0-5000 | Good default |

### 5. Copy to Project

```bash
cp mountain_heightmap.png /path/to/webgpu-lab/public/
```

## Complete Examples

### Mt. Hood, Oregon

```bash
# Fetch
gdalwarp -t_srs EPSG:4326 \
  -te -121.85 45.25 -121.55 45.50 \
  -tr 0.0003 0.0003 \
  -r bilinear \
  /vsicurl/https://prd-tnm.s3.amazonaws.com/StagedProducts/Elevation/13/TIFF/USGS_Seamless_DEM_13.vrt \
  /tmp/hood_dem.tif

# Check stats
gdalinfo -stats /tmp/hood_dem.tif | grep -E "Minimum|Maximum"
# Output: Minimum=152.xxx, Maximum=3426.xxx

# Convert to heightmap
gdal_translate -ot Byte -scale 0 4000 0 255 -of PNG \
  /tmp/hood_dem.tif public/hood_heightmap.png
```

### Grand Teton, Wyoming

```bash
gdalwarp -t_srs EPSG:4326 \
  -te -110.95 43.60 -110.65 43.90 \
  -tr 0.0003 0.0003 \
  -r bilinear \
  /vsicurl/https://prd-tnm.s3.amazonaws.com/StagedProducts/Elevation/13/TIFF/USGS_Seamless_DEM_13.vrt \
  /tmp/teton_dem.tif

gdal_translate -ot Byte -scale 1800 4200 0 255 -of PNG \
  /tmp/teton_dem.tif public/teton_heightmap.png
```

### Mt. St. Helens, Washington

```bash
gdalwarp -t_srs EPSG:4326 \
  -te -122.35 46.05 -122.05 46.35 \
  -tr 0.0003 0.0003 \
  -r bilinear \
  /vsicurl/https://prd-tnm.s3.amazonaws.com/StagedProducts/Elevation/13/TIFF/USGS_Seamless_DEM_13.vrt \
  /tmp/sthelens_dem.tif

gdal_translate -ot Byte -scale 0 3000 0 255 -of PNG \
  /tmp/sthelens_dem.tif public/sthelens_heightmap.png
```

## One-Liner Script

Save this as `fetch_mountain.sh`:

```bash
#!/bin/bash
# Usage: ./fetch_mountain.sh <name> <west> <south> <east> <north> <max_elev>

NAME=$1
WEST=$2
SOUTH=$3
EAST=$4
NORTH=$5
MAX_ELEV=${6:-5000}

USGS_VRT="/vsicurl/https://prd-tnm.s3.amazonaws.com/StagedProducts/Elevation/13/TIFF/USGS_Seamless_DEM_13.vrt"

echo "Fetching $NAME DEM..."
gdalwarp -t_srs EPSG:4326 -te $WEST $SOUTH $EAST $NORTH -tr 0.0003 0.0003 -r bilinear \
  "$USGS_VRT" "/tmp/${NAME}_dem.tif"

echo "Stats:"
gdalinfo -stats "/tmp/${NAME}_dem.tif" | grep -E "Minimum|Maximum"

echo "Converting to PNG..."
gdal_translate -ot Byte -scale 0 $MAX_ELEV 0 255 -of PNG \
  "/tmp/${NAME}_dem.tif" "public/${NAME}_heightmap.png"

echo "Done: public/${NAME}_heightmap.png"
ls -lh "public/${NAME}_heightmap.png"
```

Usage:
```bash
chmod +x fetch_mountain.sh
./fetch_mountain.sh rainier -121.95 46.70 -121.55 47.00 5000
./fetch_mountain.sh hood -121.85 45.25 -121.55 45.50 4000
./fetch_mountain.sh teton -110.95 43.60 -110.65 43.90 4500
```

## Higher Resolution Options

USGS provides multiple resolution levels:

| Resolution | Path Component | Approx. Resolution |
|------------|----------------|-------------------|
| 1 arc-second | `/1/` | ~30m |
| 1/3 arc-second | `/13/` | ~10m |
| 1/9 arc-second | `/19/` | ~3m (limited coverage) |
| 1 meter | `/1m/` | 1m (limited coverage) |

For 1 arc-second (faster downloads, lower resolution):
```bash
/vsicurl/https://prd-tnm.s3.amazonaws.com/StagedProducts/Elevation/1/TIFF/USGS_Seamless_DEM_1.vrt
```

## Adding Mountains to the App

The app auto-generates mountain configs from heightmaps at build time. To add a new mountain:

### 1. Fetch the Data

```bash
./scripts/fetch_mountain.sh <name> <west> <south> <east> <north> [max_elev]
```

### 2. Regenerate Config

```bash
npm run generate-mountains
```

This scans `public/` for heightmaps and generates `src/lib/mountains.json` with all the necessary config.

### 3. Done!

The app will automatically pick up the new mountain on the next dev server restart or build.

## Batch Fetching 14ers

The project includes a complete database of all 14ers (peaks over 14,000ft) in the lower 48 states in `scripts/fourteeners.json`.

### Fetch All 14ers

```bash
# Fetch everything (~5 minutes for 72 peaks)
npm run fetch-14ers

# Or use the script directly
./scripts/batch_fetch_14ers.sh all
```

### Fetch by State

```bash
./scripts/batch_fetch_14ers.sh colorado    # 58 peaks
./scripts/batch_fetch_14ers.sh california  # 12 peaks
./scripts/batch_fetch_14ers.sh washington  # 2 peaks
```

### Resume from Index

If the batch is interrupted, resume from a specific peak:

```bash
# Skip first 20 Colorado peaks
./scripts/batch_fetch_14ers.sh colorado 20
```

### How It Works

1. `batch_fetch_14ers.sh` reads coordinates from `fourteeners.json`
2. For each peak, it calculates a ~30km bounding box centered on the summit
3. Calls `fetch_mountain.sh` to download and convert the DEM
4. After fetching, run `npm run generate-mountains` to update the config

### 14ers Database

The `scripts/fourteeners.json` file contains:

```json
{
  "peaks": {
    "colorado": [
      { "id": "elbert", "name": "Mount Elbert", "lat": 39.1178, "lon": -106.4454, "elevation_ft": 14440 },
      ...
    ],
    "california": [...],
    "washington": [...]
  }
}
```

**Data sources:** key2stats.com, peakvisor.com, USGS GNIS

## Tuning Parameters

| Parameter | Description | Typical Values |
|-----------|-------------|----------------|
| `snowLine` | Height where snow begins (0-1 normalized) | 0.5-0.7 for Cascades |
| `treeLine` | Height where trees end (0-1 normalized) | 0.25-0.4 for Cascades |

**Climate guidelines:**
- **Cascades (WA/OR)**: snowLine 0.55-0.65, treeLine 0.40-0.45
- **Sierra Nevada**: snowLine 0.70-0.80, treeLine 0.60-0.68
- **Colorado Rockies**: snowLine 0.65-0.75, treeLine 0.55-0.65
- **Alaska**: snowLine 0.30-0.40, treeLine 0.10-0.20
- **White Mountains (CA)**: snowLine 0.85, treeLine 0.80 (high desert)

The `generate-mountains.js` script automatically estimates these based on latitude and mountain range.

### Current Coverage

| State | 14ers | Other | Total |
|-------|-------|-------|-------|
| Colorado | 58 | 0 | 58 |
| California | 12 | 0 | 12 |
| Washington | 1 | 2 | 3 |
| Oregon | 0 | 2 | 2 |
| Wyoming | 0 | 1 | 1 |
| Alaska | 0 | 1 | 1 |
| Arizona | 0 | 2 | 2 |
| **Total** | **71** | **8** | **79** |

## Data Sources

- **USGS 3DEP**: https://www.usgs.gov/3d-elevation-program
- **AWS Open Data**: https://registry.opendata.aws/usgs-lidar/
- **OpenTopography Portal**: https://portal.opentopography.org/
- **GDAL vsicurl Docs**: https://gdal.org/user/virtual_file_systems.html

## Troubleshooting

**"No such file or directory" error:**
- Check your internet connection
- The USGS server may be temporarily unavailable
- Try adding `--config GDAL_HTTP_TIMEOUT 120`

**Empty or black heightmap:**
- Verify your bounding box contains land (not ocean)
- Check elevation range with `gdalinfo -stats`

**Slow downloads:**
- Use coarser resolution (`-tr 0.001 0.001`)
- Use smaller bounding box
- The 1 arc-second VRT is faster than 1/3 arc-second

**Outside US coverage:**
- 3DEP only covers the United States
- For global coverage, try SRTM or Copernicus DEM data
