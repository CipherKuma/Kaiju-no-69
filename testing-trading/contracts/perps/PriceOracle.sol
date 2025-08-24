// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PriceOracle
 * @dev Provides price feeds for perpetual contracts
 * Can be updated manually or connected to Chainlink oracles
 */
contract PriceOracle is Ownable {
    struct PriceFeed {
        uint256 price;          // Price in USD with 8 decimals (e.g., 2500_00000000 = $2500)
        uint256 lastUpdated;    // Timestamp of last update
        bool isActive;          // Whether this feed is active
    }
    
    mapping(string => PriceFeed) public priceFeeds;
    mapping(address => bool) public authorizedUpdaters;
    
    uint256 public constant PRICE_PRECISION = 1e8;  // 8 decimal places
    uint256 public constant MAX_PRICE_AGE = 3600;   // 1 hour max age
    
    event PriceUpdated(string indexed asset, uint256 price, uint256 timestamp);
    event UpdaterAuthorized(address indexed updater, bool authorized);
    
    modifier onlyAuthorized() {
        require(authorizedUpdaters[msg.sender] || msg.sender == owner(), "Not authorized");
        _;
    }
    
    constructor() Ownable(msg.sender) {
        // Initialize with some default prices for testing
        _updatePrice("ETH", 2500 * PRICE_PRECISION);  // $2500
        _updatePrice("BTC", 50000 * PRICE_PRECISION); // $50000
        _updatePrice("LINK", 15 * PRICE_PRECISION);   // $15
        _updatePrice("SHAPE", 1 * PRICE_PRECISION);   // $1
        
        authorizedUpdaters[msg.sender] = true;
    }
    
    function updatePrice(string memory asset, uint256 price) external onlyAuthorized {
        require(price > 0, "Price must be positive");
        _updatePrice(asset, price);
    }
    
    function updatePrices(
        string[] memory assets, 
        uint256[] memory prices
    ) external onlyAuthorized {
        require(assets.length == prices.length, "Arrays length mismatch");
        
        for (uint256 i = 0; i < assets.length; i++) {
            require(prices[i] > 0, "Price must be positive");
            _updatePrice(assets[i], prices[i]);
        }
    }
    
    function _updatePrice(string memory asset, uint256 price) internal {
        priceFeeds[asset] = PriceFeed({
            price: price,
            lastUpdated: block.timestamp,
            isActive: true
        });
        
        emit PriceUpdated(asset, price, block.timestamp);
    }
    
    function getPrice(string memory asset) external view returns (uint256 price, uint256 lastUpdated) {
        PriceFeed memory feed = priceFeeds[asset];
        require(feed.isActive, "Price feed not active");
        require(block.timestamp - feed.lastUpdated <= MAX_PRICE_AGE, "Price too old");
        
        return (feed.price, feed.lastUpdated);
    }
    
    function getLatestPrice(string memory asset) external view returns (uint256) {
        (uint256 price,) = this.getPrice(asset);
        return price;
    }
    
    function isPriceStale(string memory asset) external view returns (bool) {
        PriceFeed memory feed = priceFeeds[asset];
        return block.timestamp - feed.lastUpdated > MAX_PRICE_AGE;
    }
    
    function setAuthorizedUpdater(address updater, bool authorized) external onlyOwner {
        authorizedUpdaters[updater] = authorized;
        emit UpdaterAuthorized(updater, authorized);
    }
    
    function setFeedActive(string memory asset, bool active) external onlyOwner {
        priceFeeds[asset].isActive = active;
    }
    
    function emergencyUpdatePrice(string memory asset, uint256 price) external onlyOwner {
        require(price > 0, "Price must be positive");
        _updatePrice(asset, price);
    }
    
    // View functions for testing
    function getAllPrices() external view returns (
        string[] memory assets,
        uint256[] memory prices,
        uint256[] memory timestamps
    ) {
        assets = new string[](4);
        prices = new uint256[](4);
        timestamps = new uint256[](4);
        
        assets[0] = "ETH";
        assets[1] = "BTC";
        assets[2] = "LINK";
        assets[3] = "SHAPE";
        
        for (uint256 i = 0; i < assets.length; i++) {
            PriceFeed memory feed = priceFeeds[assets[i]];
            prices[i] = feed.price;
            timestamps[i] = feed.lastUpdated;
        }
    }
}