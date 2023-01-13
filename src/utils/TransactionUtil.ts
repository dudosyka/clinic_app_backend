import { Transaction } from "sequelize";

export module TransactionUtil {
  let host: { transaction: Transaction | null } = { transaction: null };

  export function getHost(): { transaction: Transaction } | { } {
    if (host.transaction)
      return host;
    else
      return {}
  }

  export function setHost(t: Transaction) {
    host = { transaction: t };
  }

  export function isSet(): boolean {
    return (host.transaction != null);
  }

  export function commit(): Promise<void> {
    if (!host.transaction)
      return;
    const res = host.transaction.commit();
    host.transaction = null;
    return res;
  }

  export function rollback(): Promise<void> {
    if (!host.transaction)
      return null;
    const res = host.transaction.rollback();
    host.transaction = null;
    return res;
  }
}
