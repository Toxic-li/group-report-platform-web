const fs = require('fs');
const scssFile = fs.readFileSync('src/views/ReportDesigner/_design-tokens.scss', 'utf-8');
const vueFile = fs.readFileSync('src/views/ReportDesigner/index.vue', 'utf-8');

const definedVars = new Set();
const defRegex = /\$(dg-[\w-]+)\s*:/g;
let match;
while ((match = defRegex.exec(scssFile)) !== null) {
  definedVars.add(match[1]);
}

const usedVars = new Set();
const useRegex = /\$(dg-[\w-]+)/g;
while ((match = useRegex.exec(vueFile)) !== null) {
  usedVars.add(match[1]);
}

console.log('已定义的变量数:', definedVars.size);
console.log('使用的变量数:', usedVars.size);
console.log('');
console.log('未定义的变量:');
const undefinedVars = [...usedVars].filter(v => !definedVars.has(v)).sort();
undefinedVars.forEach(v => console.log('  $' + v));
console.log('');
console.log('共', undefinedVars.length, '个未定义变量');
