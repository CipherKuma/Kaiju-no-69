'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { runwareAI } from '@/lib/api/runware';
import { useKaijuNFT } from '@/hooks/use-kaiju-nft';
import { kaijuApi } from '@/lib/api/kaiju-api';
import { authApi } from '@/lib/api/auth-api';
import { useKaijuStore } from '@/lib/stores/kaijuStore';
import { useAccount } from 'wagmi';
import { 
  Loader2, 
  Sparkles, 
  Link, 
  Image as ImageIcon,
  RefreshCw,
  CheckCircle,
  ArrowRight,
  Zap
} from 'lucide-react';
import { Label } from '@/components/ui/label';

interface GeneratedImages {
  kaiju: string;
  shadowStages: [string, string, string];
}

export default function CreateKaijuPage() {
  const router = useRouter();
  const { address } = useAccount();
  const { createKaijuCollection, isCreating, getCollection } = useKaijuNFT();
  const kaijuStore = useKaijuStore();
  const [step, setStep] = useState<'configure' | 'design' | 'complete'>('configure');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdCollection, setCreatedCollection] = useState<{
    transactionHash: string;
    collectionId: number;
    kaijuContract?: string;
    shadowContract?: string;
  } | null>(null);
  
  // Form states
  const [prompt, setPrompt] = useState('');
  const [algorithmUrl, setAlgorithmUrl] = useState('');
  const [kaijuName, setKaijuName] = useState('');
  const [description, setDescription] = useState('');
  const [entryFee, setEntryFee] = useState('10');
  const [profitShare, setProfitShare] = useState('20');
  
  // Generated images
  const [generatedImages, setGeneratedImages] = useState<GeneratedImages | null>(null);
  const [regenerating, setRegenerating] = useState(false);

  const handleGenerateImages = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description for your Kaiju');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const images = await runwareAI.generateKaijuAndShadowStages(prompt);
      setGeneratedImages(images);
    } catch (err) {
      setError('Failed to generate images. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateImages = async () => {
    setRegenerating(true);
    setError(null);

    try {
      const images = await runwareAI.generateKaijuAndShadowStages(prompt);
      setGeneratedImages(images);
    } catch (err) {
      setError('Failed to regenerate images. Please try again.');
      console.error(err);
    } finally {
      setRegenerating(false);
    }
  };

  const handleSubmit = async () => {
    if (!algorithmUrl || !kaijuName || !generatedImages) {
      setError('Missing required fields or images. Please complete all steps.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Creating Kaiju NFT collection...');
      
      // Create the NFT collection on-chain
      const result = await createKaijuCollection({
        name: kaijuName,
        algorithmUrl: algorithmUrl,
        description: description || `${kaijuName} - A powerful trading Kaiju`,
        entryFee: entryFee,
        profitShare: parseInt(profitShare),
        images: generatedImages
      });

      console.log('Kaiju collection created successfully:', result);
      
      // Fetch collection details to get contract addresses
      try {
        const collectionDetails = await getCollection(result.collectionId);
        setCreatedCollection({
          transactionHash: result.transactionHash,
          collectionId: result.collectionId,
          kaijuContract: collectionDetails.kaijuContract,
          shadowContract: collectionDetails.shadowContract
        });
        
        // Save kaiju data to backend (Supabase)
        try {
          console.log('Saving Kaiju to database...');
          
          // Authenticate if not already authenticated
          if (!authApi.isAuthenticated() && address) {
            console.log('Authenticating wallet...');
            await authApi.connectWallet(address);
          }
          
          // Create kaiju in database
          const createdKaiju = await kaijuApi.createKaiju({
            nftCollectionAddress: collectionDetails.kaijuContract,
            name: kaijuName,
            bio: description || `${kaijuName} - A powerful trading Kaiju`,
            algorithmUrl: algorithmUrl,
            kaijuImageUrl: generatedImages.kaiju,
            shadowImageUrl: generatedImages.shadowStages[0] // Use the powerful stage as default
          });
          
          console.log('Kaiju saved to database:', createdKaiju);
          
          // Add to local store
          kaijuStore.addKaiju(createdKaiju);
        } catch (dbError: any) {
          console.error('Failed to save Kaiju to database:', dbError);
          // Don't fail the whole process if database save fails
          // The NFT is already created on-chain
          // But log a warning for the user
          console.warn('Note: Your Kaiju NFT was created successfully, but we could not save it to our database. You may not see full features until this is resolved.');
        }
      } catch (err) {
        console.error('Failed to fetch collection details:', err);
        // Still set basic info even if fetching details fails
        setCreatedCollection({
          transactionHash: result.transactionHash,
          collectionId: result.collectionId
        });
      }
      
      setStep('complete');
    } catch (err: any) {
      console.error('Failed to create Kaiju collection:', err);
      setError(err.message || 'Failed to create Kaiju. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden text-white">
      {/* Forest Video Background */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source src="/forest.mp4" type="video/mp4" />
      </video>
      
      {/* Dark Overlay for better text visibility */}
      <div className="absolute inset-0 bg-black/70" />
      
      {/* Content */}
      <div className="relative z-10">
        <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold font-heading mb-4 bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              Forge Your Kaiju
            </h1>
            <p className="text-xl text-gray-400">
              Create a legendary trading beast that will dominate the markets
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-12">
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 ${step === 'configure' ? 'text-blue-400' : 'text-gray-500'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  step === 'configure' ? 'border-blue-400 bg-blue-400/20' : 'border-gray-500'
                }`}>
                  1
                </div>
                <span className="font-medium">Configure</span>
              </div>
              
              <div className="w-20 h-0.5 bg-gray-700" />
              
              <div className={`flex items-center gap-2 ${step === 'design' ? 'text-purple-400' : 'text-gray-500'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  step === 'design' ? 'border-purple-400 bg-purple-400/20' : 'border-gray-500'
                }`}>
                  2
                </div>
                <span className="font-medium">Design</span>
              </div>
              
              <div className="w-20 h-0.5 bg-gray-700" />
              
              <div className={`flex items-center gap-2 ${step === 'complete' ? 'text-green-400' : 'text-gray-500'}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                  step === 'complete' ? 'border-green-400 bg-green-400/20' : 'border-gray-500'
                }`}>
                  3
                </div>
                <span className="font-medium">Complete</span>
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {/* Step 1: Configure */}
            {step === 'configure' && (
              <motion.div
                key="configure"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="bg-stone-800 rounded-2xl p-8"
              >
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Zap className="w-6 h-6 text-blue-400" />
                  Configure Your Kaiju
                </h2>

                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="name" className="text-gray-300 mb-2 block">
                      Name <span className="text-red-400">*</span>
                      </Label>
                      <input
                        id="name"
                        type="text"
                        value={kaijuName}
                        onChange={(e) => setKaijuName(e.target.value)}
                        placeholder="e.g., Crypto Dragon"
                        className="input-ancient w-full"
                      />
                    </div>

                    <div>
                      <Label htmlFor="algorithm" className="text-gray-300 mb-2 block">
                        Algorithm Server URL <span className="text-red-400">*</span>
                      </Label>
                      <div className="relative">
                        <Link className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input
                          id="algorithm"
                          type="text"
                          value={algorithmUrl}
                          onChange={(e) => setAlgorithmUrl(e.target.value)}
                          placeholder="https://your-algo-server.com/api"
                          className="input-ancient w-full pl-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-gray-300 mb-2 block">
                      Bio
                    </Label>
                    <textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe your Kaiju's trading strategy and personality..."
                      className="input-ancient w-full h-24 resize-none"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="entryFee" className="text-gray-300 mb-2 block">
                        Sacrifice Fee ($ETH)
                      </Label>
                      <input
                        id="entryFee"
                        type="number"
                        value={entryFee}
                        onChange={(e) => setEntryFee(e.target.value)}
                        placeholder="10"
                        className="input-ancient w-full"
                      />
                    </div>

                    <div>
                      <Label htmlFor="profitShare" className="text-gray-300 mb-2 block">
                        Profit  Commission (%)
                      </Label>
                      <input
                        id="profitShare"
                        type="number"
                        value={profitShare}
                        onChange={(e) => setProfitShare(e.target.value)}
                        placeholder="20"
                        min="0"
                        max="100"
                        className="input-ancient w-full"
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400">
                      {error}
                    </div>
                  )}

                  <button
                    onClick={() => {
                      if (!kaijuName.trim() || !algorithmUrl.trim()) {
                        setError('Please fill in the required fields (Name and Algorithm URL)');
                        return;
                      }
                      setError(null);
                      setStep('design');
                    }}
                    disabled={!kaijuName.trim() || !algorithmUrl.trim()}
                    className="btn-ancient btn-ancient-fire w-full py-4 px-8 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    Next: Design Appearance
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Design */}
            {step === 'design' && (
              <motion.div
                key="design"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                {/* Prompt Input Section */}
                {!generatedImages && (
                  <div className="bg-stone-800 rounded-2xl p-8">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                      <ImageIcon className="w-6 h-6 text-purple-400" />
                      Design Your Kaiju's Appearance
                    </h2>

                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="prompt" className="text-gray-300 mb-2 block">
                          Appearance Description
                        </Label>
                        <textarea
                          id="prompt"
                          value={prompt}
                          onChange={(e) => setPrompt(e.target.value)}
                          placeholder={`A fierce ${kaijuName || 'dragon-like creature'} with glowing red eyes, mechanical wings, and cryptocurrency symbols on its scales...`}
                          className="input-ancient w-full h-32 resize-none"
                        />
                        <p className="text-sm text-gray-500 mt-2">
                          Be creative! Describe the appearance, style, and unique features of "{kaijuName || 'your Kaiju'}".
                        </p>
                      </div>

                      {error && (
                        <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400">
                          {error}
                        </div>
                      )}

                      <div className="flex gap-4">
                        <button
                          onClick={() => setStep('configure')}
                          className="btn-ancient py-3 px-8"
                        >
                          Back
                        </button>
                        <button
                          onClick={handleGenerateImages}
                          disabled={loading || !prompt.trim()}
                          className="btn-ancient btn-ancient-fire flex-1 py-4 px-8 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              Generating Your Kaiju...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-5 h-5" />
                              Generate {kaijuName || 'Kaiju'} & Shadow
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Generated Images Section */}
                {generatedImages && (
                  <div className="bg-stone-800 rounded-2xl p-8">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-2xl font-bold">Your Generated Kaiju</h2>
                      <button
                        onClick={handleRegenerateImages}
                        disabled={regenerating}
                        className="btn-ancient py-3 px-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {regenerating ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4" />
                        )}
                        <span>Regenerate</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      {/* Kaiju Form */}
                      <div>
                        <h3 className="text-lg font-semibold mb-3 text-red-400">Kaiju Form</h3>
                        <div className="relative rounded-xl overflow-hidden bg-gray-900 aspect-square">
                          <img
                            src={generatedImages.kaiju}
                            alt="Generated Kaiju"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-red-900/20 to-transparent pointer-events-none" />
                        </div>
                      </div>
                      
                      {/* Shadow Aging Stages */}
                      <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-purple-400">Shadow Evolution Stages</h3>
                        
                        <div className="grid grid-cols-3 gap-3">
                          {generatedImages.shadowStages.map((shadowUrl, index) => {
                            const stageNames = ['Powerful', 'Weaker', 'Weakest'];
                            const stageColors = ['from-purple-600/30', 'from-purple-500/20', 'from-purple-400/10'];
                            
                            return (
                              <div key={index} className="space-y-2">
                                <h4 className="text-sm font-medium text-purple-300 text-center">
                                  Stage {index + 1}: {stageNames[index]}
                                </h4>
                                <div className="relative rounded-lg overflow-hidden bg-gray-900 aspect-square">
                                  <img
                                    src={shadowUrl}
                                    alt={`Shadow Stage ${index + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                  <div className={`absolute inset-0 bg-gradient-to-t ${stageColors[index]} to-transparent pointer-events-none`} />
                                  <div className="absolute bottom-1 left-1 bg-black/60 rounded px-1 py-0.5 text-xs text-purple-300">
                                    {30 - (index * 10)} days
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                        <p className="text-sm text-gray-400 mt-3">
                          Shadows age over 30 days, weakening through three stages: Powerful → Weaker → Weakest.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-4 mt-8">
                      <button
                        onClick={() => setStep('configure')}
                        className="btn-ancient py-3 px-8"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={loading || isCreating}
                        className="btn-ancient btn-ancient-fire flex-1 py-4 px-8 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {(loading || isCreating) ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {isCreating ? 'Creating NFT Collection...' : 'Processing...'}
                          </>
                        ) : (
                          <>
                            Create {kaijuName || 'Kaiju'} NFT
                            <ArrowRight className="w-5 h-5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 3: Complete */}
            {step === 'complete' && (
              <motion.div
                key="complete"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-stone-800 rounded-2xl p-12"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="w-24 h-24 mx-auto mb-6 bg-green-500/20 rounded-full flex items-center justify-center"
                >
                  <CheckCircle className="w-12 h-12 text-green-400" />
                </motion.div>

                <h2 className="text-3xl font-bold mb-4 text-center">Kaiju NFT Collection Created!</h2>
                <p className="text-xl text-gray-400 mb-6 text-center">
                  Your trading beast "{kaijuName}" is now minted as an NFT and ready to dominate the markets.
                </p>

                {/* NFT Preview Section */}
                {generatedImages && (
                  <div className="bg-stone-900 rounded-xl p-6 mb-8">
                    <h3 className="text-lg font-semibold mb-4 text-center">Your NFT Collection</h3>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                      {/* Kaiju Preview */}
                      <div>
                        <h4 className="text-sm font-medium text-red-400 mb-2">Kaiju NFT (1 of 1)</h4>
                        <div className="relative rounded-lg overflow-hidden bg-gray-900 aspect-square">
                          <img
                            src={generatedImages.kaiju}
                            alt={`${kaijuName} Kaiju NFT`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-red-900/20 to-transparent pointer-events-none" />
                        </div>
                      </div>
                      
                      {/* Shadow Preview */}
                      <div>
                        <h4 className="text-sm font-medium text-purple-400 mb-2">Shadow NFTs (Infinite Edition)</h4>
                        <div className="grid grid-cols-3 gap-2">
                          {generatedImages.shadowStages.map((shadowUrl, index) => (
                            <div key={index} className="relative rounded overflow-hidden bg-gray-900 aspect-square">
                              <img
                                src={shadowUrl}
                                alt={`Shadow Stage ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-purple-600/20 to-transparent pointer-events-none" />
                              <div className="absolute bottom-0.5 left-0.5 bg-black/60 rounded px-1 text-xs text-purple-300">
                                {['Day 1', 'Day 10', 'Day 20'][index]}
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Shadows evolve over 30 days</p>
                      </div>
                    </div>
                  </div>
                )}

                {createdCollection && (
                  <div className="bg-stone-900 rounded-xl p-6 mb-8 text-left">
                    <h3 className="text-lg font-semibold mb-4 text-center">Collection Details</h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Collection ID:</span>
                        <span className="font-mono">#{createdCollection.collectionId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Transaction:</span>
                        <a 
                          href={`https://shapescan.xyz/tx/${createdCollection.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-blue-400 hover:text-blue-300 truncate max-w-32"
                        >
                          {createdCollection.transactionHash.substring(0, 10)}...
                        </a>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Entry Fee:</span>
                        <span>{entryFee} ETH</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Profit Share:</span>
                        <span>{profitShare}%</span>
                      </div>
                    </div>
                    
                    {/* OpenSea Link */}
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <div className="text-center">
                        <p className="text-xs text-gray-500 mb-2">View on NFT Marketplace</p>
                        <a 
                          href={createdCollection.kaijuContract ? 
                            `https://opensea.io/assets/shape/${createdCollection.kaijuContract}/0` : 
                            `https://opensea.io/collection/kaiju-${createdCollection.collectionId}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-colors"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 90 90">
                            <path d="M45 0C20.151 0 0 20.151 0 45C0 69.849 20.151 90 45 90C69.849 90 90 69.849 90 45C90 20.151 69.858 0 45 0ZM22.203 46.512L22.392 46.206L34.101 27.891C34.272 27.63 34.677 27.657 34.803 27.945C36.756 32.328 38.448 37.782 37.656 41.175C37.323 42.57 36.396 44.46 35.352 46.206C35.217 46.458 35.073 46.71 34.911 46.953C34.839 47.061 34.713 47.124 34.578 47.124H22.545C22.221 47.124 22.032 46.773 22.203 46.512ZM74.376 52.812C74.376 52.983 74.277 53.127 74.133 53.19C73.224 53.577 70.119 55.008 68.832 56.799C65.538 61.38 63.027 67.932 57.402 67.932H33.948C25.632 67.932 18.9 61.173 18.9 52.83V52.56C18.9 52.344 19.08 52.164 19.305 52.164H32.373C32.634 52.164 32.823 52.398 32.805 52.659C32.706 53.505 32.868 54.378 33.273 55.17C34.047 56.745 35.658 57.726 37.395 57.726H43.866V52.677H37.467C37.143 52.677 36.945 52.299 37.134 52.029C37.206 51.921 37.278 51.813 37.368 51.687C37.971 50.823 38.835 49.491 39.699 47.97C40.284 46.944 40.851 45.846 41.31 44.748C41.4 44.55 41.472 44.343 41.553 44.145C41.679 43.794 41.805 43.461 41.895 43.137C41.985 42.858 42.066 42.57 42.138 42.3C42.354 41.364 42.444 40.374 42.444 39.348C42.444 38.943 42.426 38.52 42.39 38.124C42.372 37.683 42.318 37.242 42.264 36.801C42.228 36.414 42.156 36.027 42.084 35.631C41.985 35.046 41.859 34.461 41.715 33.876L41.661 33.651C41.553 33.246 41.454 32.868 41.328 32.463C40.959 31.203 40.545 29.97 40.095 28.818C39.933 28.359 39.753 27.918 39.564 27.486C39.294 26.82 39.015 26.217 38.763 25.65C38.628 25.389 38.52 25.155 38.412 24.912C38.286 24.642 38.16 24.372 38.025 24.111C37.935 23.913 37.827 23.724 37.755 23.544L36.963 22.086C36.855 21.888 37.035 21.645 37.251 21.708L42.201 23.049H42.219C42.228 23.049 42.228 23.049 42.237 23.049L42.885 23.238L43.605 23.436L43.866 23.508V20.574C43.866 19.152 45 18 46.413 18C47.115 18 47.754 18.288 48.204 18.756C48.663 19.224 48.951 19.863 48.951 20.574V24.939L49.482 25.083C49.518 25.101 49.563 25.119 49.599 25.146C49.725 25.236 49.914 25.38 50.148 25.56C50.337 25.704 50.535 25.884 50.769 26.073C51.246 26.46 51.822 26.955 52.443 27.522C52.605 27.666 52.767 27.81 52.92 27.963C53.721 28.71 54.621 29.583 55.485 30.555C55.728 30.834 55.962 31.104 56.205 31.401C56.439 31.698 56.7 31.986 56.916 32.274C57.213 32.661 57.519 33.066 57.798 33.489C57.924 33.687 58.077 33.894 58.194 34.092C58.554 34.623 58.86 35.172 59.157 35.721C59.283 35.973 59.409 36.252 59.517 36.522C59.85 37.26 60.111 38.007 60.273 38.763C60.327 38.925 60.363 39.096 60.381 39.258V39.294C60.435 39.51 60.453 39.744 60.471 39.987C60.543 40.752 60.507 41.526 60.345 42.3C60.273 42.624 60.183 42.93 60.075 43.263C59.958 43.578 59.85 43.902 59.706 44.217C59.427 44.856 59.103 45.504 58.716 46.098C58.59 46.323 58.437 46.557 58.293 46.782C58.131 47.016 57.96 47.241 57.816 47.457C57.609 47.736 57.393 48.024 57.168 48.285C56.97 48.555 56.772 48.825 56.547 49.068C56.241 49.437 55.944 49.779 55.629 50.112C55.449 50.328 55.251 50.553 55.044 50.751C54.846 50.976 54.639 51.174 54.459 51.354C54.144 51.669 53.892 51.903 53.676 52.11L53.163 52.569C53.091 52.641 52.992 52.677 52.893 52.677H48.951V57.726H53.91C55.017 57.726 56.07 57.339 56.925 56.61C57.213 56.358 58.482 55.26 59.985 53.604C60.039 53.541 60.111 53.505 60.183 53.487L73.863 49.527C74.124 49.455 74.376 49.644 74.376 49.914V52.812V52.812Z"/>
                          </svg>
                          View on OpenSea
                        </a>
                        <p className="text-xs text-gray-600 mt-2">
                          Note: Shape network collections may take time to appear on OpenSea
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => router.push(`/den/${createdCollection?.collectionId || '1'}`)}
                    className="btn-ancient btn-ancient-fire py-3 px-8 flex items-center justify-center gap-2"
                  >
                    View Kaiju Den
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="btn-ancient py-3 px-8"
                  >
                    Go to Dashboard
                  </button>
                  <button
                    onClick={() => window.location.reload()}
                    className="btn-ancient btn-ancient-shadow py-3 px-8"
                  >
                    Create Another
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        </div>
      </div>
    </div>
  );
}