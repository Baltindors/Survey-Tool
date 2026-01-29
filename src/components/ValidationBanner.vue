<script setup>
import { RefreshCw } from 'lucide-vue-next';

defineProps({
  isValid: {
    type: Boolean,
    required: true
  },
  targetLang: {
    type: String,
    required: true
  },
  masterLang: {
    type: String,
    default: 'EN'
  }
});

defineEmits(['sync']);
</script>

<template>
  <div v-if="!isValid" class="flex items-center pl-4 shrink-0">
    <button 
      @click="$emit('sync')"
      class="flex items-center gap-2 text-[10px] font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-full border border-red-100 hover:bg-red-100 transition animate-pulse whitespace-nowrap"
    >
      <RefreshCw :size="10" /> SYNC STRUCTURE TO {{ masterLang }}
    </button>
  </div>
</template>
