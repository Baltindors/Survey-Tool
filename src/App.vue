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
const languages = ref(['EN', 'AR', 'ES', 'FR', 'DE']);
const activeQuestionId = ref(null);

const multiLangSyntax = ref({
  EN: "{{R}}Please rate the quality of the Program\n{{COL}} Unsatisfied\n{{COL}} Satisfied\n{{ROW}} Education\n{{ROW}} Engagement\n\n{{SS}}Which platform do you prefer?\n{{COL}} Desktop\n{{COL}} Mobile",
  AR: "{{R}}يرجى تقييم جودة البرنامج\n{{COL}} غير راضٍ\n{{COL}} راضٍ\n{{ROW}} تعليم\n\n{{SS}}أي منصة تفضل؟\n{{COL}} سطح المكتب",
  ES: "",
  FR: "",
  DE: ""
});

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
    id: Date.now().toString(),
    type,
    title: "New Question",
    cols: ["Option 1"],
    rows: type === 'R' ? ["Row 1"] : []
  });
  updateSyntax(activeLang.value, generateSyntax(currentQuestions));
};

const deleteQuestion = (index) => {
  const currentQuestions = [...structures.value[activeLang.value]];
  currentQuestions.splice(index, 1);
  updateSyntax(activeLang.value, generateSyntax(currentQuestions));
};

const syncAllToMaster = (lang) => {
  const master = structures.value[languages.value[0]];
  const current = structures.value[lang];
  
  const synced = master.map((mQ, i) => {
    const cQ = current[i] || {};
    return {
      ...mQ,
      title: cQ.title || `[Needs Translation: ${mQ.title}]`,
      cols: mQ.cols.map((_, colIdx) => cQ.cols?.[colIdx] || ""),
      rows: mQ.rows.map((_, rowIdx) => cQ.rows?.[rowIdx] || "")
    };
  });
  updateSyntax(lang, generateSyntax(synced));
};

const saveProject = () => {
    console.log("Saving Project...", JSON.stringify(multiLangSyntax.value, null, 2));
    alert("Project saved! Check console for JSON output.");
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
        <div v-for="(l, i) in ['Outcomes', 'Reporting', 'Tools', 'User Manager']" :key="i" class="p-3 rounded flex items-center gap-3 cursor-pointer" :class="l === 'Tools' ? 'bg-blue-600' : 'hover:bg-white/5'">
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
           <button @click="saveProject" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded text-sm font-bold shadow-sm transition">SAVE / EXPORT</button>
           <div class="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">LF</div>
        </div>
      </header>

      <div class="flex-1 overflow-y-auto p-6 max-w-7xl mx-auto w-full">
        <!-- Top Bar: Languages -->
        <div class="flex items-center justify-between border-b mb-6 bg-white rounded-t-lg px-4 shadow-sm">
          <div class="flex gap-1 overflow-x-auto">
            <button 
              v-for="lang in languages"
              :key="lang"
              @click="activeLang = lang"
              class="relative px-6 py-4 text-xs font-black transition flex items-center gap-2 tracking-tighter shrink-0"
              :class="activeLang === lang ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'"
            >
              {{ lang }}
              <AlertCircle v-if="!validation[lang].isValid" :size="12" class="text-red-500" />
              <CheckCircle2 v-else-if="lang !== languages[0]" :size="12" class="text-green-500" />
            </button>
            <button class="px-4 text-gray-300 hover:text-blue-500 transition"><Plus :size="16"/></button>
          </div>
          <div v-if="!validation[activeLang].isValid" class="flex items-center pl-4">
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
