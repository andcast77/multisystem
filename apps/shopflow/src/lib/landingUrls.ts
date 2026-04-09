export type LandingUrls = {
  hub: string;
  shopflow: string;
  workify: string;
  techservices: string;
};

export function getLandingUrls(): LandingUrls {
  return {
    hub: process.env.NEXT_PUBLIC_HUB_URL ?? "http://localhost:3001",
    shopflow: process.env.NEXT_PUBLIC_SHOPFLOW_URL ?? "http://localhost:3002",
    workify: process.env.NEXT_PUBLIC_WORKIFY_URL ?? "http://localhost:3003",
    techservices: process.env.NEXT_PUBLIC_TECHSERVICES_URL ?? "http://localhost:3004",
  };
}
