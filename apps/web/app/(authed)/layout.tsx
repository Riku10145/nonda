import { Flex } from "@mantine/core";

import { Header } from "./_components/header";

export default function AuthedLayout({ children }: { children: React.ReactNode }) {
  return (
    <Flex direction="column" mih="100dvh">
      <Header />
      <Flex component="main" direction="column" style={{ flex: 1 }}>
        {children}
      </Flex>
    </Flex>
  );
}
