const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

console.log('=== 1. DATA-CHAPTER COUNT ===');
const chapters = html.match(/data-chapter="[^"]+"/g) || [];
console.log('Total data-chapter elements:', chapters.length);
console.log(chapters);

console.log('=== 2. PINNED ELEMENTS IN GSAP ===');
const pinRegex = /pin:\s*true/g;
const pinMatches = html.match(pinRegex) || [];
console.log('Total pin: true instances:', pinMatches.length);

console.log('=== 3. SCROLLTRIGGER INSTANCES ===');
const stInstances = html.match(/ScrollTrigger\.create\(\{[\s\S]*?\}\);/g) || [];
console.log('ScrollTrigger.create instances:', stInstances.length);
stInstances.forEach((st, i) => console.log(`--- ST ${i + 1} ---\n`, st));

console.log('=== 4. OVERFLOW AND LAYOUT ISSUES ===');
// Check if any element has overflow issues or 100vw issues
const vwMatches = html.match(/[^\n;{}]*100vw[^\n;{}]*/g) || [];
console.log('100vw occurrences (can cause horizontal scrollbar on Windows if scrollbar is ~17px):', vwMatches);

console.log('=== 5. HEAVY IMAGES DECODING ===');
const imgs = html.match(/<img[^>]+>/g) || [];
const missingDecoding = imgs.filter(img => !img.includes('decoding="async"'));
console.log('Total <img> tags:', imgs.length);
console.log('Images missing decoding="async":', missingDecoding.length);

console.log('=== 6. IMAGE SIZES IN DOM ===');
// Check sizes of the 32 images we added
const awardsImgs = [
  'images/awards-event/hero/hero2-principal-portrait.jpg',
  'images/awards-event/four-words/01-the-leader.jpg',
  'images/awards-event/four-words/02-the-work.png',
  'images/awards-event/four-words/03-the-moment.jpg',
  'images/awards-event/four-words/04-the-stage.jpg',
  'images/awards-event/sounds/sounds-counsellor-visual.png',
  'images/awards-event/peers/peer-01-participating-institution.png',
  'images/awards-event/peers/peer-02-school-leadership-discussion.png',
  'images/awards-event/peers/peer-03-institutional-leadership-team.png',
  'images/awards-event/peers/peer-04-your-institution.png',
  'images/awards-event/peers/peer-05-academic-engagement.png',
  'images/awards-event/peers/peer-06-educator-community.png',
  'images/awards-event/pathways/pathway-01-principal.png',
  'images/awards-event/pathways/pathway-02-vice-principal.png',
  'images/awards-event/pathways/pathway-03-counsellor.png',
  'images/awards-event/awards/01-best-school-leadership-award.png',
  'images/awards-event/awards/02-best-academic-excellence-award.png',
  'images/awards-event/awards/03-best-teaching-excellence-award.png',
  'images/awards-event/awards/04-best-teacher-development-award.png'
];
let totalSize = 0;
awardsImgs.forEach(f => {
  if (fs.existsSync(f)) {
    const s = fs.statSync(f).size;
    totalSize += s;
    if (s > 1024 * 1024) {
      console.log(`LARGE IMAGE: ${f} (${(s / (1024 * 1024)).toFixed(2)} MB)`);
    }
  }
});
console.log(`Total size of key added images: ${(totalSize / (1024 * 1024)).toFixed(2)} MB`);
