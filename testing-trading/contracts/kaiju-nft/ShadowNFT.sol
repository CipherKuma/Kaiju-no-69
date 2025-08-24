// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ShadowNFT
 * @dev Infinite edition Shadow NFTs with aging mechanism
 * Shadows evolve through 3 stages over 30 days: Powerful -> Mature -> Ancient
 */
contract ShadowNFT is ERC721, Ownable, ReentrancyGuard {
    // Shadow aging stages
    enum ShadowStage { Powerful, Mature, Ancient }
    
    // Shadow properties
    struct ShadowData {
        uint256 mintedAt;          // When the Shadow was minted
        ShadowStage currentStage;  // Current aging stage
        uint256 lastStageUpdate;   // Last time stage was updated
        bool isPinned;             // Whether metadata is pinned to a specific stage
        ShadowStage pinnedStage;   // Pinned stage (if applicable)
    }

    // Events
    event ShadowMinted(uint256 indexed tokenId, address indexed to);
    event ShadowStageUpdated(uint256 indexed tokenId, ShadowStage newStage);
    event ShadowMetadataPinned(uint256 indexed tokenId, ShadowStage stage);
    event ShadowMetadataUnpinned(uint256 indexed tokenId);
    event MetadataUpdate(uint256 indexed tokenId); // EIP-4906 standard

    // State variables
    mapping(uint256 => ShadowData) public shadowData;
    string[] public stageMetadataUris; // [Powerful, Mature, Ancient]
    address public factory;
    uint256 private _tokenIdCounter = 1;
    uint256 public mintFee;
    
    // Aging configuration (in seconds)
    uint256 public constant STAGE_DURATION = 10 days; // Each stage lasts 10 days (30 days total)
    uint256 public constant TOTAL_AGING_DURATION = 30 days;

    modifier onlyFactory() {
        require(msg.sender == factory, "Only factory can call this function");
        _;
    }

    modifier onlyTokenOwner(uint256 tokenId) {
        require(ownerOf(tokenId) == msg.sender, "Not the owner of this Shadow");
        _;
    }

    constructor(
        string memory name,
        string memory symbol,
        address creator,
        string[] memory metadataUris,
        uint256 _mintFee
    ) ERC721(name, symbol) Ownable(creator) {
        require(metadataUris.length == 3, "Must provide exactly 3 metadata URIs");
        factory = msg.sender;
        stageMetadataUris = metadataUris;
        mintFee = _mintFee;
    }

    /**
     * @dev Mint a Shadow NFT (only called by factory)
     */
    function mintShadow(address to) external onlyFactory returns (uint256) {
        uint256 tokenId = _tokenIdCounter++;
        _safeMint(to, tokenId);

        // Initialize Shadow data
        shadowData[tokenId] = ShadowData({
            mintedAt: block.timestamp,
            currentStage: ShadowStage.Powerful,
            lastStageUpdate: block.timestamp,
            isPinned: false,
            pinnedStage: ShadowStage.Powerful
        });

        emit ShadowMinted(tokenId, to);
        return tokenId;
    }

    /**
     * @dev Get current Shadow stage based on aging
     */
    function getCurrentStage(uint256 tokenId) public view returns (ShadowStage) {
        require(_ownerOf(tokenId) != address(0), "Shadow does not exist");
        
        ShadowData memory shadow = shadowData[tokenId];
        
        // If metadata is pinned, return pinned stage
        if (shadow.isPinned) {
            return shadow.pinnedStage;
        }

        // Calculate current stage based on time elapsed
        uint256 timeElapsed = block.timestamp - shadow.mintedAt;
        
        if (timeElapsed >= TOTAL_AGING_DURATION) {
            return ShadowStage.Ancient;
        } else if (timeElapsed >= STAGE_DURATION) {
            return ShadowStage.Mature;
        } else {
            return ShadowStage.Powerful;
        }
    }

    /**
     * @dev Update Shadow stage (can be called by anyone to update aging)
     */
    function updateShadowStage(uint256 tokenId) external {
        require(_ownerOf(tokenId) != address(0), "Shadow does not exist");
        _updateShadowStage(tokenId);
    }

    /**
     * @dev Pin metadata to a specific stage (only token owner)
     */
    function pinShadowMetadata(uint256 tokenId, ShadowStage stage) 
        external 
        onlyTokenOwner(tokenId) 
    {
        ShadowData storage shadow = shadowData[tokenId];
        shadow.isPinned = true;
        shadow.pinnedStage = stage;
        shadow.currentStage = stage;
        
        emit ShadowMetadataPinned(tokenId, stage);
        emit MetadataUpdate(tokenId);
    }

    /**
     * @dev Unpin metadata to allow natural aging (only token owner)
     */
    function unpinShadowMetadata(uint256 tokenId) 
        external 
        onlyTokenOwner(tokenId) 
    {
        ShadowData storage shadow = shadowData[tokenId];
        shadow.isPinned = false;
        
        // Update to current natural stage
        ShadowStage naturalStage = getCurrentStage(tokenId);
        shadow.currentStage = naturalStage;
        shadow.lastStageUpdate = block.timestamp;
        
        emit ShadowMetadataUnpinned(tokenId);
        emit MetadataUpdate(tokenId);
    }

    /**
     * @dev Get token URI based on current stage
     */
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "Shadow does not exist");
        
        ShadowStage stage = getCurrentStage(tokenId);
        return stageMetadataUris[uint256(stage)];
    }

    /**
     * @dev Get Shadow data and aging info
     */
    function getShadowData(uint256 tokenId) 
        external 
        view 
        returns (
            uint256 mintedAt,
            ShadowStage currentStage,
            uint256 timeElapsed,
            uint256 timeToNextStage,
            bool isPinned,
            ShadowStage pinnedStage
        ) 
    {
        require(_ownerOf(tokenId) != address(0), "Shadow does not exist");
        
        ShadowData memory shadow = shadowData[tokenId];
        uint256 elapsed = block.timestamp - shadow.mintedAt;
        
        // Calculate time to next stage
        uint256 timeToNext = 0;
        if (elapsed < STAGE_DURATION) {
            timeToNext = STAGE_DURATION - elapsed;
        } else if (elapsed < TOTAL_AGING_DURATION) {
            timeToNext = TOTAL_AGING_DURATION - elapsed;
        }
        
        return (
            shadow.mintedAt,
            getCurrentStage(tokenId),
            elapsed,
            timeToNext,
            shadow.isPinned,
            shadow.pinnedStage
        );
    }

    /**
     * @dev Get aging progress (0-100)
     */
    function getAgingProgress(uint256 tokenId) external view returns (uint256) {
        require(_ownerOf(tokenId) != address(0), "Shadow does not exist");
        
        uint256 timeElapsed = block.timestamp - shadowData[tokenId].mintedAt;
        
        if (timeElapsed >= TOTAL_AGING_DURATION) {
            return 100;
        }
        
        return (timeElapsed * 100) / TOTAL_AGING_DURATION;
    }

    /**
     * @dev Batch update multiple Shadow stages
     */
    function batchUpdateStages(uint256[] calldata tokenIds) external {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (_ownerOf(tokenIds[i]) != address(0)) {
                _updateShadowStage(tokenIds[i]);
            }
        }
    }

    /**
     * @dev Internal function to update shadow stage
     */
    function _updateShadowStage(uint256 tokenId) internal {
        ShadowData storage shadow = shadowData[tokenId];
        
        // Skip if metadata is pinned
        if (shadow.isPinned) {
            return;
        }

        ShadowStage newStage = getCurrentStage(tokenId);
        
        if (newStage != shadow.currentStage) {
            shadow.currentStage = newStage;
            shadow.lastStageUpdate = block.timestamp;
            
            emit ShadowStageUpdated(tokenId, newStage);
            emit MetadataUpdate(tokenId);
        }
    }

    /**
     * @dev Add new stage metadata URI (only owner)
     */
    function addStageMetadata(string memory metadataUri) external onlyOwner {
        stageMetadataUris.push(metadataUri);
    }

    /**
     * @dev Update existing stage metadata URI (only owner)
     */
    function updateStageMetadata(uint256 stageIndex, string memory metadataUri) 
        external 
        onlyOwner 
    {
        require(stageIndex < stageMetadataUris.length, "Invalid stage index");
        stageMetadataUris[stageIndex] = metadataUri;
    }

    /**
     * @dev Get all stage metadata URIs
     */
    function getStageMetadataUris() external view returns (string[] memory) {
        return stageMetadataUris;
    }

    /**
     * @dev Get total supply
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter - 1;
    }

    /**
     * @dev Emergency function to update mint fee (only owner)
     */
    function updateMintFee(uint256 newFee) external onlyOwner {
        mintFee = newFee;
    }
}