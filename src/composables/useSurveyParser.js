

export function useSurveyParser() {
  
  // Helper to extract ID and clean text
  // Returns { id: string | null, text: string, isCorrect: boolean, isOther: boolean }
  const parseLine = (line) => {
    const idMatch = line.match(/\{\{ID:(.*?)\}\}/);
    const isCorrect = line.includes('{{C}}');
    const isOther = line.includes('{{O}}');

    // Use trimStart to remove leading separator space but preserve trailing user input
    const text = line
      .replace(/\{\{ID:.*?\}\}/, '')
      .replace(/\{\{C\}\}/g, '')
      .replace(/\{\{O\}\}/g, '')
      .trimStart()
      .replace(/[\r\n]+$/, '');

    return {
      id: idMatch ? idMatch[1] : null,
      text,
      isCorrect,
      isOther
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
      // Only trim start to allow trailing spaces in content
      const trimmed = line.trimStart(); 
      // check for empty lines (whitespace only lines become empty string)
      if (!trimmed && !line.trim()) return;

      const qMatch = trimmed.match(/^\{\{(R|SS|MS)\}\}(.*)/);
      if (qMatch) {
         if (currentQ) questions.push(currentQ);
         
         // qMatch[2] is the rest of the line (Title). Preserve trailing.
         const rawTitle = qMatch[2]; 
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
          const raw = trimmed.replace('{{COL}}', '');
          const parsed = parseLine(raw);
          const cIndex = currentQ.cols.length;
          currentQ.cols.push({
             id: parsed.id || generateTempId('c', questions.length, cIndex),
             text: parsed.text,
             isCorrect: parsed.isCorrect,
             isOther: parsed.isOther
          });
        } else if (trimmed.startsWith('{{ROW}}')) {
          const raw = trimmed.replace('{{ROW}}', '');
          const parsed = parseLine(raw);
          const rIndex = currentQ.rows.length;
          currentQ.rows.push({
             id: parsed.id || generateTempId('r', questions.length, rIndex),
             text: parsed.text,
             isCorrect: parsed.isCorrect,
             isOther: parsed.isOther
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
        const cCorrect = c.isCorrect ? '{{C}}' : '';
        const cOther = c.isOther ? '{{O}}' : '';
        s += `{{COL}} ${cIdTag}${cOther}${cCorrect} ${c.text}\n`;
      });
      
      q.rows.forEach(r => {
        const rIdTag = r.id && !r.id.startsWith('temp-') ? `{{ID:${r.id}}}` : '';
        // Rows shouldn't typically have C/O but we preserve structure if present
        const rCorrect = r.isCorrect ? '{{C}}' : '';
        const rOther = r.isOther ? '{{O}}' : '';
        s += `{{ROW}} ${rIdTag}${rOther}${rCorrect} ${r.text}\n`;
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

  const finalizeStructureIds = (questions) => {
    let hasUpdates = false;
    const generateUuid = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`;

    questions.forEach(q => {
        if (!q.id || q.id.startsWith('temp-')) {
            q.id = generateUuid('q');
            hasUpdates = true;
        }
        q.cols.forEach(c => {
            if (!c.id || c.id.startsWith('temp-')) {
                c.id = generateUuid('c');
                hasUpdates = true;
            }
        });
        q.rows.forEach(r => {
             if (!r.id || r.id.startsWith('temp-')) {
                r.id = generateUuid('r');
                hasUpdates = true;
            }
        });
    });
    return hasUpdates;
  };

  const syncStructureToMaster = (masterStructure, currentStructure) => {
    return masterStructure.map((mQ, i) => {
      // Attempt to find matching Question in current by ID or Index
      // Since current might not have IDs yet, simple index fallback is safer for now.
      const cQ = currentStructure[i] || {};
      
      return {
        ...mQ, // Copy Master Structure (IDs, Type)
        title: cQ.title || `[Needs Translation: ${mQ.title}]`,
        // Map cols/rows. Use Master's IDs and Logic (isCorrect, isOther). Try to preserve Current's text.
        cols: mQ.cols.map((mCol, colIdx) => ({
            id: mCol.id,
            text: cQ.cols?.[colIdx]?.text || "",
            isCorrect: mCol.isCorrect, // Force Sync from Master
            isOther: mCol.isOther      // Force Sync from Master
        })),
        rows: mQ.rows.map((mRow, rowIdx) => ({
            id: mRow.id,
            text: cQ.rows?.[rowIdx]?.text || "",
            isCorrect: mRow.isCorrect, // Force Sync from Master
            isOther: mRow.isOther      // Force Sync from Master
        }))
      };
    });
  };

  const formatRichText = (text) => {
    if (!text) return '';
    
    // 1. Bold: **text** -> <strong>text</strong>
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // 2. Italics: _text_ -> <em>text</em>
    formatted = formatted.replace(/_([^_]+)_/g, '<em>$1</em>');
    
    // 3. Links: [text](url) -> <a href="url"...>text</a>
    formatted = formatted.replace(
      /\[(.*?)\]\((.*?)\)/g, 
      '<a href="$2" target="_blank" class="text-blue-600 underline" rel="noopener noreferrer">$1</a>'
    );

    // 4. Pass-through for <u>, <sub>, <sup> is handled naturally by v-html 
    // since we return the string with HTML tags.
    
    return formatted;
  };

  return {
    parseQuestions,
    generateSyntax,
    validateStructure,
    finalizeStructureIds,
    syncStructureToMaster,
    formatRichText
  };
}
