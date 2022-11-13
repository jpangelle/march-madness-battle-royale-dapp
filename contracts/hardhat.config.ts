import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";
import "solidity-coverage";

dotenv.config();

const config: HardhatUserConfig = {
  defaultNetwork: "mumbai",
  networks: {
    hardhat: {},
    mumbai: {
      url: process.env.INFURA_ENDPOINT_POLYGON_MUMBAI || "",
      accounts: [process.env.HOT_WALLET_PRIVATE_KEY],
    },
  },
  solidity: "0.8.9",
  etherscan: {
    apiKey: {
      polygonMumbai: process.env.POLYGONSCAN_API_KEY,
    },
  },
};

export default config;
