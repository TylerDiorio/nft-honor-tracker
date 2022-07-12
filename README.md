# nft-honor-tracker
This repository will contain the necessary files to construct a discord bot that is linked with aws DynamoDB storage for the purpose of tracking OTC/private-deals on ETH/Polygon. 

Users will be able to interact with the following commands in servers that host the nft-honor-tracker: 

```
!reg
!honor (Etherscan HASH#1) (Etherscan HASH#2)
!getBal
!getDegens
```
EXAMPLE: 

```
!honor 0x7daa42ac914a515cb6c3b1ac147e5b997abe3495985680fee392c52dfad6d1d7 0x01beda4693c0c5b06576555688193a0332017092adc71a63db298da6254cc388
```
The AWS database will be used to keep a running tally of total ETH/NFT assets transacted so users can easily understand the reputation of any individual with which they are contemplating transacting with.

GETTING STARTED

Simply run the following command in the desired directory of choice:

```
git clone https://github.com/Oreo-web3/nft-honor-tracker.git
```

REQUIRED PACKAGES:

The nft-honor-tracker requires the ethers.js, discord.js, aws-sdk.js, and dotenv API's in order to function properly. Please use the following commands to prepare an initially empty directory for the required dependencies using NPM:

```
npm init -y
npm install --save ethers
npm install discord.js
npm install aws-sdk
npm install dotenv --save
```
