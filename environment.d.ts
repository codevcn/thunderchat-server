declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production'
      PORT: string
      DATABASE_URL: string
      SESSION_SECRET: string
      SESSION_NAME: string
      COOKIE_EXPIRE_IN_HOURS: string
      JWT_SECRET: string
      JWT_TOKEN_MAX_AGE_IN_HOUR: string
      REDIS_CLOUD_DB_PASSWORD: string
      REDIS_HOST: string
      CLIENT_DOMAIN_DEV: string
      CLIENT_HOST_DEV: string
      CLIENT_DOMAIN: string
      CLIENT_HOST: string
      ELASTICSEARCH_URL: string
      ELASTIC_API_KEY: string
      DECRYPT_USER_KEY_MASTER_KEY: string
      AWS_ACCESS_KEY_ID: string
      AWS_SECRET_ACCESS_KEY: string
      AWS_REGION: string
      AWS_BUCKET_NAME: string
      AWS_ACCESS_KEY: string
      AWS_SECRET_KEY: string
      AWS_REGION: string
      AWS_S3_BUCKET: string
    }
  }
}

export {}
