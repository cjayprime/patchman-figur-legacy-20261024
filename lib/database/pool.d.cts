export interface DatabaseBudget { total: number; workers: number; role: 'web' | 'worker' | 'maintenance'; maximum: number; }
export function databaseBudget(env?: Record<string, string | undefined>): DatabaseBudget;
export function databasePool(env?: Record<string, string | undefined>): { acquire: number; idle: number; max: number; min: number };
export function databaseInstance<T>(name: string, factory: () => T): T;
