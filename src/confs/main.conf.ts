import * as dbConf from './db.conf';

export enum ProjectState {
  DEV,
  TEST_PROD,
  PROD,
}

export enum UserRole {
  Admin,
  Doctor,
  Patient,
}

export default {
  isDev: ProjectState.DEV,
  jwtConstants: {
    secret: 'SECRET_KEY',
  },
  db: {
    ...dbConf,
  },
  devPort: 3000,
  prodPort: 8082,
  limit: 50,
};
