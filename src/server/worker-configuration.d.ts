interface Env {
  // D1 Database
  DB: D1Database;
  
  // Durable Object Namespace
  CHAT: DurableObjectNamespace;
  
  // Static Assets
  ASSETS: Fetcher;
  
  // Secrets
  JWT_SECRET: string;
  
  // Vars
  ENVIRONMENT: "production" | "development";
}
