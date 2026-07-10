const exifr = require('exifr');
const path = require('path');
const fs = require('fs');

const rawDir = '/Users/moritamasashi/Desktop/travel_app_v2/public/raw_media';

async function readAllGPS() {
  const files = fs.readdirSync(rawDir);
  const mediaFiles = files.filter(f => !f.startsWith('.') && f !== 'IMG_1324.HEIC'); // Skip original HEIC since we have jpg

  for (let file of mediaFiles) {
    const filePath = path.join(rawDir, file);
    try {
      const gps = await exifr.gps(filePath);
      if (gps) {
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
          console.log(`${file}: ${locationName.join(', ')}`);
        } catch (e) {
          console.log(`${file}: GPS found but geocode failed`);
        }
      } else {
        console.log(`${file}: No GPS data found`);
      }
    } catch (error) {
      console.log(`${file}: Error reading EXIF`);
    }
  }
}

readAllGPS();
