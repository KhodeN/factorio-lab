import { ActionReducerMap, MetaReducer } from '@ngrx/store';
import { storeFreeze } from 'ngrx-store-freeze';

import { environment } from 'src/environments/environment';
import { DatasetsState, datasetsReducer } from './datasets';
import { factoriesReducer, FactoriesState } from './factories';
import { ItemsState, itemsReducer } from './items';
import { preferencesReducer, PreferencesState } from './preferences';
import { ProductsState, productsReducer } from './products';
import { RecipesState, recipesReducer } from './recipes';
import { SettingsState, settingsReducer } from './settings';
import { solutionReducer, SolutionState } from './solution';
import { storageMetaReducer } from './storage.reducer';

export interface State {
  datasetsState: DatasetsState;
  productsState: ProductsState;
  solutionState: SolutionState;
  itemsState: ItemsState;
  recipesState: RecipesState;
  factoriesState: FactoriesState;
  settingsState: SettingsState;
  preferencesState: PreferencesState;
}

export const reducers: ActionReducerMap<State> = {
  datasetsState: datasetsReducer,
  productsState: productsReducer,
  solutionState: solutionReducer,
  itemsState: itemsReducer,
  recipesState: recipesReducer,
  factoriesState: factoriesReducer,
  settingsState: settingsReducer,
  preferencesState: preferencesReducer,
};

/* No need to test without storeFreeze, ignore that branch here. */
export const metaReducers: MetaReducer<State>[] = environment.testing
  ? [storeFreeze]
  : /* istanbul ignore next */
  environment.production
  ? [storageMetaReducer]
  : [storeFreeze, storageMetaReducer];
