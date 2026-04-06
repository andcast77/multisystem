export type LandingUrls = {
  hub: string;
  shopflow: string;
  workify: string;
  techservices: string;
};

export function getLandingUrls(): LandingUrls {
  const env = import.meta.env as {
    VITE_HUB_URL?: string;
    VITE_SHOPFLOW_URL?: string;
    VITE_WORKIFY_URL?: string;
    VITE_TECHSERVICES_URL?: string;
  };
  return {
    hub: env.VITE_HUB_URL ?? "http://localhost:3001",
    shopflow: env.VITE_SHOPFLOW_URL ?? "http://localhost:3002",
    workify: env.VITE_WORKIFY_URL ?? "http://localhost:3003",
    techservices: env.VITE_TECHSERVICES_URL ?? "http://localhost:3004",
  };
}
