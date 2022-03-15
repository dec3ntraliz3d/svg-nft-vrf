import { TxReceipt } from '@ethereumjs/vm/dist/types';
import { Receipt } from 'hardhat-deploy/dist/types';
import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { getNamedAccounts, deployments, ethers } = hre;
  const { deployer } = await getNamedAccounts();
  const chainId = await hre.getChainId();

  if (chainId == '31337') {
    // Send linktoken to nft contract

    const LINK_TOKEN_AMOUNT = ethers.utils.parseEther('10');
    const nftContract = await ethers.getContractAt('OnChainNFT', deployer);
    const linkToken = await ethers.getContractAt('LinkToken', '0x84ea74d481ee0a5332c457a4d796187f6ba67feb');

    await linkToken.transfer(nftContract.address, LINK_TOKEN_AMOUNT);
    console.log(await linkToken.balanceOf(nftContract.address));

    // // Call create function

    const createTx = await nftContract.create();
    const txReceipt = await createTx.wait(1);
    // console.log(await nftContract.totalSupply())
    const requestId = txReceipt?.logs[3]?.topics[1];
    console.log({ txReceipt, requestId });

    // Call chainlink VRF mock with randomness
    const vrfMock = await ethers.getContract('VRFCoordinatorMock', deployer);
    const randomTx = await vrfMock.callBackWithRandomness(requestId, 67576, nftContract.address);
    randomTx.wait(1);
    // get token URI of the minted NFT

    const tokenUri: string = await nftContract.tokenURI(1);
    console.log(tokenUri);
  }
};
export default func;
func.tags = ['mint'];
