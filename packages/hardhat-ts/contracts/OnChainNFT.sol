// contracts/onChainNFT.sol
// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBase.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "./HexStrings.sol";
import "hardhat/console.sol";

contract OnChainNFT is ERC721Enumerable, VRFConsumerBase {
  event Minted(uint256 indexed tokenId);
  event RequestedRandomNumber(bytes32 indexed requestId, uint256 indexed tokenId);

  using Strings for uint256;
  using Counters for Counters.Counter;
  using HexStrings for uint160;

  Counters.Counter private _tokenIds;
  bytes32 public immutable keyhash;
  uint256 public immutable fee;

  mapping(bytes32 => address) private requestIdToSender;
  mapping(bytes32 => uint256) private requestIdToTokenId;
  mapping(uint256 => uint256) public tokenIdToRandomNumber;
  mapping(uint256 => uint256) private bodyColor;
  mapping(uint256 => uint256) private earColor;
  mapping(uint256 => uint256) private eyeColor;

  constructor(
    address _VRFCoordinator,
    address _LinkToken,
    bytes32 _keyHash,
    uint256 _fee
  ) VRFConsumerBase(_VRFCoordinator, _LinkToken) ERC721("OnChainNFT", "ONC") {
    keyhash = _keyHash;
    fee = _fee;
  }

  function create() public returns (bytes32 requestId) {
    requestId = requestRandomness(keyhash, fee);
    requestIdToSender[requestId] = msg.sender;
    _tokenIds.increment();
    requestIdToTokenId[requestId] = _tokenIds.current();
    emit RequestedRandomNumber(requestId, _tokenIds.current());
  }

  function fulfillRandomness(bytes32 requestId, uint256 randomNumber) internal override {
    address nftOwner = requestIdToSender[requestId];
    uint256 tokenId = requestIdToTokenId[requestId];
    tokenIdToRandomNumber[tokenId] = randomNumber;
    _generateTraits(randomNumber, tokenId);
    _mint(nftOwner, tokenId);
    emit Minted(tokenId);
  }

  function _generateTraits(uint256 randomNumber, uint256 tokenId) internal {
    bodyColor[tokenId] = (randomNumber % 360) + 1;
    earColor[tokenId] = ((randomNumber << 16) % 360) + 1;
    eyeColor[tokenId] = ((randomNumber << 8) % 360) + 1;
  }

  function tokenURI(uint256 id) public view override returns (string memory) {
    console.log("token id", id);
    require(_exists(id), "Token doesn't exist");
    string memory name = string(abi.encodePacked("VRF Rabbit #", id.toString()));
    string memory description = "This rabbit's color was chosen via chainlink VRF";
    string memory image = Base64.encode(bytes(generateSVGofTokenById(id)));

    return
      string(
        abi.encodePacked(
          "data:application/json;base64,",
          Base64.encode(
            bytes(
              abi.encodePacked(
                '{"name":"',
                name,
                '", "description":"',
                description,
                '",',
                renderTraits(id),
                ', "owner":"',
                (uint160(ownerOf(id))).toHexString(20),
                '", "image": "',
                "data:image/svg+xml;base64,",
                image,
                '"}'
              )
            )
          )
        )
      );
  }

  function generateSVGofTokenById(uint256 id) internal view returns (string memory) {
    string memory svg = string(abi.encodePacked('<svg width="400" height="250" xmlns="http://www.w3.org/2000/svg">', renderTokenById(id), "</svg>"));
    return svg;
  }

  function renderTokenById(uint256 id) internal view returns (string memory) {
    string memory render = string(
      abi.encodePacked(
        '<g stroke="#000">',
        '<ellipse fill="hsl(',
        bodyColor[id].toString(),
        ',35%,40%)" cx="202.119" cy="137.01" rx="72.602" ry="60.763"/>',
        renderEars(id),
        renderEyes(id),
        ' <ellipse ry=".656" rx=".51" cy="125.656" cx="221.283" fill="none"/>',
        ' <ellipse ry=".656" rx=".51" cy="124.781" cx="183.528" fill="none"/>',
        ' <path d="m183.311 151.72 39.157-.402" fill="none"/>',
        " </g>"
      )
    );

    return render;
  }

  function renderEars(uint256 id) internal view returns (string memory) {
    string memory render = string(
      abi.encodePacked(
        '<ellipse fill="hsl(',
        earColor[id].toString(),
        ',45%,50%)" cx="178.111" cy="52.007" rx="10.241" ry="38.152" transform="rotate(-12.252 178.111 52.007)" class="ear"/>',
        '<ellipse fill="hsl(',
        earColor[id].toString(),
        ',45%,50%)" cx="224.697" cy="52.007" rx="10.241" ry="38.152" transform="rotate(11.998 224.697 52.007)" class="ear"/>'
      )
    );
    return render;
  }

  function renderEyes(uint256 id) internal view returns (string memory) {
    string memory render = string(
      abi.encodePacked(
        '<ellipse fill="hsl(',
        eyeColor[id].toString(),
        ',45%,50%)" cx="183.258" cy="125.154" rx="8.233" ry="8.634" class="eye"/>',
        '<ellipse fill="hsl(',
        eyeColor[id].toString(),
        ',45%,50%)" cx="221.041" cy="125.556" rx="8.233" ry="8.634" class="eye"/>'
      )
    );
    return render;
  }

  function renderTraits(uint256 id) internal view returns (string memory) {
    string memory render = string(
      abi.encodePacked(
        '"attributes": [{"trait_type": "Body Color", "value": "',
        bodyColor[id].toString(),
        '"}, {"trait_type": "Eye Color", "value": "',
        eyeColor[id].toString(),
        '"},{"trait_type": "Ear Color", "value": "',
        earColor[id].toString(),
        '"} ]'
      )
    );
    return render;
  }
}
