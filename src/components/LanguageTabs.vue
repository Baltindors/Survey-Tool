<script setup>
import { ref } from 'vue';
import { Plus, CheckCircle2, AlertCircle } from 'lucide-vue-next';

const props = defineProps({
  languages: {
    type: Array,
    required: true
  },
  activeLang: {
    type: String,
    required: true
  },
  validation: {
    type: Object,
    required: true
  },
  availableLanguages: {
    type: Array,
    default: () => ['AR', 'ES', 'FR', 'DE', 'IT', 'PT', 'RU', 'ZH', 'JA']
  }
});

const emit = defineEmits(['update:activeLang', 'toggleLanguage']);

const isLangDropdownOpen = ref(false);
</script>

<template>
  <div class="flex items-center flex-1 gap-2 min-w-0">
    <!-- Scrollable Tabs -->
    <div class="flex gap-1 overflow-x-auto no-scrollbar scroll-smooth flex-1">
        <button 
        v-for="lang in languages"
        :key="lang"
        @click="$emit('update:activeLang', lang)"
        class="relative px-6 py-4 text-xs font-black transition flex items-center gap-2 tracking-tighter shrink-0 whitespace-nowrap"
        :class="activeLang === lang ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'"
        >
        {{ lang }}
        <AlertCircle v-if="!validation[lang]?.isValid" :size="12" class="text-red-500" />
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
                              @change="$emit('toggleLanguage', lang)"
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
</template>
