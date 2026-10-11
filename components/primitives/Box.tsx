import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

type BoxProps<T extends ElementType> = {
  as?: T;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, 'as' | 'children'>;

export function Box<T extends ElementType = 'div'>({ as, children, ...props }: BoxProps<T>) {
  const Element = as ?? 'div';
  return <Element {...props}>{children}</Element>;
}
