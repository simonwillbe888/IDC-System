<script setup lang="ts">
import { ref, onMounted, computed, watch, onUnmounted } from 'vue';
import * as d3 from 'd3';
import { 
  LayoutDashboard, 
  Server, 
  Activity, 
  AlertTriangle, 
  Cpu, 
  Zap, 
  Thermometer, 
  MessageSquare,
  Search,
  Settings,
  Bell,
  ChevronRight,
  Database
} from 'lucide-vue-next';

// 导入组件
import AIAssistant from './components/AIAssistant.vue';
import DashboardStats from './components/DashboardStats.vue';
import RackMap from './components/RackMap.vue';
import SystemLogs from './components/SystemLogs.vue';
import ParticleBackground from './components/ParticleBackground.vue';
import RackDetail3D from './components/RackDetail3D.vue';
import AnimatedBackground from './components/AnimatedBackground.vue';
 
// --- Types ---
interface Metric {
  label: string;
  value: string | number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  color: string;
}

interface Rack {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  load: number;
  temp: number;
}

// --- State ---
const activeTab = ref('dashboard');
const isSidebarOpen = ref(true);
const searchQuery = ref('');

const selectedRack = ref<Rack | null>(null);
const isDetailOpen = ref(false);

// 系统状态数据，用于AI助手
const systemStatus = computed(() => ({
  powerConsumption: `${metrics.value[0].value}${metrics.value[0].unit}`,
  averageTemperature: `${metrics.value[1].value}${metrics.value[1].unit}`,
  networkTraffic: `总计 ${(parseInt(metrics.value[2].value as string) + parseInt(metrics.value[3].value as string))}Gbps`,
  criticalAlerts: '12号机架高温, 核心交换机 B 电源故障'
}));

// 历史分析报告数据
const historyReports = ref([
  { id: 'REP-2024-02', date: '2024-02-28', title: '2月能源效率与能耗分析报告', author: 'Kimi AI', score: 94, tags: ['PUE', '能耗优化'] },
  { id: 'REP-2024-01', date: '2024-01-31', title: '1月硬件可靠性与故障回溯报告', author: 'Kimi AI', score: 88, tags: ['硬件', '可靠性'] },
  { id: 'REP-2023-Q4', date: '2023-12-31', title: '2023年第四季度整体运行评估', author: '系统自动生成', score: 91, tags: ['季度总结', '全量数据'] },
]);

const historyStats = ref([
  { label: '平均 PUE', value: '1.21', trend: 'down', target: '1.25' },
  { label: '系统可用性', value: '99.99%', trend: 'stable', target: '99.90' },
  { label: '平均修复时间 (MTTR)', value: '14min', trend: 'down', target: '20min' },
]);

const openRackDetail = (rack: Rack) => {
  selectedRack.value = rack;
  isDetailOpen.value = true;
};

// 警报数据
const alerts = ref([
  { id: 'AL-001', time: '10:45:22', severity: 'critical', source: '机架 R-12', msg: '温度传感器读数异常 (28.5°C)', status: 'unresolved' },
  { id: 'AL-002', time: '10:42:10', severity: 'warning', source: 'PDU-04', msg: '输入电压波动超出安全范围', status: 'unresolved' },
  { id: 'AL-003', time: '10:38:05', severity: 'critical', source: '核心交换机 B', msg: '冗余电源模块 A 离线', status: 'unresolved' },
  { id: 'AL-004', time: '10:30:00', severity: 'info', source: '系统', msg: '例行安全审计日志已生成', status: 'resolved' },
  { id: 'AL-005', time: '10:15:44', severity: 'warning', source: '机架 R-08', msg: '网络带宽利用率超过 85%', status: 'unresolved' },
]);

const alertStats = computed(() => ({
  critical: alerts.value.filter(a => a.severity === 'critical' && a.status === 'unresolved').length,
  warning: alerts.value.filter(a => a.severity === 'warning' && a.status === 'unresolved').length,
  total: alerts.value.length
}));

const metrics = ref<Metric[]>([
  { label: '总功耗', value: '1.24', unit: 'MW', trend: 'up', color: 'emerald' },
  { label: '平均温度', value: '22.4', unit: '°C', trend: 'stable', color: 'blue' },
  { label: '网络流入', value: '450', unit: 'Gbps', trend: 'up', color: 'indigo' },
  { label: '网络流出', value: '380', unit: 'Gbps', trend: 'down', color: 'violet' },
]);

const racks = ref<Rack[]>(
  Array.from({ length: 48 }, (_, i) => ({
    id: `R-${String(i + 1).padStart(2, '0')}`,
    name: `机架 ${i + 1}`,
    status: Math.random() > 0.95 ? 'critical' : Math.random() > 0.85 ? 'warning' : 'healthy',
    load: Math.floor(Math.random() * 60) + 20,
    temp: Math.floor(Math.random() * 10) + 18,
  }))
);

// 模拟机架内的 U 位数据
const rackSlots = computed(() => {
  if (!selectedRack.value) return [];
  return Array.from({ length: 42 }, (_, i) => ({
    u: 42 - i,
    occupied: Math.random() > 0.3,
    type: Math.random() > 0.8 ? 'Storage' : 'Compute',
    status: Math.random() > 0.9 ? 'error' : 'online'
  }));
});

const logs = ref([
  { id: 1, time: '10:45:22', type: 'info', msg: '备用发电机测试成功完成。' },
  { id: 2, time: '10:42:10', type: 'warning', msg: '12号机架温度超过阈值 (26°C)。' },
  { id: 3, time: '10:38:05', type: 'critical', msg: '核心交换机 B 冗余电源故障。' },
  { id: 4, time: '10:30:00', type: 'info', msg: '例行安全审计已启动。' },
]);

// --- D3 Telemetry Chart ---
const chartContainer = ref<HTMLElement | null>(null);
let chartData: { time: Date, value: number }[] = [];

const initChart = () => {
  if (!chartContainer.value) return;
  
  const width = chartContainer.value.clientWidth;
  const height = 300;
  const margin = { top: 20, right: 30, bottom: 30, left: 40 };

  const svg = d3.select(chartContainer.value)
    .append('svg')
    .attr('width', '100%')
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`);

  const x = d3.scaleTime().range([0, width - margin.left - margin.right]);
  const y = d3.scaleLinear().range([height - margin.top - margin.bottom, 0]);

  const line = d3.line<{ time: Date, value: number }>()
    .x(d => x(d.time))
    .y(d => y(d.value))
    .curve(d3.curveMonotoneX);

  const xAxis = svg.append('g')
    .attr('transform', `translate(0,${height - margin.top - margin.bottom})`)
    .attr('class', 'text-slate-600');

  const yAxis = svg.append('g')
    .attr('class', 'text-slate-600');

  const path = svg.append('path')
    .attr('fill', 'none')
    .attr('stroke', '#10b981')
    .attr('stroke-width', 2);

  const update = () => {
    const now = new Date();
    chartData.push({ time: now, value: 40 + Math.random() * 20 });
    if (chartData.length > 50) chartData.shift();

    x.domain(d3.extent(chartData, d => d.time) as [Date, Date]);
    y.domain([0, 100]);

    xAxis.call(d3.axisBottom(x).ticks(5).tickFormat(d3.timeFormat('%H:%M:%S') as any));
    yAxis.call(d3.axisLeft(y).ticks(5));

    path.datum(chartData).attr('d', line);
  };

  const interval = setInterval(update, 1000);
  return () => clearInterval(interval);
};

let cleanupChart: (() => void) | undefined;

watch(activeTab, (newTab) => {
  if (newTab === 'telemetry') {
    setTimeout(() => {
      cleanupChart = initChart();
    }, 100);
  } else if (cleanupChart) {
    cleanupChart();
    cleanupChart = undefined;
    if (chartContainer.value) chartContainer.value.innerHTML = '';
  }
});

onUnmounted(() => {
  if (cleanupChart) cleanupChart();
});

// 处理AI助手响应
const handleAIResponse = (content: string) => {
  console.log('AI Response:', content);
};

// 切换到机架视图
const handleViewAllRacks = () => {
  activeTab.value = 'racks';
};

// --- Lifecycle ---
onMounted(() => {
  // Simulate real-time data updates
  setInterval(() => {
    metrics.value[0].value = (parseFloat(metrics.value[0].value as string) + (Math.random() - 0.5) * 0.05).toFixed(2);
    metrics.value[1].value = (parseFloat(metrics.value[1].value as string) + (Math.random() - 0.5) * 0.2).toFixed(1);
  }, 3000);
});

const statusColor = (status: string) => {
  switch (status) {
    case 'healthy': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'warning': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'critical': return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  }
};
</script>

<template>
  <div class="min-h-screen text-slate-200 font-sans selection:bg-emerald-500/30 relative overflow-hidden">
    <!-- 全局背景动画 -->
    <AnimatedBackground />
    
    <!-- 扫描线效果 -->
    <div class="scanlines"></div>
    
    <!-- 侧边栏 -->
    <aside 
      :class="[
        'sidebar-glass fixed left-0 top-0 h-full transition-all duration-500 z-50',
        isSidebarOpen ? 'w-64' : 'w-20'
      ]"
    >
      <!-- 侧边栏背景光晕 -->
      <div class="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-emerald-500/5"></div>
      <div class="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500/50 via-cyan-500/50 to-emerald-500/50"></div>
      <div class="p-6 flex items-center gap-3">
        <div class="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-xl flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/30 glow-effect">
          <Database class="text-black w-6 h-6" />
        </div>
        <div v-if="isSidebarOpen" class="overflow-hidden whitespace-nowrap">
          <span class="font-black text-xl tracking-tighter text-white block neon-text">IDC 运营指挥平台</span>
          <span class="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">IDC OS v1.0</span>
        </div>
      </div>

      <nav class="mt-8 px-3 space-y-2">
        <button 
          v-for="item in [
            { id: 'dashboard', icon: LayoutDashboard, label: '控制面板' },
            { id: 'racks', icon: Server, label: '机架视图' },
            { id: 'telemetry', icon: Activity, label: '实时遥测' },
            { id: 'alerts', icon: AlertTriangle, label: '警报中心' },
            { id: 'history', icon: Database, label: '历史分析' },
          ]"
          :key="item.id"
          @click="activeTab = item.id"
          :class="[
            'cyber-button w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden holo-card',
            activeTab === item.id ? 'bg-emerald-500/10 text-emerald-400 shadow-inner shadow-emerald-500/5 border-emerald-500/30' : 'text-slate-400 hover:bg-white/5 hover:text-white'
          ]"
        >
          <div v-if="activeTab === item.id" class="absolute left-0 top-0 w-1 h-full bg-gradient-to-b from-emerald-400 to-emerald-600 glow-effect"></div>
          <component :is="item.icon" :class="['w-5 h-5 transition-transform duration-300 group-hover:scale-125 group-hover:rotate-12', activeTab === item.id ? 'text-emerald-400' : '']" />
          <span v-if="isSidebarOpen" class="font-bold text-sm tracking-wide">{{ item.label }}</span>
          <div v-if="item.id === 'alerts' && alertStats.critical > 0" class="ml-auto w-2 h-2 bg-rose-500 rounded-full animate-pulse alert-pulse"></div>
        </button>
      </nav>

      <div class="absolute bottom-8 left-0 w-full px-3">
        <div v-if="isSidebarOpen" class="mb-6 p-4 holo-card rounded-2xl glow-effect">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[10px] font-bold text-slate-500 uppercase">系统健康度</span>
            <span class="text-[10px] font-bold text-emerald-400 neon-text">98%</span>
          </div>
          <div class="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
            <div class="w-[98%] h-full bg-gradient-to-r from-emerald-500 to-emerald-400 glow-effect"></div>
          </div>
        </div>
        <button 
          @click="isSidebarOpen = !isSidebarOpen"
          class="cyber-button w-full flex items-center gap-3 px-3 py-3 text-slate-400 hover:text-white transition-all duration-300 hover:bg-white/5 rounded-xl holo-card"
        >
          <ChevronRight :class="['w-5 h-5 transition-transform duration-500', isSidebarOpen ? 'rotate-180' : '']" />
          <span v-if="isSidebarOpen" class="font-bold text-sm">收起菜单</span>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main :class="['transition-all duration-300 pt-6 px-8 pb-12 relative z-10', isSidebarOpen ? 'ml-64' : 'ml-20']">
      <!-- 主内容区域背景光晕 -->
        <div class="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
        <div class="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent"></div>
        
        <!-- 四角装饰 -->
        <div class="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-emerald-500/30 rounded-tl-xl"></div>
        <div class="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-emerald-500/30 rounded-tr-xl"></div>
        <div class="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-emerald-500/30 rounded-bl-xl"></div>
        <div class="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-emerald-500/30 rounded-br-xl"></div>
      <!-- Header -->
      <header class="flex items-center justify-between mb-8 holo-card p-6 rounded-2xl">
        <div>
          <h1 class="text-2xl font-bold text-white tracking-tight neon-text">IDC 运营指挥中心</h1>
          <p class="text-slate-400 text-sm mt-1 flex items-center gap-2">
            <span class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            实时监控区域：华东 - 上海 -1
          </p>
        </div>

        <div class="flex items-center gap-4">
          <div class="relative group cyber-tooltip" data-tooltip="搜索设备、机架或警报">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-emerald-400 transition-colors" />
            <input 
              v-model="searchQuery"
              type="text" 
              placeholder="搜索设备..." 
              class="holo-card border border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-emerald-500/50 w-64 transition-all bg-transparent"
            />
          </div>
          <button class="cyber-button p-2.5 holo-card border border-white/5 rounded-xl text-slate-400 hover:text-white transition-colors relative glow-effect">
            <Bell class="w-5 h-5" />
            <span class="absolute top-2 right-2 w-2 h-2 bg-emerald-500 rounded-full border-2 border-[#111113] animate-pulse"></span>
          </button>
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-black font-bold glow-effect cursor-pointer hover:scale-110 transition-transform">
            管理员
          </div>
        </div>
      </header>

      <!-- Dashboard View -->
      <div v-if="activeTab === 'dashboard'" class="space-y-8">
        <!-- Stats Grid -->
        <DashboardStats :metrics="metrics" />

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Rack Map (Mini) -->
          <div class="lg:col-span-2">
            <RackMap 
              :racks="racks" 
              @view-all="handleViewAllRacks"
              @rack-click="openRackDetail"
            />
          </div>

          <!-- AIOps Assistant -->
          <AIAssistant 
            :system-status="systemStatus" 
            @response="handleAIResponse"
          />
        </div>

        <!-- Recent Logs -->
        <SystemLogs :logs="logs" />
      </div>

      <!-- Rack View Tab -->
      <div v-else-if="activeTab === 'racks'" class="space-y-6">
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-bold text-white">全量机架视图</h2>
          <div class="flex gap-2">
            <div v-for="s in ['healthy', 'warning', 'critical']" :key="s" class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111113] border border-white/5 text-xs">
              <span :class="['w-2 h-2 rounded-full', s === 'healthy' ? 'bg-emerald-500' : s === 'warning' ? 'bg-amber-500' : 'bg-rose-500']"></span>
              <span class="text-slate-400 capitalize">{{ s === 'healthy' ? '正常' : s === 'warning' ? '警告' : '严重' }}</span>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          <div 
            v-for="rack in racks" 
            :key="rack.id"
            @click="openRackDetail(rack)"
            class="holo-card border border-white/5 rounded-xl p-4 hover:border-emerald-500/50 transition-all cursor-pointer group rack-3d"
          >
            <div class="flex items-center justify-between mb-3">
              <span class="text-xs font-mono text-slate-500">{{ rack.id }}</span>
              <span :class="['w-2 h-2 rounded-full animate-pulse', rack.status === 'healthy' ? 'bg-emerald-500' : rack.status === 'warning' ? 'bg-amber-500' : 'bg-rose-500']"></span>
            </div>
            <div class="flex flex-col items-center py-2">
              <Server :class="['w-10 h-10 mb-2 transition-all duration-500 group-hover:scale-110 group-hover:text-emerald-400', rack.status === 'healthy' ? 'text-slate-700' : rack.status === 'warning' ? 'text-amber-500/50' : 'text-rose-500/50']" />
              <span class="text-sm font-bold text-white group-hover:neon-text">{{ rack.name }}</span>
            </div>
            <div class="mt-4 space-y-2">
              <div class="flex justify-between text-[10px] text-slate-500">
                <span>负载</span>
                <span>{{ rack.load }}%</span>
              </div>
              <div class="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div 
                  :class="['h-full transition-all duration-500 glow-effect', rack.load > 80 ? 'bg-gradient-to-r from-rose-500 to-rose-400' : rack.load > 60 ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 'bg-gradient-to-r from-emerald-500 to-emerald-400']"
                  :style="{ width: rack.load + '%' }"
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Alert Center Tab -->
      <div v-else-if="activeTab === 'alerts'" class="space-y-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-rose-500/10 border border-rose-500/20 p-6 rounded-2xl">
            <div class="flex items-center gap-3 mb-2">
              <AlertTriangle class="text-rose-500 w-5 h-5" />
              <span class="text-sm font-bold text-rose-400 uppercase">严重警报</span>
            </div>
            <p class="text-3xl font-bold text-white">{{ alertStats.critical }}</p>
            <p class="text-xs text-rose-500/60 mt-1">需要立即处理的故障</p>
          </div>
          <div class="bg-amber-500/10 border border-amber-500/20 p-6 rounded-2xl">
            <div class="flex items-center gap-3 mb-2">
              <AlertTriangle class="text-amber-500 w-5 h-5" />
              <span class="text-sm font-bold text-amber-400 uppercase">警告提示</span>
            </div>
            <p class="text-3xl font-bold text-white">{{ alertStats.warning }}</p>
            <p class="text-xs text-amber-500/60 mt-1">潜在风险或性能波动</p>
          </div>
          <div class="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl">
            <div class="flex items-center gap-3 mb-2">
              <Bell class="text-emerald-500 w-5 h-5" />
              <span class="text-sm font-bold text-emerald-400 uppercase">总事件数</span>
            </div>
            <p class="text-3xl font-bold text-white">{{ alertStats.total }}</p>
            <p class="text-xs text-emerald-500/60 mt-1">过去 24 小时内记录</p>
          </div>
        </div>

        <div class="bg-[#111113] border border-white/5 rounded-2xl overflow-hidden">
          <div class="p-6 border-b border-white/5 flex items-center justify-between">
            <h3 class="text-lg font-bold text-white">实时警报流</h3>
            <div class="flex gap-2">
              <button class="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold transition-colors">全部标记为已读</button>
              <button class="px-4 py-2 bg-emerald-500 text-black rounded-lg text-xs font-bold hover:bg-emerald-600 transition-colors">导出警报日志</button>
            </div>
          </div>
          <div class="divide-y divide-white/5">
            <div v-for="alert in alerts" :key="alert.id" class="p-6 hover:bg-white/2 transition-colors group">
              <div class="flex items-start justify-between">
                <div class="flex gap-4">
                  <div :class="[
                    'p-3 rounded-xl shrink-0',
                    alert.severity === 'critical' ? 'bg-rose-500/10 text-rose-500' : 
                    alert.severity === 'warning' ? 'bg-amber-500/10 text-amber-500' : 'bg-blue-500/10 text-blue-500'
                  ]">
                    <AlertTriangle v-if="alert.severity !== 'info'" class="w-6 h-6" />
                    <Bell v-else class="w-6 h-6" />
                  </div>
                  <div>
                    <div class="flex items-center gap-3 mb-1">
                      <span class="text-sm font-bold text-white">{{ alert.msg }}</span>
                      <span :class="[
                        'text-[10px] font-bold px-2 py-0.5 rounded uppercase',
                        alert.severity === 'critical' ? 'bg-rose-500/20 text-rose-400' : 
                        alert.severity === 'warning' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                      ]">
                        {{ alert.severity === 'critical' ? '严重' : alert.severity === 'warning' ? '警告' : '信息' }}
                      </span>
                    </div>
                    <div class="flex items-center gap-4 text-xs text-slate-500">
                      <span class="flex items-center gap-1"><Server class="w-3 h-3" /> {{ alert.source }}</span>
                      <span class="flex items-center gap-1 font-mono"><Activity class="w-3 h-3" /> {{ alert.time }}</span>
                      <span class="font-mono">ID: {{ alert.id }}</span>
                    </div>
                  </div>
                </div>
                <div class="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button class="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold">查看详情</button>
                  <button v-if="alert.status === 'unresolved'" class="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg text-xs font-bold">确认警报</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- History Analysis Tab -->
      <div v-else-if="activeTab === 'history'" class="space-y-8">
        <!-- History Stats -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div v-for="stat in historyStats" :key="stat.label" class="bg-[#111113] border border-white/5 p-6 rounded-2xl relative overflow-hidden group">
            <div class="absolute -right-4 -bottom-4 w-20 h-20 bg-white/2 rounded-full blur-xl group-hover:bg-emerald-500/5 transition-colors"></div>
            <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{{ stat.label }}</p>
            <div class="flex items-baseline gap-2">
              <span class="text-3xl font-black text-white tracking-tighter">{{ stat.value }}</span>
              <span :class="['text-[10px] font-bold px-1.5 py-0.5 rounded', stat.trend === 'down' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400']">
                {{ stat.trend === 'down' ? '↓ 优于目标' : '→ 稳定' }}
              </span>
            </div>
            <p class="text-[10px] text-slate-600 mt-4 font-bold">行业基准目标: {{ stat.target }}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- AI Reports List -->
          <div class="lg:col-span-2 space-y-4">
            <div class="flex items-center justify-between mb-2">
              <h3 class="text-lg font-bold text-white">AI 智能分析报告</h3>
              <button class="text-xs font-bold text-emerald-400 hover:underline">生成新报告</button>
            </div>
            <div 
              v-for="report in historyReports" 
              :key="report.id"
              class="bg-[#111113] border border-white/5 p-5 rounded-2xl hover:border-white/10 transition-all group cursor-pointer"
            >
              <div class="flex items-start justify-between">
                <div class="flex gap-4">
                  <div class="w-12 h-12 bg-white/2 rounded-xl flex items-center justify-center border border-white/5 group-hover:border-emerald-500/30 transition-colors">
                    <Database class="w-6 h-6 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                  </div>
                  <div>
                    <h4 class="font-bold text-white group-hover:text-emerald-400 transition-colors">{{ report.title }}</h4>
                    <div class="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span>{{ report.date }}</span>
                      <span>•</span>
                      <span>生成者: {{ report.author }}</span>
                    </div>
                    <div class="flex gap-2 mt-3">
                      <span v-for="tag in report.tags" :key="tag" class="px-2 py-0.5 bg-white/5 rounded text-[10px] font-bold text-slate-400">{{ tag }}</span>
                    </div>
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-2xl font-black text-emerald-400 tracking-tighter">{{ report.score }}</div>
                  <div class="text-[10px] font-bold text-slate-600 uppercase">健康评分</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Trend Summary -->
          <div class="bg-[#111113] border border-white/5 rounded-2xl p-6">
            <h3 class="text-sm font-bold text-white mb-6">PUE 历史趋势 (6个月)</h3>
            <div class="space-y-6">
              <div v-for="(val, month) in { '9月': 1.28, '10月': 1.26, '11月': 1.24, '12月': 1.22, '1月': 1.21, '2月': 1.21 }" :key="month" class="space-y-2">
                <div class="flex justify-between text-[10px] font-bold">
                  <span class="text-slate-500">{{ month }}</span>
                  <span class="text-white">{{ val }}</span>
                </div>
                <div class="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    class="h-full bg-emerald-500 transition-all duration-1000"
                    :style="{ width: ((1.4 - val) / 0.4 * 100) + '%' }"
                  ></div>
                </div>
              </div>
            </div>
            <div class="mt-8 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl">
              <p class="text-xs text-emerald-400 leading-relaxed font-medium">
                <span class="font-bold">AI 洞察:</span> 过去半年 PUE 持续下降，主要得益于 11 月份上线的 AI 冷却优化算法。建议继续维持当前策略。
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Telemetry View -->
      <div v-else-if="activeTab === 'telemetry'" class="space-y-8">
        <div class="bg-[#111113] border border-white/5 rounded-2xl p-8">
          <div class="flex items-center justify-between mb-8">
            <div>
              <h3 class="text-xl font-bold text-white">实时电力遥测</h3>
              <p class="text-slate-500 text-sm">来自 PDU-01-A 的实时数据流</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span class="text-xs font-bold text-emerald-400 uppercase tracking-widest">实时数据流</span>
            </div>
          </div>
          
          <div ref="chartContainer" class="w-full min-h-[300px] bg-[#0A0A0B]/50 rounded-xl border border-white/5 overflow-hidden">
            <!-- D3 Chart will be injected here -->
          </div>

          <div class="grid grid-cols-3 gap-6 mt-8">
            <div v-for="stat in [
              { label: '当前负载', value: '84.2%', color: 'emerald' },
              { label: '峰值负载', value: '92.1%', color: 'amber' },
              { label: '运行效率', value: '98.4%', color: 'indigo' }
            ]" :key="stat.label" class="p-4 bg-white/2 rounded-xl border border-white/5">
              <p class="text-xs text-slate-500 uppercase font-bold mb-1">{{ stat.label }}</p>
              <p class="text-2xl font-bold text-white">{{ stat.value }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Placeholder for other tabs -->
      <div v-else class="flex flex-col items-center justify-center py-24 text-slate-500">
        <Activity class="w-12 h-12 mb-4 opacity-20" />
        <p class="text-lg font-medium">模块建设中</p>
        <p class="text-sm">{{ activeTab }} 模块正在部署到边缘节点。</p>
      </div>
    </main>

    <!-- 机架详情弹窗 (3D 模型) -->
      <div 
        v-if="isDetailOpen && selectedRack"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8"
      >
        <!-- 背景遮罩 -->
        <div 
          class="absolute inset-0 bg-black/90 backdrop-blur-md"
          @click="isDetailOpen = false"
        ></div>
        
        <!-- 弹窗内容 -->
        <div class="relative z-10 w-full max-w-6xl h-[85vh] bg-[#0f0f11]/95 backdrop-blur-xl rounded-2xl overflow-hidden flex flex-col border border-emerald-500/30 shadow-2xl shadow-emerald-500/20">
          <!-- 弹窗头部 -->
          <div class="flex items-center justify-between p-6 border-b border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 to-transparent">
            <div class="flex items-center gap-4">
              <div class="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 glow-effect">
                <Server class="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h2 class="text-2xl font-bold text-white neon-text flex items-center gap-2">
                  {{ selectedRack.name }}
                  <span :class="[
                    'px-2 py-1 rounded text-[10px] font-bold uppercase',
                    selectedRack.status === 'healthy' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                    selectedRack.status === 'warning' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  ]">
                    {{ selectedRack.status === 'healthy' ? '正常' : selectedRack.status === 'warning' ? '警告' : '严重' }}
                  </span>
                </h2>
                <p class="text-sm text-slate-400 mt-1 flex items-center gap-2">
                  <span class="font-mono text-emerald-400">{{ selectedRack.id }}</span>
                  <span class="text-slate-600">•</span>
                  <span>42U 标准机架</span>
                  <span class="text-slate-600">•</span>
                  <span class="text-emerald-400">实时 3D 视图</span>
                </p>
              </div>
            </div>
            <button 
              @click="isDetailOpen = false"
              class="cyber-button p-3 holo-card rounded-xl text-slate-400 hover:text-white border border-white/10 hover:border-emerald-500/50 transition-all"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <!-- 主体内容：左侧 3D 模型，右侧信息面板 -->
          <div class="flex-1 flex overflow-hidden">
            <!-- 左侧：3D 机架模型 -->
            <div class="flex-1 p-6 overflow-hidden border-r border-emerald-500/10">
              <div class="w-full h-full holo-card rounded-xl overflow-hidden border border-emerald-500/20">
                <RackDetail3D 
                  :slots="rackSlots"
                  :rack-name="selectedRack.name"
                  :rack-id="selectedRack.id"
                />
              </div>
            </div>
            
            <!-- 右侧：信息面板 -->
            <div class="w-80 p-6 overflow-y-auto custom-scrollbar bg-gradient-to-b from-emerald-500/5 to-transparent">
              <!-- 实时统计 -->
              <div class="space-y-4 mb-6">
                <h3 class="text-sm font-bold text-white flex items-center gap-2 mb-4">
                  <Activity class="w-4 h-4 text-emerald-400" />
                  实时统计
                </h3>
                <div class="grid grid-cols-2 gap-3">
                  <div class="holo-card p-4 rounded-xl text-center border border-emerald-500/20">
                    <div class="text-[10px] text-slate-500 uppercase font-bold mb-1">总 U 位</div>
                    <div class="text-2xl font-bold text-white neon-text">42U</div>
                  </div>
                  <div class="holo-card p-4 rounded-xl text-center border border-emerald-500/20">
                    <div class="text-[10px] text-slate-500 uppercase font-bold mb-1">已用</div>
                    <div class="text-2xl font-bold text-emerald-400 neon-text">{{ rackSlots.filter(s => s.occupied).length }}U</div>
                  </div>
                  <div class="holo-card p-4 rounded-xl text-center border border-emerald-500/20">
                    <div class="text-[10px] text-slate-500 uppercase font-bold mb-1">空闲</div>
                    <div class="text-2xl font-bold text-slate-400 neon-text">{{ rackSlots.filter(s => !s.occupied).length }}U</div>
                  </div>
                  <div class="holo-card p-4 rounded-xl text-center border border-emerald-500/20">
                    <div class="text-[10px] text-slate-500 uppercase font-bold mb-1">使用率</div>
                    <div class="text-2xl font-bold text-emerald-400 neon-text">{{ Math.round(rackSlots.filter(s => s.occupied).length / rackSlots.length * 100) }}%</div>
                  </div>
                </div>
              </div>
              
              <!-- 负载信息 -->
              <div class="mb-6">
                <h3 class="text-sm font-bold text-white flex items-center gap-2 mb-4">
                  <Zap class="w-4 h-4 text-amber-400" />
                  负载状态
                </h3>
                <div class="holo-card p-4 rounded-xl border border-amber-500/20">
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-[10px] text-slate-500 uppercase">当前负载</span>
                    <span class="text-lg font-bold text-amber-400 neon-text">{{ selectedRack.load }}%</span>
                  </div>
                  <div class="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      :class="[
                        'h-full transition-all duration-500 glow-effect',
                        selectedRack.load > 80 ? 'bg-gradient-to-r from-rose-500 to-rose-400' :
                        selectedRack.load > 60 ? 'bg-gradient-to-r from-amber-500 to-amber-400' :
                        'bg-gradient-to-r from-emerald-500 to-emerald-400'
                      ]"
                      :style="{ width: selectedRack.load + '%' }"
                    ></div>
                  </div>
                </div>
              </div>
              
              <!-- 温度信息 -->
              <div class="mb-6">
                <h3 class="text-sm font-bold text-white flex items-center gap-2 mb-4">
                  <Thermometer class="w-4 h-4 text-blue-400" />
                  温度监控
                </h3>
                <div class="holo-card p-4 rounded-xl border border-blue-500/20">
                  <div class="flex items-center justify-between">
                    <span class="text-[10px] text-slate-500 uppercase">实时温度</span>
                    <div class="flex items-center gap-2">
                      <span class="text-lg font-bold text-blue-400 neon-text">{{ selectedRack.temp }}°C</span>
                      <div :class="[
                        'w-2 h-2 rounded-full animate-pulse',
                        selectedRack.temp > 25 ? 'bg-rose-500' :
                        selectedRack.temp > 22 ? 'bg-amber-500' :
                        'bg-emerald-500'
                      ]"></div>
                    </div>
                  </div>
                  <p class="text-[10px] text-slate-500 mt-2">
                    {{ selectedRack.temp > 25 ? '温度偏高，建议检查散热' :
                       selectedRack.temp > 22 ? '温度正常，持续监控' :
                       '温度理想，运行良好' }}
                  </p>
                </div>
              </div>
              
              <!-- 设备类型分布 -->
              <div class="mb-6">
                <h3 class="text-sm font-bold text-white flex items-center gap-2 mb-4">
                  <Cpu class="w-4 h-4 text-purple-400" />
                  设备分布
                </h3>
                <div class="space-y-2">
                  <div class="flex items-center justify-between p-3 holo-card rounded-lg border border-white/5">
                    <div class="flex items-center gap-2">
                      <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
                      <span class="text-[10px] text-slate-400">计算节点</span>
                    </div>
                    <span class="text-xs font-bold text-white">{{ rackSlots.filter(s => s.occupied && s.type === 'Compute').length }}</span>
                  </div>
                  <div class="flex items-center justify-between p-3 holo-card rounded-lg border border-white/5">
                    <div class="flex items-center gap-2">
                      <div class="w-2 h-2 rounded-full bg-blue-500"></div>
                      <span class="text-[10px] text-slate-400">存储节点</span>
                    </div>
                    <span class="text-xs font-bold text-white">{{ rackSlots.filter(s => s.occupied && s.type === 'Storage').length }}</span>
                  </div>
                  <div class="flex items-center justify-between p-3 holo-card rounded-lg border border-white/5">
                    <div class="flex items-center gap-2">
                      <div class="w-2 h-2 rounded-full bg-slate-500"></div>
                      <span class="text-[10px] text-slate-400">空闲 U 位</span>
                    </div>
                    <span class="text-xs font-bold text-white">{{ rackSlots.filter(s => !s.occupied).length }}</span>
                  </div>
                </div>
              </div>
              
              <!-- 操作按钮 -->
              <div class="space-y-3">
                <h3 class="text-sm font-bold text-white flex items-center gap-2 mb-2">
                  <Settings class="w-4 h-4 text-slate-400" />
                  远程操作
                </h3>
                <button class="cyber-button w-full py-3 holo-card border border-emerald-500/30 rounded-xl text-sm font-bold text-emerald-400 transition-all flex items-center justify-center gap-2 hover:bg-emerald-500/10">
                  <Activity class="w-4 h-4" />
                  导出健康报告
                </button>
                <button class="cyber-button w-full py-3 holo-card border border-amber-500/30 rounded-xl text-sm font-bold text-amber-400 transition-all flex items-center justify-center gap-2 hover:bg-amber-500/10">
                  <Server class="w-4 h-4" />
                  重启管理模块
                </button>
                <button class="cyber-button w-full py-3 holo-card border border-rose-500/30 rounded-xl text-sm font-bold text-rose-400 transition-all flex items-center justify-center gap-2 hover:bg-rose-500/10">
                  <AlertTriangle class="w-4 h-4" />
                  紧急断电保护
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --font-sans: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}

body {
  font-family: var(--font-sans);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
