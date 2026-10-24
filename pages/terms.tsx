import type { GetServerSideProps } from 'next';

// One canonical policy covers the shared Patchman account and applications.
export const getServerSideProps: GetServerSideProps = async () => ({
  redirect: {
    destination: 'https://patchman.io/terms/',
    permanent: false,
  },
});

export default function TermsPage() {
  return null;
}
