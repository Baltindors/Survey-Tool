import { ref, computed } from 'vue';

export function useSurveyParser() {
  
  // Parser: Extract multiple questions and their components
  const parseQuestions = (syntax) => {
    if (!syntax) return [];
    const lines = syntax.split('\n');
    const questions = [];
    let currentQ = null;

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      const qMatch = trimmed.match(/^\{\{(R|SS|MS)\}\}(.*)/);
      if (qMatch) {
        if (currentQ) questions.push(currentQ);
        currentQ = {
          id: `q-${index}-${Date.now()}`, // Ensure unique ID
          type: qMatch[1], // R, SS, MS
          title: qMatch[2].trim(),
          cols: [],
          rows: []
        };
      } else if (currentQ) {
        if (trimmed.startsWith('{{COL}}')) {
          currentQ.cols.push(trimmed.replace('{{COL}}', '').trim());
        } else if (trimmed.startsWith('{{ROW}}')) {
          currentQ.rows.push(trimmed.replace('{{ROW}}', '').trim());
        }
      }
    });

    if (currentQ) questions.push(currentQ);
    return questions;
  };

  const generateSyntax = (questions) => {
    return questions.map(q => {
      let s = `{{${q.type}}}${q.title}\n`;
      q.cols.forEach(c => s += `{{COL}} ${c}\n`);
      q.rows.forEach(r => s += `{{ROW}} ${r}\n`);
      return s;
    }).join('\n');
  };

  const validateStructure = (structures, languages, masterLang = 'EN') => {
    const masterList = structures[masterLang] || [];
    const results = {};

    languages.forEach(lang => {
      const currentList = structures[lang] || [];
      const isCountMatch = currentList.length === masterList.length;

      const questionIssues = masterList.map((mQ, idx) => {
        const cQ = currentList[idx];
        if (!cQ) return { missing: true };
        return {
          typeMismatch: mQ.type !== cQ.type,
          colDiff: mQ.cols.length - cQ.cols.length,
          rowDiff: mQ.rows.length - cQ.rows.length
        };
      });

      results[lang] = {
        isValid: isCountMatch && questionIssues.every(q => !q.missing && !q.typeMismatch && q.colDiff === 0 && q.rowDiff === 0),
        issues: questionIssues
      };
    });
    return results;
  };

  return {
    parseQuestions,
    generateSyntax,
    validateStructure
  };
}
