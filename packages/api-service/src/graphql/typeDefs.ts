const typeDefs = `#graphql
    # _____Data Types_____

    # >>MongoDB Schemas<<
    type EncryptedData {
        encryptedData: String!  
        iv: String!
    }

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
        label: String
        default: Boolean
        expiresAt: String
        description: String
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

    # >> Payload (Return) Types <<
    type createdUserPayload {
        user: User!
        inviteToken: inviteToken!
    }

    type getLoginNoncePayload {
        nonce: String!
        challengeResponse: String!
    }

    type addPublicKeyMutationPayload {
        user: User!
        addedKeyId: ID!
    }
    
    # >> Input (Args) Types <<
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

    input addPublicKeyArgs {
        key: String!
        label: String
        default: Boolean
        expiresAt: String
        description: String
    }
    
    input updateUserArgs {
        username: String
        email: String
    }

    # >> Query and Mutation Definition Types <<
    type Query {        
        me: ME
        myPublicKeys: [PublicKey!]!
        myPasswords: [EncryptedUserPassword!]!
    }

    type Mutation {
        updateUser(updateUserArgs:updateUserArgs!): User!
        createUser(createUserArgs:createUserArgs!): createdUserPayload!
        completeLogin(completeLoginArgs:completeLoginArgs!): AuthSession!
        addPassword(addPasswordArgs:addPasswordArgs!): EncryptedUserPassword!
        completeAccount(completeAccountArgs:completeAccountArgs!): AuthSession!
        getLoginNonce(getLoginNonceArgs:getLoginNonceArgs!): getLoginNoncePayload!
        addPublicKey(addPublicKeyArgs:addPublicKeyArgs!): addPublicKeyMutationPayload!
      
        # TODO: Finish CRUD operations for users, public keys, and passwords
        
        # deleteUser - delete user account and all associated data
        #              (account, public keys, passwords, authSessions, session invites, etc.)
        # updatePassword - update password info like url, name, username, expiresAt
        # changePassword - change the password and reset the expiresAt date
        # deletePassword - delete a password (remove from user and the associated account)
        # updatePublicKey - update public key info like label, description, expiresAt
        # changePublicKey - change the public key and reset the expiresAt date
        # deletePublicKey - delete a public key (remove from user and the associated account)
        #
        # After the CRUD operations are complete, add the following:
        #
        # addSubUser - add a sub user to the account if supported by the account type
        # removeSubUser - remove a sub user from the account
        # upgradeAccount - upgrade the account to a higher account type
        # downgradeAccount - downgrade the account to a lower account type
        # viewAccount - view the account details
    }
`;

export {typeDefs};
