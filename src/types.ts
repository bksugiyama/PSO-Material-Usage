export type ClassType = 'Human' | 'Newman' | 'Android';

export interface Stat {
  used: number;
  goal: number;
}

export interface CharacterStats {
  Power: Stat;
  Def: Stat;
  Mind: Stat;
  Evade: Stat;
  Luck: Stat;
  HP: Stat;
  TP: Stat;
}

export interface Character {
  id: string;
  name: string;
  classType: ClassType;
  stats: CharacterStats;
}

export interface AppState {
  characters: Character[];
  activeCharId: string | null;
}

export const MAIN_STATS: (keyof CharacterStats)[] = ['Power', 'Def', 'Mind', 'Evade', 'Luck'];
export const SPECIAL_STATS: (keyof CharacterStats)[] = ['HP', 'TP'];
