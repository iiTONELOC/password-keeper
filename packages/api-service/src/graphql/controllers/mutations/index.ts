import {createUser} from './createUser';
import {addPassword} from './addPassword';
import {getLoginNonce} from './loginInvite';
import {completeLogin} from './completeLogin';
import {completeAccount} from './completeAccount';

const mutations = {
  createUser,
  getLoginNonce,
  completeLogin,
  completeAccount,
  addPassword
};

export default mutations;

export {createUser, completeAccount, getLoginNonce, completeLogin, addPassword};
