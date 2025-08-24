import { TradingFeedDemo } from "@/components/trading";

export default function TradingFeedDemoPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold mb-2">Live Trading Feed Demo</h1>
        <p className="text-muted-foreground">
          Real-time trading activity across all Kaiju territories
        </p>
      </div>
      
      <TradingFeedDemo />
      
      <div className="mt-8 space-y-4 text-sm text-muted-foreground">
        <h2 className="text-lg font-semibold text-foreground">Features Implemented:</h2>
        <ul className="list-disc list-inside space-y-2">
          <li>WebSocket connection for live trade updates</li>
          <li>Trade execution cards with Kaiju avatars and details</li>
          <li>Real-time P&L tracking with color-coded indicators</li>
          <li>Filtering by trade type (buy/sell/swap/arbitrage)</li>
          <li>Minimum value threshold filter</li>
          <li>Pause/resume functionality for live updates</li>
          <li>Smooth animations for new trades and state changes</li>
          <li>Expandable cards for full transaction details</li>
          <li>Shadow participant count display</li>
          <li>Responsive design for mobile and desktop</li>
        </ul>
      </div>
    </div>
  );
}