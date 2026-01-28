import { ref, computed } from 'vue';

export function useSurveyParser() {
  
  // Helper to extract ID and clean text
  // Returns { id: string | null, text: string }
  const parseLine = (line) => {
    const idMatch = line.match(/\{\{ID:(.*?)\}\}/);
    const text = line.replace(/\{\{ID:.*?\}\}/, '').trim();
    return {
      id: idMatch ? idMatch[1] : null,
      text
    };
  };

  // Helper to generate a temp ID if missing
  const generateTempId = (prefix, ...indices) => `temp-${prefix}-${indices.join('-')}`;

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
         
         const rawTitle = qMatch[2].trim();
         const parsedTitle = parseLine(rawTitle);
         
         const qIndex = questions.length; // Approximate index for temp ID
         currentQ = {
          id: parsedTitle.id || generateTempId('q', qIndex), 
          type: qMatch[1], // R, SS, MS
          title: parsedTitle.text,
          cols: [],
          rows: []
        };
      } else if (currentQ) {
        if (trimmed.startsWith('{{COL}}')) {
          const raw = trimmed.replace('{{COL}}', '').trim();
          const parsed = parseLine(raw);
          const cIndex = currentQ.cols.length;
          currentQ.cols.push({
             id: parsed.id || generateTempId('c', questions.length, cIndex),
             text: parsed.text
          });
        } else if (trimmed.startsWith('{{ROW}}')) {
          const raw = trimmed.replace('{{ROW}}', '').trim();
          const parsed = parseLine(raw);
          const rIndex = currentQ.rows.length;
          currentQ.rows.push({
             id: parsed.id || generateTempId('r', questions.length, rIndex),
             text: parsed.text
          });
        }
      }
    });

    if (currentQ) questions.push(currentQ);
    return questions;
  };

  const generateSyntax = (questions) => {
    return questions.map(q => {
      // Only write ID if it is NOT temporary
      const qIdTag = q.id && !q.id.startsWith('temp-') ? `{{ID:${q.id}}}` : '';
      let s = `{{${q.type}}}${qIdTag} ${q.title}\n`;
      
      q.cols.forEach(c => {
        const cIdTag = c.id && !c.id.startsWith('temp-') ? `{{ID:${c.id}}}` : '';
        s += `{{COL}} ${cIdTag} ${c.text}\n`;
      });
      
      q.rows.forEach(r => {
        const rIdTag = r.id && !r.id.startsWith('temp-') ? `{{ID:${r.id}}}` : '';
        s += `{{ROW}} ${rIdTag} ${r.text}\n`;
      });
      
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
