const { ethers } = require('ethers');
const UniswapV2Pair = require('@uniswap/v2-core/build/UniswapV2Pair.json');

// Get the init code hash from the UniswapV2Pair bytecode
// This is the hash that should be used in the library
const COMPUTED_INIT_CODE_HASH = ethers.keccak256(`0x${UniswapV2Pair.evm.bytecode.object}`);

console.log('Init Code Hash:', COMPUTED_INIT_CODE_HASH);

// The original Uniswap V2 init code hash (for reference)
const ORIGINAL_INIT_CODE_HASH = '0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f';

console.log('Original Hash:', ORIGINAL_INIT_CODE_HASH);
console.log('Match:', COMPUTED_INIT_CODE_HASH === ORIGINAL_INIT_CODE_HASH);