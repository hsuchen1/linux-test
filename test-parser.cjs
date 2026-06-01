const fs = require('fs');
const text = fs.readFileSync('src/data/econText.ts', 'utf8');
const lines = text.split('\n');
let qNum = 0;
let ansNum = 0;
lines.forEach(l => {
  if (l.match(/^第\s*\d+\s*題/)) qNum++;
  if (l.includes('答案：')) ansNum++;
})
console.log('Qs:', qNum, 'Ans:', ansNum);

