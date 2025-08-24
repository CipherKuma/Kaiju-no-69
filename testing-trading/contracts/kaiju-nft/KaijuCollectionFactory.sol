// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./KaijuNFT.sol";
import "./ShadowNFT.sol";

/**
 * @title KaijuCollectionFactory
 * @dev Factory contract for creating Kaiju and Shadow NFT collections
 * Each Kaiju gets a unique collection with 1 Kaiju NFT + infinite Shadow editions
 */
contract KaijuCollectionFactory is Ownable, ReentrancyGuard {
    struct KaijuCollection {
        address kaijuContract;      // Unique Kaiju NFT (1 of 1)
        address shadowContract;     // Shadow NFT Editions (infinite)
        address creator;            // Who created this Kaiju
        string name;                // Kaiju name
        string algorithmUrl;        // Trading algorithm URL
        uint256 createdAt;          // Creation timestamp
        bool exists;                // Flag to check existence
    }

    // Events
    event KaijuCollectionCreated(
        address indexed creator,
        address indexed kaijuContract,
        address indexed shadowContract,
        string name,
        uint256 collectionId
    );

    event KaijuMinted(
        address indexed creator,
        uint256 indexed collectionId,
        uint256 kaijuTokenId
    );

    event ShadowMinted(
        address indexed minter,
        uint256 indexed collectionId,
        uint256 shadowTokenId,
        uint256 mintFee
    );

    // State variables
    mapping(uint256 => KaijuCollection) public collections;
    mapping(address => uint256[]) public creatorCollections;
    uint256 public nextCollectionId = 1;
    uint256 public shadowMintFee = 0.0001 ether;  // Fee for minting Shadow NFTs (testing)
    
    // Platform fee settings
    uint256 public platformFeePercentage = 250; // 2.5% (in basis points)
    address public platformFeeRecipient;

    constructor(address _platformFeeRecipient) Ownable(msg.sender) {
        platformFeeRecipient = _platformFeeRecipient;
    }

    /**
     * @dev Create a new Kaiju collection with unique Kaiju NFT and Shadow editions
     * @param name Kaiju name
     * @param algorithmUrl Trading algorithm URL
     * @param kaijuMetadataUri Metadata URI for the unique Kaiju NFT
     * @param shadowMetadataUris Array of metadata URIs for Shadow stages [stage1, stage2, stage3]
     * @param entryFee Fee required to interact with this Kaiju's trading
     * @param profitSharePercentage Percentage of profits shared with Kaiju creator
     */
    function createKaijuCollection(
        string memory name,
        string memory algorithmUrl,
        string memory kaijuMetadataUri,
        string[] memory shadowMetadataUris,
        uint256 entryFee,
        uint256 profitSharePercentage
    ) external nonReentrant returns (uint256 collectionId) {
        require(bytes(name).length > 0, "Name cannot be empty");
        require(bytes(algorithmUrl).length > 0, "Algorithm URL cannot be empty");
        require(shadowMetadataUris.length == 3, "Must provide exactly 3 shadow metadata URIs");
        require(profitSharePercentage <= 5000, "Profit share cannot exceed 50%"); // Max 50%

        collectionId = nextCollectionId++;
        
        // Deploy Kaiju NFT (1 of 1)
        KaijuNFT kaijuNFT = new KaijuNFT(
            string(abi.encodePacked("Kaiju no.69: ", name)),
            string(abi.encodePacked("KAIJU-", _toString(collectionId))),
            msg.sender,
            algorithmUrl,
            entryFee,
            profitSharePercentage
        );

        // Deploy Shadow NFT Editions (infinite)
        ShadowNFT shadowNFT = new ShadowNFT(
            string(abi.encodePacked("Shadow: ", name)),
            string(abi.encodePacked("SHADOW-", _toString(collectionId))),
            msg.sender,
            shadowMetadataUris,
            shadowMintFee
        );

        // Store collection info
        collections[collectionId] = KaijuCollection({
            kaijuContract: address(kaijuNFT),
            shadowContract: address(shadowNFT),
            creator: msg.sender,
            name: name,
            algorithmUrl: algorithmUrl,
            createdAt: block.timestamp,
            exists: true
        });

        creatorCollections[msg.sender].push(collectionId);

        // Auto-mint the unique Kaiju NFT to creator (free)
        uint256 kaijuTokenId = kaijuNFT.mintKaiju(msg.sender, kaijuMetadataUri);

        emit KaijuCollectionCreated(
            msg.sender,
            address(kaijuNFT),
            address(shadowNFT),
            name,
            collectionId
        );

        emit KaijuMinted(msg.sender, collectionId, kaijuTokenId);

        return collectionId;
    }

    /**
     * @dev Mint a Shadow NFT (paid mint)
     * @param collectionId ID of the collection to mint from
     * @param to Address to mint to
     */
    function mintShadow(uint256 collectionId, address to) 
        external 
        payable 
        nonReentrant 
        returns (uint256 tokenId) 
    {
        require(collections[collectionId].exists, "Collection does not exist");
        require(msg.value >= shadowMintFee, "Insufficient mint fee");

        ShadowNFT shadowContract = ShadowNFT(collections[collectionId].shadowContract);
        tokenId = shadowContract.mintShadow(to);

        // Calculate and distribute fees
        uint256 platformFee = (msg.value * platformFeePercentage) / 10000;
        uint256 creatorFee = msg.value - platformFee;

        // Send fees
        payable(platformFeeRecipient).transfer(platformFee);
        payable(collections[collectionId].creator).transfer(creatorFee);

        emit ShadowMinted(msg.sender, collectionId, tokenId, msg.value);

        return tokenId;
    }

    /**
     * @dev Get collection information
     */
    function getCollection(uint256 collectionId) 
        external 
        view 
        returns (KaijuCollection memory) 
    {
        require(collections[collectionId].exists, "Collection does not exist");
        return collections[collectionId];
    }

    /**
     * @dev Get all collections created by a user
     */
    function getCreatorCollections(address creator) 
        external 
        view 
        returns (uint256[] memory) 
    {
        return creatorCollections[creator];
    }

    /**
     * @dev Update shadow mint fee (only owner)
     */
    function setShadowMintFee(uint256 newFee) external onlyOwner {
        shadowMintFee = newFee;
    }

    /**
     * @dev Update platform fee settings (only owner)
     */
    function setPlatformFee(uint256 newPercentage, address newRecipient) external onlyOwner {
        require(newPercentage <= 1000, "Platform fee cannot exceed 10%"); // Max 10%
        platformFeePercentage = newPercentage;
        platformFeeRecipient = newRecipient;
    }

    /**
     * @dev Emergency withdraw (only owner)
     */
    function emergencyWithdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    /**
     * @dev Convert uint256 to string
     */
    function _toString(uint256 value) internal pure returns (string memory) {
        if (value == 0) {
            return "0";
        }
        uint256 temp = value;
        uint256 digits;
        while (temp != 0) {
            digits++;
            temp /= 10;
        }
        bytes memory buffer = new bytes(digits);
        while (value != 0) {
            digits -= 1;
            buffer[digits] = bytes1(uint8(48 + uint256(value % 10)));
            value /= 10;
        }
        return string(buffer);
    }
}