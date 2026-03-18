
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'public/logo-v2.png');
const outputPath = path.join(__dirname, 'public/logo-transparent.png');

async function removeBackground() {
  try {
    console.log(`Processing ${inputPath}...`);
    
    // Create a pipeline
    await sharp(inputPath)
      .ensureAlpha() // Ensure an alpha channel exists
      .flatten({ background: { r: 255, g: 255, b: 255 } }) // Flatten onto white just in case (though it already is)
      // Actually, flattening removes transparency. We want to ADD transparency based on color.
      // Sharp doesn't have a direct "replace color with alpha" function easily without iterating pixels or using threshold.
      // But we can use 'threshold' to create a mask for the white background, then use that mask as alpha.
      // Let's create a mask where white is transparent (0) and non-white is opaque (255).
      
      // Better approach with Sharp: 
      // 1. Get raw pixel data.
      // 2. Iterate and set alpha to 0 for white pixels.
      // 3. Create new image from raw data.
      
      .raw()
      .toBuffer({ resolveWithObject: true })
      .then(({ data, info }) => {
        const { width, height, channels } = info;
        
        // Iterate through each pixel
        for (let i = 0; i < data.length; i += channels) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Check if pixel is white (or very close to white)
          if (r > 240 && g > 240 && b > 240) {
            // Set alpha channel (if 4 channels) to 0
            if (channels === 4) {
              data[i + 3] = 0;
            }
          }
        }
        
        // Create new image from modified buffer
        return sharp(data, {
          raw: {
            width,
            height,
            channels
          }
        })
        .png()
        .toFile(outputPath);
      })
      .then(() => {
        console.log(`Successfully created transparent logo at ${outputPath}`);
      })
      .catch(err => {
        console.error("Error processing image:", err);
      });
      
  } catch (error) {
    console.error("Error in main function:", error);
  }
}

removeBackground();
