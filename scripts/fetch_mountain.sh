#!/bin/bash
# Fetch mountain elevation data from USGS 3DEP via GDAL
# Usage: ./scripts/fetch_mountain.sh <name> <west> <south> <east> <north> [max_elev]
#
# Examples:
#   ./scripts/fetch_mountain.sh rainier -121.95 46.70 -121.55 47.00 5000
#   ./scripts/fetch_mountain.sh hood -121.85 45.25 -121.55 45.50 4000
#   ./scripts/fetch_mountain.sh teton -110.95 43.60 -110.65 43.90 4500
#   ./scripts/fetch_mountain.sh sthelens -122.35 46.05 -122.05 46.35 3000
#   ./scripts/fetch_mountain.sh shasta -122.35 41.25 -122.05 41.55 5000
#   ./scripts/fetch_mountain.sh whitney -118.45 36.45 -118.15 36.75 5000

set -e

if [ $# -lt 5 ]; then
  echo "Usage: $0 <name> <west> <south> <east> <north> [max_elev]"
  echo ""
  echo "Arguments:"
  echo "  name      - Output filename (e.g., 'rainier' -> rainier_heightmap.png)"
  echo "  west      - Western longitude bound (negative for US)"
  echo "  south     - Southern latitude bound"
  echo "  east      - Eastern longitude bound (negative for US)"
  echo "  north     - Northern latitude bound"
  echo "  max_elev  - Maximum elevation for scaling (default: 5000)"
  echo ""
  echo "Examples:"
  echo "  $0 rainier -121.95 46.70 -121.55 47.00 5000"
  echo "  $0 hood -121.85 45.25 -121.55 45.50 4000"
  exit 1
fi

NAME=$1
WEST=$2
SOUTH=$3
EAST=$4
NORTH=$5
MAX_ELEV=${6:-5000}

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
OUTPUT_DIR="$PROJECT_DIR/public"

USGS_VRT="/vsicurl/https://prd-tnm.s3.amazonaws.com/StagedProducts/Elevation/13/TIFF/USGS_Seamless_DEM_13.vrt"

echo "========================================"
echo "Fetching: $NAME"
echo "Bounds: W=$WEST S=$SOUTH E=$EAST N=$NORTH"
echo "Max elevation: $MAX_ELEV m"
echo "========================================"
echo ""

# Check for GDAL
if ! command -v gdalwarp &> /dev/null; then
  echo "Error: GDAL not found. Install with: brew install gdal"
  exit 1
fi

echo "[1/4] Fetching DEM from USGS 3DEP..."
gdalwarp -t_srs EPSG:4326 \
  -te $WEST $SOUTH $EAST $NORTH \
  -tr 0.0003 0.0003 \
  -r bilinear \
  "$USGS_VRT" \
  "/tmp/${NAME}_dem.tif"

echo ""
echo "[2/4] Checking elevation statistics..."
STATS=$(gdalinfo -stats "/tmp/${NAME}_dem.tif" 2>/dev/null)
MIN_ELEV=$(echo "$STATS" | grep "STATISTICS_MINIMUM" | head -1 | cut -d= -f2)
MAX_ELEV_ACTUAL=$(echo "$STATS" | grep "STATISTICS_MAXIMUM" | head -1 | cut -d= -f2)
echo "  Elevation range: ${MIN_ELEV}m to ${MAX_ELEV_ACTUAL}m"

echo ""
echo "[3/4] Converting to PNG heightmap..."
gdal_translate -ot Byte \
  -scale 0 $MAX_ELEV 0 255 \
  -of PNG \
  "/tmp/${NAME}_dem.tif" \
  "$OUTPUT_DIR/${NAME}_heightmap.png"

echo ""
echo "[4/4] Getting output info..."
WIDTH=$(gdalinfo "$OUTPUT_DIR/${NAME}_heightmap.png" 2>/dev/null | grep "Size is" | sed 's/Size is //' | cut -d, -f1)
HEIGHT=$(gdalinfo "$OUTPUT_DIR/${NAME}_heightmap.png" 2>/dev/null | grep "Size is" | sed 's/Size is //' | cut -d, -f2 | tr -d ' ')
SIZE=$(ls -lh "$OUTPUT_DIR/${NAME}_heightmap.png" | awk '{print $5}')

echo ""
echo "========================================"
echo "Success!"
echo "========================================"
echo "Output: $OUTPUT_DIR/${NAME}_heightmap.png"
echo "Size: ${WIDTH}x${HEIGHT} pixels ($SIZE)"
echo ""
echo "To use in MtRainierPS2.svelte, update:"
echo "  - loadHeightmap('/${NAME}_heightmap.png')"
echo "  - aspectRatio = $WIDTH / $HEIGHT"
echo "  - texelX = 1.0 / $WIDTH"
echo "  - texelY = 1.0 / $HEIGHT"
echo ""

# Cleanup
rm -f "/tmp/${NAME}_dem.tif"
