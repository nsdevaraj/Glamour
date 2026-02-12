import { MakeupConfig } from './types';

export type Action =
  | { type: 'UPDATE_CONFIG'; key: keyof MakeupConfig; value: string | number | boolean }
  | { type: 'RESET_CONFIG'; payload: MakeupConfig };

export const makeupReducer = (state: MakeupConfig, action: Action): MakeupConfig => {
  switch (action.type) {
    case 'UPDATE_CONFIG':
      return {
        ...state,
        [action.key]: action.value,
      };
    case 'RESET_CONFIG':
      return action.payload;
    default:
      return state;
  }
};
