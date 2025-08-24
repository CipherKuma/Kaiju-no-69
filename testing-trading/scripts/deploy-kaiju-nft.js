const { ethers } = require("hardhat");
const fs = require('fs');
const path = require('path');

async function main() {
  console.log("🏗️  Deploying Kaiju NFT System...");
  
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", ethers.formatEther(await deployer.provider.getBalance(deployer.address)));

  // Deploy KaijuCollectionFactory
  console.log("\n📦 Deploying KaijuCollectionFactory...");
  
  const KaijuCollectionFactory = await ethers.getContractFactory("KaijuCollectionFactory");
  const factory = await KaijuCollectionFactory.deploy(deployer.address); // Platform fee recipient
  await factory.waitForDeployment();
  
  const factoryAddress = await factory.getAddress();
  console.log("✅ KaijuCollectionFactory deployed to:", factoryAddress);

  // Get network info
  const network = await deployer.provider.getNetwork();
  const chainId = network.chainId.toString();
  
  console.log(`🌐 Network: ${network.name} (Chain ID: ${chainId})`);

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: chainId,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      KaijuCollectionFactory: {
        address: factoryAddress,
        shadowMintFee: ethers.formatEther(await factory.shadowMintFee()),
        platformFeePercentage: (await factory.platformFeePercentage()).toString(),
        platformFeeRecipient: await factory.platformFeeRecipient()
      }
    }
  };

  // Save to deployments directory
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, `kaiju-nft-${network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  console.log(`💾 Deployment info saved to: ${deploymentFile}`);

  // Test creating a Kaiju collection
  console.log("\n🧪 Testing Kaiju Collection Creation...");
  
  const testKaijuName = "Thunder Dragon";
  const testAlgorithmUrl = "https://api.example.com/thunder-dragon";
  const testKaijuMetadata = "https://metadata.example.com/kaiju/thunder-dragon.json";
  const testShadowMetadataUris = [
    "https://metadata.example.com/shadow/thunder-dragon-powerful.json",
    "https://metadata.example.com/shadow/thunder-dragon-mature.json",
    "https://metadata.example.com/shadow/thunder-dragon-ancient.json"
  ];
  const testEntryFee = ethers.parseEther("0.1");
  const testProfitShare = 2000; // 20%

  const tx = await factory.createKaijuCollection(
    testKaijuName,
    testAlgorithmUrl,
    testKaijuMetadata,
    testShadowMetadataUris,
    testEntryFee,
    testProfitShare
  );

  const receipt = await tx.wait();
  console.log("🎉 Test Kaiju Collection created! Transaction:", receipt.hash);

  // Get the created collection info
  const collectionInfo = await factory.getCollection(1);
  console.log("\n📊 Collection Info:");
  console.log("- Kaiju Contract:", collectionInfo.kaijuContract);
  console.log("- Shadow Contract:", collectionInfo.shadowContract);
  console.log("- Creator:", collectionInfo.creator);
  console.log("- Name:", collectionInfo.name);

  // Test minting a Shadow NFT
  console.log("\n👤 Testing Shadow NFT Mint...");
  
  const shadowMintFee = await factory.shadowMintFee();
  const shadowTx = await factory.mintShadow(1, deployer.address, { value: shadowMintFee });
  await shadowTx.wait();
  
  console.log("✨ Shadow NFT minted successfully!");

  // Get Shadow contract and test aging mechanics
  const ShadowNFT = await ethers.getContractFactory("ShadowNFT");
  const shadowContract = ShadowNFT.attach(collectionInfo.shadowContract);
  
  const shadowData = await shadowContract.getShadowData(1);
  console.log("\n🌙 Shadow NFT Data:");
  console.log("- Current Stage:", ["Powerful", "Mature", "Ancient"][shadowData.currentStage]);
  console.log("- Time Elapsed:", shadowData.timeElapsed.toString(), "seconds");
  console.log("- Aging Progress:", (await shadowContract.getAgingProgress(1)).toString() + "%");
  console.log("- Is Pinned:", shadowData.isPinned);

  // Update deployment info with test collection
  deploymentInfo.testCollection = {
    collectionId: "1",
    name: testKaijuName,
    kaijuContract: collectionInfo.kaijuContract,
    shadowContract: collectionInfo.shadowContract,
    creator: collectionInfo.creator,
    creationTx: receipt.hash
  };

  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

  console.log("\n🎊 Deployment Complete!");
  console.log("=====================================");
  console.log("Factory Address:", factoryAddress);
  console.log("Test Kaiju Contract:", collectionInfo.kaijuContract);
  console.log("Test Shadow Contract:", collectionInfo.shadowContract);
  console.log("=====================================");

  return {
    factory: factoryAddress,
    kaijuContract: collectionInfo.kaijuContract,
    shadowContract: collectionInfo.shadowContract
  };
}

// Run the deployment
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("❌ Deployment failed:", error);
      process.exit(1);
    });
}

module.exports = { main };