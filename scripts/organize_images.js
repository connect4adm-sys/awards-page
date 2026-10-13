const fs = require('fs');
const path = require('path');

const srcDir = 'C:\\Users\\Hi\\Downloads\\Awards-event images';
const baseDest = path.join(__dirname, 'images', 'awards-event');

const mapping = [
  // Hero
  {
    src: 'IMG-001 — Hero- Indian School Principal Portrait.jpg',
    category: 'hero',
    clean: 'hero-principal-portrait.jpg'
  },
  {
    src: 'IMG-001 — Hero2- Indian School Principal Portrait.jpg',
    category: 'hero',
    clean: 'hero2-principal-portrait.jpg'
  },
  // Four Words
  {
    src: 'IMG-002 — Four Words- The Leader.jpg',
    category: 'four-words',
    clean: '01-the-leader.jpg'
  },
  {
    src: 'IMG-003 — Four Words- The Work.png',
    category: 'four-words',
    clean: '02-the-work.png'
  },
  {
    src: 'IMG-004 — Four Words- The Moment.jpg',
    category: 'four-words',
    clean: '03-the-moment.jpg'
  },
  {
    src: 'IMG-005 — Four Words- The Stage.jpg',
    category: 'four-words',
    clean: '04-the-stage.jpg'
  },
  // Contributions / Changed (12 items)
  {
    src: 'IMG-006 — Career Education.png',
    category: 'contributions',
    clean: '01-career-education.png'
  },
  {
    src: 'IMG-007 — Student Counselling and Wellness.png',
    category: 'contributions',
    clean: '02-student-counselling-wellness.png'
  },
  {
    src: 'IMG-008 — STEM and Science Education.png',
    category: 'contributions',
    clean: '03-stem-science-education.png'
  },
  {
    src: 'IMG-009 — NEP 2020 Implementation.png',
    category: 'contributions',
    clean: '04-nep-2020-implementation.png'
  },
  {
    src: 'IMG-010 — Career Development and Career Fair.png',
    category: 'contributions',
    clean: '05-career-development-career-fair.png'
  },
  {
    src: 'IMG-011 — Scholarship Guidance.png',
    category: 'contributions',
    clean: '06-scholarship-guidance.png'
  },
  {
    src: 'IMG-012 — Alumni Mentorship.png',
    category: 'contributions',
    clean: '07-alumni-mentorship.png'
  },
  {
    src: 'IMG-013 — Digital Education and Campus Innovation.png',
    category: 'contributions',
    clean: '08-digital-education-campus-innovation.png'
  },
  {
    src: 'IMG-014 — Student Mental Health.png',
    category: 'contributions',
    clean: '09-student-mental-health.png'
  },
  {
    src: 'IMG-015 — Experiential Learning.png',
    category: 'contributions',
    clean: '10-experiential-learning.png'
  },
  {
    src: 'IMG-016 — Inclusive Education.png',
    category: 'contributions',
    clean: '11-inclusive-education.png'
  },
  {
    src: 'IMG-017 — Parent-School Partnership.png',
    category: 'contributions',
    clean: '12-parent-school-partnership.png'
  },
  // Sounds
  {
    src: 'IMG-018 — “Sounds Like Your Work” Counsellor Visual.png',
    category: 'sounds',
    clean: 'sounds-counsellor-visual.png'
  },
  // Peer Grid (6 cards)
  {
    src: 'IMG-019 — Peer Grid Card 1- Participating Institution.png',
    category: 'peers',
    clean: 'peer-01-participating-institution.png'
  },
  {
    src: 'IMG-020 — Peer Grid Card 2- School Leadership Discussion.png',
    category: 'peers',
    clean: 'peer-02-school-leadership-discussion.png'
  },
  {
    src: 'IMG-021 — Peer Grid Card 3- Institutional Leadership Team.png',
    category: 'peers',
    clean: 'peer-03-institutional-leadership-team.png'
  },
  {
    src: 'IMG-022 — Featured Peer Card- “Your Institution”.png',
    category: 'peers',
    clean: 'peer-04-your-institution.png'
  },
  {
    src: 'IMG-023 — Peer Grid Card 5- Academic Engagement.png',
    category: 'peers',
    clean: 'peer-05-academic-engagement.png'
  },
  {
    src: 'IMG-024 — Peer Grid Card 6- Educator Community.png',
    category: 'peers',
    clean: 'peer-06-educator-community.png'
  },
  // Pathways (3 roles)
  {
    src: 'IMG-025 — Role Pathway 1- Principal.png',
    category: 'pathways',
    clean: 'pathway-01-principal.png'
  },
  {
    src: 'IMG-026 — Role Pathway 2- Vice-Principal and Academic Operations.png',
    category: 'pathways',
    clean: 'pathway-02-vice-principal.png'
  },
  {
    src: 'IMG-027 — Role Pathway 3- School Counsellor.png',
    category: 'pathways',
    clean: 'pathway-03-counsellor.png'
  },
  // Awards (first 4)
  {
    src: 'IMG-028 — Best School Leadership Award.png',
    category: 'awards',
    clean: '01-best-school-leadership-award.png'
  },
  {
    src: 'IMG-029 — Best Academic Excellence Award.png',
    category: 'awards',
    clean: '02-best-academic-excellence-award.png'
  },
  {
    src: 'IMG-030 — Best Teaching Excellence Award.png',
    category: 'awards',
    clean: '03-best-teaching-excellence-award.png'
  },
  {
    src: 'IMG-031 — Best Teacher Development Award.png',
    category: 'awards',
    clean: '04-best-teacher-development-award.png'
  }
];

// Ensure directories exist
const categories = [...new Set(mapping.map(m => m.category))];
categories.forEach(cat => {
  const catDir = path.join(baseDest, cat);
  if (!fs.existsSync(catDir)) {
    fs.mkdirSync(catDir, { recursive: true });
  }
});

let copiedCount = 0;
mapping.forEach(item => {
  const srcPath = path.join(srcDir, item.src);
  if (!fs.existsSync(srcPath)) {
    console.error('Source file not found:', srcPath);
    return;
  }
  
  // 1. Copy as clean web-friendly name
  const destClean = path.join(baseDest, item.category, item.clean);
  fs.copyFileSync(srcPath, destClean);
  
  // 2. Also copy with original name for backwards safety
  const destOrig = path.join(baseDest, item.category, item.src);
  fs.copyFileSync(srcPath, destOrig);

  copiedCount++;
  console.log(`[OK] Copied -> images/awards-event/${item.category}/${item.clean} (${(fs.statSync(destClean).size / 1024).toFixed(1)} KB)`);
});

console.log(`\nSuccessfully organized and copied ${copiedCount} / ${mapping.length} images.`);
