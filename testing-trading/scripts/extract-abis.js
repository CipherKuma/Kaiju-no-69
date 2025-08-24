const fs = require('fs');
const path = require('path');

// Contract artifacts to extract
const contracts = [
  {
    name: 'KaijuCollectionFactory',
    path: 'contracts/kaiju-nft/KaijuCollectionFactory.sol/KaijuCollectionFactory.json'
  },
  {
    name: 'KaijuNFT',
    path: 'contracts/kaiju-nft/KaijuNFT.sol/KaijuNFT.json'
  },
  {
    name: 'ShadowNFT', 
    path: 'contracts/kaiju-nft/ShadowNFT.sol/ShadowNFT.json'
  }
];

// Output directory
const outputDir = path.join(__dirname, '../../frontend/src/lib/contracts');

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('🔧 Extracting contract ABIs...');

// Extract ABIs
contracts.forEach(contract => {
  try {
    const artifactPath = path.join(__dirname, '../artifacts', contract.path);
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    
    // Extract ABI
    const abi = artifact.abi;
    
    // Save ABI to frontend
    const abiFile = path.join(outputDir, `${contract.name}.json`);
    fs.writeFileSync(abiFile, JSON.stringify(abi, null, 2));
    
    console.log(`✅ Extracted ${contract.name} ABI`);
  } catch (error) {
    console.error(`❌ Failed to extract ${contract.name}:`, error.message);
  }
});

// Create addresses file template
const addressesTemplate = {
  hardhat: {
    chainId: 31337,
    KaijuCollectionFactory: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    // These will be populated when collections are created
    testKaijuNFT: "0xa16E02E87b7454126E5E10d957A927A7F5B5d2be",
    testShadowNFT: "0xB7A5bd0345EF1Cc5E66bf61BdeC17D2461fBd968"
  },
  shapeSepolia: {
    chainId: 11011,
    KaijuCollectionFactory: "", // Will be filled when deployed
  },
  shapeMainnet: {
    chainId: 360,
    KaijuCollectionFactory: "", // Will be filled when deployed
  }
};

const addressesFile = path.join(outputDir, 'addresses.json');
fs.writeFileSync(addressesFile, JSON.stringify(addressesTemplate, null, 2));
console.log('✅ Created addresses template');

console.log('🎉 ABI extraction complete!');