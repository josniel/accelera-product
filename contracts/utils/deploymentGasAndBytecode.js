// Hardhat script
const SortedTroves = artifacts.require("./SortedTroves.sol");
const TroveManager = artifacts.require("./TroveManager.sol");
const PriceFeed = artifacts.require("./PriceFeed.sol");
const UsdxToken = artifacts.require("./UsdxToken.sol");
const ActivePool = artifacts.require("./ActivePool.sol");
const DefaultPool = artifacts.require("./DefaultPool.sol");
const StabilityPool = artifacts.require("./StabilityPool.sol");
const BorrowerOperations = artifacts.require("./BorrowerOperations.sol");

const ACCELStaking = artifacts.require("./ACCEL/ACCELStaking.sol");
const ACCELToken = artifacts.require("./ACCEL/ACCELToken.sol");
const CommunityIssuance = artifacts.require("./ACCEL/CommunityIssuance.sol");
const HintHelpers = artifacts.require("./HintHelpers.sol");

const CommunityIssuanceTester = artifacts.require(
  "./ACCEL/CommunityIssuanceTester.sol",
);
const ActivePoolTester = artifacts.require("./ActivePoolTester.sol");
const DefaultPoolTester = artifacts.require("./DefaultPoolTester.sol");
const LiquityMathTester = artifacts.require("./LiquityMathTester.sol");
const BorrowerOperationsTester = artifacts.require(
  "./BorrowerOperationsTester.sol",
);
const TroveManagerTester = artifacts.require("./TroveManagerTester.sol");
// const UsdxTokenTester = artifacts.require("./UsdxTokenTester.sol");

const { TestHelper: th } = require("../utils/testHelpers.js");

const dh = require("./deploymentHelpers.js");
const ARBITRARY_ADDRESS = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419"; // placeholder for the LPrewards bounty addresses

const coreContractABIs = [
  BorrowerOperations,
  PriceFeed,
  UsdxToken,
  SortedTroves,
  TroveManager,
  ActivePool,
  StabilityPool,
  DefaultPool,
  HintHelpers,
];

const ACCELContractABIs = [ACCELStaking, ACCELToken, CommunityIssuance];

// const TesterContractABIs = [
//   CommunityIssuanceTester,
//   ActivePoolTester,
//   DefaultPoolTester,
//   LiquityMathTester,
//   BorrowerOperationsTester,
//   TroveManagerTester,
//   // UsdxTokenTester,
// ];

const getGasFromContractDeployment = async (contractObject, name) => {
  const txHash = contractObject.transactionHash;
  // console.log(`tx hash  of ${name} deployment is is: ${txHash}`)
  const receipt = await ethers.provider.getTransactionReceipt(txHash);
  const gas = receipt.gasUsed;
  console.log(`${name}: ${gas}`);
  return gas;
};

const getBytecodeSize = (contractABI) => {
  const bytecodeLength = contractABI.bytecode.length / 2 - 1;
  const deployedBytecodeLength = contractABI.deployedBytecode.length / 2 - 1;
  console.log(`${contractABI.contractName}: ${bytecodeLength}`);
  // console.log(`${contractABI.contractName} deployed bytecode length: ${deployedBytecodeLength}`)
};

const getUSDCostFromGasCost = (
  deploymentGasTotal,
  gasPriceInGwei,
  ETHPrice,
) => {
  const dollarCost = (deploymentGasTotal * gasPriceInGwei * ETHPrice) / 1e9;
  console.log(
    `At gas price ${gasPriceInGwei} GWei, and ETH Price $${ETHPrice} per ETH, the total cost of deployment in USD is: $${dollarCost}`,
  );
};

const logContractDeploymentCosts = async (contracts) => {
  console.log(`Gas costs for deployments: `);
  let totalGasCost = 0;
  for (contractName of Object.keys(contracts)) {
    const gasCost = await getGasFromContractDeployment(
      contracts[contractName],
      contractName,
    );
    totalGasCost = totalGasCost + Number(gasCost);
  }
  console.log(`Total deployment gas costs: ${totalGasCost}`);
  getUSDCostFromGasCost(totalGasCost, 200, 1850);
};

const logContractObjects = async (contracts) => {
  console.log(`Contract objects addresses:`);
  let totalGasCost = 0;
  for (contractName of Object.keys(contracts)) {
    const gasCost = await getGasFromContractDeployment(
      contracts[contractName],
      contractName,
    );
    totalGasCost = totalGasCost + Number(gasCost);
  }
};

const logContractBytecodeLengths = (contractABIs) => {
  console.log(`Contract bytecode lengths:`);
  for (abi of contractABIs) {
    getBytecodeSize(abi);
  }
};

// Run script: log deployment gas costs and bytecode lengths for all contracts
async function main() {
  const coreContracts = await dh.deployLiquityCoreHardhat();
  const ACCELContracts = await dh.deployACCELContractsHardhat(
    ARBITRARY_ADDRESS,
    ARBITRARY_ADDRESS,
  );

  await dh.connectCoreContracts(coreContracts, ACCELContracts);
  await dh.connectACCELContracts(ACCELContracts);
  await dh.connectACCELContractsToCore(ACCELContracts, coreContracts);

  console.log(`\n`);
  console.log(`ACCEL CONTRACTS`);
  await logContractDeploymentCosts(ACCELContracts);
  console.log(`\n`);
  logContractBytecodeLengths(ACCELContractABIs);
  console.log(`\n`);

  console.log(`CORE CONTRACTS`);
  await logContractDeploymentCosts(coreContracts);
  console.log(`\n`);
  logContractBytecodeLengths(coreContractABIs);
  console.log(`\n`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
