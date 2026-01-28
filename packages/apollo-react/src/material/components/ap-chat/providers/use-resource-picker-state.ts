import { useReducer } from 'react';
import type { CursorCoordinates } from '../components/input/tiptap';
import type { AutopilotChatResourceItem, AutopilotChatResourceItemSelector } from '../service';

export interface DrillDownState {
  category: AutopilotChatResourceItemSelector;
  resources: AutopilotChatResourceItem[];
  done: boolean;
}

export interface PickerState {
  anchorPosition: CursorCoordinates | null;
  query: string;
  drillDown: DrillDownState | null;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  searchResults: AutopilotChatResourceItem[];
  searchDone: boolean;
}

export type PickerAction =
  | { type: 'OPEN'; coords: CursorCoordinates }
  | { type: 'CLOSE' }
  | { type: 'SET_QUERY'; query: string }
  | { type: 'LOAD_START' }
  | { type: 'LOAD_MORE_START' }
  | {
      type: 'DRILL_DOWN_SUCCESS';
      category: AutopilotChatResourceItemSelector;
      resources: AutopilotChatResourceItem[];
      done: boolean;
    }
  | { type: 'SEARCH_SUCCESS'; results: AutopilotChatResourceItem[]; done: boolean }
  | {
      type: 'LOAD_MORE_SUCCESS';
      target: 'drillDown' | 'search';
      items: AutopilotChatResourceItem[];
      done: boolean;
    }
  | { type: 'LOAD_ERROR'; error: string }
  | { type: 'GO_BACK' }
  | { type: 'CLEAR_SEARCH' };

export const initialPickerState: PickerState = {
  anchorPosition: null,
  query: '',
  drillDown: null,
  loading: false,
  loadingMore: false,
  error: null,
  searchResults: [],
  searchDone: true,
};

export function pickerReducer(state: PickerState, action: PickerAction): PickerState {
  switch (action.type) {
    case 'OPEN':
      return {
        ...initialPickerState,
        anchorPosition: action.coords,
      };

    case 'CLOSE':
      return initialPickerState;

    case 'SET_QUERY':
      return {
        ...state,
        query: action.query,
      };

    case 'LOAD_START':
      return {
        ...state,
        loading: true,
        error: null,
      };

    case 'LOAD_MORE_START':
      return {
        ...state,
        loadingMore: true,
      };

    case 'DRILL_DOWN_SUCCESS':
      return {
        ...state,
        loading: false,
        drillDown: {
          category: action.category,
          resources: action.resources,
          done: action.done,
        },
      };

    case 'SEARCH_SUCCESS':
      return {
        ...state,
        loading: false,
        searchResults: action.results,
        searchDone: action.done,
      };

    case 'LOAD_MORE_SUCCESS':
      if (action.target === 'drillDown') {
        return state.drillDown
          ? {
              ...state,
              loadingMore: false,
              drillDown: {
                ...state.drillDown,
                resources: [...state.drillDown.resources, ...action.items],
                done: action.done,
              },
            }
          : { ...state, loadingMore: false };
      }
      return {
        ...state,
        loadingMore: false,
        searchResults: [...state.searchResults, ...action.items],
        searchDone: action.done,
      };

    case 'LOAD_ERROR':
      return {
        ...state,
        loading: false,
        loadingMore: false,
        error: action.error,
      };

    case 'GO_BACK':
      return {
        ...state,
        query: '',
        drillDown: null,
      };

    case 'CLEAR_SEARCH':
      return {
        ...state,
        searchResults: [],
        searchDone: true,
      };

    default:
      return state;
  }
}

export function useResourcePickerState() {
  return useReducer(pickerReducer, initialPickerState);
}
