import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Plus, Bell, ChevronDown, GripVertical, Trash2, Pencil, Eye, 
  Settings2, MoreVertical, Type, AlertCircle, CheckCircle2, RefreshCw,
  List, CheckSquare, Grid3X3
} from 'lucide-react';

const App = () => {
  const [activeLang, setActiveLang] = useState('EN');
  const [languages, setLanguages] = useState(['EN', 'AR']);
  const [activeQuestionId, setActiveQuestionId] = useState(null);
  
  // State holds syntax for each language (Supports multiple questions)
  const [multiLangSyntax, setMultiLangSyntax] = useState({
    EN: "{{R}}Please rate the quality of the Program\n{{COL}} Unsatisfied\n{{COL}} Satisfied\n{{ROW}} Education\n{{ROW}} Engagement\n\n{{SS}}Which platform do you prefer?\n{{COL}} Desktop\n{{COL}} Mobile",
    AR: "{{R}}يرجى تقييم جودة البرنامج\n{{COL}} غير راضٍ\n{{COL}} راضٍ\n{{ROW}} تعليم\n\n{{SS}}أي منصة تفضل؟\n{{COL}} سطح المكتب"
  });

  // Parser: Extract multiple questions and their components
  const parseQuestions = (syntax) => {
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
          id: `q-${index}`,
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

  const structures = useMemo(() => {
    const s = {};
    languages.forEach(lang => {
      s[lang] = parseQuestions(multiLangSyntax[lang] || "");
    });
    return s;
  }, [multiLangSyntax, languages]);

  // Validation: Check structural parity across all questions
  const validation = useMemo(() => {
    const masterList = structures[languages[0]];
    const results = {};
    
    languages.forEach(lang => {
      const currentList = structures[lang];
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
  }, [structures, languages]);

  const generateSyntax = (questions) => {
    return questions.map(q => {
      let s = `{{${q.type}}}${q.title}\n`;
      q.cols.forEach(c => s += `{{COL}} ${c}\n`);
      q.rows.forEach(r => s += `{{ROW}} ${r}\n`);
      return s;
    }).join('\n');
  };

  const handleVisualUpdate = (qIndex, updates) => {
    const currentQuestions = [...structures[activeLang]];
    currentQuestions[qIndex] = { ...currentQuestions[qIndex], ...updates };
    setMultiLangSyntax(prev => ({ ...prev, [activeLang]: generateSyntax(currentQuestions) }));
  };

  const addQuestion = (type = 'SS') => {
    const currentQuestions = [...structures[activeLang]];
    currentQuestions.push({
      id: Date.now().toString(),
      type,
      title: "New Question",
      cols: ["Option 1"],
      rows: type === 'R' ? ["Row 1"] : []
    });
    setMultiLangSyntax(prev => ({ ...prev, [activeLang]: generateSyntax(currentQuestions) }));
  };

  const syncAllToMaster = (lang) => {
    const master = structures[languages[0]];
    const current = structures[lang];
    
    const synced = master.map((mQ, i) => {
      const cQ = current[i] || {};
      return {
        ...mQ,
        title: cQ.title || `[Needs Translation: ${mQ.title}]`,
        cols: mQ.cols.map((_, colIdx) => cQ.cols?.[colIdx] || ""),
        rows: mQ.rows.map((_, rowIdx) => cQ.rows?.[rowIdx] || "")
      };
    });
    setMultiLangSyntax(prev => ({ ...prev, [lang]: generateSyntax(synced) }));
  };

  return (
    <div className="flex h-screen bg-gray-50 text-slate-800 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-16 md:w-56 bg-[#333] text-white flex flex-col shrink-0 transition-all">
        <div className="p-4 flex items-center gap-2 border-b border-white/10">
          <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center font-bold">P</div>
          <span className="hidden md:block font-semibold">PRIME Admin</span>
        </div>
        <div className="flex-1 mt-4 px-2 space-y-1">
          {['Outcomes', 'Reporting', 'Tools', 'User Manager'].map((l, i) => (
            <div key={i} className={`p-3 rounded flex items-center gap-3 cursor-pointer ${l === 'Tools' ? 'bg-blue-600' : 'hover:bg-white/5'}`}>
              <Settings2 size={18} /> <span className="hidden md:block text-sm">{l}</span>
            </div>
          ))}
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-14 bg-white border-b flex items-center justify-between px-6 shrink-0">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input className="w-full pl-9 pr-4 py-1.5 bg-gray-100 rounded text-sm outline-none focus:bg-white border border-transparent focus:border-blue-200 transition" placeholder="Search Project..." />
          </div>
          <div className="flex items-center gap-4">
             <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-sm font-bold shadow-sm transition">+ CREATE</button>
             <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">LF</div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full">
          {/* Top Bar: Languages */}
          <div className="flex items-center justify-between border-b mb-6 bg-white rounded-t-lg px-4 shadow-sm">
            <div className="flex gap-1">
              {languages.map(lang => (
                <button 
                  key={lang}
                  onClick={() => setActiveLang(lang)}
                  className={`relative px-6 py-4 text-xs font-black transition flex items-center gap-2 tracking-tighter ${activeLang === lang ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}
                >
                  {lang}
                  {!validation[lang].isValid && <AlertCircle size={12} className="text-red-500" />}
                  {validation[lang].isValid && lang !== languages[0] && <CheckCircle2 size={12} className="text-green-500" />}
                </button>
              ))}
              <button className="px-4 text-gray-300 hover:text-blue-500 transition"><Plus size={16}/></button>
            </div>
            {!validation[activeLang].isValid && (
              <button 
                onClick={() => syncAllToMaster(activeLang)}
                className="flex items-center gap-2 text-[10px] font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-full border border-red-100 hover:bg-red-100 transition animate-pulse"
              >
                <RefreshCw size={10} /> SYNC STRUCTURE TO {languages[0]}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100%-100px)]">
            
            {/* Left Column: Syntax Editor */}
            <div className="lg:col-span-5 flex flex-col h-full min-h-[500px]">
              <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Syntax Editor ({activeLang})</h2>
                <div className="text-[10px] text-gray-400 italic">Tags: R, SS, MS, COL, ROW</div>
              </div>
              <div className="bg-[#1e1e1e] rounded-lg shadow-xl overflow-hidden flex-1 flex flex-col">
                 <div className="bg-[#2d2d2d] px-4 py-2 flex gap-4 text-gray-400 border-b border-black/20">
                    <span className="text-xs font-mono text-blue-400">survey_config.mustache</span>
                 </div>
                 <textarea 
                  value={multiLangSyntax[activeLang]}
                  onChange={(e) => setMultiLangSyntax(prev => ({ ...prev, [activeLang]: e.target.value }))}
                  className="w-full flex-1 p-6 font-mono text-sm leading-relaxed outline-none bg-transparent text-gray-300 resize-none selection:bg-blue-500/30"
                  placeholder="Enter question components..."
                  spellCheck="false"
                 />
              </div>
            </div>

            {/* Right Column: Graphical Editor */}
            <div className="lg:col-span-7 flex flex-col h-full min-h-[500px]">
              <div className="flex items-center justify-between mb-3 px-1">
                <h2 className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Visual Editor</h2>
                <span className="text-[10px] text-gray-400 font-bold uppercase">Questions: {structures[activeLang].length}</span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {structures[activeLang].map((q, qIdx) => (
                  <div key={q.id} className={`bg-white border-2 rounded-xl p-5 shadow-sm transition-all hover:shadow-md ${activeQuestionId === q.id ? 'border-blue-400' : 'border-gray-100'}`} onClick={() => setActiveQuestionId(q.id)}>
                    
                    {/* Card Header: Type Selector & Delete */}
                    <div className="flex items-center justify-between mb-6 border-b pb-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-50 text-blue-600 p-2 rounded-lg">
                          {q.type === 'R' ? <Grid3X3 size={18}/> : q.type === 'MS' ? <CheckSquare size={18}/> : <List size={18}/>}
                        </div>
                        <div className="flex flex-col">
                          <label className="text-[9px] font-bold text-gray-400 uppercase">Question Type</label>
                          <select 
                            value={q.type}
                            onChange={(e) => handleVisualUpdate(qIdx, { type: e.target.value })}
                            className="text-xs font-bold text-slate-700 bg-transparent border-none p-0 focus:ring-0 cursor-pointer"
                          >
                            <option value="R">Rating Matrix (R)</option>
                            <option value="SS">Single Select (SS)</option>
                            <option value="MS">Multi Select (MS)</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button className="p-2 text-gray-300 hover:text-red-500 transition"><Trash2 size={16}/></button>
                        <button className="p-2 text-gray-300 hover:text-blue-500 transition"><GripVertical size={16}/></button>
                      </div>
                    </div>

                    {/* Question Title */}
                    <div className="mb-6">
                      <input 
                        value={q.title}
                        onChange={(e) => handleVisualUpdate(qIdx, { title: e.target.value })}
                        className="w-full text-base font-bold text-slate-800 border-none focus:ring-0 p-1 hover:bg-blue-50/50 rounded transition"
                        placeholder="Type question here..."
                      />
                    </div>

                    {/* Body: Conditional Rendering based on type */}
                    {q.type === 'R' ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr>
                              <th className="w-32"></th>
                              {q.cols.map((col, cIdx) => (
                                <th key={cIdx} className="p-1 group relative">
                                  <input 
                                    value={col}
                                    onChange={(e) => {
                                      const newCols = [...q.cols];
                                      newCols[cIdx] = e.target.value;
                                      handleVisualUpdate(qIdx, { cols: newCols });
                                    }}
                                    className="w-full text-[10px] text-center font-bold text-gray-500 border-none bg-gray-50 rounded py-2"
                                  />
                                  <button onClick={() => {
                                    const newCols = q.cols.filter((_, i) => i !== cIdx);
                                    handleVisualUpdate(qIdx, { cols: newCols });
                                  }} className="absolute -top-1 right-0 opacity-0 group-hover:opacity-100 text-red-400"><Trash2 size={10}/></button>
                                </th>
                              ))}
                              <th><button onClick={() => handleVisualUpdate(qIdx, { cols: [...q.cols, "New Col"] })} className="p-2 text-blue-500 hover:bg-blue-50 rounded"><Plus size={14}/></button></th>
                            </tr>
                          </thead>
                          <tbody>
                            {q.rows.map((row, rIdx) => (
                              <tr key={rIdx} className="group">
                                <td className="py-2 pr-2">
                                  <div className="flex items-center gap-1">
                                    <button onClick={() => {
                                      const newRows = q.rows.filter((_, i) => i !== rIdx);
                                      handleVisualUpdate(qIdx, { rows: newRows });
                                    }} className="opacity-0 group-hover:opacity-100 text-red-300"><Trash2 size={12}/></button>
                                    <input 
                                      value={row}
                                      onChange={(e) => {
                                        const newRows = [...q.rows];
                                        newRows[rIdx] = e.target.value;
                                        handleVisualUpdate(qIdx, { rows: newRows });
                                      }}
                                      className="w-full text-xs font-medium border-none p-1 hover:bg-blue-50/50 rounded"
                                    />
                                  </div>
                                </td>
                                {q.cols.map((_, cIdx) => (
                                  <td key={cIdx} className="p-2 text-center">
                                    <div className="w-4 h-4 rounded-full border-2 border-gray-200 mx-auto" />
                                  </td>
                                ))}
                                <td></td>
                              </tr>
                            ))}
                            <tr>
                              <td colSpan={q.cols.length + 2} className="pt-2">
                                <button onClick={() => handleVisualUpdate(qIdx, { rows: [...q.rows, "New Row"] })} className="text-[10px] font-bold text-blue-500 hover:underline">+ ADD ROW</button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {q.cols.map((opt, oIdx) => (
                          <div key={oIdx} className="flex items-center gap-3 group bg-gray-50/50 p-2 rounded-lg border border-transparent hover:border-blue-100">
                            <div className={`w-4 h-4 border-2 border-gray-300 shrink-0 ${q.type === 'MS' ? 'rounded' : 'rounded-full'}`} />
                            <input 
                              value={opt}
                              onChange={(e) => {
                                const newCols = [...q.cols];
                                newCols[oIdx] = e.target.value;
                                handleVisualUpdate(qIdx, { cols: newCols });
                              }}
                              className="flex-1 bg-transparent border-none text-xs font-medium focus:ring-0 p-0"
                            />
                            <button onClick={() => {
                                const newCols = q.cols.filter((_, i) => i !== oIdx);
                                handleVisualUpdate(qIdx, { cols: newCols });
                              }} className="opacity-0 group-hover:opacity-100 text-red-300 hover:text-red-500"><Trash2 size={14}/></button>
                          </div>
                        ))}
                        <button 
                          onClick={() => handleVisualUpdate(qIdx, { cols: [...q.cols, "New Option"] })}
                          className="flex items-center gap-2 text-[10px] font-bold text-blue-500 hover:bg-blue-50 px-3 py-2 rounded-md transition border border-dashed border-blue-200 w-full justify-center"
                        >
                          <Plus size={14}/> ADD OPTION
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                <button 
                  onClick={() => addQuestion('SS')}
                  className="w-full py-6 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:text-blue-500 hover:border-blue-200 hover:bg-blue-50 transition-all flex flex-col items-center gap-2 group"
                >
                  <Plus size={24} className="group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold uppercase tracking-wider">Add New Question</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <footer className="h-10 border-t bg-white flex items-center justify-center shrink-0">
           <span className="text-[9px] text-gray-400 font-bold tracking-widest">© 1997-2026 PRIME EDUCATION, LLC — PRO SURVEY ENGINE</span>
        </footer>
      </main>
    </div>
  );
};

export default App;