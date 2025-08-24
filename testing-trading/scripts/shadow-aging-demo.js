const { ethers } = require("hardhat");
require('dotenv').config();

async function demonstrateShadowAging() {
  console.log("👤 SHADOW AGING SYSTEM DEMONSTRATION");
  console.log("=" .repeat(45));
  
  console.log("\n🔍 How Shadow Aging Works:");
  console.log("=" .repeat(30));
  console.log("⏰ Natural Aging: 30 days total");
  console.log("   • Days 0-10: Powerful (Stage 0) - Intense purple energy");
  console.log("   • Days 10-20: Mature (Stage 1) - Moderate energy");
  console.log("   • Days 20-30: Ancient (Stage 2) - Fading energy");
  
  console.log("\n📌 Stage Pinning System:");
  console.log("=" .repeat(25));
  console.log("✅ Users can pin Shadows to any stage");
  console.log("✅ Pinned Shadows don't age naturally");
  console.log("✅ Users can unpin to resume natural aging");
  console.log("✅ Perfect for displaying preferred appearance");

  console.log("\n🎭 Viewing Different Aged Shadows:");
  console.log("=" .repeat(35));
  
  const shadowContract = "0x7da8D7563aB5Cd7AD032C2941C9720E6819C6187";
  
  console.log("Shadow Contract: " + shadowContract);
  console.log("\n🌙 Metadata URLs by Stage:");
  console.log("   Stage 0 (Powerful): https://gateway.pinata.cloud/ipfs/bafkreidtuo7nr3u7bydl2bs7rggmby2mcgecqmtxydkbp5izqzmfguh72i");
  console.log("   Stage 1 (Mature):   https://gateway.pinata.cloud/ipfs/bafkreicvl3e2d5ey7i7l3tm5yrmhvlthdorvi2pszwzl2s6hviphsg74xu");
  console.log("   Stage 2 (Ancient):  https://gateway.pinata.cloud/ipfs/bafkreiggilpmu5l6phlclpnvmwqpzg7xbxkeq35iz6d7jemt32ihknzx54");

  console.log("\n🧪 Testing Scenario:");
  console.log("=" .repeat(20));
  console.log("Since Shadow minting requires 0.01 ETH each, here's how you can test:");
  console.log();
  console.log("1️⃣  MINT 3 SHADOW NFTS (when you have enough ETH):");
  console.log("   npx hardhat run scripts/mint-test-shadows.js --network shapeMainnet");
  console.log();
  console.log("2️⃣  IMMEDIATELY AFTER MINTING:");
  console.log("   • Shadow #1: Leave unpinned (stays Powerful for 10 days)");
  console.log("   • Shadow #2: Pin to Mature stage (appears aged to mid-life)");
  console.log("   • Shadow #3: Pin to Ancient stage (appears fully aged)");
  console.log();
  console.log("3️⃣  RESULT - YOU'LL SEE 3 DIFFERENT STAGES:");
  console.log("   🔥 Shadow #1: Intense purple energy (Powerful)");
  console.log("   ⚡ Shadow #2: Moderate purple glow (Mature)");
  console.log("   👻 Shadow #3: Fading energy (Ancient)");

  console.log("\n💡 Smart Contract Functions for Aging:");
  console.log("=" .repeat(40));
  console.log("📍 pinShadowMetadata(tokenId, stage) - Pin to specific stage");
  console.log("🔓 unpinShadowMetadata(tokenId) - Resume natural aging");
  console.log("📊 getShadowData(tokenId) - Get aging info");
  console.log("📈 getAgingProgress(tokenId) - Get 0-100% progress");
  console.log("🔄 updateShadowStage(tokenId) - Force aging update");

  console.log("\n🎯 To See All Stages Immediately:");
  console.log("=" .repeat(35));
  console.log("Since you can pin Shadows to any stage, you can:");
  console.log("1. Mint 3 Shadow NFTs");
  console.log("2. Pin each to a different stage");
  console.log("3. View all 3 aging stages instantly!");
  console.log("4. Each will display different metadata/artwork");

  console.log("\n🌐 View on Marketplaces:");
  console.log("=" .repeat(25));
  console.log("OpenSea: https://opensea.io/collection/shape/0x7da8D7563aB5Cd7AD032C2941C9720E6819C6187");
  console.log("Shape Explorer: https://shapescan.xyz/address/0x7da8D7563aB5Cd7AD032C2941C9720E6819C6187");

  console.log("\n" + "=" .repeat(45));
  console.log("🎊 Ready to mint and test aging system! 🎊");
}

// Run the demonstration
demonstrateShadowAging().catch(console.error);