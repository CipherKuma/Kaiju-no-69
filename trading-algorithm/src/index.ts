import { validateConfig } from "./config/index.js";
import { startServer } from "./server.js";
import { logger } from "./utils/logger.js";

async function main() {
  try {
    logger.info("Starting AI Trading Algorithm");
    
    // Validate configuration
    validateConfig();
    logger.info("Configuration validated");
    
    // Start the server and trading engine
    await startServer();
    
    logger.info("AI Trading Algorithm is running");
  } catch (error) {
    logger.error("Failed to start application", { error });
    process.exit(1);
  }
}

// Run the application
main();
