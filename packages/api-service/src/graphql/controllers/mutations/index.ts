import {createUser} from './createUser';
import {getLoginNonce} from './loginInvite';
import {completeLogin} from './completeLogin';
import {completeAccount} from './completeAccount';

const mutations = {
  createUser,
  getLoginNonce,
  completeLogin,
  completeAccount
};

export default mutations;

export {createUser, completeAccount, getLoginNonce, completeLogin};
