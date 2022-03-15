import { DeployFunction } from 'hardhat-deploy/types';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { ChainlinkConfig } from '../hardhat-helper-config';

const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { getNamedAccounts, deployments, ethers } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const chainId = await hre.getChainId();

  if (chainId == '31337') {

    // Deploy mocks only if current network is localhost

    console.log('---------------------------------------------------------------------');
    console.log('Deploying mocks ...');
    console.log('Deploying LinkToken contract ...');
    await deploy('LinkToken', {
      from: deployer,
      log: true,
    });
    console.log('LinkToken contract deployed.');
    const linkToken = await ethers.getContract('LinkToken', deployer);
    console.log('Deploying VRFCoordinatorMock contract ...');
    await deploy('VRFCoordinatorMock', {
      from: deployer,
      args: [linkToken.address],
      log: true,
    });
    console.log('VRFCoordinatorMock contract deployed.');
    const vrfCoordinatorMock = await ethers.getContract('VRFCoordinatorMock', deployer);

    // deploy NFT contract
    const args = [vrfCoordinatorMock.address, linkToken.address, ChainlinkConfig[chainId].keyHash, ChainlinkConfig[chainId].fee];
    console.log('-------------------------------------------------------------------');
    console.log('Deploying OnChainNFT contract in local hardhat network ...');
    await deploy('OnChainNFT', { from: deployer, log: true, args: args });
    const nftContract = await ethers.getContract('OnChainNFT', deployer);
    console.log(`NFT Contract deployed at ${nftContract.address}`);

    const LINK_TOKEN_AMOUNT = ethers.utils.parseEther('10');
    await linkToken.transfer(nftContract.address, LINK_TOKEN_AMOUNT);

    const createTx = await nftContract.create();
    const txReceipt = await createTx.wait(1);
    const requestId = txReceipt?.logs[3]?.topics[1];
    const tokenId = txReceipt?.logs[3]?.topics[2];

    const randomTx = await vrfCoordinatorMock.callBackWithRandomness(requestId, 67576, nftContract.address);
    await randomTx.wait(2);
    const tokenUri: string = await nftContract.tokenURI(tokenId);
    console.log(tokenUri);
  } else {
    const args = [ChainlinkConfig[chainId].vrfCoordinator, ChainlinkConfig[chainId].linkToken, ChainlinkConfig[chainId].keyHash, ChainlinkConfig[chainId].fee];

    console.log('-------------------------------------------------------------------');
    console.log('Deploying OnChainNFT contract ...');
    await deploy('OnChainNFT', { from: deployer, log: true, args: args });
  }
};
export default func;
func.tags = ['mocks', 'nft'];
