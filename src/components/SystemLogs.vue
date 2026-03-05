<script setup lang="ts">
interface Log {
  id: number;
  time: string;
  type: 'info' | 'warning' | 'critical';
  msg: string;
}

interface Props {
  logs: Log[];
}

const props = defineProps<Props>();

const getTypeLabel = (type: string) => {
  switch (type) {
    case 'critical': return '严重';
    case 'warning': return '警告';
    default: return '信息';
  }
};

const getTypeClass = (type: string) => {
  switch (type) {
    case 'critical': return 'bg-rose-500/10 text-rose-400';
    case 'warning': return 'bg-amber-500/10 text-amber-400';
    default: return 'bg-emerald-500/10 text-emerald-400';
  }
};
</script>

<template>
  <div class="bg-[#111113] border border-white/5 rounded-2xl overflow-hidden">
    <div class="p-6 border-bottom border-white/5">
      <h3 class="text-lg font-bold text-white">系统事件日志</h3>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full text-left">
        <thead>
          <tr class="bg-white/2 text-slate-500 text-xs font-bold uppercase tracking-wider">
            <th class="px-6 py-4">时间戳</th>
            <th class="px-6 py-4">级别</th>
            <th class="px-6 py-4">事件描述</th>
            <th class="px-6 py-4">操作</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/5">
          <tr v-for="log in logs" :key="log.id" class="hover:bg-white/2 transition-colors">
            <td class="px-6 py-4 text-sm font-mono text-slate-400">{{ log.time }}</td>
            <td class="px-6 py-4">
              <span :class="[
                'text-[10px] font-bold px-2 py-0.5 rounded uppercase',
                getTypeClass(log.type)
              ]">
                {{ getTypeLabel(log.type) }}
              </span>
            </td>
            <td class="px-6 py-4 text-sm text-slate-300">{{ log.msg }}</td>
            <td class="px-6 py-4">
              <button class="text-xs font-bold text-slate-500 hover:text-white transition-colors">确认</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>