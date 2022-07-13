import { BigNumber, providers, utils } from "ethers";
import Head from "next/head";
import React, { useEffect, useRef, useState } from "react";
import Web3Modal from "web3modal";
import styles from "../styles/Home.module.css";
import { getNftContractInstance } from "../utils/helperFunction";
import LoadingButton from '@mui/lab/LoadingButton';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';


export default function Home() {
  /** General state variables */
  // loading is set to true when the transaction is mining and set to false when
  // the transaction has mined
  const [loading, setLoading] = useState(false);
  // This variable is the `0` number in form of a BigNumber
  const zero = BigNumber.from(0);
  /** Wallet connection */
  // Create a reference to the Web3 Modal (used for connecting to Metamask) which persists as long as the page is open
  const web3ModalRef = useRef();
  // walletConnected keep track of whether the user's wallet is connected or not
  const [walletConnected, setWalletConnected] = useState(false);

  const { MerkleTree } = require("merkletreejs");
  const keccak256 = require("keccak256");

  let whitelistAddresses = [
    "0x6cAfc07C1e6D37903aBd6b56A92e9b1DC985f903",
    "0xB64107Edd823F6B6E57FF99C4d8e2c7394C2e00E",
    "0xD20d11319e611e3208B3a0bfc2BB4163F9CC3A65",
    "0x0000004B8702bAaED343A17B3e240ddCEf88D6f0",
    "0x0000000000000000000000000000000000000000",
    "0x0000000000000000000000000000000000000001",
    "0x0000000000000000000000000000000000000002",
    "0x0000000000000000000000000000000000000003",
    "0x0000000000000000000000000000000000000004",
    "0x0000000000000000000000000000000000000005",
    "0x0000000000000000000000000000000000000006",
    "0x0000000000000000000000000000000000000007",
    "0x0000000000000000000000000000000000000008",
    "0x0000000000000000000000000000000000000009",
    "0x0000000000000000000000000000000000000010"]

  const leafNodes = whitelistAddresses.map(addr => keccak256(addr));
  const merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });

  const rootHash = merkleTree.getRoot();

  /**
   * connectWallet: Connects the MetaMask wallet
   */
  const connectWallet = async () => {
    try {
      // Get the provider from web3Modal, which in our case is MetaMask
      // When used for the first time, it prompts the user to connect their wallet
      await getProviderOrSigner();
      setWalletConnected(true);
    } catch (err) {
      console.error(err);
    }
  };

  const getProviderOrSigner = async (needSigner = false) => {
    // Connect to Metamask
    // Since we store `web3Modal` as a reference, we need to access the `current` value to get access to the underlying object
    const provider = await web3ModalRef.current.connect();
    const web3Provider = new providers.Web3Provider(provider);

    // If user is not connected to the Rinkeby network, let them know and throw an error
    const { chainId } = await web3Provider.getNetwork();
    if (chainId !== 4) {
      window.alert("Change the network to Rinkeby");
      throw new Error("Change network to Rinkeby");
    }

    if (needSigner) {
      const signer = web3Provider.getSigner();
      return signer;
    }
    return web3Provider;
  };

  // useEffects are used to react to changes in state of the website
  // The array at the end of function call represents what state changes will trigger this effect
  // In this case, whenever the value of `walletConnected` changes - this effect will be called
  useEffect(() => {
    // if wallet is not connected, create a new instance of Web3Modal and connect the MetaMask wallet
    if (!walletConnected) {
      // Assign the Web3Modal class to the reference object by setting it's `current` value
      // The `current` value is persisted throughout as long as this page is open
      web3ModalRef.current = new Web3Modal({
        network: "rinkeby",
        providerOptions: {},
        disableInjectedProvider: false,
      });
      connectWallet();
    }
  }, [walletConnected]);


  // ============================================================== 
  // FUNCTIONS FOR WRITE CONTRACT INTERACTIONS
  // ============================================================== 
  const mint = async () => {
    try {
      const signer = await getProviderOrSigner(true);
      const nftContract = getNftContractInstance(signer);
      const address = await signer.getAddress();
      const hasClaimed = await nftContract.claimed(address);
      const merkleProof = merkleTree.getHexProof(keccak256(address));
      if (hasClaimed == true) {
        window.alert("Sorry, you have claimed your whitelist mint!")
      }
      else if (merkleProof.length > 0) {
        const tx = await nftContract.mint(merkleProof, { value: 0 });
        setLoading(true);
        await tx.wait();
        setLoading(false);
        window.alert("Congrats, you have minted a NFT!");
      }
      else {
        window.alert("Sorry, you are not in the whitelist!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  /*
      renderButton: Returns a button based on the state of the dapp
  */
  const renderButton = () => {
    if (!walletConnected) {
      return (
        <Button variant="contained" size="medium" onClick={connectWallet}>
          Connect your wallet
        </Button>
      );
    }

    // Allow user to mint NFT
    else {
      return (
        <LoadingButton onClick={mint} loading={loading} loadingIndicator="Loading.." variant="contained" width="fit-content">
          Mint your NFT! 🚀
        </LoadingButton>
      );
    }
  };

  return (
    <div>
      <Head>
        <title>Whitelist Only Sale</title>
        <meta name="description" content="Whitelist-Only-Sale" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Container maxWidth="xl">
        <div className={styles.main}>
          <div>
            <h1 className={styles.title}>Welcome to our whitelist only NFT sale!</h1>
            <div className={styles.description}>
              You can only mint if you're whitelisted
            </div>
            <div>
              {renderButton()}
            </div>
          </div>
        </div>
      </Container>
      <footer className={styles.footer}>
        Made with &#10084; by SL
      </footer>
    </div>
  );
}
