<script setup>
import { 
  Grid3X3, CheckSquare, List, Trash2, GripVertical, Plus, Check, Scaling, MessageSquare
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

// Helper: generate new ID for new items (always temp)
const generateId = (prefix) => `temp-${prefix}-${Date.now().toString(36)}`;

const updateCol = (index, updates) => {
  const newCols = [...props.question.cols];
  newCols[index] = { ...newCols[index], ...updates };
  updateQuestion({ cols: newCols });
};

const removeCol = (index) => {
  const newCols = props.question.cols.filter((_, i) => i !== index);
  updateQuestion({ cols: newCols });
};

const addCol = () => {
  const newCol = { id: generateId('c'), text: "New Option" };
  updateQuestion({ cols: [...props.question.cols, newCol] });
};

const updateRowText = (index, text) => {
  const newRows = [...props.question.rows];
  newRows[index] = { ...newRows[index], text };
  updateQuestion({ rows: newRows });
};

const removeRow = (index) => {
  const newRows = props.question.rows.filter((_, i) => i !== index);
  updateQuestion({ rows: newRows });
};

const addRow = () => {
  const newRow = { id: generateId('r'), text: "New Row" };
  updateQuestion({ rows: [...props.question.rows, newRow] });
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
        <div class="flex flex-col items-center gap-1">
             <div class="bg-blue-50 text-blue-600 p-2 rounded-lg">
              <Grid3X3 v-if="question.type === 'R'" :size="18"/>
              <CheckSquare v-else-if="question.type === 'MS'" :size="18"/>
              <List v-else :size="18"/>
            </div>
            <span v-if="question.id && !question.id.startsWith('temp-')" class="text-[9px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-mono">#{{ question.id }}</span>
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
            <!-- Use col.id for key -->
            <th v-for="(col, cIdx) in question.cols" :key="col.id" class="p-1 group relative">
              <input 
                :value="col.text"
                @input="e => updateColText(cIdx, e.target.value)"
                class="w-full text-[10px] text-center font-bold text-gray-500 border-none bg-gray-50 rounded py-2 outline-none"
              />
              <button v-if="isMaster" @click="removeCol(cIdx)" class="absolute -top-1 right-0 opacity-0 group-hover:opacity-100 text-red-400"><Trash2 :size="10"/></button>
            </th>
            <th v-if="isMaster"><button @click="addCol" class="p-2 text-blue-500 hover:bg-blue-50 rounded"><Plus :size="14"/></button></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, rIdx) in question.rows" :key="row.id" class="group">
            <td class="py-2 pr-2">
              <div class="flex items-center gap-1">
                <button v-if="isMaster" @click="removeRow(rIdx)" class="opacity-0 group-hover:opacity-100 text-red-300"><Trash2 :size="12"/></button>
                <input 
                  :value="row.text"
                  @input="e => updateRowText(rIdx, e.target.value)"
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
      <!-- Use col.id for key -->
      <!-- Use col.id for key -->
      <div v-for="(opt, oIdx) in question.cols" :key="opt.id">
        <div 
            class="flex items-center gap-3 group bg-gray-50/50 p-2 rounded-lg border transition-all hover:shadow-sm"
            :class="opt.isCorrect ? 'border-green-400 bg-green-50/30' : 'border-transparent hover:border-blue-100'"
        >
            <div class="w-4 h-4 border-2 shrink-0 flex items-center justify-center transition-colors" 
                :class="[
                    question.type === 'MS' ? 'rounded' : 'rounded-full',
                    opt.isCorrect ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300'
                ]"
            >
                <Check v-if="opt.isCorrect" :size="10" stroke-width="4" />
            </div>

            <div class="flex-1 flex flex-col">
                <input 
                :value="opt.text"
                @input="e => updateCol(oIdx, { text: e.target.value })"
                class="w-full bg-transparent border-none text-xs font-medium focus:ring-0 p-0 outline-none"
                placeholder="Option text..."
                />
            </div>

            <!-- ACTIONS -->
            <div class="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity" v-if="isMaster">
                <!-- Correct Answer Toggle -->
                 <button 
                    @click="updateCol(oIdx, { isCorrect: !opt.isCorrect })"
                    class="p-1.5 rounded transition"
                    :class="opt.isCorrect ? 'bg-green-100 text-green-600' : 'text-gray-300 hover:text-green-500 hover:bg-green-50'"
                    title="Mark as Correct Answer"
                >
                    <Check :size="14"/>
                </button>

                <!-- Other Toggle -->
                 <button 
                    @click="updateCol(oIdx, { isOther: !opt.isOther })"
                    class="p-1.5 rounded transition"
                    :class="opt.isOther ? 'bg-blue-100 text-blue-600' : 'text-gray-300 hover:text-blue-500 hover:bg-blue-50'"
                    title="Enable 'Other' Specification"
                >
                    <MessageSquare :size="14"/>
                </button>

                <button @click="removeCol(oIdx)" class="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded transition"><Trash2 :size="14"/></button>
            </div>
        </div>
        
        <!-- Other Specification Preview -->
        <div v-if="opt.isOther" class="ml-9 mt-1 mr-2 opacity-75">
            <input disabled value="Please specify..." class="w-full text-[10px] italic bg-gray-100 border border-gray-200 rounded px-2 py-1 select-none text-gray-400 cursor-not-allowed" />
        </div>
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
