
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import StatCard from './components/StatCard';
import MediaModal from './components/MediaModal';
import ChannelModal from './components/ChannelModal';
import InventoryModal from './components/InventoryModal';
import { 
  Package, DollarSign, TrendingUp, Users, Plus, Edit2, Trash2, Search, 
  Filter, FileText, CheckCircle, AlertCircle, RefreshCw, BarChart3,
  Calculator, AlertTriangle, Tv, ShoppingCart, Settings, Save, MinusCircle, X,
  Monitor, Clock, Download, ChevronDown, MoreHorizontal, Globe, Store, Star, Link2,
  Smartphone, Home, BriefcaseMedical, Droplets, ExternalLink, TrendingDown,
  ArrowRight, Equal, Percent, Activity, Calendar, Database, Upload, ChevronLeft, ChevronRight,
  FileBarChart, PieChart as PieChartIcon, LineChart as LineChartIcon, RotateCcw, Award, Lightbulb, Target, Layers, SearchCode
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend,
  LineChart, Line, AreaChart, Area, ComposedChart, ReferenceLine
} from 'recharts';
import { InventoryItem, InventoryStatus, AIAnalysisResult, MediaResource, SalesChannel, AppSettings, Notification, PricingPlan } from './types';
import { analyzePricing, assessRisk, runFinancialSimulation, optimizePricingStrategy, researchProductInfo, ProductResearchResult } from './services/geminiService';

// --- MOCK DATA ---
const INITIAL_INVENTORY: InventoryItem[] = [
  { id: '1', name: '讯飞X10语音文本笔', brand: '科大讯飞', category: '电子产品', quantity: 1085, marketPrice: 4999, lowestPrice: 4299, costPrice: 2000, productUrl: 'https://www.jd.com', status: InventoryStatus.IN_STOCK, lastUpdated: '2023-10-25' },
  { id: '2', name: '科大讯飞 (样品) X3', brand: '科大讯飞', category: '家用电器', quantity: 2788, marketPrice: 1973, lowestPrice: 1680, costPrice: 800, productUrl: '', status: InventoryStatus.IN_STOCK, lastUpdated: '2023-10-24' },
  { id: '3', name: '读书郎学习机 P6', brand: '读书郎', category: '电子产品', quantity: 1988, marketPrice: 600, lowestPrice: 499, costPrice: 250, productUrl: 'https://.taobao.com', status: InventoryStatus.IN_STOCK, lastUpdated: '2023-10-26' },
  { id: '4', name: '中老年补钙高蛋白', brand: '诺崔特', category: '保健品', quantity: 526, marketPrice: 4894, lowestPrice: 3500, costPrice: 1200, productUrl: '', status: InventoryStatus.LOW_STOCK, lastUpdated: '2023-10-20' },
  { id: '5', name: '燕京至简苏打水', brand: '燕京', category: '食品饮料', quantity: 42, marketPrice: 18775, lowestPrice: 15000, costPrice: 8000, productUrl: '', status: InventoryStatus.OUT_OF_STOCK, lastUpdated: '2023-10-22' }
];

const INITIAL_MEDIA: MediaResource[] = [
  { id: 'm1', name: '德高中国 (JCDecaux)', type: '户外媒体', format: '地铁媒体', location: '全国主要城市地铁', rate: '¥15,000/周', discount: 0.68, contractStart: '2023-05-01', contractEnd: '2025-04-30', status: 'active', valuation: 50000 },
  { id: 'm2', name: '分众传媒 (Focus Media)', type: '户外媒体', format: '电梯楼宇广告', location: '一线城市核心写字楼', rate: '¥8,000/天', discount: 0.75, contractStart: '2023-01-01', contractEnd: '2024-12-31', status: 'active', valuation: 30000 }
];

const INITIAL_CHANNELS: SalesChannel[] = [
  { id: 'c1', name: '1688 (阿里巴巴)', type: 'Online', subType: '批发为主', features: '最大尾货批发平台', applicableCategories: '全品类', pros: '覆盖面广', status: 'active', commissionRate: 0.05, contactPerson: 'Alice Wu' },
  { id: 'c2', name: '得物 (Poizon)', type: 'Online', subType: '潮流电商', features: '溢价能力强', applicableCategories: '鞋服/电子', pros: '客单价高', status: 'active', commissionRate: 0.12, contactPerson: 'Bob Chen' }
];

const DEFAULT_SETTINGS: AppSettings = { lowStockThreshold: 50, outOfStockThreshold: 0 };

const STORAGE_KEYS = {
  INVENTORY: 'duckwolf_inventory',
  MEDIA: 'duckwolf_media',
  CHANNELS: 'duckwolf_channels',
  SETTINGS: 'duckwolf_settings',
  PLANS: 'duckwolf_plans'
};

const loadFromStorage = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (error) {
    return fallback;
  }
};

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [inventory, setInventory] = useState<InventoryItem[]>(() => loadFromStorage(STORAGE_KEYS.INVENTORY, INITIAL_INVENTORY));
  const [media, setMedia] = useState<MediaResource[]>(() => loadFromStorage(STORAGE_KEYS.MEDIA, INITIAL_MEDIA));
  const [channels, setChannels] = useState<SalesChannel[]>(() => loadFromStorage(STORAGE_KEYS.CHANNELS, INITIAL_CHANNELS));
  const [settings, setSettings] = useState<AppSettings>(() => loadFromStorage(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS));
  const [pricingPlans, setPricingPlans] = useState<PricingPlan[]>(() => loadFromStorage(STORAGE_KEYS.PLANS, []));
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [editingInventory, setEditingInventory] = useState<InventoryItem | null>(null);
  
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [editingMedia, setEditingMedia] = useState<MediaResource | null>(null);

  const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<SalesChannel | null>(null);

  useEffect(() => { localStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory)); }, [inventory]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.MEDIA, JSON.stringify(media)); }, [media]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.CHANNELS, JSON.stringify(channels)); }, [channels]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings)); }, [settings]);
  useEffect(() => { localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(pricingPlans)); }, [pricingPlans]);

  const addNotification = (title: string, message: string, type: 'info' | 'warning' | 'error' | 'success') => {
    const newNote: Notification = { id: Math.random().toString(), title, message, type, timestamp: new Date(), read: false };
    setNotifications(prev => [newNote, ...prev]);
  };

  // --- Pages ---

  const DashboardPage = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="总库存价值" value={`¥${inventory.reduce((a, b) => a + b.marketPrice * b.quantity, 0).toLocaleString()}`} icon={DollarSign} trend="↑ 12%" trendUp={true} />
        <StatCard title="商品总数" value={inventory.reduce((a, b) => a + b.quantity, 0).toLocaleString()} icon={Package} />
        <StatCard title="媒体资源估值" value={`¥${media.reduce((a, b) => a + (b.valuation || 0), 0).toLocaleString()}`} icon={Tv} />
        <StatCard title="活跃渠道" value={channels.length} icon={Users} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center"><Package className="mr-2 h-5 w-5 text-indigo-500" /> 最新库存动态</h3>
          <div className="space-y-4">
            {inventory.slice(0, 5).map(item => (
              <div key={item.id} className="flex items-center justify-between py-2 border-b last:border-0 border-slate-50">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded flex items-center justify-center font-bold mr-3">{item.name.charAt(0)}</div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">{item.name}</div>
                    <div className="text-xs text-slate-500">{item.brand} | {item.category}</div>
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div className="font-bold text-slate-900">{item.quantity} 件</div>
                  <div className="text-xs text-slate-500">¥{item.marketPrice}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center"><Activity className="mr-2 h-5 w-5 text-emerald-500" /> 销售渠道概览</h3>
          <div className="space-y-4">
            {channels.map(channel => (
              <div key={channel.id} className="flex items-center justify-between py-3 border-b last:border-0 border-slate-50">
                <div className="flex items-center">
                  <div className={`p-2 rounded mr-3 ${channel.type === 'Online' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
                    {channel.type === 'Online' ? <Globe size={18} /> : <Store size={18} />}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">{channel.name}</div>
                    <div className="text-xs text-slate-500">{channel.subType} | 费率: {(channel.commissionRate * 100).toFixed(1)}%</div>
                  </div>
                </div>
                <div className="px-2 py-1 rounded text-xs font-medium bg-green-50 text-green-700">运行中</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const InventoryPage = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900">库存商品列表</h2>
        <button 
          onClick={() => { setEditingInventory(null); setIsInventoryModalOpen(true); }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center transition-all shadow-sm"
        >
          <Plus className="mr-2 h-4 w-4" /> 新增商品
        </button>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">商品详情</th>
              <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">数量</th>
              <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">价格 (零售/成本)</th>
              <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">状态</th>
              <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {inventory.map(item => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-slate-900">{item.name}</div>
                  <div className="text-xs text-slate-500">{item.brand} · {item.category}</div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-900 font-medium">{item.quantity}</td>
                <td className="px-6 py-4">
                  <div className="text-sm text-slate-900 font-semibold">¥{item.marketPrice}</div>
                  <div className="text-xs text-slate-400">成本: ¥{item.costPrice}</div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.status === InventoryStatus.IN_STOCK ? 'bg-green-100 text-green-700' :
                    item.status === InventoryStatus.LOW_STOCK ? 'bg-amber-100 text-amber-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {item.status === InventoryStatus.IN_STOCK ? '充足' : 
                     item.status === InventoryStatus.LOW_STOCK ? '低库存' : '缺货'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button onClick={() => { setEditingInventory(item); setIsInventoryModalOpen(true); }} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"><Edit2 size={16}/></button>
                  <button onClick={() => setInventory(prev => prev.filter(i => i.id !== item.id))} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const MediaPage = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900">媒体资源库</h2>
        <button 
          onClick={() => { setEditingMedia(null); setIsMediaModalOpen(true); }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center transition-all shadow-sm"
        >
          <Plus className="mr-2 h-4 w-4" /> 新增媒体
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {media.map(m => (
          <div key={m.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-2 rounded-lg ${m.type === '户外媒体' ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'}`}>
                <Tv size={24} />
              </div>
              <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => { setEditingMedia(m); setIsMediaModalOpen(true); }} className="p-1 text-slate-400 hover:text-indigo-600"><Edit2 size={14}/></button>
                <button onClick={() => setMedia(prev => prev.filter(item => item.id !== m.id))} className="p-1 text-slate-400 hover:text-red-600"><Trash2 size={14}/></button>
              </div>
            </div>
            <h4 className="font-bold text-slate-900 mb-1">{m.name}</h4>
            <div className="text-sm text-slate-500 mb-4">{m.location}</div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-50 p-2 rounded text-center">
                <div className="text-[10px] text-slate-400 uppercase font-bold">报价</div>
                <div className="text-xs font-bold text-slate-700">{m.rate}</div>
              </div>
              <div className="bg-slate-50 p-2 rounded text-center">
                <div className="text-[10px] text-slate-400 uppercase font-bold">易货折扣</div>
                <div className="text-xs font-bold text-slate-700">{(m.discount * 10).toFixed(1)} 折</div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-100">
              <span className="text-slate-400">有效期至: {m.contractEnd}</span>
              <span className={`px-2 py-0.5 rounded ${m.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                {m.status === 'active' ? '生效中' : '待处理'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const ChannelsPage = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-900">分销渠道管理</h2>
        <button 
          onClick={() => { setEditingChannel(null); setIsChannelModalOpen(true); }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center transition-all shadow-sm"
        >
          <Plus className="mr-2 h-4 w-4" /> 新增渠道
        </button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {channels.map(c => (
          <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-6 flex items-start gap-4 hover:shadow-md transition-all">
            <div className={`p-4 rounded-xl ${c.type === 'Online' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'}`}>
              <ShoppingCart size={32} />
            </div>
            <div className="flex-1">
              <div className="flex justify-between">
                <h4 className="font-bold text-lg text-slate-900">{c.name}</h4>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingChannel(c); setIsChannelModalOpen(true); }} className="text-slate-400 hover:text-indigo-600"><Edit2 size={16}/></button>
                  <button onClick={() => setChannels(prev => prev.filter(item => item.id !== c.id))} className="text-slate-400 hover:text-red-600"><Trash2 size={16}/></button>
                </div>
              </div>
              <p className="text-sm text-slate-500 mt-1">{c.features}</p>
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">佣金率</div>
                  <div className="text-sm font-bold">{(c.commissionRate * 100).toFixed(0)}%</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">对接人</div>
                  <div className="text-sm font-bold">{c.contactPerson}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 uppercase font-bold">适用范围</div>
                  <div className="text-sm font-bold truncate">{c.applicableCategories}</div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const PricingPage = () => {
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [selectedMedia, setSelectedMedia] = useState<MediaResource | null>(null);
    const [selectedChannel, setSelectedChannel] = useState<SalesChannel | null>(null);
    const [result, setResult] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleAnalyze = async () => {
      if (!selectedItem || !selectedMedia || !selectedChannel) return;
      setLoading(true);
      try {
        const res = await optimizePricingStrategy(selectedItem, selectedMedia, selectedChannel);
        setResult(res);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-white p-6 rounded-xl border border-slate-200">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">选择商品</label>
            <select className="w-full border-slate-300 rounded-md py-2 px-3 text-sm" onChange={e => setSelectedItem(inventory.find(i => i.id === e.target.value) || null)}>
              <option value="">请选择商品...</option>
              {inventory.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">选择匹配媒体</label>
            <select className="w-full border-slate-300 rounded-md py-2 px-3 text-sm" onChange={e => setSelectedMedia(media.find(m => m.id === e.target.value) || null)}>
              <option value="">请选择媒体...</option>
              {media.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">选择销售渠道</label>
            <select className="w-full border-slate-300 rounded-md py-2 px-3 text-sm" onChange={e => setSelectedChannel(channels.find(c => c.id === e.target.value) || null)}>
              <option value="">请选择渠道...</option>
              {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="lg:col-span-3">
            <button 
              onClick={handleAnalyze}
              disabled={loading || !selectedItem || !selectedMedia || !selectedChannel}
              className="w-full py-3 bg-indigo-600 text-white rounded-md font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center"
            >
              {loading ? <RefreshCw className="animate-spin mr-2" /> : <Calculator className="mr-2" />}
              AI 智能定价分析
            </button>
          </div>
        </div>

        {result && (
          <div className="bg-indigo-900 text-white p-8 rounded-xl shadow-xl animate-fade-in-up">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-indigo-200 font-bold uppercase tracking-wider text-xs mb-2">建议零售出价</h3>
                <div className="text-5xl font-extrabold mb-4">¥{result.suggestedPrice}</div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="bg-white/10 px-3 py-1 rounded text-sm">ROI 预测: {result.predictedROI}%</div>
                  <div className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded text-sm font-bold">极力推荐</div>
                </div>
                <p className="text-indigo-100 text-lg italic">“{result.reasoning}”</p>
              </div>
              <div className="bg-white/5 p-6 rounded-lg border border-white/10">
                <h4 className="font-bold mb-4">测算详情</h4>
                <ul className="space-y-3 text-sm text-indigo-100">
                  <li className="flex justify-between"><span>市场溢价率:</span> <span>-{Math.round((1 - result.suggestedPrice / selectedItem!.marketPrice) * 100)}%</span></li>
                  <li className="flex justify-between"><span>毛利空间 (含佣金):</span> <span>¥{Math.round(result.suggestedPrice * (1 - selectedChannel!.commissionRate) - selectedItem!.costPrice)}</span></li>
                  <li className="flex justify-between"><span>库存周转预期:</span> <span>15-30 天</span></li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const FinancePage = () => {
    const [inputs, setInputs] = useState({ sellPrice: 0, quantity: 0, mediaCost: 0 });
    const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
    const [selectedMedia, setSelectedMedia] = useState<MediaResource | null>(null);
    const [selectedChannel, setSelectedChannel] = useState<SalesChannel | null>(null);
    const [analysis, setAnalysis] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleSimulate = async () => {
      if (!selectedItem || !selectedMedia || !selectedChannel) return;
      setLoading(true);
      try {
        const res = await runFinancialSimulation(selectedItem, selectedMedia, selectedChannel, inputs);
        setAnalysis(res);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="font-bold text-slate-800 border-b pb-2">模拟配置</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">预计售价 (¥)</label>
                <input type="number" className="w-full border-slate-200 rounded p-2 text-sm" onChange={e => setInputs({...inputs, sellPrice: Number(e.target.value)})} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">目标销量</label>
                <input type="number" className="w-full border-slate-200 rounded p-2 text-sm" onChange={e => setInputs({...inputs, quantity: Number(e.target.value)})} />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1">媒体外加投入</label>
                <input type="number" className="w-full border-slate-200 rounded p-2 text-sm" onChange={e => setInputs({...inputs, mediaCost: Number(e.target.value)})} />
              </div>
            </div>
            <div className="space-y-3">
              <select className="w-full border-slate-200 rounded p-2 text-sm" onChange={e => setSelectedItem(inventory.find(i => i.id === e.target.value) || null)}>
                <option value="">选择商品...</option>
                {inventory.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
              <select className="w-full border-slate-200 rounded p-2 text-sm" onChange={e => setSelectedMedia(media.find(m => m.id === e.target.value) || null)}>
                <option value="">选择媒体...</option>
                {media.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <select className="w-full border-slate-200 rounded p-2 text-sm" onChange={e => setSelectedChannel(channels.find(c => c.id === e.target.value) || null)}>
                <option value="">选择渠道...</option>
                {channels.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <button 
              onClick={handleSimulate}
              disabled={loading || !selectedItem || !selectedMedia || !selectedChannel}
              className="w-full py-2 bg-slate-900 text-white rounded font-bold flex items-center justify-center gap-2 hover:bg-slate-800"
            >
              {loading ? <RefreshCw className="animate-spin" size={16}/> : <TrendingUp size={16}/>}
              开始 AI 模拟测算
            </button>
          </div>

          <div className="bg-slate-50 rounded-lg p-6 flex flex-col items-center justify-center text-center border border-dashed border-slate-300">
            {!analysis && !loading ? (
              <>
                <Calculator className="h-12 w-12 text-slate-300 mb-4" />
                <p className="text-slate-500">在左侧输入参数，AI 将通过财务算法评估此次易货交易的可行性。</p>
              </>
            ) : analysis ? (
              <div className="w-full text-left">
                <div className="flex items-center gap-4 mb-6">
                   <div className="text-4xl font-black text-indigo-600">S+</div>
                   <div>
                     <div className="font-bold text-slate-800">战略契合度评分: {analysis.strategicFitScore}</div>
                     <div className="text-xs text-slate-500">基于产品调性与渠道画像匹配度</div>
                   </div>
                </div>
                <div className="mb-4">
                  <div className="text-xs font-bold text-slate-400 uppercase mb-2">执行核心建议</div>
                  <div className="bg-white p-3 rounded border border-slate-200 text-sm italic">{analysis.recommendation}</div>
                </div>
                <div className="space-y-2">
                  {analysis.reasoning.map((r: string, idx: number) => (
                    <div key={idx} className="flex gap-2 text-xs text-slate-600">
                      <CheckCircle size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : <RefreshCw className="animate-spin text-indigo-600" size={32} />}
          </div>
        </div>
      </div>
    );
  };

  const RiskPage = () => {
    const [riskInfo, setRiskInfo] = useState<any>(null);
    const [loading, setLoading] = useState(false);

    const handleCheck = async () => {
      setLoading(true);
      const totalVal = inventory.reduce((a, b) => a + b.marketPrice * b.quantity, 0);
      const mediaExp = media.reduce((a, b) => a + (b.valuation || 0), 0);
      try {
        const res = await assessRisk(totalVal, mediaExp, channels.length);
        setRiskInfo(res);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="bg-white p-10 rounded-xl border border-slate-200 text-center shadow-sm">
          <div className="mx-auto w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle className="h-10 w-10 text-amber-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">全系统易货业务风控</h2>
          <p className="text-slate-500 mb-8 max-w-md mx-auto">针对库存积压、渠道依赖、合同到期等风险进行全局 AI 扫描。</p>
          <button 
            onClick={handleCheck}
            disabled={loading}
            className="px-8 py-3 bg-red-600 text-white rounded-full font-bold shadow-lg hover:bg-red-700 transition-all flex items-center mx-auto"
          >
            {loading ? <RefreshCw className="animate-spin mr-2" /> : <Search className="mr-2" />}
            执行一键风险扫描
          </button>
        </div>

        {riskInfo && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in-up">
            <div className="bg-white p-6 rounded-xl border border-slate-200 flex flex-col items-center">
              <h4 className="font-bold text-slate-800 mb-6 w-full text-left flex items-center"><Activity className="mr-2 text-indigo-500" /> 风险综合评分</h4>
              <div className="relative flex items-center justify-center">
                <div className={`text-6xl font-black ${riskInfo.riskScore > 70 ? 'text-red-600' : riskInfo.riskScore > 40 ? 'text-amber-500' : 'text-emerald-500'}`}>
                  {riskInfo.riskScore}
                </div>
                <div className="absolute -bottom-4 text-xs font-bold text-slate-400">0 - 100 安全指数</div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-slate-200">
               <h4 className="font-bold text-slate-800 mb-4 flex items-center"><Target className="mr-2 text-red-500" /> 扫描报告</h4>
               <p className="text-sm text-slate-700 mb-4 bg-slate-50 p-4 rounded-lg italic">“{riskInfo.recommendation}”</p>
               <div className="space-y-2">
                 {riskInfo.reasoning.map((item: string, idx: number) => (
                   <div key={idx} className="flex gap-2 text-sm text-slate-600 border-b border-slate-50 pb-2">
                     <AlertCircle size={16} className="text-amber-500 shrink-0" />
                     <span>{item}</span>
                   </div>
                 ))}
               </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const ReportsPage = () => {
    const data = inventory.map(item => ({ name: item.name, value: item.quantity * item.marketPrice }));
    const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center"><PieChartIcon className="mr-2 h-5 w-5 text-indigo-500" /> 库存资产价值分布</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(value) => `¥${Number(value).toLocaleString()}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-6 flex items-center"><BarChart3 className="mr-2 h-5 w-5 text-emerald-500" /> 销售渠道佣金结构</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={channels}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} />
                  <YAxis axisLine={false} tickLine={false} fontSize={12} unit="%" />
                  <Tooltip />
                  <Bar dataKey="commissionRate" fill="#10b981" radius={[4, 4, 0, 0]} label={{ position: 'top', formatter: (val: number) => `${(val * 100).toFixed(0)}%` }} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const SettingsPage = () => {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-xl font-bold text-slate-900 mb-8 flex items-center"><Settings className="mr-2 h-6 w-6 text-slate-500" /> 系统全局配置</h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">库存预警阈值</label>
              <div className="flex items-center gap-4">
                <input type="range" min="10" max="500" step="10" value={settings.lowStockThreshold} onChange={e => setSettings({...settings, lowStockThreshold: Number(e.target.value)})} className="flex-1" />
                <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded font-bold">{settings.lowStockThreshold} 件</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">数据同步周期</label>
              <select className="w-full border-slate-200 rounded p-3 text-sm">
                <option>每小时 (实时)</option>
                <option>每日凌晨</option>
                <option>手动同步</option>
              </select>
            </div>
            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <button onClick={() => addNotification("设置已保存", "系统配置更新成功", "success")} className="px-6 py-2 bg-indigo-600 text-white rounded font-bold flex items-center gap-2 hover:bg-indigo-700">
                <Save size={18} /> 保存配置
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const ResearchPage = () => {
    const [selectedId, setSelectedId] = useState('');
    const [researchResult, setResearchResult] = useState<ProductResearchResult | null>(null);
    const [loading, setLoading] = useState(false);

    const handleResearch = async () => {
      const item = inventory.find(i => i.id === selectedId);
      if (!item) return;
      setLoading(true);
      try {
        const res = await researchProductInfo(item);
        setResearchResult(res);
      } catch (e) {
        addNotification("调研失败", "AI 无法获取该产品的信息，请稍后重试。", "error");
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <SearchCode className="mr-2 h-5 w-5 text-indigo-600" /> AI 深度产品调研
          </h3>
          <div className="flex flex-col md:flex-row gap-4">
            <select 
              className="flex-1 border-slate-300 rounded-md py-2 px-3 text-sm"
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
            >
              <option value="">选择要调研的库存商品...</option>
              {inventory.map(i => <option key={i.id} value={i.id}>{i.name} ({i.brand})</option>)}
            </select>
            <button 
              onClick={handleResearch}
              disabled={loading || !selectedId}
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center transition-all"
            >
              {loading ? <RefreshCw className="animate-spin mr-2 h-4 w-4" /> : <Search className="mr-2 h-4 w-4" />}
              {loading ? "正在联网调研中..." : "开始 AI 联网调研"}
            </button>
          </div>
        </div>

        {researchResult && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                <h4 className="font-bold text-slate-800 mb-3 border-b pb-2">市场深度摘要</h4>
                <p className="text-sm text-slate-600 leading-relaxed mb-6">{researchResult.summary}</p>
                
                <h4 className="font-bold text-slate-800 mb-3 border-b pb-2">市场与竞品分析</h4>
                <div className="space-y-3">
                  {researchResult.marketAnalysis.map((item, i) => (
                    <div key={i} className="bg-slate-50 p-3 rounded text-sm text-slate-700 border-l-4 border-indigo-400">
                      {item}
                    </div>
                  ))}
                  <div className="bg-amber-50 p-3 rounded text-sm text-amber-900 border-l-4 border-amber-400">
                    <span className="font-bold">竞品概况：</span> {researchResult.competitorAnalysis}
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-6">
                <div>
                  <h4 className="font-bold text-slate-800 mb-3 flex items-center">
                    <Target className="mr-2 h-4 w-4 text-red-500" /> 易货渠道定位建议
                  </h4>
                  <div className="p-4 bg-indigo-50 text-indigo-900 text-sm rounded-lg border border-indigo-100 font-medium">
                    {researchResult.suggestedPositioning}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-slate-800 mb-3 flex items-center">
                    <Link2 className="mr-2 h-4 w-4 text-blue-500" /> 参考资料来源
                  </h4>
                  <div className="space-y-2">
                    {researchResult.sources.map((s, i) => (
                      <a 
                        key={i} 
                        href={s.uri} 
                        target="_blank" 
                        rel="noreferrer"
                        className="block text-xs text-indigo-600 hover:underline truncate bg-slate-50 p-2 rounded"
                      >
                        {s.title}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {!researchResult && !loading && (
          <div className="py-20 text-center bg-white rounded-xl border border-dashed border-slate-300">
            <Layers className="h-12 w-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">请在上方选择商品，AI 将自动从全网获取最新的价格信息、竞品对比及用户评价。</p>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardPage />;
      case 'inventory': return <InventoryPage />;
      case 'research': return <ResearchPage />;
      case 'media': return <MediaPage />;
      case 'channels': return <ChannelsPage />;
      case 'pricing': return <PricingPage />;
      case 'finance': return <FinancePage />;
      case 'risk': return <RiskPage />;
      case 'reports': return <ReportsPage />;
      case 'settings': return <SettingsPage />;
      default: return <div className="p-8 text-center text-slate-500">板块暂未就绪...</div>;
    }
  };

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab}
      notifications={notifications}
      onMarkAsRead={id => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))}
      onClearAllNotifications={() => setNotifications([])}
    >
      {renderContent()}
      
      {/* Modals */}
      <InventoryModal 
        isOpen={isInventoryModalOpen} 
        onClose={() => setIsInventoryModalOpen(false)} 
        initialData={editingInventory}
        onSave={(data) => {
          if (editingInventory) {
            setInventory(prev => prev.map(i => i.id === editingInventory.id ? { ...i, ...data } : i));
          } else {
            setInventory(prev => [{ ...data, id: Math.random().toString(), lastUpdated: new Date().toISOString() } as InventoryItem, ...prev]);
          }
          setIsInventoryModalOpen(false);
          addNotification("成功", "库存信息已更新", "success");
        }}
      />

      <MediaModal 
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        initialData={editingMedia}
        onSave={(data) => {
          if (editingMedia) {
            setMedia(prev => prev.map(m => m.id === editingMedia.id ? { ...m, ...data } : m));
          } else {
            setMedia(prev => [{ ...data, id: `m-${Math.random().toString(36).substr(2, 5)}` } as MediaResource, ...prev]);
          }
          setIsMediaModalOpen(false);
          addNotification("成功", "媒体资源已更新", "success");
        }}
      />

      <ChannelModal
        isOpen={isChannelModalOpen}
        onClose={() => setIsChannelModalOpen(false)}
        initialData={editingChannel}
        onSave={(data) => {
          if (editingChannel) {
            setChannels(prev => prev.map(c => c.id === editingChannel.id ? { ...c, ...data } : c));
          } else {
            setChannels(prev => [{ ...data, id: `c-${Math.random().toString(36).substr(2, 5)}` } as SalesChannel, ...prev]);
          }
          setIsChannelModalOpen(false);
          addNotification("成功", "分销渠道已更新", "success");
        }}
      />
    </Layout>
  );
}

export default App;
