<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';

const containerRef = ref<HTMLElement | null>(null);
const particles = ref<Array<{ id: number; left: number; delay: number; duration: number; size: number }>>([]);

onMounted(() => {
  // 生成随机粒子
  const particleArray = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 5,
    duration: 10 + Math.random() * 10,
    size: 1 + Math.random() * 3
  }));
  particles.value = particleArray;
});
</script>

<template>
  <div ref="containerRef" class="particle-bg">
    <div 
      v-for="particle in particles" 
      :key="particle.id"
      class="particle"
      :style="{
        left: particle.left + '%',
        animationDelay: particle.delay + 's',
        animationDuration: particle.duration + 's',
        width: particle.size + 'px',
        height: particle.size + 'px'
      }"
    ></div>
  </div>
</template>

<style scoped>
.particle {
  position: absolute;
  background: var(--neon-blue);
  border-radius: 50%;
  opacity: 0;
  animation: float 15s infinite;
  box-shadow: 0 0 10px var(--neon-blue);
}

@keyframes float {
  0%, 100% {
    transform: translateY(100vh) translateX(0) scale(0);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 1;
  }
  100% {
    transform: translateY(-100vh) translateX(100px) scale(1);
    opacity: 0;
  }
}
</style>
