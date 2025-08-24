// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title KaijuNFT
 * @dev Unique 1-of-1 Kaiju NFT with trading algorithm integration
 * Each Kaiju represents a unique trading beast with its own algorithm and parameters
 */
contract KaijuNFT is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    // Kaiju properties
    struct KaijuData {
        string algorithmUrl;        // Trading algorithm endpoint
        uint256 entryFee;          // Fee to interact with this Kaiju's trading
        uint256 profitSharePercentage; // Percentage of profits shared (in basis points)
        uint256 createdAt;         // Creation timestamp
        uint256 totalTrades;       // Number of trades executed
        uint256 totalVolume;       // Total trading volume in wei
        uint256 totalProfit;       // Total profit generated in wei
        bool isActive;             // Whether the Kaiju is active for trading
    }

    // Events
    event KaijuCreated(uint256 indexed tokenId, address indexed creator, string algorithmUrl);
    event KaijuActivated(uint256 indexed tokenId);
    event KaijuDeactivated(uint256 indexed tokenId);
    event TradeExecuted(uint256 indexed tokenId, uint256 volume, int256 profit);
    event AlgorithmUpdated(uint256 indexed tokenId, string newAlgorithmUrl);

    // State variables
    mapping(uint256 => KaijuData) public kaijuData;
    address public factory;
    uint256 private _tokenIdCounter = 1;
    uint256 public constant MAX_SUPPLY = 1; // Only 1 Kaiju per contract

    modifier onlyFactory() {
        require(msg.sender == factory, "Only factory can call this function");
        _;
    }

    modifier onlyKaijuOwner(uint256 tokenId) {
        require(ownerOf(tokenId) == msg.sender, "Not the owner of this Kaiju");
        _;
    }

    constructor(
        string memory name,
        string memory symbol,
        address creator,
        string memory algorithmUrl,
        uint256 entryFee,
        uint256 profitSharePercentage
    ) ERC721(name, symbol) Ownable(creator) {
        factory = msg.sender;
    }

    /**
     * @dev Mint the unique Kaiju NFT (only called by factory)
     */
    function mintKaiju(address to, string memory metadataURI) 
        external 
        onlyFactory 
        returns (uint256) 
    {
        require(_tokenIdCounter <= MAX_SUPPLY, "Max supply reached");
        
        uint256 tokenId = _tokenIdCounter++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);

        // Initialize Kaiju data
        kaijuData[tokenId] = KaijuData({
            algorithmUrl: "",
            entryFee: 0,
            profitSharePercentage: 0,
            createdAt: block.timestamp,
            totalTrades: 0,
            totalVolume: 0,
            totalProfit: 0,
            isActive: true
        });

        emit KaijuCreated(tokenId, to, "");

        return tokenId;
    }

    /**
     * @dev Configure the Kaiju's trading parameters (only owner)
     */
    function configureKaiju(
        uint256 tokenId,
        string memory algorithmUrl,
        uint256 entryFee,
        uint256 profitSharePercentage
    ) external onlyKaijuOwner(tokenId) {
        require(bytes(algorithmUrl).length > 0, "Algorithm URL cannot be empty");
        require(profitSharePercentage <= 5000, "Profit share cannot exceed 50%");

        KaijuData storage kaiju = kaijuData[tokenId];
        kaiju.algorithmUrl = algorithmUrl;
        kaiju.entryFee = entryFee;
        kaiju.profitSharePercentage = profitSharePercentage;

        emit AlgorithmUpdated(tokenId, algorithmUrl);
    }

    /**
     * @dev Activate/deactivate Kaiju for trading
     */
    function setKaijuActive(uint256 tokenId, bool active) 
        external 
        onlyKaijuOwner(tokenId) 
    {
        kaijuData[tokenId].isActive = active;
        
        if (active) {
            emit KaijuActivated(tokenId);
        } else {
            emit KaijuDeactivated(tokenId);
        }
    }

    /**
     * @dev Record a trade execution (called by trading system)
     */
    function recordTrade(
        uint256 tokenId,
        uint256 volume,
        int256 profit
    ) external {
        // In a real implementation, this would be restricted to authorized trading contracts
        // For now, allowing any caller for testing purposes
        
        KaijuData storage kaiju = kaijuData[tokenId];
        require(kaiju.isActive, "Kaiju is not active");

        kaiju.totalTrades++;
        kaiju.totalVolume += volume;
        
        if (profit > 0) {
            kaiju.totalProfit += uint256(profit);
        }

        emit TradeExecuted(tokenId, volume, profit);
    }

    /**
     * @dev Get Kaiju data
     */
    function getKaijuData(uint256 tokenId) 
        external 
        view 
        returns (KaijuData memory) 
    {
        require(_ownerOf(tokenId) != address(0), "Kaiju does not exist");
        return kaijuData[tokenId];
    }

    /**
     * @dev Get Kaiju performance metrics
     */
    function getKaijuStats(uint256 tokenId) 
        external 
        view 
        returns (
            uint256 totalTrades,
            uint256 totalVolume,
            uint256 totalProfit,
            uint256 avgTradeSize,
            bool isActive
        ) 
    {
        require(_ownerOf(tokenId) != address(0), "Kaiju does not exist");
        
        KaijuData memory kaiju = kaijuData[tokenId];
        
        return (
            kaiju.totalTrades,
            kaiju.totalVolume,
            kaiju.totalProfit,
            kaiju.totalTrades > 0 ? kaiju.totalVolume / kaiju.totalTrades : 0,
            kaiju.isActive
        );
    }

    /**
     * @dev Check if Kaiju exists and is active
     */
    function isKaijuActive(uint256 tokenId) external view returns (bool) {
        return _ownerOf(tokenId) != address(0) && kaijuData[tokenId].isActive;
    }

    /**
     * @dev Get total supply (should always be 1)
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter - 1;
    }

    /**
     * @dev Update token URI (only token owner)
     */
    function updateTokenURI(uint256 tokenId, string memory newURI) 
        external 
        onlyKaijuOwner(tokenId) 
    {
        _setTokenURI(tokenId, newURI);
    }

    // Override required by Solidity for multiple inheritance
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}