import { IdName } from '../id-name';

export enum Game {
  Factorio,
  DysonSphereProgram,
  Satisfactory,
  ReFactory
}

export const GameOptions: IdName<Game>[] = [
  { id: Game.Factorio, name: 'Factorio' },
  { id: Game.DysonSphereProgram, name: 'Dyson Sphere Program' },
  { id: Game.Satisfactory, name: 'Satisfactory' },
  { id: Game.ReFactory, name: 'ReFactory' }
];
