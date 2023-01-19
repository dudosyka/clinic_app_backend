import * as dbConf from "./db.conf";
import { data_conf } from "./data.conf";

export enum ProjectState {
  DEV, TEST_PROD, PROD,
}

export enum UserRole {
  Admin, Doctor, Patient
}

export default {
  isDev: ProjectState.DEV,
  jwtConstants: {
    secret: "SECRET_KEY"
  },
  db: {
    ...dbConf
  },
  data: {
    ...data_conf
  },
  devPort: 3000,
  prodPort: 8082
};
