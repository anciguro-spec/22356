const hre = require("hardhat");

async function main() {
  console.log("Deploying FoodSupplyChain contract...");

  const FoodSupplyChain = await hre.ethers.getContractFactory("FoodSupplyChain");
  const foodSupplyChain = await FoodSupplyChain.deploy();

  await foodSupplyChain.waitForDeployment();

  const address = await foodSupplyChain.getAddress();
  console.log("FoodSupplyChain deployed to:", address);

  // Save the contract address for frontend integration
  const fs = require("fs");
  const contractData = {
    address: address,
    deploymentTime: new Date().toISOString()
  };

  fs.writeFileSync(
    "./src/contracts/contract-address.json",
    JSON.stringify(contractData, null, 2)
  );

  console.log("Contract address saved to src/contracts/contract-address.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
