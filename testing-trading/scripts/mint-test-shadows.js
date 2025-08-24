const { ethers } = require("hardhat");
require('dotenv').config();

async function mintAndTestShadows() {
  console.log("👤 MINTING & TESTING SHADOW NFTS");
  console.log("=" .repeat(35));
  
  const [deployer] = await ethers.getSigners();
  const network = await deployer.provider.getNetwork();
  const balance = await deployer.provider.getBalance(deployer.address);
  
  console.log("🌐 Network:", network.name);
  console.log("👛 Address:", deployer.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "ETH");
  
  // Contract addresses from deployment
  const factoryAddress = "0x94B03d30a4bdde64af2A713060dF1bE4dEb8BeC1";
  const shadowContract = "0x7da8D7563aB5Cd7AD032C2941C9720E6819C6187";
  
  // Get contract instances
  const KaijuCollectionFactory = await ethers.getContractFactory("KaijuCollectionFactory");
  const factory = KaijuCollectionFactory.attach(factoryAddress);
  
  const ShadowNFT = await ethers.getContractFactory("ShadowNFT");
  const shadowNFT = ShadowNFT.attach(shadowContract);
  
  // Get mint fee
  const mintFee = await factory.shadowMintFee();
  console.log("💰 Shadow Mint Fee:", ethers.formatEther(mintFee), "ETH");
  
  const requiredBalance = mintFee * 3n; // Need 3x mint fee for 3 shadows
  console.log("💎 Required for 3 Shadows:", ethers.formatEther(requiredBalance), "ETH");
  
  if (balance < requiredBalance) {
    console.log("⚠️  Insufficient balance for minting 3 Shadows");
    console.log("📝 Need", ethers.formatEther(requiredBalance - balance), "more ETH");
    return;
  }
  
  console.log("\n🔄 Minting 3 Shadow NFTs...");
  
  // Mint 3 Shadow NFTs
  for (let i = 1; i <= 3; i++) {
    console.log(`\n⚡ Minting Shadow #${i}...`);
    
    try {
      const mintTx = await factory.mintShadow(1, deployer.address, { 
        value: mintFee,
        gasLimit: 500000
      });
      
      const receipt = await mintTx.wait();
      console.log(`✅ Shadow #${i} minted! Gas used:`, receipt.gasUsed.toString());
      console.log(`   Transaction: ${receipt.hash}`);
    } catch (error) {
      console.log(`❌ Failed to mint Shadow #${i}:`, error.message);
      continue;
    }
  }
  
  console.log("\n📊 Current Shadow States:");
  console.log("=" .repeat(30));
  
  // Check current total supply
  const totalSupply = await shadowNFT.totalSupply();
  console.log(`📈 Total Shadow Supply: ${totalSupply}`);
  
  // Get data for each shadow
  for (let tokenId = 1; tokenId <= totalSupply; tokenId++) {
    try {
      const shadowData = await shadowNFT.getShadowData(tokenId);
      const progress = await shadowNFT.getAgingProgress(tokenId);
      const tokenURI = await shadowNFT.tokenURI(tokenId);
      const stageNames = ['Powerful', 'Mature', 'Ancient'];
      
      console.log(`\n🌙 Shadow NFT #${tokenId}:`);
      console.log(`   Stage: ${stageNames[shadowData[1]]} (${shadowData[1]})`);
      console.log(`   Age: ${shadowData[2]} seconds`);
      console.log(`   Progress: ${progress}%`);
      console.log(`   Pinned: ${shadowData[4]}`);
      console.log(`   Metadata: ${tokenURI.substring(0, 60)}...`);
    } catch (error) {
      console.log(`❌ Shadow #${tokenId} not found or error:`, error.message);
    }
  }
  
  console.log("\n🎭 Testing Stage Pinning...");
  console.log("=" .repeat(30));
  
  if (totalSupply >= 2n) {
    console.log("📌 Pinning Shadow #2 to Mature stage...");
    try {
      const pinTx = await shadowNFT.pinShadowMetadata(2, 1); // 1 = Mature
      await pinTx.wait();
      console.log("✅ Shadow #2 pinned to Mature stage");
    } catch (error) {
      console.log("❌ Failed to pin Shadow #2:", error.message);
    }
  }
  
  if (totalSupply >= 3n) {
    console.log("📌 Pinning Shadow #3 to Ancient stage...");
    try {
      const pinTx = await shadowNFT.pinShadowMetadata(3, 2); // 2 = Ancient
      await pinTx.wait();
      console.log("✅ Shadow #3 pinned to Ancient stage");
    } catch (error) {
      console.log("❌ Failed to pin Shadow #3:", error.message);
    }
  }
  
  console.log("\n🎊 FINAL SHADOW STATES:");
  console.log("=" .repeat(30));
  
  // Final check
  for (let tokenId = 1; tokenId <= totalSupply; tokenId++) {
    try {
      const shadowData = await shadowNFT.getShadowData(tokenId);
      const tokenURI = await shadowNFT.tokenURI(tokenId);
      const stageNames = ['Powerful', 'Mature', 'Ancient'];
      
      console.log(`\n🌙 Shadow #${tokenId}: ${stageNames[shadowData[1]]}`);
      console.log(`   Pinned: ${shadowData[4] ? 'YES' : 'NO'}`);
      console.log(`   Metadata: ${tokenURI}`);
      console.log(`   🎨 This shows ${stageNames[shadowData[1]].toLowerCase()} artwork!`);
    } catch (error) {
      console.log(`❌ Error checking Shadow #${tokenId}`);
    }
  }
  
  console.log("\n🌟 Testing Complete! You now have Shadows in different aging stages!");
  console.log("🔗 View them on: https://opensea.io/collection/shape/0x7da8D7563aB5Cd7AD032C2941C9720E6819C6187");
}

if (require.main === module) {
  mintAndTestShadows()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Error:", error);
      process.exit(1);
    });
}

module.exports = { mintAndTestShadows };