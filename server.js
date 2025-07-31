require('dotenv').config(); // Load .env variables automatically

const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/public', express.static(path.join(__dirname, 'public')));

const dataDir = path.join(__dirname, 'data');
const homepageFile = path.join(dataDir, 'Homepage.json');
const maintenanceFile = path.join(dataDir, 'Maintenance.json');
const staffFile = path.join(dataDir, 'Staff.json');

const SUPABASE_TOKEN = process.env.SUPABASE_TOKEN;

function verifyAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No authorization header' });

  if (authHeader !== `Bearer ${SUPABASE_TOKEN}`) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  next();
}

// Homepage API
app.get('/api/homepage', verifyAuth, (req, res) => {
  try {
    const content = fs.readFileSync(homepageFile, 'utf-8');
    res.json(JSON.parse(content));
  } catch (err) {
    res.status(500).json({ error: 'Could not read homepage.' });
  }
});

app.post('/api/homepage', verifyAuth, (req, res) => {
  const { html } = req.body;
  if (!html) return res.status(400).json({ error: 'No content provided' });

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(dataDir, `Homepage.${timestamp}.json`);
    if (fs.existsSync(homepageFile)) {
      fs.copyFileSync(homepageFile, backupPath);
    }

    fs.writeFileSync(homepageFile, JSON.stringify({ html }, null, 2));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Save failed.' });
  }
});

app.get('/api/homepage/versions', verifyAuth, (req, res) => {
  fs.readdir(dataDir, (err, files) => {
    if (err) return res.status(500).json({ error: 'Failed to read directory' });
    const versions = files.filter(f => f.startsWith('Homepage.') && f.endsWith('.json'));
    res.json({ versions });
  });
});

app.get('/api/homepage/version/:filename', verifyAuth, (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(dataDir, filename);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Version not found' });

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    res.json(JSON.parse(content));
  } catch (err) {
    res.status(500).json({ error: 'Failed to load version' });
  }
});

// Maintenance API
app.get('/api/maintenance', (req, res) => {
  try {
    const status = fs.readFileSync(maintenanceFile, 'utf-8');
    res.json(JSON.parse(status));
  } catch (err) {
    res.status(500).json({ error: 'Could not read maintenance status' });
  }
});

app.post('/api/maintenance', verifyAuth, (req, res) => {
  const { enabled } = req.body;
  if (typeof enabled !== 'boolean') {
    return res.status(400).json({ error: 'Invalid toggle value' });
  }
  try {
    fs.writeFileSync(maintenanceFile, JSON.stringify({ enabled }, null, 2));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Could not update maintenance status' });
  }
});

// Staff API
app.get('/api/staff', (req, res) => {
  try {
    const content = fs.readFileSync(staffFile, 'utf-8');
    res.json(JSON.parse(content));
  } catch (err) {
    res.status(500).json({ error: 'Could not read staff data.' });
  }
});

// Serve homepage or maintenance page
app.get('/', (req, res) => {
  try {
    const maintenance = JSON.parse(fs.readFileSync(maintenanceFile, 'utf-8'));
    if (maintenance.enabled) {
      return res.send('<h1>Maintenance Mode</h1><p>The site is currently under maintenance.</p>');
    }
  } catch {
    // If maintenance.json missing or broken, just serve homepage
  }
  res.sendFile(path.join(__dirname, 'public', 'Index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
