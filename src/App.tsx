import React, { useState, useEffect, useRef } from 'react';
import { Download, Upload, Plus, Trash2, Edit2, ShieldAlert, Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppState, Character, ClassType, CharacterStats, MAIN_STATS, SPECIAL_STATS } from './types';

const INITIAL_STAT = { used: 0, goal: 0 };
const DEFAULT_STATS: CharacterStats = {
  Power: { ...INITIAL_STAT },
  Def: { ...INITIAL_STAT },
  Mind: { ...INITIAL_STAT },
  Evade: { ...INITIAL_STAT },
  Luck: { ...INITIAL_STAT },
  HP: { ...INITIAL_STAT },
  TP: { ...INITIAL_STAT },
};

function generateId() {
  return Math.random().toString(36).substring(2, 9);
}

function getClassCap(classType: ClassType): number {
  if (classType === 'Human') return 250;
  return 150;
}

export default function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('pso-material-tracker');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to load save data', e);
      }
    }
    return { characters: [], activeCharId: null };
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem('pso-material-tracker', JSON.stringify(state));
  }, [state]);

  const activeChar = state.characters.find(c => c.id === state.activeCharId);

  const addCharacter = () => {
    const newChar: Character = {
      id: generateId(),
      name: `New Character ${state.characters.length + 1}`,
      classType: 'Human',
      stats: JSON.parse(JSON.stringify(DEFAULT_STATS)), // Deep copy
    };
    setState(s => ({
      ...s,
      characters: [...s.characters, newChar],
      activeCharId: newChar.id,
    }));
  };

  const deleteCharacter = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this character?')) return;
    setState(s => {
      const newChars = s.characters.filter(c => c.id !== id);
      return {
        ...s,
        characters: newChars,
        activeCharId: s.activeCharId === id ? (newChars[0]?.id || null) : s.activeCharId,
      };
    });
  };

  const updateActiveChar = (updates: Partial<Character>) => {
    if (!state.activeCharId) return;
    setState(s => ({
      ...s,
      characters: s.characters.map(c => 
        c.id === s.activeCharId ? { ...c, ...updates } : c
      )
    }));
  };

  const updateStat = (statName: keyof CharacterStats, field: 'used' | 'goal', value: number) => {
    if (!state.activeCharId) return;
    const cleanValue = Math.max(0, isNaN(value) ? 0 : value);
    
    setState(s => ({
      ...s,
      characters: s.characters.map(c => {
        if (c.id !== s.activeCharId) return c;
        const newStats = { ...c.stats };
        newStats[statName] = { ...newStats[statName], [field]: cleanValue };
        return { ...c, stats: newStats };
      })
    }));
  };

  const handleBackupData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", `pso-materials-backup-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleUploadBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result;
        if (typeof result === 'string') {
          const parsed = JSON.parse(result);
          if (parsed && typeof parsed === 'object' && Array.isArray(parsed.characters)) {
            setState(parsed);
          } else {
            alert('Invalid backup file format.');
          }
        }
      } catch (err) {
        alert('Failed to parse backup file.');
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const resetAll = () => {
    if (confirm('Are you ABSOLUTELY sure you want to delete ALL data? This cannot be undone.')) {
      setState({ characters: [], activeCharId: null });
    }
  };

  const mainStatsTotal = activeChar ? MAIN_STATS.reduce((sum, stat) => sum + activeChar.stats[stat].used, 0) : 0;
  const mainStatsCap = activeChar ? getClassCap(activeChar.classType) : 0;
  
  return (
    <div className="h-screen overflow-hidden bg-[#fafafa] flex font-sans text-gray-900 selection:bg-gray-200 relative">
      
      {/* Mobile Header */}
      <div className="md:hidden absolute top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 z-20">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">PSO Tracker</h1>
        </div>
        <button onClick={() => setIsSidebarOpen(true)} className="p-2 -mr-2 text-gray-600 hover:text-gray-900">
          <Menu size={24} />
        </button>
      </div>

      {/* Sidebar Overlay (Mobile) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/20 z-30 md:hidden" 
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed md:sticky top-0 left-0 h-screen w-72 bg-white border-r border-gray-200 z-40 flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} shrink-0`}>
        <div className="p-6 border-b border-gray-100 flex-none flex justify-between items-start">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">PSO Tracker</h1>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-medium">Material Management</p>
          </div>
          <button className="md:hidden p-2 text-gray-400 hover:text-gray-900 -mr-2 -mt-2" onClick={() => setIsSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {state.characters.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No characters yet.</p>
          ) : (
            <AnimatePresence>
              {state.characters.map((char) => (
                <motion.div
                  key={char.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={() => {
                    setState(s => ({ ...s, activeCharId: char.id }));
                    setIsSidebarOpen(false);
                  }}
                  className={`group relative p-4 rounded-xl cursor-pointer transition-all duration-200 border ${
                    state.activeCharId === char.id 
                      ? 'bg-gray-900 text-white border-gray-900 shadow-md' 
                      : 'bg-white border-gray-200 hover:border-gray-400 hover:bg-gray-50 text-gray-900'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="font-medium truncate pr-6">{char.name}</h3>
                    <button 
                      onClick={(e) => deleteCharacter(char.id, e)}
                      className={`absolute right-4 p-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity ${
                        state.activeCharId === char.id ? 'hover:bg-gray-800 text-gray-300 hover:text-red-400' : 'hover:bg-gray-200 text-gray-400 hover:text-red-500'
                      }`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className={`text-xs ${state.activeCharId === char.id ? 'text-gray-300' : 'text-gray-500'}`}>
                    {char.classType}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 flex-none">
          <button 
            onClick={addCharacter}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus size={16} /> New Character
          </button>
        </div>

        {/* Global Controls */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex-none space-y-2">
           <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleUploadBackup} 
            accept=".json" 
            className="hidden" 
          />
          <div className="flex gap-2">
            <button 
              onClick={handleBackupData}
              title="Backup Data"
              className="flex-1 flex items-center justify-center py-2 px-3 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-sm transition-colors text-gray-600"
            >
              <Download size={14} />
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              title="Restore Data"
              className="flex-1 flex items-center justify-center py-2 px-3 bg-white border border-gray-200 hover:bg-gray-50 rounded-lg text-sm transition-colors text-gray-600"
            >
              <Upload size={14} />
            </button>
            <button 
              onClick={resetAll}
              title="Reset Everything"
              className="flex-1 flex items-center justify-center py-2 px-3 bg-red-50 border border-red-100 hover:bg-red-100 hover:border-red-200 text-red-600 rounded-lg text-sm transition-colors"
            >
              <ShieldAlert size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 pt-16 md:pt-0">
        {!activeChar ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Edit2 className="text-gray-400" size={24} />
              </div>
              <h2 className="text-xl font-medium text-gray-700">No Character Selected</h2>
              <p className="text-gray-500 mt-2 max-w-sm">Select a character from the sidebar or create a new one to start tracking materials.</p>
            </div>
          </div>
        ) : (
          <motion.div 
            key={activeChar.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 overflow-y-auto"
          >
            <div className="max-w-4xl mx-auto p-8 lg:p-12">
              
              {/* Header */}
              <div className="mb-12 flex flex-col md:flex-row gap-6 md:items-end justify-between border-b border-gray-200 pb-8">
                <div className="space-y-4 flex-1">
                  <div>
                    <label className="text-xs uppercase tracking-widest font-semibold text-gray-400 mb-2 block">Name</label>
                    <input 
                      type="text" 
                      value={activeChar.name}
                      onChange={(e) => updateActiveChar({ name: e.target.value })}
                      className="text-4xl lg:text-5xl font-bold bg-transparent border-none p-0 focus:ring-0 w-full placeholder-gray-300 text-gray-900"
                      placeholder="Character Name"
                    />
                  </div>
                </div>
                <div className="w-48 shrink-0">
                  <label className="text-xs uppercase tracking-widest font-semibold text-gray-400 mb-2 block">Class Type</label>
                  <select 
                    value={activeChar.classType}
                    onChange={(e) => updateActiveChar({ classType: e.target.value as ClassType })}
                    className="w-full bg-white border border-gray-200 text-gray-800 text-sm rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-gray-900 block p-2.5 transition-shadow cursor-pointer appearance-none"
                    style={{ backgroundImage: 'url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23111111%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.7rem top 50%', backgroundSize: '0.65rem auto' }}
                  >
                    <option value="Human">Human (250 Cap)</option>
                    <option value="Newman">Newman (150 Cap)</option>
                    <option value="Android">Android (150 Cap)</option>
                  </select>
                </div>
              </div>

              {/* Status Banner */}
              <div className="mb-10 p-6 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col md:flex-row gap-8 justify-between items-center">
                <div className="flex-1 w-full">
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-sm font-semibold tracking-wide text-gray-600 uppercase">Primary Material Usage</span>
                    <div className="text-right">
                      <span className={`text-2xl font-bold ${mainStatsTotal > mainStatsCap ? 'text-red-500' : 'text-gray-900'}`}>{mainStatsTotal}</span>
                      <span className="text-gray-400 font-medium ml-1">/ {mainStatsCap}</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                    <motion.div 
                      className={`h-2.5 rounded-full ${mainStatsTotal > mainStatsCap ? 'bg-red-500' : mainStatsTotal === mainStatsCap ? 'bg-emerald-500' : 'bg-gray-900'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (mainStatsTotal / mainStatsCap) * 100)}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    ></motion.div>
                  </div>
                  {mainStatsTotal > mainStatsCap && (
                    <p className="text-red-500 text-xs font-medium mt-2 flex items-center gap-1.5"><ShieldAlert size={12}/> Primary limit exceeded!</p>
                  )}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="space-y-12">
                
                {/* Primary Stats */}
                <section>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Primary Stats</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {MAIN_STATS.map(stat => (
                      <StatRow key={stat} statName={stat} activeChar={activeChar} updateStat={updateStat} maxGoal={mainStatsCap} />
                    ))}
                  </div>
                </section>

                <hr className="border-gray-100"/>

                {/* Independent Stats */}
                <section>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6 flex justify-between items-center">
                    Independent Stats 
                    <span className="text-xs font-normal text-gray-400 normal-case bg-gray-100 px-2 py-0.5 rounded-full">Cap: 125 each</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {SPECIAL_STATS.map(stat => (
                      <StatRow key={stat} statName={stat} activeChar={activeChar} updateStat={updateStat} hardCap={125} maxGoal={125}/>
                    ))}
                  </div>
                </section>
                
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}

// Subcomponent for Stat Rows
function StatRow({ statName, activeChar, updateStat, hardCap, maxGoal }: { 
  key?: string | number;
  statName: keyof CharacterStats; 
  activeChar: Character; 
  updateStat: (statName: keyof CharacterStats, field: 'used'|'goal', value: number) => void;
  hardCap?: number;
  maxGoal?: number;
}) {
  const stat = activeChar.stats[statName];
  const used = Math.min(stat.used, hardCap ?? Infinity) || 0;
  const goal = stat.goal || 0;
  
  // Logic for bar filling. 
  // If no goal is set, show usage against the implicit bar, 
  // but if we have a maxGoal scale against that.
  const scaleMax = Math.max(goal, maxGoal ?? 1);
  const progressRatio = (used / (goal || scaleMax)) * 100;
  const clampedRatio = Math.min(100, Math.max(0, progressRatio));
  
  // The progress color changes if it reaches the goal
  const isGoalMet = goal > 0 && used >= goal;
  const isOverCap = hardCap && used > hardCap;

  let barColor = 'bg-gray-800';
  if (isOverCap) barColor = 'bg-red-500';
  else if (isGoalMet) barColor = 'bg-emerald-500';
  else if (goal > 0) barColor = 'bg-indigo-500';

  return (
    <div className="group">
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold text-gray-700 w-24">{statName}</span>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 focus-within:text-gray-900 text-gray-500 transition-colors">
            <span className="text-xs uppercase tracking-wider font-medium">Used</span>
            <input 
              type="number" 
              value={stat.used || ''} 
              onChange={(e) => updateStat(statName, 'used', parseInt(e.target.value))}
              placeholder="0"
              className="w-16 h-8 text-center bg-gray-50 border border-gray-200 rounded text-sm font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </div>
          <div className="text-gray-300">/</div>
          <div className="flex items-center gap-1.5 focus-within:text-indigo-600 text-gray-500 transition-colors">
            <span className="text-xs uppercase tracking-wider font-medium">Goal</span>
            <input 
              type="number" 
              value={stat.goal || ''} 
              onChange={(e) => updateStat(statName, 'goal', parseInt(e.target.value))}
              placeholder="0"
              className="w-16 h-8 text-center bg-gray-50 border border-gray-200 rounded text-sm font-mono focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium text-gray-900"
            />
          </div>
        </div>
      </div>
      <div className="relative w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <motion.div 
          className={`absolute top-0 left-0 h-full ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${clampedRatio}%` }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        />
        {/* Goal marker if goal is set and less than max scale */}
        {goal > 0 && goal < scaleMax && (
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-gray-300"
            style={{ left: `${(goal / scaleMax) * 100}%` }}
          />
        )}
      </div>
    </div>
  );
}

