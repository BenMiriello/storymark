const fs = require('fs');
const path = require('path');

// Create a tiny valid PNG (1x1 pixel) using base64 encoded data
const assetsDir = path.join(__dirname, 'assets');

// 1x1 red pixel PNG (base64 encoded)
const redPixelPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
  'base64'
);

// 1x1 blue pixel PNG (base64 encoded)
const bluePixelPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI/t0xVYwAAAABJRU5ErkJggg==',
  'base64'
);

// 1x1 green pixel PNG (base64 encoded)
const greenPixelPng = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

// Create test images
fs.writeFileSync(path.join(assetsDir, 'test_image.png'), redPixelPng);
fs.writeFileSync(path.join(assetsDir, 'test_image2.png'), bluePixelPng);
fs.writeFileSync(path.join(assetsDir, 'gallery_image.png'), greenPixelPng);

// Create minimal WAV file (0.1 second of silence)
const sampleRate = 8000;
const duration = 0.1;
const samples = Math.floor(sampleRate * duration);

const wavHeader = Buffer.alloc(44);
wavHeader.write('RIFF', 0);
wavHeader.writeUInt32LE(36 + samples * 2, 4);
wavHeader.write('WAVE', 8);
wavHeader.write('fmt ', 12);
wavHeader.writeUInt32LE(16, 16);
wavHeader.writeUInt16LE(1, 20);
wavHeader.writeUInt16LE(1, 22);
wavHeader.writeUInt32LE(sampleRate, 24);
wavHeader.writeUInt32LE(sampleRate * 2, 28);
wavHeader.writeUInt16LE(2, 32);
wavHeader.writeUInt16LE(16, 34);
wavHeader.write('data', 36);
wavHeader.writeUInt32LE(samples * 2, 40);

const audioData = Buffer.alloc(samples * 2, 0); // silence
fs.writeFileSync(
  path.join(assetsDir, 'test_audio.wav'),
  Buffer.concat([wavHeader, audioData])
);

// Create minimal MP4 header (not a valid video, but a file with .mp4 extension)
const mp4Data = Buffer.from([
  0x00,
  0x00,
  0x00,
  0x20, // box size
  0x66,
  0x74,
  0x79,
  0x70, // 'ftyp'
  0x69,
  0x73,
  0x6f,
  0x6d, // brand
  0x00,
  0x00,
  0x02,
  0x00, // version
  0x69,
  0x73,
  0x6f,
  0x6d, // compatible
  0x69,
  0x73,
  0x6f,
  0x32, // compatible
  0x61,
  0x76,
  0x63,
  0x31, // compatible
  0x6d,
  0x70,
  0x34,
  0x31, // compatible
]);

fs.writeFileSync(path.join(assetsDir, 'test_video.mp4'), mp4Data);

console.log('Test assets created:');
console.log(`- test_image.png (${redPixelPng.length} bytes)`);
console.log(`- test_image2.png (${bluePixelPng.length} bytes)`);
console.log(`- gallery_image.png (${greenPixelPng.length} bytes)`);
console.log(`- test_audio.wav (${wavHeader.length + audioData.length} bytes)`);
console.log(`- test_video.mp4 (${mp4Data.length} bytes)`);
