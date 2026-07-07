const fs = require('fs');
const vueFile = fs.readFileSync('src/views/ReportDesigner/index.vue', 'utf-8');

const lines = vueFile.split('\n');
const matches = [];

lines.forEach((line, idx) => {
  const regex = /\$dg-bg(?![-\w])/g;
  let match;
  while ((match = regex.exec(line)) !== null) {
    matches.push({ line: idx + 1, content: line.trim() });
  }
});

console.log('$dg-bg 精确匹配共', matches.length, '处:');
console.log('');
matches.forEach(m => console.log('  行' + m.line + ': ' + m.content));
