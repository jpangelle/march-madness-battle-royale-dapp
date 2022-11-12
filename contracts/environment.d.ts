import { string } from "hardhat/internal/core/params/argumentTypes";

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      INFURA_ENDPOINT_POLYGON_MUMBAI: string;
      HOT_WALLET_PRIVATE_KEY: string;
      POLYGONSCAN_API_KEY: string;
    }
  }
}

export {};
