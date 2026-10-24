export interface DatabasePolicy {
  total: number;
  workers: number;
}
export interface DatabaseAllocation {
  role?: 'web' | 'worker' | 'maintenance';
  workerIndex?: number;
}
export interface DatabaseBudget {
  total: number;
  workers: number;
  role: 'web' | 'worker' | 'maintenance';
  maximum: number;
}
export function configureDatabaseProcess(allocation: DatabaseAllocation, policy?: DatabasePolicy): void;
export function databaseBudget(allocation?: DatabaseAllocation, policy?: DatabasePolicy): DatabaseBudget;
export function databasePool(
  allocation?: DatabaseAllocation,
  policy?: DatabasePolicy,
): { acquire: number; idle: number; max: number; min: number };
export function databaseInstance<T>(name: string, factory: () => T): T;
