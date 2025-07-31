require('dotenv').config();

const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

const supabaseUrl = 'https://kesmvuagqejhjapbtyxa.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Your service_role key, secret
const supabase = createClient(supabaseUrl, supabaseServiceKey);

app.use(cors());
app.use(bodyParser.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/public', express.static(path.join(__dirname, 'public')));

const dataDir = path.join(__dirname, 'data');
const homepageFile = path.join(dataDir, 'Homepage.json');
const maintenanceFile = path.join(dataDir, 'Maintenance.json');
const staffFile = path.join(dataDir, 'Staff.json');

// Middleware: verify Supabase JWT access token from frontend
async function verifyAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No authorization header' });

    const token = authHeader.replace('Bearer ', '');
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = data.user;
    next();
  } catch {
    return res.status(401).json({ error: 'Unauthorized' });
  }
}

// API routes protected by verifyAuth

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
  } catch {
    res.status(500).json({ error: 'Save failed.' });
  }
});

app.get('/api/maintenance', (req, res) => {
  try {
    const content = fs.readFileSync(maintenanceFile, 'utf-8');
    res.json(JSON.parse(content));
  } catch {
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
  } catch {
    res.status(500).json({ error: 'Could not update maintenance status' });
  }
});

app.get('/api/staff', (req, res) => {
  try {
    const content = fs.readFileSync(staffFile, 'utf-8');
    res.json(JSON.parse(content));
  } catch {
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
    // ignore
  }
  res.sendFile(path.join(__dirname, 'public', 'Index.html'));
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
