const fs = require('fs');
const path = require('path');

// Ensure backup folder exists
const versionsDir = path.join(__dirname, 'data', 'versions');
if (!fs.existsSync(versionsDir)) {
  fs.mkdirSync(versionsDir, { recursive: true });
}

// BACKUP before overwrite
function backupHomepage() {
  const originalPath = path.join(__dirname, 'data', 'homepage.json');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupPath = path.join(versionsDir, `homepage-${timestamp}.json`);
  if (fs.existsSync(originalPath)) {
    fs.copyFileSync(originalPath, backupPath);
  }
}

// POST /api/homepage (with backup)
app.post('/api/homepage', authenticate, (req, res) => {
  const html = req.body.html || '';
  const filePath = path.join(__dirname, 'data', 'homepage.json');
  try {
    backupHomepage();
    fs.writeFileSync(filePath, JSON.stringify({ html }, null, 2));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save homepage' });
  }
});

// GET /api/homepage/versions
app.get('/api/homepage/versions', authenticate, (req, res) => {
  const files = fs.readdirSync(versionsDir)
    .filter(f => f.startsWith('homepage-') && f.endsWith('.json'))
    .sort()
    .reverse();
  res.json({ versions: files });
});

// GET /api/homepage/version/:filename
app.get('/api/homepage/version/:filename', authenticate, (req, res) => {
  const file = req.params.filename;
  const fullPath = path.join(versionsDir, file);
  if (fs.existsSync(fullPath)) {
    const html = JSON.parse(fs.readFileSync(fullPath)).html;
    res.json({ html });
  } else {
    res.status(404).json({ error: 'Version not found' });
  }
});
