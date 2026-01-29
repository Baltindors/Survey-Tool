<script setup>
import { Plus } from 'lucide-vue-next';
import QuestionCard from './QuestionCard.vue';

const props = defineProps({
  questions: {
    type: Array,
    required: true
  },
  activeQuestionId: String,
  isMaster: Boolean
});

const emit = defineEmits(['updateQuestion', 'addQuestion', 'setActive', 'deleteQuestion']);

const handleUpdate = (index, updates) => {
  emit('updateQuestion', { index, updates });
};
</script>

<template>
  <div class="flex flex-col h-full min-h-[500px]">
    <div class="flex items-center justify-between mb-3 px-1">
      <h2 class="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Visual Editor</h2>
      <span class="text-[10px] text-gray-400 font-bold uppercase">Questions: {{ questions.length }}</span>
    </div>

    <div class="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
      <QuestionCard
        v-for="(q, index) in questions"
        :key="q.id"
        :question="q"
        :isActive="activeQuestionId === q.id"
        :isMaster="isMaster"
        @activate="emit('setActive', q.id)"
        @update="(updates) => handleUpdate(index, updates)"
        @delete="emit('deleteQuestion', index)" 
      />
      
      <button 
        v-if="isMaster"
        @click="emit('addQuestion', 'SS')"
        class="w-full py-6 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:text-blue-500 hover:border-blue-200 hover:bg-blue-50 transition-all flex flex-col items-center gap-2 group"
      >
        <Plus :size="24" class="group-hover:scale-110 transition-transform" />
        <span class="text-xs font-bold uppercase tracking-wider">Add New Question</span>
      </button>
    </div>
  </div>
</template>
