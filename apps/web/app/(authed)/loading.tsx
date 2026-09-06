import { Center, Loader } from "@mantine/core";

export default function AuthedLoading() {
  return (
    <Center py="xl">
      <Loader color="teal" />
    </Center>
  );
}
