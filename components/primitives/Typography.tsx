import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

type TypographyProps<T extends ElementType> = {
  as?: T;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children'>;

export function Typography<T extends ElementType = 'p'>({ as, children, ...props }: TypographyProps<T>) {
  const Element = as ?? 'p';
  return <Element {...props}>{children}</Element>;
}
