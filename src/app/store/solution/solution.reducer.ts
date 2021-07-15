import { Step, SimplexResult, Product, Entities, Rational } from '~/models';
import { SolutionAction, SolutionActionType } from './solution.actions';

export interface SolutionState {
  products: Product[];
  productSteps: Entities<[string, Rational][]>;
  steps: Step[];
  result: SimplexResult;
  // [ rows, cols ]
  size: [number, number];
  pivots: number;
  ms: number;
}

export const initialSolutionState: SolutionState = {
  products: [],
  productSteps: {},
  steps: [],
  result: SimplexResult.None,
  size: null,
  pivots: 0,
  ms: 0,
};

export function solutionReducer(
  state: SolutionState = initialSolutionState,
  action: SolutionAction
): SolutionState {
  switch (action.type) {
    case SolutionActionType.RESET:
      return initialSolutionState;
    case SolutionActionType.SET_PRODUCTS:
      return {
        ...state,
        ...{ products: action.payload },
      };
    case SolutionActionType.SET_PRODUCT_STEPS:
      return {
        ...state,
        ...{ productSteps: action.payload },
      };
    case SolutionActionType.SET_SIZE:
      return {
        ...state,
        ...{ size: action.payload, result: SimplexResult.Started },
      };
    case SolutionActionType.SET_STATUS:
      return {
        ...state,
        ...{ pivots: action.payload[0], ms: action.payload[1] },
      };
    case SolutionActionType.SET_RESULT:
      return {
        ...state,
        ...{ steps: action.payload[0], result: action.payload[1] },
      };
    default:
      return state;
  }
}
