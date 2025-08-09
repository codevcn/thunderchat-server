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
  GROUP_CHAT = 'group-chat',
  GROUP_MEMBER = 'group-member',
  PROFILE = 'profile',
  PIN_CONVERSATION = 'pin-conversation',
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
  ALL_USERS_AND_MESSAGES = 'allUsersAndMessages',
}

export enum EWorkerEvents {
  ERROR = 'error',
  EXIT = 'exit',
  MESSAGE = 'message',
}

export enum EMsgEncryptionAlgorithms {
  AES_256_ECB = 'aes-256-ecb',
}

export enum EChatType {
  DIRECT = 'DIRECT',
  GROUP = 'GROUP',
}

export enum ESortTypes {
  TIME_ASC = 'ASC',
  TIME_DESC = 'DESC',
}

export enum EMessageStatus {
  SENT = 'SENT',
  SEEN = 'SEEN',
}

export enum EAppRoles {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

export enum EGlobalMessages {
  UNKNOWN_FILE_TYPE = 'Unknown file type',
}

export enum EInternalEvents {
  CREATE_GROUP_CHAT = 'CREATE_GROUP_CHAT',
  ADD_MEMBERS_TO_GROUP_CHAT = 'ADD_MEMBERS_TO_GROUP_CHAT',
  REMOVE_GROUP_CHAT_MEMBERS = 'REMOVE_GROUP_CHAT_MEMBERS',
}

export enum EUserOnlineStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
}
