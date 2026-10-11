import { useMemo, type CSSProperties } from 'react';

export function Whitespace({ size = 16 }: { size?: number }) {
  const style = useMemo<CSSProperties>(() => ({ height: size, width: size }), [size]);
  return <span aria-hidden="true" style={style} />;
}
