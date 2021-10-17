import * as React from "react";
import { ethers } from "ethers";
import './App.css';
import myabi from "../src/utils/SayHi.json"

export default function App() {
    /*
  * Just a state variable we use to store our user's public wallet.
  */
    const [currentAccount, setCurrentAccount] = React.useState("");
    const [allWaves, setAllWaves] = React.useState(null);
    const [customMessage, setCustomMesage] = React.useState("");
    const [dom, updateDom] = React.useState("")
    const contractAddress = process.env.REACT_APP_CONTRACT_ADDRESS
    /**
    * Create a variable here that references the abi content!
    */
    const contractABI = myabi.abi;

    const checkIfWalletIsConnected = async () => {
      try {
        const { ethereum } = window;
        
        if (!ethereum) {
          console.log("Make sure you have metamask!");
          return;
        } else {
          console.log("We have the ethereum object", ethereum);
          getAllWaves()
        }
        
        /*
        * Check if we're authorized to access the user's wallet
        */
        const accounts = await ethereum.request({ method: 'eth_accounts' });
        
        if (accounts.length !== 0) {
          const account = accounts[0];
          console.log("Found an authorized account:", account);
          setCurrentAccount(account)
        } else {
          console.log("No authorized account found")
        }
      } catch (error) {
        console.log(error);
      }
    }
    /**
  * Implement your connectWallet method here
  */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]); 
    } catch (error) {
      console.log(error)
    }
  }
    
    React.useEffect(() => {
      checkIfWalletIsConnected();
    }, [dom])

  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        if (customMessage){
          const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());

        /*
        * Execute the actual wave from your smart contract
        */
        // const waveTxn = await wavePortalContract.wave();
        const waveTxn = await wavePortalContract.wave(customMessage, { gasLimit: 300000 })
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
        updateDom("")
        setCustomMesage("")
        }else {
          alert('You need to send a custom Message along!')
        }
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error)
    }
  }

  /*
   * Create a method that gets all waves from your contract
   */
  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        /*
         * Call the getAllWaves method from your Smart Contract
         */
        const waves = await wavePortalContract.getAllWaves();

        console.log('List of waves are', waves);
        

        /*
         * We only need address, timestamp, and message in our UI so let's
         * pick those out
         */
        let wavesCleaned = [];
        waves.forEach(wave => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          });
        });

        /*
         * Store our data in React State
         */
        setAllWaves(wavesCleaned);

        /**
         * Listen in for emitter events!
         */
         wavePortalContract.on("NewWave", (from, timestamp, message) => {
          console.log("NewWave", from, timestamp, message);

          setAllWaves(prevState => [...prevState, {
            address: from,
            timestamp: new Date(timestamp * 1000),
            message: message
          }]);
        });

        
      } else {
        console.log("Ethereum object doesn't exist!")
      }
    } catch (error) {
      console.log(error);
    }
  }
  
  return (
    <div className="mainContainer">

      <div className="dataContainer">
        <div className="header">
        👋 Hey Pal!!
        </div>

        <div className="bio">
        I am Taofik and a Software Developer with awesome skills in blockchain developmet! <br/> Connect your Ethereum wallet and wave at me!
        </div>

        <textarea onChange={(e)=> setCustomMesage(e.target.value)} value={customMessage}></textarea>

        <button className="waveButton" onClick={wave}>
          Say Hi to me with a customize message
        </button>

        {/*
        * If there is no currentAccount render this button
        */}
        {!currentAccount && (
          <button className="waveButton" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        {allWaves && allWaves.map((wave, index) => {
          return (
            <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div>)
        })}
      </div>
    </div>
  );
}
