export interface MakeupConfig {
  enableLips: boolean;
  lipColor: string;
  lipOpacity: number;
  enableTeeth: boolean;
  teethWhiteness: number;
  
  enableFace: boolean;
  blushColor: string;
  blushOpacity: number;
  foundationTone: string;
  foundationOpacity: number;

  enableEyes: boolean;
  eyeshadowColor: string;
  eyeshadowOpacity: number;
  eyelinerColor: string;
  eyelinerOpacity: number;

  enableHair: boolean;
  hairColor: string;
  hairOpacity: number;

  enableAccessories: boolean;
  accessoryColor: string; // For Bindi

  enableNoseRing: boolean;
  noseRingOpacity: number;
  enableEarrings: boolean;
  earringsOpacity: number;
}

export interface AIAdvice {
  title: string;
  description: string;
  suggestedConfig: Partial<MakeupConfig>;
}

export enum MakeupCategory {
  LIPS = 'LIPS',
  EYES = 'EYES',
  FACE = 'FACE',
  HAIR = 'HAIR',
  ACCESSORIES = 'EXTRAS'
}
