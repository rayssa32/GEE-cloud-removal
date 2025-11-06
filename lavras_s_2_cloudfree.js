/***********************************
 * Sentinel-2 (SR Harmonized) – South of Minas (multiple cities, single GeoTIFF)
 * Cloud mask via SCL + temporal composite (median)
 * Exports ONE .tif file containing all cities (municipality mosaic)
 *
 * Requirements: asset "projects/sete-cidades/assets/MG_Municipios_2024"
 ***********************************/

// =============================
// 0) GENERAL CONFIGURATION
// =============================
var MG = ee.FeatureCollection('projects/sete-cidades/assets/MG_Municipios_2024');

// List of municipalities (EXACT NAMES in 'NM_MUN')
var CITIES = [
  'Lavras',
  'Itajubá',
  'Alfenas',
  'Poços de Caldas',
  'Pouso Alegre',
  'Varginha',
  'Três Corações'
];

// Time window (fills cloud gaps around target date)
var START = '2025-07-10';
var END   = '2025-07-30';

// Sentinel-2 SR harmonized dataset
var DATASET = 'COPERNICUS/S2_SR_HARMONIZED';

// =============================
// 1) AUXILIARY FUNCTIONS
// =============================
// SCL-based mask: keeps good pixels (3=veg,4=bare soil,5=water); removes clouds (7,8,9), shadows (2,6), cirrus (10), snow (11), defective (1)
function maskS2_SCL(image) {
  var scl = image.select('SCL');
  var good = scl.eq(3).or(scl.eq(4)).or(scl.eq(5));
  return image.updateMask(good);
}

// Returns median composite (cloud-free) clipped to the municipality
function compositeMunicipality(muniFC) {
  var comp = ee.ImageCollection(DATASET)
    .filterBounds(muniFC)
    .filterDate(START, END)
    .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 80))
    .map(maskS2_SCL)
    .median()
    .clip(muniFC);
  return comp;
}

// =============================
// 2) GENERATE SINGLE MOSAIC WITH ALL CITIES
// =============================
var bands10 = ['B2','B3','B4','B8'];
var bands20 = ['B5','B6','B7','B8A','B11','B12'];

// Ensure final order: 2,3,4,5,6,7,8,8A,11,12
var desiredOrder = ['B2','B3','B4','B5','B6','B7','B8','B8A','B11','B12'];

// Collection of images (one per city), already resampled to 10 m and stacked
var cityCollection = CITIES.map(function(name) {
  var muni = MG.filter(ee.Filter.eq('NM_MUN', name));
  var comp = compositeMunicipality(muni);

  var img10 = comp.select(bands10);
  var img20_to10 = comp.select(bands20)
    .resample('bilinear')
    .reproject({ crs: img10.select('B2').projection() });
  var all_10m = img10.addBands(img20_to10);

  // Explicitly reorder bands: 2,3,4,5,6,7,8,8A,11,12
  var allOrdered = all_10m.select(desiredOrder);

  // Rename with municipality suffix (remove accents/spaces)
  var citySlug = name.replace(/[çãõéáíúâêôà ]/g, function(ch){
    var map = { 'ç':'c','ã':'a','õ':'o','é':'e','á':'a','í':'i','ú':'u','â':'a','ê':'e','ô':'o','à':'a',' ':'_'};
    return map[ch] || ch;
  });
  var rename = desiredOrder.map(function(b){
    return ee.String(b).cat('_').cat(citySlug);
  });
  var all_10m_named = allOrdered.rename(rename);
  return all_10m_named;
});

// Merge everything into a single Image (unique band names)
var mosaicAll = ee.ImageCollection(cityCollection).toBands();

// =============================
// 3) VISUALIZATION AND SINGLE EXPORT
// =============================
// Quick visualization using Lavras bands, if available
Map.centerObject(MG.filter(ee.Filter.eq('NM_MUN', CITIES[0])), 9);

// Try RGB visualization for the first city in the list
var firstCity = CITIES[0].replace(/[çãõéáíúâêôà ]/g, function(ch){
  var map = { 'ç':'c','ã':'a','õ':'o','é':'e','á':'a','í':'i','ú':'u','â':'a','ê':'e','ô':'o','à':'a',' ':'_'};
  return map[ch] || ch;
});
Map.addLayer(mosaicAll.select(['B4_'+firstCity, 'B3_'+firstCity, 'B2_'+firstCity]), {min:0, max:3000}, 'RGB – ' + CITIES[0]);

// Export region: bounding box of selected municipalities
var regions = ee.FeatureCollection(CITIES.map(function(name){
  return MG.filter(ee.Filter.eq('NM_MUN', name)).first();
}));
var regionAll = regions.geometry();

Export.image.toDrive({
  image: mosaicAll.clip(regionAll),
  description: 'S2_South_Minas_Jul2025_AllCities_10m',
  folder: 'GEE_Export',
  fileNamePrefix: 'S2_South_Minas_Jul2025_AllCities_10m',
  region: regionAll,
  scale: 10,
  crs: 'EPSG:32723',
  maxPixels: 1e13,
  fileFormat: 'GeoTIFF',
  formatOptions: { cloudOptimized: true }
});
