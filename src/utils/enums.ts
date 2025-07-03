export enum ERoutes {
   AUTH = 'auth',
   USER = 'user',
   DIRECT_CHAT = 'direct-chat',
   MESSAGE = 'message',
   FRIEND = 'friend',
   FRIEND_REQUEST = 'friend-request',
   HEALTHCHECK = 'healthcheck',
   STICKER = 'sticker',
   SEARCH = 'search',
}

export enum EClientCookieNames {
   JWT_TOKEN_AUTH = 'jwt_token_auth',
}

export enum ELengths {
   PASSWORD_MIN_LEN = 6,
}

export enum EProviderTokens {
   PRISMA_CLIENT = 'Prisma_Client_Provider',
}

export enum ECommonStatuses {
   SUCCESS = 'success',
   FAIL = 'fail',
   ERROR = 'error',
}

export enum EEnvironments {
   development = 'development',
   production = 'production',
}

export enum ESyncDataToESWorkerType {
   CREATE_MESSAGE = 'createMessage',
   UPDATE_MESSAGE = 'updateMessage',
   DELETE_MESSAGE = 'deleteMessage',
   CREATE_USER = 'createUser',
   UPDATE_USER = 'updateUser',
   DELETE_USER = 'deleteUser',
   CREATE_PROFILE = 'createProfile',
   UPDATE_PROFILE = 'updateProfile',
   DELETE_PROFILE = 'deleteProfile',
}

export enum EWorkerEvents {
   ERROR = 'error',
   EXIT = 'exit',
   MESSAGE = 'message',
}

export enum EMsgEncryptionAlgorithms {
   AES_256_ECB = 'aes-256-ecb',
}
