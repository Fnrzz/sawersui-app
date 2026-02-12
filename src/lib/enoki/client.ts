import { EnokiFlow } from "@mysten/enoki";

const apiKey = process.env.NEXT_PUBLIC_ENOKI_API_KEY;

export const enokiFlow =
  typeof window !== "undefined"
    ? new EnokiFlow({
        apiKey: apiKey!,
      })
    : ({} as EnokiFlow);
