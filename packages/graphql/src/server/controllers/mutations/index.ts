import {createUser, updateUser} from './user';
import {getLoginNonce, completeLogin} from './login';
import {addPassword, updatePassword, deletePassword} from './password';
import {addPublicKeyMutation, updatePublicKey, deletePublicKey} from './publicKey';

const mutations = {
  createUser,
  updateUser,
  addPassword,
  getLoginNonce,
  completeLogin,
  updatePassword,
  deletePassword,
  updatePublicKey,
  deletePublicKey,
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
  updatePublicKey,
  deletePublicKey,
  addPublicKeyMutation
};
