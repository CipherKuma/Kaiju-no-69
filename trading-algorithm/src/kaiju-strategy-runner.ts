import { KaijuIntegratedStrategy } from './strategies/KaijuIntegratedStrategy';
import { validateKaijuConfig, KAIJU_CONFIG } from './config/kaijuConfig';
import { logger } from './utils/logger';

async function main() {
  try {
    logger.info('🚀 Starting Kaiju No. 69 Trading Algorithm');
    
    // Validate configuration
    validateKaijuConfig();
    
    // Display configuration
    logger.info('Configuration:', {
      kaijuId: KAIJU_CONFIG.KAIJU_ID,
      serviceUrl: KAIJU_CONFIG.SERVICE_URL,
      minConfidence: KAIJU_CONFIG.MIN_CONFIDENCE_THRESHOLD,
      maxPositions: KAIJU_CONFIG.MAX_OPEN_POSITIONS
    });
    
    // Initialize and run strategy
    const strategy = new KaijuIntegratedStrategy();
    await strategy.run();
    
    logger.info('✅ Kaiju strategy is running');
    
    // Keep the process running
    process.on('SIGINT', async () => {
      logger.info('Shutting down gracefully...');
      process.exit(0);
    });
    
  } catch (error) {
    logger.error('Failed to start Kaiju strategy:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch(console.error);