<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface RackSlot {
  u: number;
  occupied: boolean;
  type: string;
  status: string;
}

interface Props {
  slots?: RackSlot[];
  rackName?: string;
  rackId?: string;
}

const props = withDefaults(defineProps<Props>(), {
  slots: () => [],
  rackName: '机架',
  rackId: 'R-00'
});

const rotationY = ref(0);
const rotationX = ref(10);
const isAutoRotating = ref(true);
const zoom = ref(1);
let animationId: number;

// 自动旋转
const animate = () => {
  if (isAutoRotating.value) {
    rotationY.value += 0.3;
  }
  animationId = requestAnimationFrame(animate);
};

onMounted(() => {
  animate();
});

// 鼠标拖拽旋转
const isDragging = ref(false);
const lastX = ref(0);
const lastY = ref(0);

const onMouseDown = (e: MouseEvent) => {
  isDragging.value = true;
  lastX.value = e.clientX;
  lastY.value = e.clientY;
  isAutoRotating.value = false;
  
  // 阻止默认拖拽行为（防止出现图片提示）
  e.preventDefault();
  e.stopPropagation();
};

const onMouseMove = (e: MouseEvent) => {
  if (!isDragging.value) return;
  
  const deltaX = e.clientX - lastX.value;
  const deltaY = e.clientY - lastY.value;
  
  rotationY.value += deltaX * 0.5;
  rotationX.value = Math.max(-30, Math.min(30, rotationX.value - deltaY * 0.5));
  
  lastX.value = e.clientX;
  lastY.value = e.clientY;
  
  // 阻止默认行为
  e.preventDefault();
};

const onMouseUp = () => {
  isDragging.value = false;
};

const onMouseLeave = () => {
  isDragging.value = false;
};

// 缩放控制
const onWheel = (e: WheelEvent) => {
  zoom.value = Math.max(0.5, Math.min(2, zoom.value - e.deltaY * 0.001));
};

// 重置视角
const resetView = () => {
  rotationY.value = 0;
  rotationX.value = 10;
  zoom.value = 1;
  isAutoRotating.value = true;
};

// 插槽状态颜色
const getSlotColor = (status: string, occupied: boolean) => {
  if (!occupied) return 'bg-slate-800/50 border-slate-700/50';
  if (status === 'error') return 'bg-rose-500/80 border-rose-400 glow-effect';
  if (status === 'warning') return 'bg-amber-500/80 border-amber-400 glow-effect';
  return 'bg-emerald-500/80 border-emerald-400 glow-effect';
};

const getSlotLabel = (type: string, occupied: boolean) => {
  if (!occupied) return '';
  return type === 'Compute' ? 'CPU' : 'STO';
};
</script>

<template>
  <div class="relative w-full h-full bg-gradient-to-b from-[#0a0a0f] to-[#0f0f13] rounded-xl overflow-hidden">
    <!-- 控制面板 -->
    <div class="absolute top-4 left-4 z-20 flex flex-col gap-2">
      <div class="holo-card p-3 rounded-xl border border-emerald-500/30 backdrop-blur-sm">
        <div class="flex items-center gap-2 mb-2">
          <span class="text-[10px] font-bold text-slate-400 uppercase">视角控制</span>
        </div>
        <div class="space-y-2">
          <button 
            @click="resetView"
            class="cyber-button w-full py-2 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-[10px] font-bold text-emerald-400 transition-all"
          >
            重置视角
          </button>
          <button 
            @click="isAutoRotating = !isAutoRotating"
            class="cyber-button w-full py-2 px-3 border border-slate-500/30 rounded-lg text-[10px] font-bold transition-all"
            :class="isAutoRotating ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-slate-500/10 text-slate-400'"
          >
            {{ isAutoRotating ? '停止旋转' : '自动旋转' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- 状态显示 -->
    <div class="absolute top-4 right-4 z-20">
      <div class="holo-card p-3 rounded-xl border border-emerald-500/30 backdrop-blur-sm">
        <div class="space-y-2 text-[9px] font-mono">
          <div class="flex items-center gap-2">
            <span class="text-slate-500">旋转:</span>
            <span class="text-emerald-400 font-bold">{{ Math.round(rotationY % 360) }}°</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-slate-500">倾斜:</span>
            <span class="text-emerald-400 font-bold">{{ Math.round(rotationX) }}°</span>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-slate-500">缩放:</span>
            <span class="text-emerald-400 font-bold">{{ zoom.toFixed(2) }}x</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 3D 场景容器 -->
    <div 
      ref="sceneContainer"
      class="w-full h-full flex items-center justify-center perspective-1000 select-none"
      style="user-select: none; -webkit-user-select: none; -moz-user-select: none; -ms-user-select: none;"
    >
      <!-- 3D 机架 -->
      <div 
        class="relative transform-style-3d transition-transform duration-75"
        :style="{
          transform: `translateZ(${-150}px) rotateX(${rotationX}deg) rotateY(${rotationY}deg) scale(${zoom})`,
          width: '300px',
          height: '500px'
        }"
        @mousedown="onMouseDown"
        @mousemove="onMouseMove"
        @mouseup="onMouseUp"
        @mouseleave="onMouseLeave"
        @wheel="onWheel"
        draggable="false"
        style="-webkit-user-drag: none; user-select: none;"
      >
        <!-- 鼠标释放监听 -->
        <div 
          v-if="isDragging"
          class="fixed inset-0 z-50"
          @mouseup="onMouseUp"
          @mousemove="onMouseMove"
        ></div>
        
        <!-- 机架主体 - 前面 -->
        <div 
          class="absolute w-full h-full bg-gradient-to-b from-slate-800 to-slate-900 border-2 border-emerald-500/50 rounded-lg shadow-2xl shadow-emerald-500/20"
          style="transform: translateZ(60px)"
        >
          <!-- 机架顶部装饰 -->
          <div class="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-emerald-500/30 to-transparent border-b border-emerald-500/30 rounded-t-lg"></div>
          
          <!-- 机架名称 -->
          <div class="absolute top-2 left-0 right-0 text-center z-10">
            <span class="text-xs font-bold text-emerald-400 neon-text">{{ rackName }}</span>
            <span class="text-[8px] font-mono text-slate-500 block mt-0.5">{{ rackId }}</span>
          </div>

          <!-- U 位插槽 -->
          <div class="absolute top-10 left-2 right-2 bottom-2 grid grid-cols-1 gap-1 overflow-y-auto custom-scrollbar">
            <div 
              v-for="slot in slots.slice(0, 20)" 
              :key="slot.u"
              :class="[
                'h-7 rounded flex items-center justify-between px-2 transition-all duration-300 border',
                getSlotColor(slot.status, slot.occupied),
                slot.occupied ? 'hover:scale-105 cursor-pointer' : ''
              ]"
              :title="slot.occupied ? `${slot.type} - U${slot.u}` : `空位 U${slot.u}`"
            >
              <span class="text-[7px] font-mono text-slate-400">U{{ slot.u }}</span>
              <span class="text-[7px] font-bold text-white">{{ getSlotLabel(slot.type, slot.occupied) }}</span>
              <div 
                v-if="slot.occupied"
                :class="[
                  'w-2 h-2 rounded-full',
                  slot.status === 'error' ? 'bg-rose-300 animate-pulse' :
                  slot.status === 'warning' ? 'bg-amber-300 animate-pulse' :
                  'bg-emerald-300 animate-pulse'
                ]"
              ></div>
            </div>
          </div>
        </div>

        <!-- 机架后面 -->
        <div 
          class="absolute w-full h-full bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-slate-700/50 rounded-lg"
          style="transform: translateZ(-60px) rotateY(180deg)"
        >
          <!-- 线缆接口 -->
          <div class="absolute inset-4 grid grid-cols-6 gap-2">
            <div v-for="i in 24" :key="i" class="bg-slate-800 rounded border border-slate-600/50"></div>
          </div>
        </div>
        
        <!-- 左侧面 -->
        <div 
          class="absolute h-full bg-gradient-to-r from-slate-800 to-slate-900 border-2 border-slate-700/50 rounded-lg"
          style="width: 120px; transform: rotateY(-90deg) translateZ(-60px) translateX(-60px)"
        >
          <!-- 散热孔 -->
          <div class="absolute inset-4 grid grid-cols-3 gap-2">
            <div v-for="i in 12" :key="i" class="bg-slate-950/50 rounded-full border border-slate-600/30"></div>
          </div>
        </div>
        
        <!-- 右侧面 -->
        <div 
          class="absolute h-full bg-gradient-to-l from-slate-800 to-slate-900 border-2 border-slate-700/50 rounded-lg"
          style="width: 120px; transform: rotateY(90deg) translateZ(180px) translateX(-60px)"
        >
          <!-- 电源模块 -->
          <div class="absolute top-4 left-4 right-4 h-20 bg-slate-950 rounded border border-slate-600/50 p-2">
            <div class="text-[6px] text-slate-400 font-mono mb-1">PSU-1</div>
            <div class="flex items-center justify-between">
              <div class="w-6 h-3 bg-emerald-500/20 rounded border border-emerald-500/50"></div>
              <div class="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div class="absolute top-28 left-4 right-4 h-20 bg-slate-950 rounded border border-slate-600/50 p-2">
            <div class="text-[6px] text-slate-400 font-mono mb-1">PSU-2</div>
            <div class="flex items-center justify-between">
              <div class="w-6 h-3 bg-emerald-500/20 rounded border border-emerald-500/50"></div>
              <div class="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
        
        <!-- 顶部 -->
        <div 
          class="absolute w-full bg-gradient-to-b from-slate-700 to-slate-800 border-2 border-slate-600/50 rounded-lg"
          style="height: 120px; transform: rotateX(90deg) translateZ(60px) translateY(-60px)"
        >
          <!-- 散热风扇 -->
          <div class="absolute inset-4 grid grid-cols-4 gap-3">
            <div v-for="i in 4" :key="i" class="relative">
              <div class="absolute inset-0 bg-slate-900 rounded-full border-2 border-slate-600/50"></div>
              <div 
                class="absolute inset-2 bg-slate-800 rounded-full border border-slate-500/50"
                :style="{ animation: isAutoRotating ? 'spin 1s linear infinite' : '' }"
              >
                <div class="absolute inset-0 flex items-center justify-center">
                  <div class="w-6 h-0.5 bg-slate-600 rotate-45"></div>
                  <div class="w-6 h-0.5 bg-slate-600 -rotate-45"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 底部 -->
        <div 
          class="absolute w-full bg-gradient-to-b from-slate-900 to-slate-950 border-2 border-slate-800/50 rounded-lg"
          style="height: 120px; transform: rotateX(-90deg) translateZ(440px) translateY(-60px)"
        >
          <!-- 线缆出口 -->
          <div class="absolute inset-8 bg-slate-950 rounded border border-slate-700/50"></div>
        </div>
      </div>
    </div>
    
    <!-- 操作提示 -->
    <div class="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20">
      <div class="holo-card px-4 py-2 rounded-full border border-emerald-500/30 backdrop-blur-sm">
        <p class="text-[9px] text-slate-400 flex items-center gap-2">
          <span class="flex items-center gap-1">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
            拖拽旋转
          </span>
          <span class="text-slate-600">|</span>
          <span class="flex items-center gap-1">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
            </svg>
            滚轮缩放
          </span>
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.perspective-1000 {
  perspective: 1000px;
}

.transform-style-3d {
  transform-style: preserve-3d;
}

/* 防止拖拽时的图片提示 */
.select-none {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}

/* 防止图片拖拽 */
[draggable="false"] {
  -webkit-user-drag: none;
  -khtml-user-drag: none;
  -moz-user-drag: none;
  -o-user-drag: none;
  user-drag: none;
}

/* 优化鼠标交互 */
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 2px;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(0, 240, 255, 0.3);
  border-radius: 2px;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 240, 255, 0.5);
}
</style>
