<script setup lang="ts">
import { defineProps, defineEmits } from 'vue';
import { Server } from 'lucide-vue-next';

interface Rack {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  load: number;
  temp: number;
}

interface Props {
  racks: Rack[];
  maxDisplay?: number;
  showViewAll?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  maxDisplay: 24,
  showViewAll: true
});

const emit = defineEmits<{
  (e: 'view-all'): void;
  (e: 'rack-click', rack: Rack): void;
}>();

const statusColor = (status: string) => {
  switch (status) {
    case 'healthy': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'warning': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'critical': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  }
};

const handleRackClick = (rack: Rack) => {
  emit('rack-click', rack);
};

const handleViewAll = () => {
  emit('view-all');
};
</script>

<template>
  <div class="bg-[#111113] border border-white/5 rounded-2xl p-6">
    <div class="flex items-center justify-between mb-6">
      <h3 class="text-lg font-bold text-white">机架健康矩阵</h3>
      <button v-if="showViewAll" @click="handleViewAll" class="text-emerald-400 text-sm font-medium hover:underline">查看全部机架</button>
    </div>
    <div class="grid grid-cols-6 md:grid-cols-8 gap-3">
      <div 
        v-for="rack in racks.slice(0, maxDisplay)" 
        :key="rack.id"
        @click="handleRackClick(rack)"
        :class="[
          'aspect-square rounded-lg border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer hover:scale-105',
          statusColor(rack.status)
        ]"
      >
        <span class="text-[10px] font-bold opacity-60">{{ rack.id }}</span>
        <Server class="w-4 h-4" />
      </div>
    </div>
  </div>
</template>