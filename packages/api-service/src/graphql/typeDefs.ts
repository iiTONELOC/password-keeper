const typeDefs = `#graphql
 
    type User {
        _id: ID!
        username: String!
        email: String!
        publicKeys: [PublicKey!]!
    }
    
    type PublicKey {
        _id: ID!
        key: String!
        owner: User!
        expiresAt: String
    }

    type AccountCompletionInvite {
        _id: ID!
        nonce: String!
        user: User!
        expiresAt: String
    }

    type AuthSession {
        _id: ID!
        nonce: String!
        user: ME!
        expiresAt: String
    }

    type ME {
        _id: ID!
        username: String!
        email: String!
    }

    type inviteToken {
        token: String!
        expiresAt: String!
    }

    input createUserArgs {
        username: String!
        email: String!
    }

    type createdUserPayload {
        user: User!
        inviteToken: inviteToken!
    }
    
    input completeAccountArgs {
        nonce: String!
        publicKey: String!
    }
    
    type Query {        
        me: ME
    }

    type Mutation {
        createUser(createUserArgs:createUserArgs!): createdUserPayload!
        completeAccount(completeAccountArgs:completeAccountArgs!): AuthSession!
       
    }
`;

export {typeDefs};
