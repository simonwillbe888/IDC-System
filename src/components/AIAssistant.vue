<script setup lang="ts">
import { ref, defineProps, defineEmits } from 'vue';
import { MessageSquare, Activity, ChevronRight } from 'lucide-vue-next';
import { aiService } from '../utils/aiService';

interface Props {
  systemStatus: {
    powerConsumption: string;
    averageTemperature: string;
    networkTraffic: string;
    criticalAlerts: string;
  };
}

const props = defineProps<Props>();
const emit = defineEmits<{
  (e: 'response', content: string): void;
}>();

const aiQuery = ref('');
const aiResponse = ref('');
const isLoading = ref(false);

const askKimi = async () => {
  if (!aiQuery.value.trim()) return;
  
  isLoading.value = true;
  aiResponse.value = '';
  
  try {
    const messages = [
      {
        role: 'system' as const,
        content: aiService.getSystemPrompt()
      },
      {
        role: 'user' as const,
        content: aiService.buildUserMessage(aiQuery.value, props.systemStatus)
      }
    ];
    
    const response = await aiService.chat(messages);
    aiResponse.value = response;
    emit('response', response);
  } catch (error) {
    aiResponse.value = '连接 AIOps 服务时出错。请检查 API 配置。';
    console.error(error);
  } finally {
    isLoading.value = false;
  }
};
</script>

<template>
  <div class="bg-[#111113] border border-white/5 rounded-2xl p-6 flex flex-col">
    <div class="flex items-center gap-3 mb-6">
      <div class="p-2 bg-indigo-500/10 rounded-lg">
        <MessageSquare class="text-indigo-400 w-5 h-5" />
      </div>
      <h3 class="text-lg font-bold text-white">AIOps 智能助手</h3>
    </div>
    
    <div class="flex-1 overflow-y-auto space-y-4 mb-4 min-h-[200px] max-h-[300px] pr-2 custom-scrollbar">
      <div v-if="!aiResponse && !isLoading" class="text-slate-500 text-sm italic">
        您可以询问系统健康状况、异常分析或优化建议。
      </div>
      <div v-if="isLoading" class="flex items-center gap-2 text-indigo-400 text-sm animate-pulse">
        <Activity class="w-4 h-4" />
        <span>正在分析遥测数据...</span>
      </div>
      <div v-if="aiResponse" class="bg-indigo-500/5 border border-indigo-500/20 rounded-xl p-4 text-sm leading-relaxed text-slate-300">
        {{ aiResponse }}
      </div>
    </div>

    <div class="relative">
      <input 
        v-model="aiQuery"
        @keyup.enter="askKimi"
        type="text" 
        placeholder="咨询 Kimi..." 
        class="w-full bg-[#0A0A0B] border border-white/5 rounded-xl pl-4 pr-12 py-3 text-sm focus:outline-none focus:border-indigo-500/50"
      />
      <button 
        @click="askKimi"
        class="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
      >
        <ChevronRight class="w-4 h-4" />
      </button>
    </div>
  </div>
</template>