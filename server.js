const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase setup
const SUPABASE_URL = 'https://kesmvuagqejhjapbtyxa.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtlc212dWFncWVqaGphcGJ0eXhhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM4Njk5NzgsImV4cCI6MjA2OTQ0NTk3OH0.QQCuyekoXlzlG3H6JBj1YxS_LE0RZV1QIdhJDl1Kats';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/public', express.static(path.join(__dirname, 'public')));

const dataDir = path.join(__dirname, 'data');
const homepageFile = path.join(dataDir, 'Homepage.json');
const maintenanceFile = path.join(dataDir, 'Maintenance.json');

// Middleware to verify Supabase token
async function verifyAuth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return res.status(401).json({ error: 'Invalid token' });
  req.user = data.user;
  next();
}

// Homepage routes
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

// Maintenance toggle
app.get('/api/maintenance', (req, res) => {
  try {
    const content = fs.readFileSync(maintenanceFile, 'utf-8');
    res.json(JSON.parse(content));
  } catch (err) {
    res.status(500).json({ error: 'Could not read maintenance file.' });
  }
});

app.post('/api/maintenance', verifyAuth, (req, res) => {
  const { active } = req.body;
  try {
    fs.writeFileSync(maintenanceFile, JSON.stringify({ active }, null, 2));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle maintenance.' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'Index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
