const typeDefs = `#graphql
    # _____Data Types_____

    # >>MongoDB Models<<
    type User {
        _id: ID!
        email: String!
        username: String!
        subUsers: [User!]!
        account: Account!
        publicKeys: [PublicKey!]!
        passwords: [EncryptedUserPassword!]!
    }

    type AccountType {
        type: String!
        price: Float!
        maxUsers: Int!
        maxPublicKeys: Int!
        maxPasswords: Int!
    }

    type Account {
        _id: ID!
        owner: User!
        status: String!
        subUsers: [User!]!
        accountType: AccountType!
        publicKeys: [PublicKey!]!
        passwords: [EncryptedUserPassword!]!
    }

    type EncryptedData {
        encryptedData: String!  
        iv: String!
    }

    type EncryptedUserPassword {
        _id: ID!
        owner: User!
        expiresAt: String
        url: EncryptedData
        name: EncryptedData!
        username: EncryptedData!
        password: EncryptedData!
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
        user: ME!
        nonce: String!
        expiresAt: String
    }

    # >> Query and Mutation Types <<
    type ME {
        _id: ID!
        email: String!
        username: String!
        account: Account!
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
    
    input encryptedInput {
        encryptedData: String!
        iv: String!
    }

    input addPasswordArgs {
        url: encryptedInput
        name: encryptedInput!
        username: encryptedInput!
        password: encryptedInput!
    }

    # _____Queries and Mutations _____
    
    type Query {        
        me: ME
        myPublicKeys: [PublicKey!]!
        myPasswords: [EncryptedUserPassword!]!
    }

    type Mutation {
        addPassword(addPasswordArgs:addPasswordArgs!): EncryptedUserPassword!
        createUser(createUserArgs:createUserArgs!): createdUserPayload!
        completeLogin(completeLoginArgs:completeLoginArgs!): AuthSession!
        completeAccount(completeAccountArgs:completeAccountArgs!): AuthSession!
        getLoginNonce(getLoginNonceArgs:getLoginNonceArgs!): getLoginNoncePayload!
    }
`;

export {typeDefs};
