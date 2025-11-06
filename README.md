# Cloud-Free Sentinel-2 Composites with Automated Gap Regeneration (GEE)

This repository contains a Google Earth Engine (GEE) script that automates the generation of **cloud-free, gap-filled Sentinel-2 mosaics** for multiple municipalities. The workflow extracts a median composite for each region of interest, remaps bands to a uniform 10-meter resolution, masks problematic pixels, and stacks the results into a single multi-band GeoTIFF — grouped by city and ready for spatial analysis in QGIS, Python, R, or GRASS GIS.

---

## Purpose

This workflow is designed to streamline large-scale, multi-region preprocessing of Sentinel-2 data in a way that is:

- Cloud-resilient
- Geometrically consistent
- Export-ready for machine learning classification, spatial mapping, or further geoprocessing

It aims to eliminate the manual and error-prone steps of downloading, masking, reprojecting and merging data — offering a more reliable and scalable alternative to desktop-based tools like QGIS SCP or SNAP.

---

## Key Features

| Feature | Description |
|---------|-------------|
| **Multi-city support** | Processes multiple AOIs iteratively in a single script |
| **Cloud & shadow masking** | Uses Sentinel-2 SCL band (Scene Classification Layer) |
| **Automated gap filling** | Temporal median composite removes missing data pixels |
| **Unified 10m resolution** | All bands resampled using bilinear interpolation |
| **Dynamic band naming** | Band names auto-tagged with city names for easy parsing |
| **Multiband export** | Organized GeoTIFF suitable for machine learning pipelines |

---

## Workflow Overview

1. Load a FeatureCollection (municipal shapefile or other AOIs)
2. Loop over each feature:
   - Clip Sentinel-2 collection by geometry
   - Mask clouds, shadows, saturated pixels, and invalid SCL classes
   - Build a temporal median composite to fill data gaps
   - Resample bands to 10m
   - Rename bands using standardized labels: `<city>_B2`, `<city>_B3`, etc.
3. Combine all individual composites into a single image
4. Export the result to Google Drive as a georeferenced `.tif` file

---

## Output Band Structure (example)

lavras_B2
lavras_B3
lavras_B4
...
varginha_B2
varginha_B3
...
pouso_alegre_B2
...

---

## How To Adapt

| Task | Change |
|------|--------|
| Replace cities | Update the FeatureCollection asset path |
| Change export target | Swap `Export.image.toDrive()` for `Export.image.toAsset()` |
| Use different sensor | Adapt band list and collection ID |
| Integrate classifiers | Stack indices or apply Random Forest to the final mosaic |

---

## Limitations

- The processing time and export size scale with the number of cities and bands
- Cloud masks depend on the quality of the SCL band in each image
- Exporting too many bands at once may hit API limits or result in large files

---

## License

This project is shared under the **Creative Commons Attribution-NonCommercial-NoDerivatives 4.0 License (CC BY-NC-ND 4.0)**.

You may copy and redistribute the script with proper attribution, but commercial use and modification are prohibited without permission. See the `LICENSE` file for details.

> Note: This workflow is part of an active research project. The repository is temporarily licensed under supervisory rights due to an ongoing publication process. License terms may change upon official publication.

---

### Keywords

'Cloud-Free Sentinel-2 Mosaic','Google Earth Engine (GEE)','Temporal Median Composite','Cloud and Shadow Masking', 'SCL Band', 'Gap Filling', 'Multiband GeoTIFF', '10m Resolution', 'Bilinear Resampling', 'Batch Preprocessing', 'Multi-region Mosaic Workflow', 'Remote Sensing Automation', 'QGIS / Python-ready Stack'


---
