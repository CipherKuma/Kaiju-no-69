declare namespace NodeJS {
  interface ProcessEnv {
    // Database Configuration
    NEXT_PUBLIC_SUPABASE_URL: string;
    NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
    SUPABASE_SERVICE_ROLE_KEY: string;

    // Web3 Configuration
    NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID: string;
    NEXT_PUBLIC_ALCHEMY_ID: string;
    NEXT_PUBLIC_CHAIN_ID: string;

    // WebSocket Configuration
    NEXT_PUBLIC_WEBSOCKET_URL: string;

    // Vincent Agent Configuration
    VINCENT_API_KEY: string;
    VINCENT_API_URL: string;

    // Image Generation API
    IMAGE_GENERATION_API_KEY: string;
    IMAGE_GENERATION_API_URL: string;

    // Analytics
    NEXT_PUBLIC_ANALYTICS_ID: string;

    // Environment
    NODE_ENV: 'development' | 'production' | 'test';
  }
}