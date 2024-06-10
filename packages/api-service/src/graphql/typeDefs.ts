const typeDefs = `#graphql

    type User {
        id: ID!
        username: String!
        email: String!
        publicKeys: [PublicKey!]!
    }

    type ME {
        id: ID!
        username: String!
        email: String!
    }

    type Auth {
        token: ID!
        user : ME!
    }

    type PublicKey {
        id: ID!
        key: String!
        owner: User!
        expiresAt: String
    }

    type createUserPayload {
        username: String!
        email: String!
    }

    type createPublicKeyPayload {
        key: String!
        owner: User!
        expiresAt: String
    }
    
    type Query {        
        me: ME
    }

    type Mutation {
        createUser(username: String!, email: String!): createUserPayload!
        createPublicKey(key: String!, owner: ID!, expiresAt: String): createPublicKeyPayload!
        login(username: String!, email: String!): Auth!
    }
`;

export {typeDefs};
