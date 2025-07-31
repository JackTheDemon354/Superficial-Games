const express = require('express');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json());
app.use(fileUpload());
app.use(express.static('public'));

const supabaseUrl = 'https://kesmvuagqejhjapbtyxa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtlc212dWFncWVqaGphcGJ0eXhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4Njk5NzgsImV4cCI6MjA2OTQ0NTk3OH0.QQCuyekoXlzlG3H6JBj1YxS_LE0RZV1QIdhJDl1Kats';

const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware to check Supabase JWT
async function auth(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).send('Unauthorized');

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return res.status(401).send('Unauthorized');

  next();
}

// Save homepage content
app.post('/save-homepage', auth, (req, res) => {
  const content = req.body;
  fs.writeFileSync('./data/homepage.json', JSON.stringify(content, null, 2));
  res.json({ success: true });
});

// Save staff list
app.post('/save-staff', auth, (req, res) => {
  const content = req.body;
  fs.writeFileSync('./data/staff.json', JSON.stringify(content, null, 2));
  res.json({ success: true });
});

// Save maintenance settings
app.post('/save-maintenance', auth, (req, res) => {
  const content = req.body;
  fs.writeFileSync('./data/maintenance.json', JSON.stringify(content, null, 2));
  res.json({ success: true });
});

// Upload staff image + add staff member
app.post('/add-staff', auth, (req, res) => {
  if (!req.files || !req.files.image || !req.body.name) {
    return res.status(400).send('Name and image required');
  }

  const img = req.files.image;
  const name = req.body.name;

  // Save image to uploads folder
  const uploadPath = path.join(__dirname, 'public', 'uploads', img.name);
  img.mv(uploadPath, err => {
    if (err) return res.status(500).send('Upload error');

    // Update staff.json
    let staff = [];
    try {
      staff = JSON.parse(fs.readFileSync('./data/staff.json', 'utf8'));
    } catch {}

    staff.push({
      name,
      image: `/uploads/${img.name}`
    });

    fs.writeFileSync('./data/staff.json', JSON.stringify(staff, null, 2));
    res.json({ success: true });
  });
});

// Serve homepage or maintenance page
app.get('/', (req, res) => {
  try {
    const maintenance = JSON.parse(fs.readFileSync('./data/maintenance.json', 'utf8'));
    if (maintenance.enabled) {
      return res.send(`
        <h1>🛠 ${maintenance.message || 'Site Under Maintenance'}</h1>
        <style>body{font-family:calibri;text-align:center;margin-top:50px}</style>
      `);
    }
  } catch {}

  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(3000, () => {
  console.log('✅ Server running at http://localhost:3000');
});
