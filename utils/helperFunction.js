import { Contract, providers } from "ethers";
import { TOKEN_CONTRACT_ABI, TOKEN_CONTRACT_ADDRESS } from "../constants";

// Helper function to return NFT Contract instance
// given a Provider/Signer
export const getNftContractInstance = (providerOrSigner) => {
    return new Contract(
        TOKEN_CONTRACT_ADDRESS,
        TOKEN_CONTRACT_ABI,
        providerOrSigner
    );
};
