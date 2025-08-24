const { ethers } = require("hardhat");
require('dotenv').config();

async function main() {
  console.log("🎭 PINNING SHADOW STAGES SCRIPT 🎭");
  console.log("===================================");
  
  // Configuration - Update these values based on your deployment
  const SHADOW_CONTRACT_ADDRESS = "0xBD6E32958C56728DEb06E3f7E883685eC38E0174"; // From latest deployment
  const TEST_WALLET_PRIVATE_KEY = process.env.TEST_WALLET_PRIVATE_KEY; // Add this to your .env
  
  if (!TEST_WALLET_PRIVATE_KEY) {
    throw new Error("TEST_WALLET_PRIVATE_KEY not found in .env file");
  }
  
  // Connect to test wallet
  const testWallet = new ethers.Wallet(TEST_WALLET_PRIVATE_KEY, ethers.provider);
  console.log("👛 Test Wallet:", testWallet.address);
  
  const balance = await testWallet.provider.getBalance(testWallet.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "ETH");
  
  if (balance < ethers.parseEther("0.0001")) {
    throw new Error("Insufficient balance for transactions. Need at least 0.0001 ETH");
  }
  
  // Get Shadow NFT contract
  const ShadowNFT = await ethers.getContractFactory("ShadowNFT");
  const shadowContract = ShadowNFT.attach(SHADOW_CONTRACT_ADDRESS).connect(testWallet);
  
  console.log("\n📍 CHECKING SHADOW OWNERSHIP...");
  console.log("================================");
  
  // Check which shadows the test wallet owns
  const ownedShadows = [];
  for (let tokenId = 1; tokenId <= 10; tokenId++) {
    try {
      const owner = await shadowContract.ownerOf(tokenId);
      if (owner.toLowerCase() === testWallet.address.toLowerCase()) {
        const shadowData = await shadowContract.getShadowData(tokenId);
        const stageNames = ['Powerful', 'Weaker', 'Weakest'];
        
        ownedShadows.push({
          tokenId,
          currentStage: shadowData[1],
          isPinned: shadowData[4],
          pinnedStage: shadowData[5]
        });
        
        console.log(`✅ Shadow #${tokenId}: Stage ${stageNames[shadowData[1]]} ${shadowData[4] ? `(Pinned to ${stageNames[shadowData[5]]})` : '(Not pinned)'}`);
      }
    } catch (error) {
      // Token doesn't exist or not owned by test wallet
      break;
    }
  }
  
  if (ownedShadows.length === 0) {
    console.log("❌ No Shadow NFTs found for test wallet");
    return;
  }
  
  console.log(`\n🎯 Found ${ownedShadows.length} Shadow NFTs owned by test wallet`);
  
  // Pin shadows to different stages for testing
  console.log("\n📌 PINNING SHADOWS TO DIFFERENT STAGES...");
  console.log("=========================================");
  
  for (let i = 0; i < Math.min(ownedShadows.length, 3); i++) {
    const shadow = ownedShadows[i];
    const targetStage = i; // 0=Powerful, 1=Weaker, 2=Weakest
    const stageNames = ['Powerful', 'Weaker', 'Weakest'];
    
    if (shadow.isPinned && shadow.pinnedStage === targetStage) {
      console.log(`✓ Shadow #${shadow.tokenId} already pinned to ${stageNames[targetStage]}`);
      continue;
    }
    
    console.log(`📌 Pinning Shadow #${shadow.tokenId} to ${stageNames[targetStage]} stage...`);
    
    try {
      const tx = await shadowContract.pinShadowMetadata(shadow.tokenId, targetStage, {
        gasLimit: 200000
      });
      
      console.log(`   Transaction: ${tx.hash}`);
      const receipt = await tx.wait();
      console.log(`   ✅ Success! Gas used: ${receipt.gasUsed.toString()}`);
      
      // Verify the pin
      const updatedData = await shadowContract.getShadowData(shadow.tokenId);
      const tokenURI = await shadowContract.tokenURI(shadow.tokenId);
      console.log(`   📷 Shadow #${shadow.tokenId} now shows ${stageNames[targetStage]} metadata`);
      console.log(`   🔗 Metadata: ${tokenURI}`);
    } catch (error) {
      console.log(`   ❌ Failed to pin Shadow #${shadow.tokenId}:`, error.message);
    }
  }
  
  // Display final state
  console.log("\n🌟 FINAL SHADOW STATES:");
  console.log("=======================");
  
  for (const shadow of ownedShadows) {
    const shadowData = await shadowContract.getShadowData(shadow.tokenId);
    const stageNames = ['Powerful', 'Weaker', 'Weakest'];
    const tokenURI = await shadowContract.tokenURI(shadow.tokenId);
    
    console.log(`\n🌙 Shadow NFT #${shadow.tokenId}:`);
    console.log(`   Current Age Stage: ${stageNames[shadowData[1]]}`);
    console.log(`   Pinned: ${shadowData[4] ? 'YES' : 'NO'}`);
    if (shadowData[4]) {
      console.log(`   Pinned Stage: ${stageNames[shadowData[5]]}`);
    }
    console.log(`   Metadata URI: ${tokenURI}`);
  }
  
  console.log("\n✨ Script completed! You can now view different shadow stages in your wallet.");
  console.log("🔗 View on OpenSea: https://opensea.io/collection/shape/" + SHADOW_CONTRACT_ADDRESS.toLowerCase());
}

// Execute with error handling
main()
  .then(() => {
    console.log("\n✅ Shadow pinning script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Script failed:");
    console.error(error);
    process.exit(1);
  });