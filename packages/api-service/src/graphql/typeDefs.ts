const typeDefs = `#graphql
    # _____Data Types_____

    # >>MongoDB Schemas<<
    type EncryptedData {
        encryptedData: String!  
        iv: String!
    }

    # >>MongoDB Models<<
    #--------------------------------

    # _____ USER _____
    type User {
        _id: ID!
        email: String!
        username: String!
        subUsers: [User!]!
        account: Account!
        publicKeys: [PublicKey!]!
        passwords: [EncryptedUserPassword!]!
    }

    # _____ ACCOUNT _____
     type AccountCompletionInvite {
        _id: ID!
        nonce: String!
        user: User!
        expiresAt: String
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

    # _____ PASSWORD _____
    type EncryptedUserPassword {
        _id: ID!
        owner: User!
        expiresAt: String
        url: EncryptedData
        name: EncryptedData!
        username: EncryptedData!
        password: EncryptedData!
    }

     type UpdatedEncryptedUserPassword {
        _id: ID!
        owner: User
        expiresAt: String
        url: EncryptedData
        name: EncryptedData
        username: EncryptedData
        password: EncryptedData
    }
    
    # _____ PUBLIC KEY _____
    type PublicKey {
        _id: ID!
        key: String!
        owner: User!
        label: String
        default: Boolean
        expiresAt: String
        description: String
    }

    # _____ AUTH SESSION _____
    type AuthSession {
        _id: ID!
        user: ME!
        nonce: String!
        expiresAt: String
    }

    # >> Query and Mutation Types <<
    #--------------------------------  

    # _____ USER _____
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
    #--------------------------------

    # _____ CREATE USER _____
    type createdUserPayload {
        user: User!
        inviteToken: inviteToken!
    }

    # _____ GET LOGIN NONCE _____
    type getLoginNoncePayload {
        nonce: String!
        challengeResponse: String!
    }

    # _____ ADD PUBLIC KEY _____
    type addPublicKeyMutationPayload {
        user: User!
        addedKeyId: ID!
    }
    
    # >> Input (Args) Types <<
    #--------------------------------

    # _____ USER _____
    input createUserArgs {
        username: String!
        email: String!
    }
    
    input completeAccountArgs {
        nonce: String!
        publicKey: String!
    }

    input updateUserArgs {
        username: String
        email: String
    }

    # _____ AUTH SESSION _____
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
    
    # _____ PASSWORD _____
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
    
    input updatePasswordArgs {
        owner: ID!
        passwordId: ID!
        expiresAt: String
        url: encryptedInput
        name: encryptedInput
        username: encryptedInput
        password: encryptedInput
    }


    # _____ PUBLIC KEY _____
    input addPublicKeyArgs {
        key: String!
        label: String
        default: Boolean
        expiresAt: String
        description: String
    }
    
    # >> Query and Mutation Definition Types <<
    type Query {        
        me: ME
        myPublicKeys: [PublicKey!]!
        myPasswords: [EncryptedUserPassword!]!
    }

    type Mutation {
        deleteUser: User!
        updateUser(updateUserArgs:updateUserArgs!): User!
        getPassword(passwordId: ID!): EncryptedUserPassword!
        deletePassword(passwordId: ID!): EncryptedUserPassword!
        createUser(createUserArgs:createUserArgs!): createdUserPayload!
        completeLogin(completeLoginArgs:completeLoginArgs!): AuthSession!
        addPassword(addPasswordArgs:addPasswordArgs!): EncryptedUserPassword!
        completeAccount(completeAccountArgs:completeAccountArgs!): AuthSession!
        getLoginNonce(getLoginNonceArgs:getLoginNonceArgs!): getLoginNoncePayload!
        addPublicKey(addPublicKeyArgs:addPublicKeyArgs!): addPublicKeyMutationPayload!
        updatePassword(updatePasswordArgs:updatePasswordArgs!): UpdatedEncryptedUserPassword!
        

      
        # TODO: Finish CRUD operations for users, public keys, and passwords
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
