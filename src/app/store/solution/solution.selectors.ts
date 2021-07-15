import { compose, createSelector } from '@ngrx/store';

import { Entities, Product, Rational, Step } from '~/models';
import { FlowUtility, RateUtility } from '~/utilities';
import { State } from '..';
import * as Items from '../items';
import * as Preferences from '../preferences';
import * as Recipes from '../recipes';
import * as Settings from '../settings';
import { SolutionState } from './solution.reducer';

/* Base selector functions */
export const solutionState = (state: State): SolutionState =>
  state.solutionState;
const sProducts = (state: SolutionState): Product[] => state.products;
const sProductSteps = (state: SolutionState): Entities<[string, Rational][]> =>
  state.productSteps;
const sSteps = (state: SolutionState): Step[] => state.steps;

/** Simple selectors */
export const getProducts = compose(sProducts, solutionState);
export const getProductSteps = compose(sProductSteps, solutionState);
export const getBaseSteps = compose(sSteps, solutionState);

/** Complex selectors */
export const getSortedSteps = createSelector(
  getBaseSteps,
  Recipes.getAdjustedDataset,
  (steps, data) =>
    RateUtility.sortHierarchy(
      RateUtility.calculateOutputs(RateUtility.copy(steps), data)
    )
);

export const getNormalizedSteps = createSelector(
  getSortedSteps,
  Settings.getDisplayRate,
  (steps, displayRate) =>
    RateUtility.displayRate(RateUtility.copy(steps), displayRate)
);

export const getSteps = createSelector(
  getNormalizedSteps,
  Items.getItemSettings,
  Recipes.getRecipeSettings,
  Settings.getBeltSpeed,
  Recipes.getAdjustedDataset,
  (steps, itemSettings, recipeSettings, beltSpeed, data) =>
    RateUtility.calculateBelts(
      RateUtility.copy(steps),
      itemSettings,
      recipeSettings,
      beltSpeed,
      data
    )
);

export const getSankey = createSelector(
  getSteps,
  Preferences.getLinkSize,
  Preferences.getLinkText,
  Preferences.getLinkPrecision,
  Recipes.getAdjustedDataset,
  (steps, linkSize, linkText, linkPrecision, data) =>
    FlowUtility.buildSankey(
      RateUtility.copy(steps),
      linkSize,
      linkText,
      linkPrecision,
      data
    )
);
