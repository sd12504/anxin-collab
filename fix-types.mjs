import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join } from 'path';

const pagesDir = 'src/pages';
const compDir = 'src/components';

function fixFile(file) {
  let s = readFileSync(file, 'utf8');
  let changed = false;

  // Stage names
  const stageMap = {
    "'接案'": "'企劃中'", "'丈量'": "'拍攝前置'", "'設計中'": "'拍攝中'",
    "'施工中'": "'後期製作'", "'完工'": "'已完成'",
  };
  for (const [old, nu] of Object.entries(stageMap)) {
    if (s.includes(old)) { s = s.replace(new RegExp(old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), nu); changed = true; }
  }

  // Visibility
  for (const [old, nu] of [["'可'", "'可露出'"], ["'需確認'", "'未確認'"], ["'不可'", "'不建議'"]]) {
    if (s.includes(old) && !s.includes(`const ${old}`)) {
      // Only replace in specific contexts - as string values, not variable names
    }
  }

  if (changed) writeFileSync(file, s);
}

// Fix case management
fixFile(join(pagesDir, 'CaseManagement.tsx'));
fixFile(join(compDir, 'CaseModal.tsx'));
fixFile(join(pagesDir, 'CollabBoard.tsx'));
console.log('done');
