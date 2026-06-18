const https = require('https');
const fs = require('fs');

const file = fs.createWriteStream("src/assets/login_audio.mp3");

// We must follow redirects for Drive URLs
function download(url) {
  console.log("Fetching url:", url);
  https.get(url, (response) => {
    console.log("Status code:", response.statusCode);
    if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
      download(response.headers.location);
    } else {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log("Download complete written to src/assets/login_audio.mp3");
      });
    }
  }).on('error', (err) => {
    console.error("Download Error:", err.message);
  });
}

download("https://drive.google.com/uc?export=download&id=1gPXgnzPLhjPryErHWaz5l1KPSJf8VCjM");
