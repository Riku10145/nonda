export interface Bindings {
  DATABASE_URL: string;
  FRONTEND_URL: string;
}

export interface Variables {
  userId: string;
}

export interface AppEnv {
  Bindings: Bindings;
  Variables: Variables;
}
