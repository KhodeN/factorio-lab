import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest, Subject } from 'rxjs';
import { filter, map, take } from 'rxjs/operators';

import { environment } from 'src/environments';
import {
  DisplayRateVal,
  Entities,
  FuelType,
  RateType,
  Rational,
  RationalProduct,
  SimplexResult,
  Step,
} from '~/models';
import { State } from '~/store';
import { getFactorySettings } from '~/store/factories';
import { getSimplex } from '~/store/preferences';
import { checkProducts } from '~/store/products';
import { getRationalRecipeSettings } from '~/store/recipes';
import {
  getAdjustmentData,
  getBeltSpeed,
  getDataset,
  getDatasets,
  getDisplayRate,
} from '~/store/settings';
import * as Solution from '~/store/solution';
import {
  SetSizeAction,
  SetStateAction as SetStatusAction,
} from '~/store/solution';
import { RateUtility, RecipeUtility, SimplexUtility } from '~/utilities';
import { RouterService } from './router.service';

@Injectable({
  providedIn: 'root',
})
export class StateService {
  constructor(private router: RouterService, private store: Store<State>) {
    this.checkViaState();
    this.calculateSteps();

    // Used only in development to update hash files
    // istanbul ignore next
    if (environment.debug) {
      this.checkHash();
    }
  }

  checkViaState(): void {
    // this.store.select(checkViaState).subscribe((s) => {
    //   for (const product of s.products) {
    //     if (
    //       product.viaId &&
    //       product.viaId !== product.itemId &&
    //       product.rate.nonzero() &&
    //       s.rates[product.id].isZero()
    //     ) {
    //       // Reset invalid viaId
    //       // This normally occurs when a chosen viaId no longer appears in the result steps
    //       // Usually due to some parent item/recipe being ignored or recipe disabled
    //       this.store.dispatch(
    //         new SetViaAction({ id: product.id, value: null })
    //       );
    //     }
    //   }
    // });
  }

  calculateSteps(): void {
    this.store
      .select(checkProducts)
      .subscribe(async ({ products, itemSettings, disabledRecipes, data }) => {
        this.store.dispatch(new Solution.ResetAction());

        if (!products || !products.length) {
          return;
        }

        const productSteps: Entities<[string, Rational][]> = {};
        for (const p of products) {
          productSteps[p.itemId] = await SimplexUtility.getSteps(
            p.itemId,
            itemSettings,
            disabledRecipes,
            data,
            p.rateType === RateType.Factories
          );
        }

        combineLatest([
          this.store.select(getRationalRecipeSettings).pipe(take(1)),
          this.store.select(getFactorySettings).pipe(take(1)),
          this.store.select(getDisplayRate).pipe(take(1)),
          this.store.select(getBeltSpeed).pipe(take(1)),
          this.store.select(getAdjustmentData).pipe(take(1)),
        ]).subscribe(
          ([recipeSettings, factories, displayRate, beltSpeed, adj]) => {
            products = products.map((p) =>
              RecipeUtility.adjustProduct(
                p,
                productSteps,
                recipeSettings,
                factories,
                data
              )
            );

            this.store.dispatch(new Solution.SetProductsAction(products));
            this.store.dispatch(
              new Solution.SetProductStepsAction(productSteps)
            );

            const rProducts = products.map((p) => new RationalProduct(p));
            const rates: Entities<Rational> = {};
            for (const p of rProducts) {
              switch (p.rateType) {
                case RateType.Items: {
                  const rate = p.rate.div(DisplayRateVal[displayRate]);
                  if (p.viaId === p.itemId) {
                    rates[p.id] = rate;
                  } else {
                    const via = RecipeUtility.getProductStepData(
                      productSteps,
                      p
                    );
                    if (via) {
                      rates[p.id] = rate.div(via[1]);
                    } else {
                      rates[p.id] = Rational.zero;
                    }
                  }
                  break;
                }
                case RateType.Belts: {
                  if (p.viaId === p.itemId) {
                    rates[p.id] = p.rate.mul(
                      beltSpeed[p.viaSetting || itemSettings[p.itemId].belt]
                    );
                  } else {
                    const via = RecipeUtility.getProductStepData(
                      productSteps,
                      p
                    );
                    if (via) {
                      rates[p.id] = p.rate
                        .mul(
                          beltSpeed[p.viaSetting || itemSettings[via[0]].belt]
                        )
                        .div(via[1]);
                    } else {
                      rates[p.id] = Rational.zero;
                    }
                  }
                  break;
                }
                case RateType.Wagons: {
                  if (p.viaId === p.itemId) {
                    const item = data.itemR[p.itemId];
                    const wagon =
                      data.itemR[p.viaSetting || itemSettings[p.itemId].wagon];
                    rates[p.id] = p.rate
                      .div(DisplayRateVal[displayRate])
                      .mul(
                        item.stack
                          ? item.stack.mul(wagon.cargoWagon.size)
                          : wagon.fluidWagon.capacity
                      );
                  } else {
                    const via = RecipeUtility.getProductStepData(
                      productSteps,
                      p
                    );
                    if (via) {
                      const item = data.itemR[via[0]];
                      const wagon =
                        data.itemR[p.viaSetting || itemSettings[via[0]].wagon];
                      rates[p.id] = p.rate
                        .div(DisplayRateVal[displayRate])
                        .mul(
                          item.stack
                            ? item.stack.mul(wagon.cargoWagon.size)
                            : wagon.fluidWagon.capacity
                        )
                        .div(via[1]);
                    } else {
                      rates[p.id] = Rational.zero;
                    }
                  }
                  break;
                }
                case RateType.Factories: {
                  let recipeId = data.itemRecipeIds[p.itemId];
                  if (recipeId && p.viaId === recipeId) {
                    const recipe = data.recipeR[recipeId];
                    rates[p.id] = p.rate
                      .div(recipe.time)
                      .mul(recipe.out[p.itemId]);
                    if (recipe.adjustProd) {
                      rates[p.id] = rates[p.id].div(recipe.productivity);
                    }
                  } else {
                    const via = RecipeUtility.getProductStepData(
                      productSteps,
                      p
                    );
                    if (via) {
                      recipeId = via[0];
                      rates[p.id] = p.rate.div(via[1]);
                    } else {
                      rates[p.id] = Rational.zero;
                    }
                  }

                  // Adjust based on product recipe settings
                  if (recipeId && p.viaSetting) {
                    const customSettings = {
                      ...recipeSettings,
                      ...{
                        [recipeId]: {
                          ...{
                            factory: p.viaSetting,
                            factoryModules: p.viaFactoryModules,
                            beaconCount: p.viaBeaconCount,
                            beacon: p.viaBeacon,
                            beaconModules: p.viaBeaconModules,
                          },
                        },
                      },
                    };
                    const recipeR = RecipeUtility.adjustRecipes(
                      customSettings,
                      adj.fuel,
                      adj.miningBonus,
                      adj.researchSpeed,
                      adj.data
                    );
                    const oldRecipe = data.recipeR[recipeId];
                    const newRecipe = recipeR[recipeId];
                    const ratio = newRecipe.productivity
                      .div(newRecipe.time)
                      .div(oldRecipe.productivity)
                      .mul(oldRecipe.time);
                    rates[p.id] = rates[p.id].mul(ratio);
                  }
                  break;
                }
              }
            }

            const steps: Step[] = [];
            for (const product of products) {
              RateUtility.addStepsFor(
                product.itemId,
                rates[product.id],
                steps,
                itemSettings,
                data
              );
            }

            this.store
              .select(getSimplex)
              .pipe(take(1))
              .subscribe((simplex) => {
                if (simplex) {
                  const size = new Subject<[number, number]>();
                  size.subscribe((s) =>
                    this.store.dispatch(new SetSizeAction(s))
                  );
                  const status = new Subject<[number, number]>();
                  status.subscribe((s) =>
                    this.store.dispatch(new SetStatusAction(s))
                  );
                  SimplexUtility.solve(
                    steps,
                    itemSettings,
                    disabledRecipes,
                    data,
                    true,
                    size,
                    status
                  ).then((result) => {
                    this.store.dispatch(new Solution.SetResultAction(result));
                  });
                } else {
                  this.store.dispatch(
                    new Solution.SetResultAction([steps, SimplexResult.Skipped])
                  );
                }
                return steps;
              });
          }
        );
      });
  }

  // Used only in development to update hash files
  // istanbul ignore next
  checkHash(): void {
    this.store
      .select(getDatasets)
      .pipe(
        filter((d) => !!d.length),
        take(1),
        map((d) => d[0].id)
      )
      .subscribe((id) => {
        this.router
          .requestHash(id)
          .pipe(take(1))
          .subscribe((h) => {
            this.store
              .select(getDataset)
              .pipe(take(1))
              .subscribe((d) => {
                console.log(id);
                console.log(
                  JSON.stringify(
                    d.complexRecipeIds.filter((i) => !d.itemEntities[i])
                  )
                );
                const old = JSON.stringify(h);
                for (const id of [...d.itemIds]
                  .sort()
                  .filter((i) => h.items.indexOf(i) === -1)) {
                  h.items.push(id);
                }
                for (const id of [...d.beaconIds]
                  .sort()
                  .filter((i) => h.beacons.indexOf(i) === -1)) {
                  h.beacons.push(id);
                }
                for (const id of [...d.beltIds]
                  .sort()
                  .filter((i) => h.belts.indexOf(i) === -1)) {
                  h.belts.push(id);
                }
                if (d.fuelIds[FuelType.Chemical]) {
                  for (const id of [...d.fuelIds[FuelType.Chemical]]
                    .sort()
                    .filter((i) => h.fuels.indexOf(i) === -1)) {
                    h.fuels.push(id);
                  }
                }
                for (const id of [...d.cargoWagonIds, ...d.fluidWagonIds]
                  .sort()
                  .filter((i) => h.wagons.indexOf(i) === -1)) {
                  h.wagons.push(id);
                }
                for (const id of [...d.factoryIds]
                  .sort()
                  .filter((i) => h.factories.indexOf(i) === -1)) {
                  h.factories.push(id);
                }
                for (const id of [...d.moduleIds]
                  .sort()
                  .filter((i) => h.modules.indexOf(i) === -1)) {
                  h.modules.push(id);
                }
                for (const id of [...d.recipeIds]
                  .sort()
                  .filter((i) => h.recipes.indexOf(i) === -1)) {
                  h.recipes.push(id);
                }
                if (old === JSON.stringify(h)) {
                  console.log('No change in hash');
                } else {
                  console.log('New hash:');
                  console.log(JSON.stringify(h));
                }
              });
          });
      });
  }
}
