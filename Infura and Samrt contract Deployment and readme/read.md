# Infura deployment requirement

1. You will need a ropsten account and its seed phrase which also known as mnemonic.
2. infura account with project enable, you will get infura endpoint. 
3. modification on truffle-configure.js which is located in truffle contract folder. 

# Steps:
### 1. open cmd change directory to MedicalPass-contract, then do npm install @truffle/hdwallet-provider. this will download required package for deploying on infura network

### 2. modify truffle_config.js in MedicalPass-contract directory.

![development](screenshot/infura_truffle_config.png)
![development](screenshot/truffle_config_netwok.png)

### 3. then open cmd type truffle migrate -network ropsten, make sure you have build folder removed!
![development](screenshot/Infura_Deployment_CMD.png)

### if deployed succeed you can also view this change on infura,I have done some debugging you will see stats of my project request.
![development](screenshot/infura_usage.png)
![development](screenshot/infura_usage_!.png)

### if you use your own deployment and contract please make sure the contract address in app.js changed as well
![development](screenshot/infura_usage.png)


### 4.Once you have the everything done change directory to MedicalPass-Dapp\MedicalPass-Client then npm start 

![development](screenshot/infura_requirement.png)


# How to interact with smart contract ?

## please visit readme in interact contract readme folder

![development](screenshot/interface.png)