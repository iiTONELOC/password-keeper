import queries from './queries';
import mutations from './mutations';

const graphqlControllers = {
  ...queries,
  ...mutations
};

export default graphqlControllers;

export {queries, mutations};
