import { compose, createSelector } from '@ngrx/store';

import { Column, Game, LinkValue, Rational, SankeyAlign } from '~/models';
import { State } from '../';
import * as Settings from '../settings';
import {
  ColumnsState,
  initialColumnsState,
  PreferencesState,
} from './preferences.reducer';

export const preferencesState = (state: State): PreferencesState =>
  state.preferencesState;
const sColumns = (state: PreferencesState): ColumnsState => state.columns;
const sLinkSize = (state: PreferencesState): LinkValue => state.linkSize;
const sLinkText = (state: PreferencesState): LinkValue => state.linkText;
const sSankeyAlign = (state: PreferencesState): SankeyAlign =>
  state.sankeyAlign;
const sSimplex = (state: PreferencesState): boolean => state.simplex;

export const getColumns = compose(sColumns, preferencesState);
export const getLinkSize = compose(sLinkSize, preferencesState);
export const getLinkText = compose(sLinkText, preferencesState);
export const getSankeyAlign = compose(sSankeyAlign, preferencesState);
export const getSimplex = compose(sSimplex, preferencesState);

function hideColumns(col: ColumnsState, ...columns: Column[]): ColumnsState {
  return columns.reduce((acc, column) => {
    acc[column] = {
      ...col[column],
      show: false
    };

    return acc;
  }, {});
}

export const getColumnsState = createSelector(
  getColumns,
  Settings.getGame,
  (col, game): ColumnsState => {
    switch (game) {
      case Game.Factorio:
        return {
          ...initialColumnsState,
          ...col,
          ...hideColumns(col, Column.Overclock)
        };
      case Game.DysonSphereProgram:
        return {
          ...initialColumnsState,
          ...col,
          ...hideColumns(col, Column.Wagons, Column.Overclock, Column.Beacons, Column.Pollution)
        };
      case Game.Satisfactory:
        return {
          ...initialColumnsState,
          ...col,
          ...hideColumns(col, Column.Beacons, Column.Pollution)
        };
      case Game.ReFactory:
        return {
          ...initialColumnsState,
          ...col,
          ...hideColumns(col, Column.Wagons, Column.Overclock, Column.Beacons, Column.Pollution)
        };
    }
  }
);

export const getLinkPrecision = createSelector(
  getLinkText,
  getColumns,
  (linkText, columns) => {
    switch (linkText) {
      case LinkValue.Items:
        return columns[Column.Items].precision;
      case LinkValue.Belts:
        return columns[Column.Belts].precision;
      case LinkValue.Wagons:
        return columns[Column.Wagons].precision;
      case LinkValue.Factories:
        return columns[Column.Factories].precision;
      default:
        return null;
    }
  }
);

export const getSimplexModifiers = createSelector(
  getSimplex,
  Settings.getRationalCostInput,
  Settings.getRationalCostIgnored,
  (simplex, costInput, costIgnored) => ({
    simplex,
    costInput,
    costIgnored,
  })
);
