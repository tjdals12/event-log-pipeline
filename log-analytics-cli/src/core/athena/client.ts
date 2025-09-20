import { AthenaClient } from "@aws-sdk/client-athena";

export const createAthenaClient = (args: { region: string }): AthenaClient => {
  const { region } = args;
  const athenaClient = new AthenaClient({
    region,
  });
  return athenaClient;
};
