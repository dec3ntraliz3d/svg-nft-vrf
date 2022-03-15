import { StaticJsonRpcProvider } from '@ethersproject/providers';
import { AddressInput } from 'eth-components/ant';
import { transactor } from 'eth-components/functions';
import { EthComponentsSettingsContext } from 'eth-components/models';
import { useGasPrice } from 'eth-hooks';
import { useEthersContext } from 'eth-hooks/context';
import { FC, useState, useContext, useEffect } from 'react';

import { useAppContracts } from '~~/config/contractContext';

export interface INFTCardProps {
  id: number;
  mainnetProvider: StaticJsonRpcProvider | undefined;
}

const NFTCard: FC<INFTCardProps> = (props) => {
  const ethersContext = useEthersContext();
  const ethComponentsSettings = useContext(EthComponentsSettingsContext);
  const [gasPrice] = useGasPrice(ethersContext.chainId, 'fast');
  const tx = transactor(ethComponentsSettings, ethersContext?.signer, gasPrice);
  const nftContract = useAppContracts('OnChainNFT', ethersContext?.chainId);
  const [toAddress, setToAddress] = useState('');
  const [imageData, setImageData] = useState<string>();

  const getImageData = async () => {
    const base64EndcodedURI = await nftContract?.tokenURI(props.id);
    const decodedData = atob(base64EndcodedURI?.substring(29) ?? '');
    const parsedJsonData = JSON.parse(decodedData);
    setImageData(parsedJsonData?.image);
  };
  useEffect(() => {
    getImageData();
  }, []);

  const transfer = () => {
    if (ethersContext.account == undefined) return;
    tx?.(nftContract?.transferFrom(ethersContext?.account, toAddress, props.id));
  };

  return (
    <div className="p-2 m-1 border rounded-lg shadow-lg">
      <img src={imageData} />
      <AddressInput
        ensProvider={props.mainnetProvider}
        placeholder="Enter address"
        address={toAddress}
        onChange={setToAddress}
      />
      <button className="px-4 py-2 mt-3 font-bold text-white bg-blue-500 rounded hover:bg-blue-700" onClick={transfer}>
        Transfer
      </button>
    </div>
  );
};
export default NFTCard;
