'use client';

import { SessionProvider } from 'next-auth/react';

interface ClientLayoutProps {
  children: React.ReactNode;
}
const ClientLayout = ({ children }: ClientLayoutProps) => {
  return (
    <>
      <SessionProvider>
        {children}
      </SessionProvider>
    </>
  );
};

export default ClientLayout;
