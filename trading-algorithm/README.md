# AI-Powered Cryptocurrency Trading Algorithm

An intelligent trading system that combines market data analysis, sentiment analysis, technical indicators, and Claude AI to make informed trading decisions in cryptocurrency markets.

## Features

- **Real-time Market Data Collection**: Fetches live price data from cryptocurrency exchanges
- **Sentiment Analysis**: Analyzes market sentiment from news and social media
- **Technical Analysis**: Calculates various technical indicators (RSI, MACD, Bollinger Bands, etc.)
- **AI-Powered Decision Making**: Uses Claude AI to analyze market conditions and generate trading signals
- **Multiple Trading Strategies**: Momentum, mean reversion, sentiment-based, and combined strategies
- **Advanced Trading Capabilities**: Mock implementations for spot trading, perpetual swaps, lending, and borrowing
- **Risk Management**: Position sizing, stop-loss, take-profit, and portfolio risk controls
- **Real-time Monitoring**: Web dashboard with WebSocket updates
- **Paper Trading Mode**: Test strategies without real money

## Architecture

```
trading-algorithm/
├── src/
│   ├── collectors/         # Market data and sentiment collection
│   ├── analyzers/          # Technical and AI analysis
│   ├── strategies/         # Trading strategies
│   ├── trading/            # Trade execution and risk management
│   ├── utils/              # Logging and utilities
│   ├── config/             # Configuration management
│   ├── types/              # TypeScript type definitions
│   ├── server.ts           # Express server and WebSocket
│   └── index.ts            # Main entry point
├── dashboard.html          # Real-time monitoring dashboard
├── package.json            # Dependencies
├── tsconfig.json           # TypeScript configuration
└── .env.example            # Environment variables template
```

## Setup

1. **Clone and navigate to the directory:**
   ```bash
   cd trading-algorithm
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and add your:
   - Anthropic API key for Claude AI
   - Exchange API credentials (optional for paper trading)
   - Trading parameters and risk limits

4. **Create logs directory:**
   ```bash
   mkdir logs
   ```

5. **Build the TypeScript code:**
   ```bash
   npm run build
   ```

## Running the Algorithm

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

### Monitoring Dashboard
Open `dashboard.html` in a web browser to monitor the algorithm in real-time.

## Configuration

Key configuration options in `.env`:

- `TRADING_MODE`: Set to `paper` for testing or `live` for real trading
- `INITIAL_CAPITAL`: Starting capital for paper trading
- `MAX_POSITION_SIZE`: Maximum percentage of capital per trade
- `STOP_LOSS_PERCENTAGE`: Default stop-loss percentage
- `TRADING_PAIRS`: Comma-separated list of trading pairs (e.g., BTC/USDT,ETH/USDT)

## Trading Strategies

1. **Momentum Strategy**: Identifies trends and trades in the direction of momentum
2. **Mean Reversion**: Trades when prices deviate significantly from moving averages
3. **Sentiment Strategy**: Makes decisions based on market sentiment analysis
4. **Combined Strategy**: Uses multiple strategies for confirmation

## API Endpoints

- `GET /health` - Health check
- `GET /status` - Current portfolio and risk metrics
- `GET /positions` - Open positions
- `GET /trades` - Trade history
- `GET /risk-metrics` - Detailed risk analysis
- `POST /analyze` - Force market analysis

## WebSocket Events

The server broadcasts real-time updates via WebSocket:
- Market data updates
- Sentiment changes
- Trade executions
- Analysis completions

## Risk Management

The algorithm includes multiple risk controls:
- Position size limits
- Daily loss limits
- Maximum open positions
- Stop-loss and take-profit orders
- Correlation risk checking

## Safety Features

- **Paper Trading Mode**: Test without real money
- **Configuration Validation**: Ensures valid settings before starting
- **Error Handling**: Graceful error recovery
- **Logging**: Comprehensive logging for debugging

## Development

### Adding New Strategies

1. Create a new strategy class extending `BaseStrategy` in `src/strategies/`
2. Implement the `analyze()` method
3. Register the strategy in `StrategyManager`

### Customizing Risk Management

Edit `src/trading/RiskManager.ts` to modify:
- Position sizing algorithms
- Risk validation rules
- Portfolio metrics calculations

## Important Notes

- This is a demonstration/educational project
- Always test thoroughly in paper trading mode first
- Cryptocurrency trading involves significant risk
- Past performance doesn't guarantee future results
- Never invest more than you can afford to lose

## License

ISC