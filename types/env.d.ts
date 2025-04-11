declare namespace NodeJS {
  interface ProcessEnv {
    FIREBASE_PROJECT_ID: string;
    FIREBASE_PRIVATE_KEY: string;
    FIREBASE_CLIENT_EMAIL: string;
    
    MAIL_HOST: string;
    EMAIL: string;
    EMAIL_PASSWORD: string;
    
    NEXT_PUBLIC_APP_URL?: string;
  }
} 