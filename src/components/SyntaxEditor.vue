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
      <div class="text-[10px] text-gray-400 italic">Tags: R, SS, MS, COL, ROW</div>
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
