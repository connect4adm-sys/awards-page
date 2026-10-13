const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const largeFiles = [
  'four-words/02-the-work.png',
  'sounds/sounds-counsellor-visual.png',
  'peers/peer-01-participating-institution.png',
  'peers/peer-02-school-leadership-discussion.png',
  'peers/peer-03-institutional-leadership-team.png',
  'peers/peer-04-your-institution.png',
  'peers/peer-05-academic-engagement.png',
  'pathways/pathway-01-principal.png',
  'pathways/pathway-03-counsellor.png',
  'awards/02-best-academic-excellence-award.png',
  'contributions/01-career-education.png',
  'contributions/02-student-counselling-wellness.png',
  'contributions/03-stem-science-education.png',
  'contributions/04-nep-2020-implementation.png',
  'contributions/05-career-development-career-fair.png',
  'contributions/07-alumni-mentorship.png',
  'contributions/08-digital-education-campus-innovation.png',
  'contributions/09-student-mental-health.png',
  'contributions/11-inclusive-education.png',
  'awards/13-best-inclusive-education-award.png',
  'awards/17-best-student-leadership-award.png',
  'awards/18-best-alumni-engagement-award.png',
  'journey/04-recognised-on-stage.png',
  'stage/stage-reveal-trophy-bg.png',
  'reach/pan-india-reach.png',
  'final/final-cta-awaiting-stage.png'
];

console.log('Optimizing large photographic PNGs to high-quality JPEGs (Quality 88)...');

largeFiles.forEach(rel => {
  const fullPng = path.join(__dirname, '..', 'images', 'awards-event', rel);
  const fullJpg = fullPng.replace(/\.png$/, '.jpg');
  
  if (!fs.existsSync(fullPng)) {
    console.log('Skipping (not found):', rel);
    return;
  }
  
  const psCmd = `powershell -Command "Add-Type -AssemblyName System.Drawing; $img = [System.Drawing.Image]::FromFile('${fullPng.replace(/\\/g, '/')}'); $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }; $encParams = New-Object System.Drawing.Imaging.EncoderParameters(1); $encParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]88); $img.Save('${fullJpg.replace(/\\/g, '/')}', $codec, $encParams); $img.Dispose();"`;
  
  try {
    execSync(psCmd);
    const origSize = (fs.statSync(fullPng).size / 1024).toFixed(1);
    const newSize = (fs.statSync(fullJpg).size / 1024).toFixed(1);
    console.log(`[OK] ${rel}: ${origSize} KB -> ${newSize} KB (${(100 - (newSize / origSize * 100)).toFixed(0)}% smaller)`);
  } catch (err) {
    console.error(`[ERR] Failed on ${rel}:`, err.message);
  }
});
