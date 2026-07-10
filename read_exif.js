const exifr = require('exifr');
const path = require('path');
const fs = require('fs');

const rawDir = '/Users/moritamasashi/Desktop/travel_app_v2/public/raw_media';
const selectedImages = [
  "dji_fly_20260507_113312_0813_1778156375359_photo.jpg",
  "IMG_0458.JPG",
  "IMG_1324.jpg",
  "IMG_1596.JPG",
  "IMG_1890.JPG"
];

async function readGPS() {
  for (let file of selectedImages) {
    const filePath = path.join(rawDir, file);
    if (!fs.existsSync(filePath)) {
      console.log(`${file}: File not found`);
      continue;
    }
    
    try {
      const gps = await exifr.gps(filePath);
      if (gps) {
        console.log(`${file}: lat=${gps.latitude}, lng=${gps.longitude}`);
        
        // Reverse geocoding using Nominatim (OpenStreetMap)
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${gps.latitude}&lon=${gps.longitude}&zoom=14&addressdetails=1`, {
            headers: { 'User-Agent': 'TravelAppScript/1.0' }
          });
          const data = await res.json();
          let locationName = [];
          if (data.address) {
            if (data.address.province) locationName.push(data.address.province);
            if (data.address.city || data.address.town || data.address.village) locationName.push(data.address.city || data.address.town || data.address.village);
            if (data.address.suburb || data.address.island) locationName.push(data.address.island || data.address.suburb);
          }
          console.log(` -> Location: ${locationName.join(', ')} (${data.display_name})`);
        } catch (e) {
          console.log(` -> Location: Could not fetch from OpenStreetMap`);
        }
      } else {
        console.log(`${file}: No GPS data found`);
      }
    } catch (error) {
      console.log(`${file}: Error reading EXIF - ${error.message}`);
    }
  }
}

readGPS();
