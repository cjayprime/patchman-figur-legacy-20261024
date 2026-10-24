import Image from 'next/image';
export default function SuiteMark({ name }: { name: string }) {
  const key = name.endsWith('we') ? 'dowe' : name.toLowerCase() === 'patchman' ? 'landing' : name.toLowerCase();
  return <Image src={`/patchman-apps/${key}.svg`} alt="" width={38} height={38} />;
}
