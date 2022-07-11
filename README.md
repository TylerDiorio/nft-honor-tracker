# nft-honor-tracker
This repository will contain the necessary files to construct a discord bot that is linked with aws DynamoDB storage for the purpose of tracking OTC/private-deals on ETH/Polygon. 

Users will be able to log successful private transactions using 3 inputs: 

(1) Pseudonym upon which to store a record

(2) Etherscan/Polygonscan transaction approval #1

(3) Etherscan/Polygonscan transaction approval #2

The AWS database will be used to keep a running tally of total ETH/NFT assets transacted so users can easily understand the reputation of any individual with which they are contemplating transacting with.
