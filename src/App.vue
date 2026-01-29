<script setup>
import { ref, computed } from 'vue';
import { 
  Search, Plus, Settings2, AlertCircle, CheckCircle2, RefreshCw 
} from 'lucide-vue-next';
import { useSurveyParser } from './composables/useSurveyParser';
import SyntaxEditor from './components/SyntaxEditor.vue';
import VisualEditor from './components/VisualEditor.vue';

const { parseQuestions, generateSyntax, validateStructure } = useSurveyParser();

const activeLang = ref('EN');
const languages = ref(['EN']);
const availableLanguages = ['AR', 'ES', 'FR', 'DE', 'IT', 'PT', 'RU', 'ZH', 'JA'];
const isLangDropdownOpen = ref(false);
const activeQuestionId = ref(null);

// Initial State (Flat string, parser will add temp IDs)
// Initial State (Flat string, parser will add temp IDs)
const multiLangSyntax = ref({
  EN: "{{R}}Please rate the quality of the Program\n{{COL}} Unsatisfied\n{{COL}} Satisfied\n{{ROW}} Education\n{{ROW}} Engagement\n\n{{SS}}Which platform do you prefer?\n{{COL}} Desktop\n{{COL}} Mobile"
});

// Mock Data for "Pre-Activity"
const MOCK_DATA = [
  {
    id: "q-1",
    type: "R",
    title: "How effective was the training?",
    rows: [
      { id: "r-1", text: "Clarity" },
      { id: "r-2", text: "Pacing" }
    ],
    cols: [
      { id: "c-1", text: "Low" },
      { id: "c-2", text: "High" }
    ]
  },
  {
    id: "q-2",
    type: "SS",
    title: "Years of experience?",
    rows: [],
    cols: [
      { id: "c-3", text: "0-2" },
      { id: "c-4", text: "3-5", isCorrect: true },
      { id: "c-5", text: "5+" }
    ]
  },
  {
    id: "q-3",
    type: "MS",
    title: "Preferred tools?",
    rows: [],
    cols: [
      { id: "c-6", text: "Vue", isCorrect: true },
      { id: "c-7", text: "React" },
      { id: "c-8", text: "Angular" },
      { id: "c-9", text: "Other", isOther: true }
    ]
  }
];

const loadExistingSurvey = () => {
    console.log("Loading Pre-Activity Mock Data...", MOCK_DATA);
    // Convert Mock Data Objects -> Syntax String with IDs
    const syntax = generateSyntax(MOCK_DATA);
    
    // Update Master (EN)
    multiLangSyntax.value['EN'] = syntax;
    
    // Clear others or simulate translation??
    // Let's just reset others to empty to force user to 'Sync'
    // Clear others or simulate translation??
    // Let's just reset others to empty to force user to 'Sync'
    languages.value.forEach(l => {
        if (l !== 'EN') multiLangSyntax.value[l] = "";
    });
    
    activeLang.value = 'EN';
    alert("Pre-Activity Survey Loaded! Check console.");
};

const structures = computed(() => {
  const s = {};
  languages.value.forEach(lang => {
    s[lang] = parseQuestions(multiLangSyntax.value[lang] || "");
  });
  return s;
});

const validation = computed(() => {
  return validateStructure(structures.value, languages.value, languages.value[0]);
});

const updateSyntax = (lang, newSyntax) => {
  multiLangSyntax.value[lang] = newSyntax;
};

const handleVisualUpdate = (index, updates) => {
  const currentQuestions = [...structures.value[activeLang.value]];
  currentQuestions[index] = { ...currentQuestions[index], ...updates };
  updateSyntax(activeLang.value, generateSyntax(currentQuestions));
};

const addQuestion = (type) => {
  const currentQuestions = [...structures.value[activeLang.value]];
  currentQuestions.push({
    id: `temp-q-${Date.now()}`,
    type,
    title: "New Question",
    cols: [{ id: `temp-c-${Date.now()}-1`, text: "Option 1" }],
    rows: type === 'R' ? [{ id: `temp-r-${Date.now()}-1`, text: "Row 1" }] : []
  });
  updateSyntax(activeLang.value, generateSyntax(currentQuestions));
};

const deleteQuestion = (index) => {
  const currentQuestions = [...structures.value[activeLang.value]];
  currentQuestions.splice(index, 1);
  updateSyntax(activeLang.value, generateSyntax(currentQuestions));
};

const toggleLanguage = (lang) => {
  if (lang === 'EN') return; // Master is locked

  const idx = languages.value.indexOf(lang);
  if (idx === -1) {
    // Add
    languages.value.push(lang);
    if (!multiLangSyntax.value[lang]) {
        multiLangSyntax.value[lang] = ""; // Initialize
    }
  } else {
    // Remove
    if (confirm(`Are you sure you want to remove ${lang}? This will delete its content.`)) {
        languages.value.splice(idx, 1);
        delete multiLangSyntax.value[lang]; // Optional: Clean up memory (or keep it if untoggled? Plan said delete)
        if (activeLang.value === lang) {
            activeLang.value = 'EN';
        }
    }
  }
};

const syncAllToMaster = (lang) => {
  const master = structures.value[languages.value[0]];
  const current = structures.value[lang];
  
  // Try to match by ID first? Or just index as per original logic?
  // User asked for "Missing mustache tags from Master to secondary".
  // If we assume structure sync, we copy master structure and fill text from current if available.
  
  const synced = master.map((mQ, i) => {
    // Attempt to find matching Question in current by ID or Index
    // Since current might not have IDs yet, simple index fallback is safer for now unless we know current has IDs.
    const cQ = current[i] || {};
    
    return {
      ...mQ, // Copy Master Structure (IDs, Type)
      title: cQ.title || `[Needs Translation: ${mQ.title}]`,
      // Map cols/rows. Use Master's IDs. Try to preserve Current's text.
      cols: mQ.cols.map((mCol, colIdx) => ({
          id: mCol.id,
          text: cQ.cols?.[colIdx]?.text || ""
      })),
      rows: mQ.rows.map((mRow, rowIdx) => ({
          id: mRow.id,
          text: cQ.rows?.[rowIdx]?.text || ""
      }))
    };
  });
  updateSyntax(lang, generateSyntax(synced));
};

const saveProject = () => {
    // Global Validation Check
    const errors = [];
    languages.value.forEach(lang => {
        if (!validation.value[lang].isValid) {
            errors.push(lang);
        }
    });

    // Validate Single Select Logic (Max 1 Correct) across all questions in Master
    const masterQs = structures.value['EN'];
    masterQs.forEach((q, idx) => {
        if (q.type === 'SS') {
            const correctCount = q.cols.filter(c => c.isCorrect).length;
            if (correctCount > 1) {
                 // Push a custom error or just alert? Plan said Global Validation.
                 // Let's add it to errors? Or a separate alert? 
                 // Let's block save and show specific message.
                 // Actually logic below joins errors. But this is logic error, not structural mismatch.
                 // I'll make a separate check block.
            }
        }
    });
    
    // Check SS Correct Counts
    const ssErrors = masterQs
        .map((q, i) => ({ q, i }))
        .filter(({ q }) => q.type === 'SS' && q.cols.filter(c => c.isCorrect).length > 1)
        .map(({ q, i }) => `Question ${i + 1} ("${q.title}") is Single Select but has multiple correct answers.`);

    if (errors.length > 0) {
        alert(`Cannot save: The following languages have structural errors:\n\n${errors.join(', ')}\n\nPlease fix them before exporting.`);
        return;
    }
    
    if (ssErrors.length > 0) {
        alert(`Cannot save: Logic Errors found:\n\n${ssErrors.join('\n')}`);
        return;
    }

    // Finalize IDs: Replace 'temp-' IDs with real UUIDs
    const masterQuestions = [...structures.value['EN']];
    let hasUpdates = false;
    
    const generateUuid = (prefix) => `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`;

    masterQuestions.forEach(q => {
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

    if (hasUpdates) {
        updateSyntax('EN', generateSyntax(masterQuestions));
    }

    // Allow Vue to react to the update before logging (nextTick would be better but simple sequential call works for ref sync usually if logic is sync)
    // Actually generateSyntax above updates the ref.
    
    // We should probably wait a tick, but for now just logging the *updated* ref value is fine.
    // However, the computed 'structures' might not have re-run yet? 
    // updateSyntax updates 'multiLangSyntax'. 
    
    console.log("Saving Project (IDs Finalized)...", JSON.stringify(multiLangSyntax.value, null, 2));
    alert("Project saved! IDs finalized.");
}

</script>

<template>
  <div class="flex h-screen bg-gray-50 text-slate-800 font-sans overflow-hidden">
    <!-- Sidebar -->
    <aside class="w-16 md:w-56 bg-[#333] text-white flex flex-col shrink-0 transition-all">
      <div class="p-4 flex items-center gap-2 border-b border-white/10">
        <div class="w-8 h-8 bg-blue-500 rounded flex items-center justify-center font-bold">P</div>
        <span class="hidden md:block font-semibold">PRIME Admin</span>
      </div>
      <div class="flex-1 mt-4 px-2 space-y-1">
        <div v-for="(l, i) in ['Tools']" :key="i" class="p-3 rounded flex items-center gap-3 cursor-pointer" :class="l === 'Tools' ? 'bg-blue-600' : 'hover:bg-white/5'">
          <Settings2 :size="18" /> <span class="hidden md:block text-sm">{{ l }}</span>
        </div>
      </div>
    </aside>

    <main class="flex-1 flex flex-col overflow-hidden">
      <!-- Header -->
      <header class="h-14 bg-white border-b flex items-center justify-between px-6 shrink-0">
        <div class="flex-1 max-w-md relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" :size="16" />
          <input class="w-full pl-9 pr-4 py-1.5 bg-gray-100 rounded text-sm outline-none focus:bg-white border border-transparent focus:border-blue-200 transition" placeholder="Search Project..." />
        </div>
        <div class="flex items-center gap-4">
           <button @click="loadExistingSurvey" class="border border-blue-600 text-blue-600 hover:bg-blue-50 px-4 py-1.5 rounded text-sm font-bold transition mr-2">LOAD PRE-ACTIVITY</button>
           <button @click="saveProject" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-sm font-bold shadow-sm transition">SAVE / EXPORT</button>
           <div class="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">LF</div>
        </div>
      </header>

      <div class="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full">
        <!-- Top Bar: Languages -->
        <div class="flex items-center justify-between border-b mb-6 bg-white rounded-t-lg px-4 shadow-sm relative z-20">
          <div class="flex items-center flex-1 gap-2 min-w-0">
            <!-- Scrollable Tabs -->
            <div class="flex gap-1 overflow-x-auto no-scrollbar scroll-smooth flex-1">
                <button 
                v-for="lang in languages"
                :key="lang"
                @click="activeLang = lang"
                class="relative px-6 py-4 text-xs font-black transition flex items-center gap-2 tracking-tighter shrink-0 whitespace-nowrap"
                :class="activeLang === lang ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'"
                >
                {{ lang }}
                <AlertCircle v-if="!validation[lang].isValid" :size="12" class="text-red-500" />
                <CheckCircle2 v-else-if="lang !== languages[0]" :size="12" class="text-green-500" />
                </button>
            </div>

            <!-- Fixed Add Button -->
            <div class="pl-2 border-l border-gray-100 relative shrink-0 z-50">
                 <button class="relative px-2 py-2 text-gray-300 hover:text-blue-500 transition rounded-full hover:bg-gray-50" @click="isLangDropdownOpen = !isLangDropdownOpen">
                    <Plus :size="18"/>
                 </button>
                 
                 <!-- Dropdown -->
                 <div v-if="isLangDropdownOpen" class="absolute top-full right-0 mt-2 w-48 bg-white border rounded-lg shadow-xl z-50 py-2 flex flex-col items-start overflow-hidden origin-top-right animate-in fade-in zoom-in-95 duration-100">
                      <h3 class="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider w-full text-left">Manage Languages</h3>
                      <div class="w-full max-h-60 overflow-y-auto custom-scrollbar">
                          <label 
                              v-for="lang in availableLanguages" 
                              :key="lang"
                              class="flex items-center gap-3 px-4 py-2 hover:bg-blue-50 cursor-pointer w-full text-left group transition-colors"
                          >
                              <div class="relative flex items-center">
                                  <input 
                                      type="checkbox" 
                                      :checked="languages.includes(lang)"
                                      :disabled="lang === 'EN'"
                                      @change="toggleLanguage(lang)"
                                      class="peer appearance-none w-4 h-4 border-2 border-gray-300 rounded checked:bg-blue-600 checked:border-blue-600 transition disabled:opacity-50"
                                  />
                                   <CheckCircle2 class="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none left-0.5" :size="12" />
                              </div>
                              <span class="text-xs font-bold" :class="languages.includes(lang) ? 'text-blue-900' : 'text-gray-500 group-hover:text-blue-600'">{{ lang }}</span>
                          </label>
                      </div>
                  </div>
            </div>
          </div>

          <!-- Right Side: Validation / Sync -->
          <div v-if="!validation[activeLang].isValid" class="flex items-center pl-4 shrink-0">
            <button 
              @click="syncAllToMaster(activeLang)"
              class="flex items-center gap-2 text-[10px] font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-full border border-red-100 hover:bg-red-100 transition animate-pulse whitespace-nowrap"
            >
              <RefreshCw :size="10" /> SYNC STRUCTURE TO {{ languages[0] }}
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100%-100px)]">
          
          <!-- Left Column: Syntax Editor -->
          <div class="lg:col-span-5">
            <SyntaxEditor 
              :modelValue="multiLangSyntax[activeLang]" 
              @update:modelValue="(val) => updateSyntax(activeLang, val)"
              :activeLang="activeLang"
            />
          </div>

          <!-- Right Column: Graphical Editor -->
          <div class="lg:col-span-7">
            <VisualEditor 
              :questions="structures[activeLang]"
              :activeQuestionId="activeQuestionId"
              :isMaster="activeLang === 'EN'"
              @updateQuestion="({index, updates}) => handleVisualUpdate(index, updates)"
              @addQuestion="addQuestion"
              @setActive="(id) => activeQuestionId = id"
              @deleteQuestion="deleteQuestion"
            />
          </div>
        </div>
      </div>

      <footer class="h-10 border-t bg-white flex items-center justify-center shrink-0">
         <span class="text-[9px] text-gray-400 font-bold tracking-widest">© 1997-2026 PRIME EDUCATION, LLC — PRO SURVEY ENGINE</span>
      </footer>
    </main>
  </div>
</template>
