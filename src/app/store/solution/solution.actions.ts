import { Action } from '@ngrx/store';

import { Entities, Product, Rational, SimplexResult, Step } from '~/models';

export const enum SolutionActionType {
  RESET = '[Solution] Reset',
  SET_PRODUCTS = '[Solution] Set Products',
  SET_PRODUCT_STEPS = '[Solution] Set Product Steps',
  SET_SIZE = '[Solution] Set Size',
  SET_STATUS = '[Solution] Set Status',
  SET_RESULT = '[Solution] Set Result',
}

export class ResetAction implements Action {
  readonly type = SolutionActionType.RESET;
  constructor() {}
}

export class SetProductsAction implements Action {
  readonly type = SolutionActionType.SET_PRODUCTS;
  constructor(public payload: Product[]) {}
}

export class SetProductStepsAction implements Action {
  readonly type = SolutionActionType.SET_PRODUCT_STEPS;
  constructor(public payload: Entities<[string, Rational][]>) {}
}

export class SetSizeAction implements Action {
  readonly type = SolutionActionType.SET_SIZE;
  constructor(public payload: [number, number]) {}
}

export class SetStateAction implements Action {
  readonly type = SolutionActionType.SET_STATUS;
  constructor(public payload: [number, number]) {}
}

export class SetResultAction implements Action {
  readonly type = SolutionActionType.SET_RESULT;
  constructor(public payload: [Step[], SimplexResult]) {}
}

export type SolutionAction =
  | ResetAction
  | SetProductsAction
  | SetProductStepsAction
  | SetSizeAction
  | SetStateAction
  | SetResultAction;
