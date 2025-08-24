const axios = require('axios');
const FormData = require('form-data');
const fetch = require('node-fetch');
require('dotenv').config();

const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_API_SECRET = process.env.PINATA_API_SECRET;
const PINATA_JWT = process.env.PINATA_JWT;

/**
 * Upload an image URL to Pinata IPFS
 */
async function uploadImageToPinata(imageUrl, fileName) {
  try {
    console.log(`📁 Uploading ${fileName} to IPFS...`);
    
    // Download the image
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    
    const imageBuffer = await response.buffer();
    
    // Create form data
    const formData = new FormData();
    formData.append('file', imageBuffer, fileName);
    
    // Add pinata options
    const pinataOptions = JSON.stringify({
      cidVersion: 1,
      customPinPolicy: {
        regions: [
          {
            id: 'FRA1',
            desiredReplicationCount: 1
          },
          {
            id: 'NYC1', 
            desiredReplicationCount: 1
          }
        ]
      }
    });
    formData.append('pinataOptions', pinataOptions);
    
    // Upload to Pinata
    const pinataResponse = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
      headers: {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${PINATA_JWT}`
      }
    });

    const ipfsHash = pinataResponse.data.IpfsHash;
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
    
    console.log(`✅ ${fileName} uploaded to IPFS: ${ipfsUrl}`);
    return { ipfsHash, ipfsUrl };
    
  } catch (error) {
    console.error(`❌ Failed to upload ${fileName} to IPFS:`, error.message);
    throw error;
  }
}

/**
 * Upload JSON metadata to Pinata IPFS
 */
async function uploadMetadataToPinata(metadata, fileName) {
  try {
    console.log(`📝 Uploading ${fileName} metadata to IPFS...`);
    
    const response = await axios.post('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      pinataContent: metadata,
      pinataOptions: {
        cidVersion: 1,
        customPinPolicy: {
          regions: [
            {
              id: 'FRA1',
              desiredReplicationCount: 1
            },
            {
              id: 'NYC1',
              desiredReplicationCount: 1
            }
          ]
        }
      },
      pinataMetadata: {
        name: fileName,
        keyvalues: {
          project: 'kaiju-no-69',
          type: 'metadata'
        }
      }
    }, {
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`,
        'Content-Type': 'application/json'
      }
    });

    const ipfsHash = response.data.IpfsHash;
    const ipfsUrl = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;
    
    console.log(`✅ ${fileName} metadata uploaded to IPFS: ${ipfsUrl}`);
    return { ipfsHash, ipfsUrl };
    
  } catch (error) {
    console.error(`❌ Failed to upload ${fileName} metadata to IPFS:`, error.message);
    throw error;
  }
}

/**
 * Create NFT metadata JSON
 */
function createMetadata(name, description, imageUrl, attributes = []) {
  return {
    name,
    description,
    image: imageUrl,
    attributes,
    external_url: `https://kaiju-no-69.vercel.app/kaiju/${name.toLowerCase().replace(/\s+/g, '-')}`,
    background_color: "000000",
    animation_url: null,
    youtube_url: null
  };
}

/**
 * Generate Kaiju images using Runware AI
 */
async function generateKaijuImages(prompt, kaijuName) {
  try {
    console.log(`🎨 Generating images for ${kaijuName}...`);
    
    // This would integrate with your Runware AI service
    // For now, I'll create a mock implementation that you can replace
    const { Runware } = require('@runware/sdk-js');
    
    const runware = new Runware({ 
      apiKey: 'F7nehgk6wilDDC97BewmSwESkYxj9Rak',
      shouldReconnect: true,
      globalMaxRetries: 3,
    });

    // Generate Kaiju image
    console.log('🐉 Generating Kaiju image...');
    const kaijuImages = await runware.requestImages({
      positivePrompt: `${prompt}, powerful trading beast, digital monster, cryptocurrency theme, epic pose, detailed, high quality`,
      negativePrompt: 'low quality, blurry, distorted',
      width: 512,
      height: 512,
      model: 'runware:101@1',
      steps: 30,
      numberResults: 1,
    });

    // Generate Shadow Stage 1 (Powerful Shadow Incarnation)
    console.log('👤 Generating Shadow Stage 1 (Powerful Shadow Incarnation)...');
    const shadowStage1Images = await runware.requestImages({
      positivePrompt: `shadow incarnation of (${prompt}), same creature but as a dark shadow, intense neon purple energy radiating, maximum power, glowing purple aura, dark ethereal form, mystical shadow energy, super powerful shadow version`,
      negativePrompt: 'low quality, blurry, distorted, different creature, weak, faded, solid body',
      width: 512,
      height: 512,
      model: 'runware:101@1',
      steps: 30,
      numberResults: 1,
    });

    // Generate Shadow Stage 2 (Weaker Shadow Incarnation)
    console.log('👤 Generating Shadow Stage 2 (Weaker Shadow Incarnation)...');
    const shadowStage2Images = await runware.requestImages({
      positivePrompt: `weaker shadow incarnation of (${prompt}), same creature but as aging shadow, moderate purple glow, translucent form, medium energy, fading power, dimmer shadow aura, aging shadow version`,
      negativePrompt: 'low quality, blurry, distorted, different creature, intense power, bright, solid',
      width: 512,
      height: 512,
      model: 'runware:101@1',
      steps: 30,
      numberResults: 1,
    });

    // Generate Shadow Stage 3 (Weakest Shadow Incarnation)
    console.log('👤 Generating Shadow Stage 3 (Weakest Shadow Incarnation)...');
    const shadowStage3Images = await runware.requestImages({
      positivePrompt: `weakest shadow incarnation of (${prompt}), same creature but as fading shadow, weak purple glow, very translucent, minimal energy, almost invisible, dying shadow form, barely visible incarnation`,
      negativePrompt: 'low quality, blurry, distorted, different creature, bright, intense, powerful, solid form',
      width: 512,
      height: 512,
      model: 'runware:101@1',
      steps: 30,
      numberResults: 1,
    });

    return {
      kaiju: kaijuImages[0].imageURL,
      shadowStages: [
        shadowStage1Images[0].imageURL,
        shadowStage2Images[0].imageURL,
        shadowStage3Images[0].imageURL
      ]
    };

  } catch (error) {
    console.error('❌ Failed to generate images:', error);
    throw error;
  }
}

/**
 * Upload all images and metadata for a Kaiju collection to IPFS
 */
async function uploadKaijuCollectionToIPFS(kaijuName, description, entryFee, profitShare, images) {
  try {
    console.log(`🚀 Uploading complete ${kaijuName} collection to IPFS...`);
    
    // Upload Kaiju image
    const kaijuImageUpload = await uploadImageToPinata(
      images.kaiju, 
      `${kaijuName.toLowerCase().replace(/\s+/g, '-')}-kaiju.jpg`
    );

    // Upload Shadow images
    const shadowImageUploads = await Promise.all([
      uploadImageToPinata(
        images.shadowStages[0], 
        `${kaijuName.toLowerCase().replace(/\s+/g, '-')}-shadow-powerful.jpg`
      ),
      uploadImageToPinata(
        images.shadowStages[1], 
        `${kaijuName.toLowerCase().replace(/\s+/g, '-')}-shadow-mature.jpg`
      ),
      uploadImageToPinata(
        images.shadowStages[2], 
        `${kaijuName.toLowerCase().replace(/\s+/g, '-')}-shadow-ancient.jpg`
      )
    ]);

    // Create and upload Kaiju metadata
    const kaijuMetadata = createMetadata(
      kaijuName,
      description,
      kaijuImageUpload.ipfsUrl,
      [
        { trait_type: "Type", value: "Kaiju" },
        { trait_type: "Rarity", value: "Legendary" },
        { trait_type: "Entry Fee", value: `${entryFee} ETH` },
        { trait_type: "Profit Share", value: `${profitShare}%` },
        { trait_type: "Supply", value: "1 of 1" }
      ]
    );

    const kaijuMetadataUpload = await uploadMetadataToPinata(
      kaijuMetadata,
      `${kaijuName.toLowerCase().replace(/\s+/g, '-')}-kaiju-metadata.json`
    );

    // Create and upload Shadow metadata
    const stageNames = ['Powerful', 'Weaker', 'Weakest'];
    const stageDescriptions = [
      'A powerful shadow incarnation of the original Kaiju, radiating intense purple energy and maximum power',
      'A weaker shadow incarnation as it ages, with moderate energy and fading power over time',
      'The weakest shadow incarnation, barely visible with minimal energy, nearing complete dissolution'
    ];

    const shadowMetadataUploads = await Promise.all(
      shadowImageUploads.map(async (imageUpload, index) => {
        const stageName = stageNames[index];
        const metadata = createMetadata(
          `${kaijuName} Shadow - ${stageName}`,
          stageDescriptions[index],
          imageUpload.ipfsUrl,
          [
            { trait_type: "Type", value: "Shadow" },
            { trait_type: "Stage", value: stageName },
            { trait_type: "Stage Number", value: index + 1 },
            { trait_type: "Parent Kaiju", value: kaijuName },
            { trait_type: "Aging Duration", value: "30 days" },
            { trait_type: "Days Remaining", value: 30 - (index * 10) },
            { trait_type: "Power Level", value: ["Maximum", "Medium", "Minimal"][index] }
          ]
        );

        return uploadMetadataToPinata(
          metadata,
          `${kaijuName.toLowerCase().replace(/\s+/g, '-')}-shadow-${stageName.toLowerCase()}-metadata.json`
        );
      })
    );

    console.log(`🎉 Complete ${kaijuName} collection uploaded to IPFS!`);
    
    return {
      kaiju: {
        imageUrl: kaijuImageUpload.ipfsUrl,
        metadataUrl: kaijuMetadataUpload.ipfsUrl
      },
      shadows: shadowMetadataUploads.map((upload, index) => ({
        stage: stageNames[index],
        imageUrl: shadowImageUploads[index].ipfsUrl,
        metadataUrl: upload.ipfsUrl
      }))
    };

  } catch (error) {
    console.error('❌ Failed to upload collection to IPFS:', error);
    throw error;
  }
}

module.exports = {
  uploadImageToPinata,
  uploadMetadataToPinata,
  createMetadata,
  generateKaijuImages,
  uploadKaijuCollectionToIPFS
};