<script setup>
import { ref, computed, watch } from 'vue';
import { Search, Settings2 } from 'lucide-vue-next';
import { useSurveyParser } from './composables/useSurveyParser';
import SyntaxEditor from './components/SyntaxEditor.vue';
import VisualEditor from './components/VisualEditor.vue';
import LanguageTabs from './components/LanguageTabs.vue';
import ValidationBanner from './components/ValidationBanner.vue';

const { 
  parseQuestions, 
  generateSyntax, 
  validateStructure, 
  finalizeStructureIds, 
  syncStructureToMaster 
} = useSurveyParser();

const activeLang = ref('EN');
const languages = ref(['EN']);
const activeQuestionId = ref(null);

// Initial State (Flat string, parser will add temp IDs)
const multiLangSyntax = ref({
  EN: "{{R}}Please rate the quality of the Program\n{{COL}} Unsatisfied\n{{COL}} Satisfied\n{{ROW}} Education\n{{ROW}} Engagement\n\n{{SS}}Which platform do you prefer?\n{{COL}} Desktop\n{{COL}} Mobile"
});

// Watcher for Languages to keep multiLangSyntax in sync
watch(languages, (newLangs) => {
    // Add missing keys
    newLangs.forEach(lang => {
        if (multiLangSyntax.value[lang] === undefined) {
             multiLangSyntax.value[lang] = "";
        }
    });
    // Remove deleted keys
    Object.keys(multiLangSyntax.value).forEach(lang => {
        if (!newLangs.includes(lang)) {
            delete multiLangSyntax.value[lang];
        }
    });
}, { deep: true });

const loadExistingSurvey = () => {
    // Simulated raw syntax string with IDs from backend/file
    const rawSyntax = `{{R}}{{ID:q-1}} Welcome to the **Rich-Text** _Feature Tour_!
{{COL}} {{ID:c-1}} **Strong** Agree
{{COL}} {{ID:c-2}} _Slight_ Disagree
{{ROW}} {{ID:r-1}} Formatting
{{ROW}} {{ID:r-2}} <u>Ease of Use</u>

{{SS}}{{ID:q-2}} Rate these compounds:
{{COL}} {{ID:c-3}} H<sub>2</sub>O
{{COL}} {{ID:c-4}} {{C}} E=mc<sup>2</sup>
{{COL}} {{ID:c-5}} CO<sub>2</sub>

{{MS}}{{ID:q-3}} Feedback?
{{COL}} {{ID:c-6}} {{C}} [Visit Website](https://example.com) to learn more
{{COL}} {{ID:c-7}} **Email** us
{{COL}} {{ID:c-8}} No _comments_
{{COL}} {{ID:c-9}} {{O}} Other`;

    console.log("Loading Raw Syntax string...");
    multiLangSyntax.value['EN'] = rawSyntax;
    
    // Reset others
    languages.value.forEach(l => {
        if (l !== 'EN') multiLangSyntax.value[l] = "";
    });
    
    activeLang.value = 'EN';
    alert("Survey Loaded from Raw Syntax!");
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
    languages.value.push(lang);
  } else {
    if (confirm(`Are you sure you want to remove ${lang}? This will delete its content.`)) {
        languages.value.splice(idx, 1);
        if (activeLang.value === lang) {
            activeLang.value = 'EN';
        }
    }
  }
};

const syncAllToMaster = (lang) => {
  const masterStruct = structures.value[languages.value[0]];
  const currentStruct = structures.value[lang];
  
  const syncedQuestions = syncStructureToMaster(masterStruct, currentStruct);
  updateSyntax(lang, generateSyntax(syncedQuestions));
};

const saveProject = () => {
    // 1. Validate All
    const errors = [];
    languages.value.forEach(lang => {
        if (!validation.value[lang].isValid) {
            errors.push(lang);
        }
    });

    if (errors.length > 0) {
        alert(`Cannot save: The following languages have structural errors:\n\n${errors.join(', ')}\n\nPlease fix them before exporting.`);
        return;
    }

    // 2. Finalize IDs (if needed)
    const masterQuestions = [...structures.value['EN']];
    const hasUpdates = finalizeStructureIds(masterQuestions);

    if (hasUpdates) {
        updateSyntax('EN', generateSyntax(masterQuestions));
    }

    // 3. Export Data
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
        <!-- New Component: Language Tabs -->
        <div class="flex items-center justify-between border-b mb-6 bg-white rounded-t-lg px-4 shadow-sm relative z-20">
          <LanguageTabs 
            :languages="languages"
            :activeLang="activeLang"
            :validation="validation"
            @update:activeLang="activeLang = $event"
            @toggleLanguage="toggleLanguage"
          />

          <!-- New Component: Validation Banner -->
          <ValidationBanner 
             :isValid="validation[activeLang].isValid"
             :targetLang="activeLang"
             :masterLang="languages[0]"
             @sync="syncAllToMaster(activeLang)"
          />
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
         <span class="text-[9px] text-gray-400 font-bold tracking-widest">© 1997-2026 PRIME EDUCATION, LLC</span>
      </footer>
    </main>
  </div>
</template>
