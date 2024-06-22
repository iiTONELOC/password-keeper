import {completeAccount} from './account';
import {createUser, updateUser} from './user';
import {addPublicKeyMutation} from './publicKey';
import {getLoginNonce, completeLogin} from './login';
import {addPassword, updatePassword, deletePassword} from './password';

const mutations = {
  createUser,
  updateUser,
  addPassword,
  getLoginNonce,
  completeLogin,
  updatePassword,
  deletePassword,
  completeAccount,
  addPublicKey: addPublicKeyMutation
};

export default mutations;

export {
  createUser,
  updateUser,
  addPassword,
  getLoginNonce,
  completeLogin,
  updatePassword,
  deletePassword,
  completeAccount,
  addPublicKeyMutation
};
