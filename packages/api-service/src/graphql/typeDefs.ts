const typeDefs = `#graphql
    # _____Data Types_____

    # >>MongoDB Models<<
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

    # >> Query and Mutation Types <<
    type ME {
        _id: ID!
        username: String!
        email: String!
    }

    type inviteToken {
        token: String!
        expiresAt: String!
    } 

    # >> Payload Types <<

    type createdUserPayload {
        user: User!
        inviteToken: inviteToken!
    }

    type getLoginNoncePayload {
        nonce: String!
        challengeResponse: String!
    }
    
    # _____Input Types_____

    input completeAccountArgs {
        nonce: String!
        publicKey: String!
    }

    input getLoginNonceArgs {
        username: String!,
        challenge: String!
        signature: String!
    }

    input completeLoginArgs {
        nonce: String!
        userId: String!
        signature: String!
    }
    
     input createUserArgs {
        username: String!
        email: String!
    }

    # _____Queries and Mutations _____
    
    type Query {        
        me: ME
    }

    type Mutation {
        getLoginNone(getLoginNonceArgs:getLoginNonceArgs!): getLoginNoncePayload!
        completeLogin(completeLoginArgs:completeLoginArgs!): AuthSession!
        createUser(createUserArgs:createUserArgs!): createdUserPayload!
        completeAccount(completeAccountArgs:completeAccountArgs!): AuthSession!
    }
`;

export {typeDefs};
