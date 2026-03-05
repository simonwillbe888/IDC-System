<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const containerRef = ref<HTMLElement | null>(null);
const gridLines = ref<Array<{ id: number; type: 'horizontal' | 'vertical'; position: number; delay: number }>>([]);
const dataNodes = ref<Array<{ id: number; x: number; y: number; size: number; delay: number }>>([]);

onMounted(() => {
  // 生成网格线
  const horizontalLines = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    type: 'horizontal' as const,
    position: i * 5,
    delay: Math.random() * 5
  }));

  const verticalLines = Array.from({ length: 20 }, (_, i) => ({
    id: i + 20,
    type: 'vertical' as const,
    position: i * 5,
    delay: Math.random() * 5
  }));

  gridLines.value = [...horizontalLines, ...verticalLines];

  // 生成数据节点
  dataNodes.value = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 1 + Math.random() * 2,
    delay: Math.random() * 3
  }));
});
</script>

<template>
  <div ref="containerRef" class="animated-bg">
    <!-- 动态渐变背景 -->
    <div class="gradient-bg"></div>
    
    <!-- 动态网格 -->
    <div class="grid-layer">
      <div 
        v-for="line in gridLines" 
        :key="line.id"
        :class="[
          'grid-line',
          line.type === 'horizontal' ? 'grid-line-horizontal' : 'grid-line-vertical'
        ]"
        :style="{
          [line.type === 'horizontal' ? 'top' : 'left']: line.position + '%',
          animationDelay: line.delay + 's'
        }"
      ></div>
    </div>

    <!-- 数据节点 -->
    <div class="data-nodes-layer">
      <div 
        v-for="node in dataNodes" 
        :key="node.id"
        class="data-node"
        :style="{
          left: node.x + '%',
          top: node.y + '%',
          width: node.size + 'px',
          height: node.size + 'px',
          animationDelay: node.delay + 's'
        }"
      ></div>
    </div>

    <!-- 连接线路 -->
    <svg class="connections-layer" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style="stop-color:var(--neon-blue);stop-opacity:0" />
          <stop offset="50%" style="stop-color:var(--neon-blue);stop-opacity:0.5" />
          <stop offset="100%" style="stop-color:var(--neon-blue);stop-opacity:0" />
        </linearGradient>
      </defs>
      <line 
        v-for="i in 5" 
        :key="i"
        :x1="Math.random() * 100 + '%'"
        :y1="Math.random() * 100 + '%'"
        :x2="Math.random() * 100 + '%'"
        :y2="Math.random() * 100 + '%'"
        stroke="url(#lineGradient)"
        :stroke-width="0.5"
        class="connection-line"
        :style="{ animationDelay: Math.random() * 5 + 's' }"
      />
    </svg>

    <!-- 光晕效果 -->
    <div class="glow-orb glow-orb-1"></div>
    <div class="glow-orb glow-orb-2"></div>
    <div class="glow-orb glow-orb-3"></div>
    
    <!-- 扫描线效果 -->
    <div class="scanlines"></div>
  </div>
</template>

<style scoped>
.animated-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

/* 动态渐变背景 */
.gradient-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    135deg,
    #0a0e1a 0%,
    #0f1428 25%,
    #0a0f20 50%,
    #0f1428 75%,
    #0a0e1a 100%
  );
  animation: gradient-shift 20s ease infinite;
  background-size: 400% 400%;
}

@keyframes gradient-shift {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* 网格层 */
.grid-layer {
  position: absolute;
  inset: 0;
  opacity: 0.3;
}

.grid-line {
  position: absolute;
  background: linear-gradient(
    90deg,
    transparent,
    var(--neon-blue),
    transparent
  );
  animation: grid-pulse 4s ease-in-out infinite;
}

.grid-line-horizontal {
  left: 0;
  right: 0;
  height: 1px;
}

.grid-line-vertical {
  top: 0;
  bottom: 0;
  width: 1px;
  background: linear-gradient(
    180deg,
    transparent,
    var(--neon-blue),
    transparent
  );
}

@keyframes grid-pulse {
  0%, 100% {
    opacity: 0.2;
  }
  50% {
    opacity: 0.5;
  }
}

/* 数据节点层 */
.data-nodes-layer {
  position: absolute;
  inset: 0;
}

.data-node {
  position: absolute;
  background: var(--neon-blue);
  border-radius: 50%;
  box-shadow: 0 0 10px var(--neon-blue);
  animation: node-pulse 3s ease-in-out infinite;
}

@keyframes node-pulse {
  0%, 100% {
    opacity: 0.3;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.5);
  }
}

/* 连接层 */
.connections-layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.connection-line {
  animation: line-flow 5s linear infinite;
}

@keyframes line-flow {
  0% {
    opacity: 0;
    stroke-dashoffset: 100;
  }
  50% {
    opacity: 0.5;
  }
  100% {
    opacity: 0;
    stroke-dashoffset: -100;
  }
}

/* 光晕球体 */
.glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.3;
  animation: orb-float 20s ease-in-out infinite;
}

.glow-orb-1 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, var(--neon-blue) 0%, transparent 70%);
  top: -200px;
  right: -200px;
  animation-delay: 0s;
}

.glow-orb-2 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, var(--neon-purple) 0%, transparent 70%);
  bottom: -150px;
  left: -150px;
  animation-delay: -7s;
}

.glow-orb-3 {
  width: 350px;
  height: 350px;
  background: radial-gradient(circle, var(--neon-green) 0%, transparent 70%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation-delay: -14s;
}

@keyframes orb-float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  25% {
    transform: translate(50px, -50px) scale(1.1);
  }
  50% {
    transform: translate(-50px, 50px) scale(0.9);
  }
  75% {
    transform: translate(50px, 50px) scale(1.05);
  }
}

/* 扫描线效果 */
.scanlines {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent,
    transparent 2px,
    rgba(0, 240, 255, 0.03) 2px,
    rgba(0, 240, 255, 0.03) 4px
  );
  animation: scanline-move 10s linear infinite;
  pointer-events: none;
  z-index: 10;
}

@keyframes scanline-move {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(10px);
  }
}
</style>
