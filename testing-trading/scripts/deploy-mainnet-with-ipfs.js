const { ethers } = require("hardhat");
const { generateKaijuImages, uploadKaijuCollectionToIPFS } = require('./ipfs-utils');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function main() {
  console.log("🚀 DEPLOYING KAIJU NFT SYSTEM TO SHAPE MAINNET 🚀");
  console.log("================================================");
  
  const [deployer] = await ethers.getSigners();
  const network = await deployer.provider.getNetwork();
  const balance = await deployer.provider.getBalance(deployer.address);
  
  console.log("🌐 Network:", network.name, "(Chain ID:", network.chainId.toString() + ")");
  console.log("👛 Deployer:", deployer.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "ETH");
  
  if (balance < ethers.parseEther("0.0005")) {
    throw new Error("Insufficient balance for deployment. Need at least 0.0005 ETH");
  }

  console.log("\n📦 Deploying KaijuCollectionFactory...");
  
  // Deploy factory contract
  const KaijuCollectionFactory = await ethers.getContractFactory("KaijuCollectionFactory");
  const factory = await KaijuCollectionFactory.deploy(deployer.address);
  await factory.waitForDeployment();
  
  const factoryAddress = await factory.getAddress();
  console.log("✅ KaijuCollectionFactory deployed to:", factoryAddress);
  
  // Get contract settings
  const shadowMintFee = await factory.shadowMintFee();
  const platformFeePercentage = await factory.platformFeePercentage();
  
  console.log("⚙️  Shadow Mint Fee:", ethers.formatEther(shadowMintFee), "ETH");
  console.log("⚙️  Platform Fee:", (Number(platformFeePercentage) / 100).toString() + "%");

  // Test Kaiju data
  const testKaijuData = {
    name: "Lightning Dragon Master",
    description: "A legendary lightning-powered trading Kaiju that harnesses the power of market volatility to generate unprecedented profits. With scales that crackle with electric energy and eyes that see through market deception, this beast dominates the crypto trading realm.",
    algorithmUrl: "https://kaiju-trading-api.vercel.app/lightning-dragon/v1",
    entryFee: "0.05", // ETH
    profitShare: 25, // 25%
    prompt: "A majestic dragon with lightning coursing through its body, electric blue and gold scales, glowing cyan eyes, crypto currency symbols floating around it, cyberpunk aesthetic, digital art, highly detailed"
  };

  console.log(`\n🎨 GENERATING 4 IMAGES FOR "${testKaijuData.name.toUpperCase()}"...`);
  console.log("=" .repeat(60));
  
  // Generate all 4 images using Runware AI
  const images = await generateKaijuImages(testKaijuData.prompt, testKaijuData.name);
  
  console.log("\n✅ IMAGE GENERATION COMPLETE!");
  console.log("🐉 Kaiju Image:", images.kaiju.substring(0, 50) + "...");
  console.log("👤 Shadow Stage 1 (Powerful):", images.shadowStages[0].substring(0, 50) + "...");
  console.log("👤 Shadow Stage 2 (Mature):", images.shadowStages[1].substring(0, 50) + "...");
  console.log("👤 Shadow Stage 3 (Ancient):", images.shadowStages[2].substring(0, 50) + "...");

  console.log(`\n📁 UPLOADING TO IPFS VIA PINATA...`);
  console.log("=" .repeat(40));
  
  // Upload everything to IPFS
  const ipfsData = await uploadKaijuCollectionToIPFS(
    testKaijuData.name,
    testKaijuData.description,
    testKaijuData.entryFee,
    testKaijuData.profitShare,
    images
  );

  console.log("\n✅ IPFS UPLOAD COMPLETE!");
  console.log("🐉 Kaiju Metadata:", ipfsData.kaiju.metadataUrl);
  console.log("👤 Shadow Stage URLs:");
  ipfsData.shadows.forEach((shadow, index) => {
    console.log(`   Stage ${index + 1} (${shadow.stage}):`, shadow.metadataUrl);
  });

  console.log(`\n🔗 CREATING NFT COLLECTION ON-CHAIN...`);
  console.log("=" .repeat(45));
  
  // Create the NFT collection
  const createTx = await factory.createKaijuCollection(
    testKaijuData.name,
    testKaijuData.algorithmUrl,
    ipfsData.kaiju.metadataUrl,
    ipfsData.shadows.map(s => s.metadataUrl),
    ethers.parseEther(testKaijuData.entryFee),
    testKaijuData.profitShare * 100 // Convert to basis points
  );

  console.log("⏳ Transaction submitted:", createTx.hash);
  const receipt = await createTx.wait();
  console.log("✅ Collection created! Gas used:", receipt.gasUsed.toString());

  // Get collection details
  const collectionInfo = await factory.getCollection(1);
  const kaijuContract = collectionInfo[0];
  const shadowContract = collectionInfo[1];
  
  console.log("\n🎊 COLLECTION DETAILS:");
  console.log("=" .repeat(25));
  console.log("📋 Collection ID: #1");
  console.log("🐉 Kaiju Contract:", kaijuContract);
  console.log("👤 Shadow Contract:", shadowContract);
  console.log("👤 Creator:", collectionInfo[2]);
  console.log("📛 Name:", collectionInfo[3]);

  console.log(`\n🧪 TESTING SHADOW NFT MINTS...`);
  console.log("=" .repeat(35));
  
  // Test minting Shadow NFTs
  const mintFee = await factory.shadowMintFee();
  
  console.log("💰 Shadow Mint Fee:", ethers.formatEther(mintFee), "ETH");
  console.log("🔄 Minting 3 Shadow NFTs for testing...");

  // Mint 3 Shadow NFTs
  for (let i = 0; i < 3; i++) {
    console.log(`\n⚡ Minting Shadow NFT #${i + 1}...`);
    const mintTx = await factory.mintShadow(1, deployer.address, { 
      value: mintFee,
      gasLimit: 500000 
    });
    
    const mintReceipt = await mintTx.wait();
    console.log(`✅ Shadow #${i + 1} minted! Gas used:`, mintReceipt.gasUsed.toString());
  }

  // Get Shadow contract instance for aging tests
  const ShadowNFT = await ethers.getContractFactory("ShadowNFT");
  const shadowNFTContract = ShadowNFT.attach(shadowContract);
  
  console.log(`\n👤 SHADOW AGING INFORMATION:`);
  console.log("=" .repeat(35));
  
  for (let tokenId = 1; tokenId <= 3; tokenId++) {
    const shadowData = await shadowNFTContract.getShadowData(tokenId);
    const progress = await shadowNFTContract.getAgingProgress(tokenId);
    const stageNames = ['Powerful', 'Mature', 'Ancient'];
    
    console.log(`\n🌙 Shadow NFT #${tokenId}:`);
    console.log(`   Current Stage: ${stageNames[shadowData[1]]} (${shadowData[1]})`);
    console.log(`   Time Elapsed: ${shadowData[2]} seconds`);
    console.log(`   Aging Progress: ${progress}%`);
    console.log(`   Is Pinned: ${shadowData[4]}`);
    console.log(`   Token URI: ${await shadowNFTContract.tokenURI(tokenId)}`);
  }

  console.log(`\n⚡ TESTING SHADOW AGING MECHANICS...`);
  console.log("=" .repeat(40));
  
  // Test pinning different stages for demonstration
  console.log("📌 Pinning Shadow #2 to Mature stage...");
  const pinTx1 = await shadowNFTContract.pinShadowMetadata(2, 1); // 1 = Mature
  await pinTx1.wait();
  console.log("✅ Shadow #2 pinned to Mature stage");
  
  console.log("📌 Pinning Shadow #3 to Ancient stage...");  
  const pinTx2 = await shadowNFTContract.pinShadowMetadata(3, 2); // 2 = Ancient
  await pinTx2.wait();
  console.log("✅ Shadow #3 pinned to Ancient stage");

  console.log(`\n👤 UPDATED SHADOW STATES:`);
  console.log("=" .repeat(30));
  
  for (let tokenId = 1; tokenId <= 3; tokenId++) {
    const shadowData = await shadowNFTContract.getShadowData(tokenId);
    const stageNames = ['Powerful', 'Mature', 'Ancient'];
    
    console.log(`\n🌙 Shadow NFT #${tokenId}:`);
    console.log(`   Current Stage: ${stageNames[shadowData[1]]}`);
    console.log(`   Is Pinned: ${shadowData[4]}`);
    console.log(`   Metadata URI: ${await shadowNFTContract.tokenURI(tokenId)}`);
  }

  // Save deployment information
  const deploymentInfo = {
    network: {
      name: network.name,
      chainId: network.chainId.toString(),
      rpcUrl: network.name === 'shapeMainnet' ? 'https://mainnet.shape.network' : undefined
    },
    deployment: {
      timestamp: new Date().toISOString(),
      deployer: deployer.address,
      transactionHash: createTx.hash,
      gasUsed: receipt.gasUsed.toString()
    },
    contracts: {
      KaijuCollectionFactory: {
        address: factoryAddress,
        shadowMintFee: ethers.formatEther(shadowMintFee),
        platformFeePercentage: (Number(platformFeePercentage) / 100).toString() + "%"
      }
    },
    testCollection: {
      collectionId: 1,
      name: testKaijuData.name,
      kaijuContract: kaijuContract,
      shadowContract: shadowContract,
      creator: deployer.address,
      entryFee: testKaijuData.entryFee + " ETH",
      profitShare: testKaijuData.profitShare + "%"
    },
    ipfsData: {
      kaiju: ipfsData.kaiju,
      shadows: ipfsData.shadows
    },
    generatedImages: {
      kaiju: images.kaiju,
      shadowStages: images.shadowStages
    }
  };

  // Save deployment file
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, `kaiju-nft-${network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

  console.log(`\n💾 Deployment info saved to: ${deploymentFile}`);

  console.log(`\n🎊 DEPLOYMENT COMPLETE! 🎊`);
  console.log("=" .repeat(50));
  console.log(`🏭 Factory Contract: ${factoryAddress}`);
  console.log(`🐉 Kaiju NFT: ${kaijuContract}`);
  console.log(`👤 Shadow NFT: ${shadowContract}`);
  console.log(`🌐 Explorer: https://shapescan.xyz/address/${factoryAddress}`);
  console.log(`📱 Collection: https://opensea.io/collection/shape-mainnet/${shadowContract}`);
  
  console.log(`\n🔗 IMPORTANT LINKS:`);
  console.log("=" .repeat(20));
  console.log(`Kaiju Metadata: ${ipfsData.kaiju.metadataUrl}`);
  console.log(`Shadow Stage 1: ${ipfsData.shadows[0].metadataUrl}`);
  console.log(`Shadow Stage 2: ${ipfsData.shadows[1].metadataUrl}`);
  console.log(`Shadow Stage 3: ${ipfsData.shadows[2].metadataUrl}`);

  return {
    factoryAddress,
    kaijuContract,
    shadowContract,
    collectionId: 1,
    ipfsData,
    deployment: deploymentInfo
  };
}

if (require.main === module) {
  main()
    .then(() => {
      console.log(`\n🚀 Ready for production! Your Kaiju NFT system is live on Shape Mainnet! 🚀`);
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n❌ DEPLOYMENT FAILED:");
      console.error("=" .repeat(25));
      console.error(error);
      process.exit(1);
    });
}

module.exports = { main };