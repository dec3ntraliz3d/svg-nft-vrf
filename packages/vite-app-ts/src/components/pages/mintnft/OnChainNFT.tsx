import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { transactor } from 'eth-components/functions';
import { EthComponentsSettingsContext } from 'eth-components/models';
import { useContractReader, useGasPrice } from 'eth-hooks';
import { useEthersContext } from 'eth-hooks/context';
import React, { useState, FC, useContext, useEffect } from 'react';

import NFTCard from './NFTCard';

import { useAppContracts } from '~~/config/contractContext';

export interface IOnChainNFTProps {
  mainnetProvider: StaticJsonRpcProvider | undefined;
}

export const OnChainNFT: FC<IOnChainNFTProps> = (props) => {
  const ethersContext = useEthersContext();
  const address = ethersContext.account ?? '';
  const ethComponentsSettings = useContext(EthComponentsSettingsContext);
  const [gasPrice] = useGasPrice(ethersContext.chainId, 'fast');
  const tx = transactor(ethComponentsSettings, ethersContext?.signer, gasPrice);

  const nftContract = useAppContracts('OnChainNFT', ethersContext?.chainId);
  const [balance] = useContractReader(nftContract, nftContract?.balanceOf, [address], nftContract?.filters.Transfer());
  const [tokenIds, setTokenIds] = useState<number[]>([]);

  const getUserTokenIds = async () => {
    if (!balance) return;

    const ids: number[] = [];
    for (let i = 0; i < balance?.toNumber(); i++) {
      const id = await nftContract?.tokenOfOwnerByIndex(address, i);
      ids.push(id?.toNumber()!);
    }
    setTokenIds(ids);
  };

  useEffect(() => {
    getUserTokenIds();
  }, [balance, address]);

  return (
    <div className="container max-w-4xl px-4 pb-5 mx-auto">
      <h1 className="mt-5 text-4xl font-bold sm:text-3xl md:text-2xl">Mint a Random NFT with Chainlink VRF</h1>
      <img src="assets/bunny.svg" className="m-auto" />
      <button
        className="px-4 py-2 mt-6 font-bold text-white bg-blue-500 rounded hover:bg-blue-700"
        onClick={() => {
          tx?.(nftContract?.create());
        }}>
        Mint
      </button>
      <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {tokenIds?.map((id) => {
          return <NFTCard key={id} id={id} mainnetProvider={props.mainnetProvider} />;
        })}
      </div>
    </div>
  );
};
