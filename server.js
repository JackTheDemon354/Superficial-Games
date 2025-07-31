const express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(fileUpload());
app.use(express.static('public'));

// 🔒 Protect routes (basic token check)
const STAFF_TOKEN = "your-super-secret-token"; // Replace with secure one

function auth(req, res, next) {
  const token = req.headers.authorization;
  if (token === `Bearer ${STAFF_TOKEN}`) {
    next();
  } else {
    res.status(401).send('Unauthorized');
  }
}

// 🌐 Homepage JSON Save
app.post('/api/save-homepage', auth, (req, res) => {
  fs.writeFileSync('./data/homepage.json', JSON.stringify(req.body, null, 2));
  res.json({ success: true });
});

// 👥 Staff JSON Save
app.post('/api/save-staff', auth, (req, res) => {
  fs.writeFileSync('./data/staff.json', JSON.stringify(req.body, null, 2));
  res.json({ success: true });
});

// ⚠️ Maintenance Mode
app.post('/api/save-maintenance', auth, (req, res) => {
  fs.writeFileSync('./data/maintenance.json', JSON.stringify(req.body, null, 2));
  res.json({ success: true });
});

// 🖼 Image Uploads
app.post('/api/upload', auth, (req, res) => {
  if (!req.files || !req.files.image) return res.status(400).send('No file uploaded.');

  const img = req.files.image;
  const uploadPath = path.join(__dirname, 'public', 'uploads', img.name);

  img.mv(uploadPath, err => {
    if (err) return res.status(500).send(err);
    res.json({ url: `/uploads/${img.name}` });
  });
});

// 🏠 Homepage with Maintenance Mode
app.get('/', (req, res) => {
  const maintenance = JSON.parse(fs.readFileSync('./data/maintenance.json', 'utf8'));
  if (maintenance.enabled) {
    return res.send(`
      <h1>🛠 ${maintenance.message || 'Site Under Maintenance'}</h1>
      <style>body{font-family:sans-serif;text-align:center;margin-top:50px}</style>
    `);
  }
  res.sendFile(__dirname + '/public/home.html');
});

app.listen(3000, () => {
  console.log('✅ Server running: http://localhost:3000');
});
