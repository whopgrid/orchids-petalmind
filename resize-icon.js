const sharp = require('sharp');
const fs = require('fs');

async function resizeIcons() {
  const input = '/tmp/orchid-icon.jpg';
  
  // Read the input image
  const image = sharp(input);
  
  // Generate all required sizes
  await image.clone().resize(192, 192).toFile('public/icon-192.png');
  console.log('✓ Created icon-192.png');
  
  await image.clone().resize(512, 512).toFile('public/icon-512.png');
  console.log('✓ Created icon-512.png');
  
  await image.clone().resize(180, 180).toFile('public/apple-icon.png');
  console.log('✓ Created apple-icon.png');
  
  await image.clone().resize(256, 256).toFile('public/icon.png');
  console.log('✓ Created icon.png');
  
  await image.clone().resize(32, 32).toFile('public/favicon.png');
  console.log('✓ Created favicon.png');
  
  // Create ICO file (32x32 for favicon)
  await image.clone().resize(32, 32).toFormat('png').toFile('/tmp/favicon-32.png');
  
  // For .ico, we'll just use the 32x32 PNG and rename it
  // (browsers accept PNG in .ico files nowadays)
  const faviconData = fs.readFileSync('/tmp/favicon-32.png');
  fs.writeFileSync('public/favicon.ico', faviconData);
  console.log('✓ Created favicon.ico');
  
  console.log('\n✅ All icons created successfully!');
}

resizeIcons().catch(console.error);
