<script setup>
import { 
  Grid3X3, CheckSquare, List, Trash2, GripVertical, Plus 
} from 'lucide-vue-next';

const props = defineProps({
  question: {
    type: Object,
    required: true
  },
  isActive: Boolean,
  isMaster: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['update', 'activate', 'delete']);

const updateQuestion = (updates) => {
  emit('update', { ...props.question, ...updates });
};

const updateCol = (index, value) => {
  const newCols = [...props.question.cols];
  newCols[index] = value;
  updateQuestion({ cols: newCols });
};

const removeCol = (index) => {
  const newCols = props.question.cols.filter((_, i) => i !== index);
  updateQuestion({ cols: newCols });
};

const addCol = () => {
  updateQuestion({ cols: [...props.question.cols, "New Option"] });
};

const updateRow = (index, value) => {
  const newRows = [...props.question.rows];
  newRows[index] = value;
  updateQuestion({ rows: newRows });
};

const removeRow = (index) => {
  const newRows = props.question.rows.filter((_, i) => i !== index);
  updateQuestion({ rows: newRows });
};

const addRow = () => {
  updateQuestion({ rows: [...props.question.rows, "New Row"] });
};
</script>

<template>
  <div 
    class="bg-white border-2 rounded-xl p-5 shadow-sm transition-all hover:shadow-md cursor-pointer"
    :class="isActive ? 'border-blue-400' : 'border-gray-100'"
    @click="emit('activate')"
  >
    <!-- Card Header: Type Selector & Delete -->
    <div class="flex items-center justify-between mb-6 border-b pb-3">
      <div class="flex items-center gap-3">
        <div class="bg-blue-50 text-blue-600 p-2 rounded-lg">
          <Grid3X3 v-if="question.type === 'R'" :size="18"/>
          <CheckSquare v-else-if="question.type === 'MS'" :size="18"/>
          <List v-else :size="18"/>
        </div>
        <div class="flex flex-col">
          <label class="text-[9px] font-bold text-gray-400 uppercase">Question Type</label>
          <select 
            :value="question.type"
            :disabled="!isMaster"
            @change="e => updateQuestion({ type: e.target.value })"
            class="text-xs font-bold text-slate-700 bg-transparent border-none p-0 focus:ring-0 cursor-pointer outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <option value="R">Rating Matrix (R)</option>
            <option value="SS">Single Select (SS)</option>
            <option value="MS">Multi Select (MS)</option>
          </select>
        </div>
      </div>
      <div class="flex gap-1" v-if="isMaster">
        <button @click.stop="emit('delete')" class="p-2 text-gray-300 hover:text-red-500 transition"><Trash2 :size="16"/></button>
        <button class="p-2 text-gray-300 hover:text-blue-500 transition cursor-grab"><GripVertical :size="16"/></button>
      </div>
    </div>

    <!-- Question Title -->
    <div class="mb-6">
      <input 
        :value="question.title"
        @input="e => updateQuestion({ title: e.target.value })"
        class="w-full text-base font-bold text-slate-800 border-none focus:ring-0 p-1 hover:bg-blue-50/50 rounded transition outline-none"
        placeholder="Type question here..."
      />
    </div>

    <!-- Body: Conditional Rendering based on type -->
    <div v-if="question.type === 'R'" class="overflow-x-auto">
      <table class="w-full text-left">
        <thead>
          <tr>
            <th class="w-32"></th>
            <th v-for="(col, cIdx) in question.cols" :key="cIdx" class="p-1 group relative">
              <input 
                :value="col"
                @input="e => updateCol(cIdx, e.target.value)"
                class="w-full text-[10px] text-center font-bold text-gray-500 border-none bg-gray-50 rounded py-2 outline-none"
              />
              <button v-if="isMaster" @click="removeCol(cIdx)" class="absolute -top-1 right-0 opacity-0 group-hover:opacity-100 text-red-400"><Trash2 :size="10"/></button>
            </th>
            <th v-if="isMaster"><button @click="addCol" class="p-2 text-blue-500 hover:bg-blue-50 rounded"><Plus :size="14"/></button></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rIdx) in question.rows" :key="rIdx" class="group">
            <td class="py-2 pr-2">
              <div class="flex items-center gap-1">
                <button v-if="isMaster" @click="removeRow(rIdx)" class="opacity-0 group-hover:opacity-100 text-red-300"><Trash2 :size="12"/></button>
                <input 
                  :value="row"
                  @input="e => updateRow(rIdx, e.target.value)"
                  class="w-full text-xs font-medium border-none p-1 hover:bg-blue-50/50 rounded outline-none"
                />
              </div>
            </td>
            <td v-for="(_, cIdx) in question.cols" :key="cIdx" class="p-2 text-center">
              <div class="w-4 h-4 rounded-full border-2 border-gray-200 mx-auto" />
            </td>
            <td></td>
          </tr>
          <tr v-if="isMaster">
            <td :colspan="question.cols.length + 2" class="pt-2">
              <button @click="addRow" class="text-[10px] font-bold text-blue-500 hover:underline">+ ADD ROW</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="space-y-2">
      <div v-for="(opt, oIdx) in question.cols" :key="oIdx" class="flex items-center gap-3 group bg-gray-50/50 p-2 rounded-lg border border-transparent hover:border-blue-100">
        <div class="w-4 h-4 border-2 border-gray-300 shrink-0" :class="question.type === 'MS' ? 'rounded' : 'rounded-full'" />
        <input 
          :value="opt"
          @input="e => updateCol(oIdx, e.target.value)"
          class="flex-1 bg-transparent border-none text-xs font-medium focus:ring-0 p-0 outline-none"
        />
        <button v-if="isMaster" @click="removeCol(oIdx)" class="opacity-0 group-hover:opacity-100 text-red-300 hover:text-red-500"><Trash2 :size="14"/></button>
      </div>
      <button 
        v-if="isMaster"
        @click="addCol"
        class="flex items-center gap-2 text-[10px] font-bold text-blue-500 hover:bg-blue-50 px-3 py-2 rounded-md transition border border-dashed border-blue-200 w-full justify-center"
      >
        <Plus :size="14"/> ADD OPTION
      </button>
    </div>
  </div>
</template>
