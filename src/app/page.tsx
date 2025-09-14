import { SessionProvider } from "next-auth/react";
import AuthButton from "../app/components/AuthButton";

import type { AppProps } from "next/app";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <SessionProvider session={pageProps.session}>
      <AuthButton />
      <Component {...pageProps} />
    </SessionProvider>
  );
}