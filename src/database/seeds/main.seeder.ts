import { DataSource } from 'typeorm';
import { runSeeders, Seeder, runSeeder } from 'typeorm-extension';
import { UserSeeder } from './user.seeder';
//import { MenuSeeder } from './menu.seeder';

export class MainSeeder implements Seeder {
  constructor(protected seedName: string) {
    console.log('seedname : ' + seedName);
  }
  public async run(dataSource: DataSource): Promise<void> {
    await runSeeders(dataSource, {
      seeds: [UserSeeder],
    });
  }
}
