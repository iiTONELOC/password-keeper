/* istanbul ignore file */
import {me} from './me';
import {myPasswords} from './myPasswords';
import {myPublicKeys} from './myPublicKeys';

export {me, myPublicKeys, myPasswords};

const queries = {
  me,
  myPasswords,
  myPublicKeys
};

export default queries;
