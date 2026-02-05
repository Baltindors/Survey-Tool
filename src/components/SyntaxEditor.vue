<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    required: true
  },
  activeLang: {
    type: String,
    default: 'EN'
  }
});

const emit = defineEmits(['update:modelValue']);

const value = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});
</script>

<template>
  <div class="flex flex-col h-full min-h-[500px]">
    <div class="flex items-center justify-between mb-3 px-1">
      <h2 class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Syntax Editor ({{ activeLang }})</h2>
      <div class="group relative flex items-center gap-1 cursor-help">
        <span class="text-[10px] text-gray-400 italic border-b border-dashed border-gray-400">Documentation</span>
        
        <!-- Tooltip -->
        <div class="absolute right-0 top-full mt-2 w-64 bg-slate-800 text-slate-200 text-[10px] p-3 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 border border-slate-700">
          <div class="space-y-3" v-pre>
            <div>
              <div class="font-bold text-blue-400 mb-1 border-b border-white/10 pb-0.5">Structure</div>
              <div class="flex flex-col gap-1">
                <div><code>{{R}}</code> Rating</div>
                <div><code>{{SS}}</code> Single Select</div>
                <div><code>{{MS}}</code> Multi Select</div>
                <div><code>{{COL}}</code> Column</div>
                <div><code>{{ROW}}</code> Row</div>
              </div>
            </div>
            <div>
              <div class="font-bold text-green-400 mb-1 border-b border-white/10 pb-0.5">Logic</div>
              <div class="flex flex-col gap-1">
                <div><code>{{ID:x}}</code> Unique ID</div>
                <div><code>{{C}}</code> Correct Answer</div>
                <div><code>{{O}}</code> Other/Specify</div>
                <div><code>{{O:n}}</code> Other/numeric</div>
                <div><code>{{O:p}}</code> Other/phone number</div>
                <div><code>{{O:e}}</code> Other/emails</div>
                <div><code>{{O:d}}</code> Other/date</div>
                <div><code>{{O:t}}</code> Other/time</div>
                <div><code>{{O:dt}}</code> Other/datetime</div>

              </div>
            </div>
            <div>
              <div class="font-bold text-purple-400 mb-1 border-b border-white/10 pb-0.5">Formatting</div>
              <div class="grid grid-cols-2 gap-x-2 gap-y-1">
                <div><code>**B**</code> Bold</div>
                <div><code>_I_</code> Italic</div>
                <div><code>&lt;u&gt;</code> Underline</div>
                <div><code>[Tx](Url)</code> Link</div>
                <div><code>&lt;sup&gt;</code> Sup</div>
                <div><code>&lt;sub&gt;</code> Sub</div>
              </div>
            </div>
          </div>
          <!-- Triangle -->
          <div class="absolute -top-1 right-2 w-2 h-2 bg-slate-800 rotate-45 border-t border-l border-slate-700"></div>
        </div>
      </div>
    </div>
    <div class="bg-[#1e1e1e] rounded-lg shadow-xl overflow-hidden flex-1 flex flex-col">
      <div class="bg-[#2d2d2d] px-4 py-2 flex gap-4 text-gray-400 border-b border-black/20">
        <span class="text-xs font-mono text-blue-400">survey_config.mustache</span>
      </div>
      <textarea 
        v-model="value"
        class="w-full flex-1 p-6 font-mono text-sm leading-relaxed outline-none bg-transparent text-gray-300 resize-none selection:bg-blue-500/30"
        placeholder="Enter question components..."
        spellcheck="false"
      />
    </div>
  </div>
</template>
