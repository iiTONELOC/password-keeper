import {getLoginNonce, completeLogin} from './login';
import {createUser, addPassword, completeAccount, addPublicKeyMutation, updateUser} from './user';

const mutations = {
  createUser,
  updateUser,
  addPassword,
  getLoginNonce,
  completeLogin,
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
  completeAccount,
  addPublicKeyMutation
};
