<script setup lang="ts">
import { computed } from 'vue';
import { Zap, Thermometer, Activity } from 'lucide-vue-next';

interface Metric {
  label: string;
  value: string | number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  color: string;
}

interface Props {
  metrics: Metric[];
}

const props = defineProps<Props>();

const getIcon = (label: string) => {
  if (label.includes('功耗')) return Zap;
  if (label.includes('温度')) return Thermometer;
  return Activity;
};
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
    <div 
      v-for="metric in metrics" 
      :key="metric.label"
      class="holo-card p-6 rounded-2xl glow-effect group relative overflow-hidden rack-3d"
    >
      <!-- 数据流动效果 -->
      <div class="data-stream" :style="{ left: (Math.random() * 80 + 10) + '%' }"></div>
      <div class="data-stream" :style="{ left: (Math.random() * 80 + 10) + '%', animationDelay: Math.random() * 2 + 's' }"></div>
      
      <div class="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl group-hover:bg-emerald-500/10 transition-colors"></div>
      <div class="flex items-center justify-between mb-4 relative z-10">
        <span class="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">{{ metric.label }}</span>
        <div :class="['p-2 rounded-xl bg-opacity-10 text-emerald-400 border border-emerald-500/20 glow-effect', 'bg-' + metric.color + '-500']">
          <component :is="getIcon(metric.label)" class="w-4 h-4" />
        </div>
      </div>
      <div class="flex items-baseline gap-2 relative z-10">
        <span class="text-4xl font-black text-white tracking-tighter tabular-nums number-roll neon-text">{{ metric.value }}</span>
        <span class="text-slate-500 font-bold text-sm">{{ metric.unit }}</span>
      </div>
      <div class="mt-6 flex items-center justify-between relative z-10">
        <div class="flex items-center gap-2">
          <span :class="['text-[10px] font-black px-2 py-1 rounded-lg holo-card', metric.trend === 'up' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30']">
            {{ metric.trend === 'up' ? '↑ 2.4%' : '↓ 1.1%' }}
          </span>
          <span class="text-[10px] font-bold text-slate-600 uppercase tracking-widest">较上小时</span>
        </div>
        <div class="flex gap-0.5">
          <div v-for="i in 5" :key="i" :class="['w-1 h-3 rounded-full transition-all duration-500', i < 4 ? 'bg-gradient-to-t from-emerald-500 to-emerald-400 glow-effect' : 'bg-white/5']"></div>
        </div>
      </div>
    </div>
  </div>
</template>