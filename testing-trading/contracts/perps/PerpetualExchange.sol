// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./PriceOracle.sol";

/**
 * @title PerpetualExchange
 * @dev Decentralized perpetual futures exchange with leverage up to 50x
 */
contract PerpetualExchange is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    
    // Constants
    uint256 public constant MAX_LEVERAGE = 50;
    uint256 public constant LIQUIDATION_THRESHOLD = 8000; // 80% (out of 10000)
    uint256 public constant MAINTENANCE_MARGIN = 500;     // 5% (out of 10000)
    uint256 public constant FUNDING_RATE_PRECISION = 1e8;
    uint256 public constant PRICE_PRECISION = 1e8;
    uint256 public constant PERCENTAGE_PRECISION = 10000;
    
    // Structs
    struct Position {
        address user;           // Position owner
        string asset;          // Asset symbol (e.g., "ETH", "BTC")
        bool isLong;           // True for long, false for short
        uint256 size;          // Position size in USD (with 18 decimals)
        uint256 collateral;    // Collateral amount in USDC (with 6 decimals)
        uint256 entryPrice;    // Entry price (with 8 decimals)
        uint256 lastFundingIndex; // Last funding rate index applied
        uint256 timestamp;     // Position open time
        bool isActive;         // Position status
    }
    
    struct Market {
        string asset;          // Asset symbol
        bool isActive;         // Market status
        uint256 maxLeverage;   // Maximum leverage for this market
        uint256 fundingRateIndex; // Cumulative funding rate
        uint256 lastFundingTime;  // Last funding rate update
        uint256 longOpenInterest;  // Total long open interest
        uint256 shortOpenInterest; // Total short open interest
        uint256 maxOpenInterest;   // Maximum open interest allowed
    }
    
    struct UserAccount {
        uint256 totalCollateral;    // Total collateral deposited
        uint256 usedCollateral;     // Collateral used in positions
        uint256[] positionIds;      // Array of position IDs
        int256 totalPnL;            // Realized PnL (can be negative)
        uint256 lastActivity;       // Last activity timestamp
    }
    
    // State variables
    IERC20 public immutable collateralToken; // USDC token
    PriceOracle public immutable priceOracle;
    
    mapping(uint256 => Position) public positions;
    mapping(string => Market) public markets;
    mapping(address => UserAccount) public userAccounts;
    
    uint256 public nextPositionId = 1;
    uint256 public totalCollateral;
    uint256 public protocolFees;
    
    // Fee structure (in basis points - 1 basis point = 0.01%)
    uint256 public openFee = 10;      // 0.1%
    uint256 public closeFee = 10;     // 0.1%
    uint256 public liquidationFee = 50; // 0.5%
    
    string[] public supportedAssets;
    
    // Events
    event PositionOpened(
        uint256 indexed positionId,
        address indexed user,
        string asset,
        bool isLong,
        uint256 size,
        uint256 collateral,
        uint256 entryPrice
    );
    
    event PositionClosed(
        uint256 indexed positionId,
        address indexed user,
        uint256 pnl,
        uint256 fees
    );
    
    event PositionLiquidated(
        uint256 indexed positionId,
        address indexed liquidator,
        uint256 liquidationFee
    );
    
    event CollateralAdded(address indexed user, uint256 amount);
    event CollateralWithdrawn(address indexed user, uint256 amount);
    event FundingRateUpdated(string indexed asset, int256 fundingRate);
    
    constructor(
        address _collateralToken,
        address _priceOracle
    ) Ownable(msg.sender) {
        collateralToken = IERC20(_collateralToken);
        priceOracle = PriceOracle(_priceOracle);
        
        // Initialize supported markets
        _initializeMarket("ETH", 50, 1000000 * 1e18); // $1M max OI
        _initializeMarket("BTC", 50, 2000000 * 1e18); // $2M max OI  
        _initializeMarket("LINK", 25, 500000 * 1e18); // $500k max OI
        _initializeMarket("SHAPE", 10, 100000 * 1e18); // $100k max OI
    }
    
    function _initializeMarket(
        string memory asset,
        uint256 maxLev,
        uint256 maxOI
    ) internal {
        markets[asset] = Market({
            asset: asset,
            isActive: true,
            maxLeverage: maxLev,
            fundingRateIndex: 0,
            lastFundingTime: block.timestamp,
            longOpenInterest: 0,
            shortOpenInterest: 0,
            maxOpenInterest: maxOI
        });
        supportedAssets.push(asset);
    }
    
    function depositCollateral(uint256 amount) external nonReentrant {
        require(amount > 0, "Amount must be positive");
        
        collateralToken.safeTransferFrom(msg.sender, address(this), amount);
        
        userAccounts[msg.sender].totalCollateral += amount;
        userAccounts[msg.sender].lastActivity = block.timestamp;
        totalCollateral += amount;
        
        emit CollateralAdded(msg.sender, amount);
    }
    
    function withdrawCollateral(uint256 amount) external nonReentrant {
        UserAccount storage account = userAccounts[msg.sender];
        require(amount > 0, "Amount must be positive");
        require(account.totalCollateral >= amount, "Insufficient balance");
        
        uint256 availableCollateral = account.totalCollateral - account.usedCollateral;
        require(availableCollateral >= amount, "Collateral is being used");
        
        account.totalCollateral -= amount;
        totalCollateral -= amount;
        
        collateralToken.safeTransfer(msg.sender, amount);
        
        emit CollateralWithdrawn(msg.sender, amount);
    }
    
    function openPosition(
        string memory asset,
        bool isLong,
        uint256 collateralAmount,
        uint256 leverage
    ) external nonReentrant returns (uint256 positionId) {
        require(markets[asset].isActive, "Market not active");
        require(leverage > 0 && leverage <= markets[asset].maxLeverage, "Invalid leverage");
        require(collateralAmount > 0, "Collateral must be positive");
        
        UserAccount storage account = userAccounts[msg.sender];
        require(account.totalCollateral - account.usedCollateral >= collateralAmount, "Insufficient collateral");
        
        uint256 currentPrice = priceOracle.getLatestPrice(asset);
        uint256 positionSize = (collateralAmount * 1e12 * leverage); // Convert USDC to 18 decimals
        
        // Check max open interest
        Market storage market = markets[asset];
        if (isLong) {
            require(market.longOpenInterest + positionSize <= market.maxOpenInterest, "Max OI exceeded");
            market.longOpenInterest += positionSize;
        } else {
            require(market.shortOpenInterest + positionSize <= market.maxOpenInterest, "Max OI exceeded");
            market.shortOpenInterest += positionSize;
        }
        
        // Calculate fees
        uint256 fee = (positionSize * openFee) / PERCENTAGE_PRECISION;
        require(collateralAmount * 1e12 > fee, "Collateral too small for fees");
        
        positionId = nextPositionId++;
        
        positions[positionId] = Position({
            user: msg.sender,
            asset: asset,
            isLong: isLong,
            size: positionSize,
            collateral: collateralAmount,
            entryPrice: currentPrice,
            lastFundingIndex: market.fundingRateIndex,
            timestamp: block.timestamp,
            isActive: true
        });
        
        account.usedCollateral += collateralAmount;
        account.positionIds.push(positionId);
        protocolFees += fee / 1e12; // Convert back to USDC decimals
        
        emit PositionOpened(
            positionId,
            msg.sender,
            asset,
            isLong,
            positionSize,
            collateralAmount,
            currentPrice
        );
    }
    
    function closePosition(uint256 positionId) external nonReentrant {
        Position storage position = positions[positionId];
        require(position.isActive, "Position not active");
        require(position.user == msg.sender, "Not position owner");
        
        uint256 currentPrice = priceOracle.getLatestPrice(position.asset);
        (int256 pnl, uint256 fees) = _calculatePositionPnL(positionId, currentPrice);
        
        _closePosition(positionId, currentPrice, pnl, fees, false);
    }
    
    function liquidatePosition(uint256 positionId) external nonReentrant {
        Position storage position = positions[positionId];
        require(position.isActive, "Position not active");
        
        uint256 currentPrice = priceOracle.getLatestPrice(position.asset);
        require(_isLiquidatable(positionId, currentPrice), "Position not liquidatable");
        
        (int256 pnl, uint256 fees) = _calculatePositionPnL(positionId, currentPrice);
        
        // Liquidation fee goes to liquidator
        uint256 liquidationReward = (position.size * liquidationFee) / PERCENTAGE_PRECISION / 1e12;
        if (liquidationReward > position.collateral / 2) {
            liquidationReward = position.collateral / 2;
        }
        
        collateralToken.safeTransfer(msg.sender, liquidationReward);
        
        _closePosition(positionId, currentPrice, pnl, fees, true);
        
        emit PositionLiquidated(positionId, msg.sender, liquidationReward);
    }
    
    function _closePosition(
        uint256 positionId,
        uint256 currentPrice,
        int256 pnl,
        uint256 fees,
        bool isLiquidation
    ) internal {
        Position storage position = positions[positionId];
        UserAccount storage account = userAccounts[position.user];
        Market storage market = markets[position.asset];
        
        // Update open interest
        if (position.isLong) {
            market.longOpenInterest -= position.size;
        } else {
            market.shortOpenInterest -= position.size;
        }
        
        // Calculate final collateral
        int256 finalCollateral = int256(position.collateral * 1e12) + pnl - int256(fees);
        
        if (finalCollateral > 0) {
            uint256 returnAmount = uint256(finalCollateral) / 1e12;
            if (returnAmount > 0) {
                collateralToken.safeTransfer(position.user, returnAmount);
            }
        }
        
        account.usedCollateral -= position.collateral;
        account.totalPnL += pnl;
        protocolFees += fees / 1e12;
        
        position.isActive = false;
        
        emit PositionClosed(positionId, position.user, uint256(pnl), fees);
    }
    
    function _calculatePositionPnL(
        uint256 positionId,
        uint256 currentPrice
    ) internal view returns (int256 pnl, uint256 fees) {
        Position memory position = positions[positionId];
        
        // Price difference
        int256 priceDiff;
        if (position.isLong) {
            priceDiff = int256(currentPrice) - int256(position.entryPrice);
        } else {
            priceDiff = int256(position.entryPrice) - int256(currentPrice);
        }
        
        // PnL calculation
        pnl = (int256(position.size) * priceDiff) / int256(position.entryPrice);
        
        // Fees
        fees = (position.size * closeFee) / PERCENTAGE_PRECISION;
        
        // Funding fees (simplified - should be more complex in production)
        Market memory market = markets[position.asset];
        if (market.fundingRateIndex > position.lastFundingIndex) {
            uint256 fundingFees = ((market.fundingRateIndex - position.lastFundingIndex) * position.size) / FUNDING_RATE_PRECISION;
            fees += fundingFees;
        }
    }
    
    function _isLiquidatable(uint256 positionId, uint256 currentPrice) internal view returns (bool) {
        Position memory position = positions[positionId];
        (int256 pnl,) = _calculatePositionPnL(positionId, currentPrice);
        
        int256 equity = int256(position.collateral * 1e12) + pnl;
        int256 maintenanceMargin = int256((position.size * MAINTENANCE_MARGIN) / PERCENTAGE_PRECISION);
        
        return equity <= maintenanceMargin;
    }
    
    // View functions
    function getPosition(uint256 positionId) external view returns (Position memory) {
        return positions[positionId];
    }
    
    function getUserPositions(address user) external view returns (uint256[] memory) {
        return userAccounts[user].positionIds;
    }
    
    function getPositionPnL(uint256 positionId) external view returns (int256 pnl, uint256 fees) {
        Position memory position = positions[positionId];
        require(position.isActive, "Position not active");
        
        uint256 currentPrice = priceOracle.getLatestPrice(position.asset);
        return _calculatePositionPnL(positionId, currentPrice);
    }
    
    function getUserAccount(address user) external view returns (UserAccount memory) {
        return userAccounts[user];
    }
    
    function getMarket(string memory asset) external view returns (Market memory) {
        return markets[asset];
    }
    
    function getSupportedAssets() external view returns (string[] memory) {
        return supportedAssets;
    }
    
    // Admin functions
    function updateFees(
        uint256 _openFee,
        uint256 _closeFee,
        uint256 _liquidationFee
    ) external onlyOwner {
        require(_openFee <= 100 && _closeFee <= 100 && _liquidationFee <= 200, "Fees too high");
        openFee = _openFee;
        closeFee = _closeFee;
        liquidationFee = _liquidationFee;
    }
    
    function withdrawProtocolFees() external onlyOwner {
        uint256 amount = protocolFees;
        protocolFees = 0;
        collateralToken.safeTransfer(msg.sender, amount);
    }
    
    function setMarketStatus(string memory asset, bool active) external onlyOwner {
        markets[asset].isActive = active;
    }
    
    function emergencyClosePosition(uint256 positionId) external onlyOwner {
        Position storage position = positions[positionId];
        require(position.isActive, "Position not active");
        
        uint256 currentPrice = priceOracle.getLatestPrice(position.asset);
        (int256 pnl, uint256 fees) = _calculatePositionPnL(positionId, currentPrice);
        
        _closePosition(positionId, currentPrice, pnl, fees, true);
    }
}