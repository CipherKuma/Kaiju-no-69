export * from './provider';
export * from './contracts/addresses';
export * from './services/swapService';
export * from './services/liquidityService';
export * from './services/perpsService';

import { SwapService } from './services/swapService';
import { LiquidityService } from './services/liquidityService';
import { PerpsService } from './services/perpsService';

// Export service instances
export const swapService = new SwapService();
export const liquidityService = new LiquidityService();
export const perpsService = new PerpsService();