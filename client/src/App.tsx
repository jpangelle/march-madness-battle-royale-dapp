import {
  useAccount,
  useConnect,
  useContractRead,
  useDisconnect,
  useWaitForTransaction,
} from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { Button, TextInput } from '@mantine/core';
import { usePrepareContractWrite, useContractWrite } from 'wagmi';
import { BigNumber } from 'ethers';
import { useState } from 'react';
import usdcAbi from './usdc.abi.json';
import { abi as battleRoyaleAbi } from '../../contracts/artifacts/contracts/BattleRoyale.sol/BattleRoyale.json';

const requiredUSDCAllowance = BigNumber.from(10000000);
const usdcContractAddress = '0xE097d6B3100777DC31B34dC2c58fB524C2e76921';
const battleRoyaleContractAddress =
  '0x26C3bBaB45aff0ea34f9C27F1Fe9d738A54a8845';

export const App = () => {
  const [poolEntryName, setPoolEntryName] = useState('');
  const { address, isConnected } = useAccount();
  const { connect } = useConnect({
    connector: new InjectedConnector(),
  });
  const { disconnect } = useDisconnect();

  const { data: usdcAllowance, refetch } = useContractRead({
    address: usdcContractAddress,
    abi: usdcAbi,
    functionName: 'allowance',
    args: [address!, battleRoyaleContractAddress],
    enabled: isConnected,
  }) as {
    data: BigNumber | undefined;
    refetch: () => void;
  };

  const { config: registerPoolEntryConfig } = usePrepareContractWrite({
    address: battleRoyaleContractAddress,
    abi: battleRoyaleAbi,
    functionName: 'registerPoolEntry',
    args: [poolEntryName],
    enabled: usdcAllowance?.gte(requiredUSDCAllowance),
  });

  const { config: approveConfig } = usePrepareContractWrite({
    address: usdcContractAddress,
    abi: usdcAbi,
    functionName: 'approve',
    args: [battleRoyaleContractAddress, requiredUSDCAllowance],
    enabled: usdcAllowance?.lt(requiredUSDCAllowance),
  });

  const { write: registerPoolEntry } = useContractWrite(
    registerPoolEntryConfig
  );
  const { write: approve, data: approveData } = useContractWrite(approveConfig);

  const { isLoading } = useWaitForTransaction({
    hash: approveData?.hash,
    onSuccess: () => {
      refetch?.();
      registerPoolEntry?.();
    },
  });

  if (isConnected)
    return (
      <div>
        Connected to {address}
        <Button onClick={() => disconnect()}>Disconnect</Button>
        <Button
          onClick={() => {
            if (usdcAllowance?.lt(requiredUSDCAllowance)) {
              approve?.();
            } else {
              registerPoolEntry?.();
            }
          }}
        >
          Register
        </Button>
        <TextInput
          value={poolEntryName}
          onChange={(event) => setPoolEntryName(event.currentTarget.value)}
        />
        {isLoading && <div>Waiting for transaction to be mined</div>}
      </div>
    );
  return <Button onClick={() => connect()}>Connect Wallet</Button>;
};
