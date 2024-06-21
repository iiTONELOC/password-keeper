import {createUser} from './createUser';
import {addPassword} from './addPassword';
import {getLoginNonce} from './loginInvite';
import {completeLogin} from './completeLogin';
import {completeAccount} from './completeAccount';
import {addPublicKeyMutation} from './addPublicKey';

const mutations = {
  createUser,
  getLoginNonce,
  completeLogin,
  completeAccount,
  addPublicKey: addPublicKeyMutation,
  addPassword
};

export default mutations;

export {
  createUser,
  completeAccount,
  getLoginNonce,
  completeLogin,
  addPassword,
  addPublicKeyMutation
};
