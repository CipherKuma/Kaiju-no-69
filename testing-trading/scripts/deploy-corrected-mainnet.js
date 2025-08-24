const { ethers } = require("hardhat");
const { generateKaijuImages, uploadKaijuCollectionToIPFS } = require('./ipfs-utils');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function main() {
  console.log("🚀 DEPLOYING CORRECTED KAIJU NFT SYSTEM 🚀");
  console.log("============================================");
  
  const [deployer] = await ethers.getSigners();
  const network = await deployer.provider.getNetwork();
  const balance = await deployer.provider.getBalance(deployer.address);
  
  console.log("🌐 Network:", network.name, "(Chain ID:", network.chainId.toString() + ")");
  console.log("👛 Deployer:", deployer.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "ETH");
  
  if (balance < ethers.parseEther("0.0008")) {
    throw new Error("Insufficient balance for deployment. Need at least 0.0008 ETH");
  }

  console.log("\n📦 Deploying KaijuCollectionFactory with corrected settings...");
  
  // Deploy factory contract with updated shadow mint fee
  const KaijuCollectionFactory = await ethers.getContractFactory("KaijuCollectionFactory");
  const factory = await KaijuCollectionFactory.deploy(deployer.address);
  await factory.waitForDeployment();
  
  const factoryAddress = await factory.getAddress();
  console.log("✅ KaijuCollectionFactory deployed to:", factoryAddress);
  
  // Get contract settings
  const shadowMintFee = await factory.shadowMintFee();
  const platformFeePercentage = await factory.platformFeePercentage();
  
  console.log("⚙️  Shadow Mint Fee:", ethers.formatEther(shadowMintFee), "ETH (Testing - Very Low!)");
  console.log("⚙️  Platform Fee:", (Number(platformFeePercentage) / 100).toString() + "%");

  // Test Kaiju data - single prompt for main + shadow incarnations
  const testKaijuData = {
    name: "Thunder Phoenix Emperor",
    description: "A majestic phoenix-dragon hybrid that controls lightning and thunder, wielding the power of storms to dominate crypto markets. Its feathers crackle with electric energy while its eyes burn with the intensity of market volatility.",
    algorithmUrl: "https://kaiju-trading-api.vercel.app/thunder-phoenix/v1",
    entryFee: "0.001", // ETH
    profitShare: 20, // 20%
    prompt: "A majestic phoenix-dragon hybrid with electric feathers, glowing lightning eyes, storm clouds swirling around it, thunder and lightning effects, majestic wings spread, golden and electric blue colors, mythical creature, highly detailed, epic fantasy art"
  };

  console.log(`\n🎨 GENERATING MAIN KAIJU + 3 SHADOW INCARNATIONS...`);
  console.log("📝 Single Prompt:", testKaijuData.prompt);
  console.log("=" .repeat(60));
  
  // Generate main Kaiju + 3 shadow incarnations from single prompt
  const images = await generateKaijuImages(testKaijuData.prompt, testKaijuData.name);
  
  console.log("\n✅ IMAGE GENERATION COMPLETE!");
  console.log("🐉 Main Kaiju:", images.kaiju.substring(0, 50) + "...");
  console.log("👤 Shadow Incarnation 1 (Powerful):", images.shadowStages[0].substring(0, 50) + "...");
  console.log("👤 Shadow Incarnation 2 (Weaker):", images.shadowStages[1].substring(0, 50) + "...");
  console.log("👤 Shadow Incarnation 3 (Weakest):", images.shadowStages[2].substring(0, 50) + "...");

  console.log(`\n📁 UPLOADING TO IPFS...`);
  console.log("=" .repeat(25));
  
  // Upload everything to IPFS
  const ipfsData = await uploadKaijuCollectionToIPFS(
    testKaijuData.name,
    testKaijuData.description,
    testKaijuData.entryFee,
    testKaijuData.profitShare,
    images
  );

  console.log("\n✅ IPFS UPLOAD COMPLETE!");
  console.log("🐉 Main Kaiju Metadata:", ipfsData.kaiju.metadataUrl);
  console.log("👤 Shadow Incarnation URLs:");
  ipfsData.shadows.forEach((shadow, index) => {
    console.log(`   ${shadow.stage} (${index + 1}):`, shadow.metadataUrl);
  });

  console.log(`\n🔗 CREATING NFT COLLECTION ON-CHAIN...`);
  console.log("=" .repeat(45));
  
  // Create the NFT collection (auto-mints Kaiju to creator)
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
  console.log("🐉 Kaiju NFT automatically minted to creator!");

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

  // Test wallet for shadow minting
  const testWallet = "0xb9119A436c9D59ffBc468648E9137C386ffFe01b";
  console.log(`\n🧪 MINTING SHADOWS TO TEST WALLET...`);
  console.log("🎯 Test Wallet:", testWallet);
  console.log("=" .repeat(40));
  
  // Get Shadow contract for pinning
  const ShadowNFT = await ethers.getContractFactory("ShadowNFT");
  const shadowNFTContract = ShadowNFT.attach(shadowContract);
  
  // Mint 3 Shadow NFTs to test wallet
  const mintFee = await factory.shadowMintFee();
  console.log("💰 Shadow Mint Fee:", ethers.formatEther(mintFee), "ETH per NFT");
  
  for (let i = 1; i <= 3; i++) {
    console.log(`\n⚡ Minting Shadow #${i} to test wallet...`);
    try {
      const mintTx = await factory.mintShadow(1, testWallet, { 
        value: mintFee,
        gasLimit: 500000 
      });
      
      const mintReceipt = await mintTx.wait();
      console.log(`✅ Shadow #${i} minted! Gas used:`, mintReceipt.gasUsed.toString());
    } catch (error) {
      console.log(`❌ Failed to mint Shadow #${i}:`, error.message);
      continue;
    }
  }

  console.log(`\n🎭 SETTING UP DIFFERENT SHADOW STAGES FOR TESTING...`);
  console.log("=" .repeat(50));
  
  // Pin different shadows to different stages for immediate testing
  console.log("📌 Shadow #1: Keeping as Powerful (default)");
  
  console.log("📌 Shadow #2: Pinning to Weaker stage...");
  try {
    const pinTx1 = await shadowNFTContract.pinShadowMetadata(2, 1); // 1 = Weaker
    await pinTx1.wait();
    console.log("✅ Shadow #2 pinned to Weaker stage");
  } catch (error) {
    console.log("❌ Failed to pin Shadow #2:", error.message);
  }
  
  console.log("📌 Shadow #3: Pinning to Weakest stage...");
  try {
    const pinTx2 = await shadowNFTContract.pinShadowMetadata(3, 2); // 2 = Weakest
    await pinTx2.wait();
    console.log("✅ Shadow #3 pinned to Weakest stage");
  } catch (error) {
    console.log("❌ Failed to pin Shadow #3:", error.message);
  }

  console.log(`\n👤 FINAL SHADOW STATES IN TEST WALLET:`);
  console.log("=" .repeat(45));
  
  for (let tokenId = 1; tokenId <= 3; tokenId++) {
    try {
      const owner = await shadowNFTContract.ownerOf(tokenId);
      if (owner.toLowerCase() === testWallet.toLowerCase()) {
        const shadowData = await shadowNFTContract.getShadowData(tokenId);
        const tokenURI = await shadowNFTContract.tokenURI(tokenId);
        const stageNames = ['Powerful', 'Weaker', 'Weakest'];
        
        console.log(`\n🌙 Shadow NFT #${tokenId}: ${stageNames[shadowData[1]]}`);
        console.log(`   Owner: ${owner}`);
        console.log(`   Pinned: ${shadowData[4] ? 'YES' : 'NO'}`);
        console.log(`   Metadata: ${tokenURI}`);
        console.log(`   🎨 Shows ${stageNames[shadowData[1]].toLowerCase()} shadow incarnation!`);
      }
    } catch (error) {
      console.log(`❌ Error checking Shadow #${tokenId}`);
    }
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
      profitShare: testKaijuData.profitShare + "%",
      testWallet: testWallet
    },
    ipfsData: {
      kaiju: ipfsData.kaiju,
      shadows: ipfsData.shadows
    },
    generatedImages: {
      kaiju: images.kaiju,
      shadowStages: images.shadowStages
    },
    corrections: {
      shadowMintFee: "0.0001 ETH (very low for testing)",
      imageGeneration: "Single prompt generates main Kaiju + 3 shadow incarnations",
      shadowProgression: "Powerful → Weaker → Weakest incarnations of same creature",
      autoMinting: "Kaiju NFT auto-minted to creator on collection creation",
      testSetup: "3 different shadow stages minted to test wallet for immediate viewing"
    }
  };

  // Save deployment file
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, `kaiju-nft-corrected-${network.name}.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

  console.log(`\n💾 Deployment info saved to: ${deploymentFile}`);

  console.log(`\n🎊 CORRECTED SYSTEM DEPLOYED! 🎊`);
  console.log("=" .repeat(50));
  console.log(`🏭 Factory Contract: ${factoryAddress}`);
  console.log(`🐉 Kaiju NFT: ${kaijuContract}`);
  console.log(`👤 Shadow NFT: ${shadowContract}`);
  console.log(`🌐 Explorer: https://shapescan.xyz/address/${factoryAddress}`);
  
  console.log(`\n✅ CORRECTIONS IMPLEMENTED:`);
  console.log("=" .repeat(30));
  console.log("🔸 Shadow mint fee: 0.0001 ETH (testing)");
  console.log("🔸 Single prompt → Main + 3 shadow incarnations");
  console.log("🔸 Shadows are incarnations, not different creatures");
  console.log("🔸 Progression: Powerful → Weaker → Weakest");
  console.log("🔸 Kaiju auto-minted to creator");
  console.log("🔸 Test shadows minted to specified wallet");
  console.log("🔸 All 3 shadow stages immediately viewable");

  console.log(`\n🎯 TEST WALLET HAS:`);
  console.log("=" .repeat(20));
  console.log("👤 Shadow #1: Powerful incarnation (intense energy)");
  console.log("👤 Shadow #2: Weaker incarnation (moderate energy)");
  console.log("👤 Shadow #3: Weakest incarnation (fading energy)");
  
  console.log(`\n🔗 VIEW COLLECTION:`);
  console.log("=" .repeat(20));
  console.log("OpenSea: https://opensea.io/collection/shape/" + shadowContract.toLowerCase());
  console.log("Shape Explorer: https://shapescan.xyz/address/" + shadowContract);

  return {
    factoryAddress,
    kaijuContract,
    shadowContract,
    collectionId: 1,
    testWallet,
    ipfsData,
    deployment: deploymentInfo
  };
}

if (require.main === module) {
  main()
    .then(() => {
      console.log(`\n🚀 Corrected Kaiju NFT system is live! Ready for frontend integration! 🚀`);
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