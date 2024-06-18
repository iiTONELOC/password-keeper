import {logger} from '../utils';
import connectToDB, {disconnectFromDB} from '../db/connection';
import {DBConnection, IAccountType} from 'passwordkeeper.types';
import {AccountTypeModel, AccountTypeMap, DefaultAccountTypes} from '../db/Models';

// seed the AccountType collection with the default account types using the data from the AccountTypeMap
export const createDefaultAccountTypes = async () => {
  const accountTypes: IAccountType[] = Object.values(AccountTypeMap).map(
    accountType => accountType
  );

  await AccountTypeModel.insertMany(accountTypes);
};

export const hasPopulatedAccountTypes = async () => {
  const accountTypes = await AccountTypeModel.find();
  return accountTypes.length === DefaultAccountTypes.length;
};

export const seedAccountTypes = async () => {
  try {
    logger.info('Seeding the database with default account types...');

    const hasPopulated = await hasPopulatedAccountTypes();

    if (!hasPopulated) {
      await AccountTypeModel.deleteMany({});
      await createDefaultAccountTypes();
      logger.info('Database seeded successfully!');
    } else {
      logger.info('Database already seeded!');
    }
  } catch (error) {
    logger.error('Error seeding the database!\n', error); //NOSONAR
  }
};

if (require.main === module) {
  // if we are not in production, look for an argument to specify the database to seed
  let db: DBConnection | null = null;
  (async () => {
    if (process.env.NODE_ENV !== 'production') {
      const dbArg = process.argv[2];
      db = dbArg ? await connectToDB(dbArg) : await connectToDB();
      await seedAccountTypes();
    } else {
      await seedAccountTypes();
    }

    db && (await disconnectFromDB(db));
  })();
}
