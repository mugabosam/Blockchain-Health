const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("═══════════════════════════════════════════");
  console.log("  MEDICHAIN v2.1 - Deployment");
  console.log("═══════════════════════════════════════════");
  console.log(`  Deployer:  ${deployer.address}`);
  console.log(`  Network:   ${hre.network.name}`);
  console.log(`  Balance:   ${hre.ethers.formatEther(
    await hre.ethers.provider.getBalance(deployer.address)
  )} ETH/MATIC`);
  console.log("───────────────────────────────────────────");

  // Deploy MediChainCore
  console.log("\n  Deploying MediChainCore...");
  const MediChainCore = await hre.ethers.getContractFactory("MediChainCore");
  const core = await MediChainCore.deploy();
  await core.waitForDeployment();

  const address = await core.getAddress();
  console.log(`  ✅ MediChainCore deployed to: ${address}`);

  // Verify on block explorer (skip for local network)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n  Waiting for block confirmations...");
    await core.deploymentTransaction().wait(5);

    console.log("  Verifying on Polygonscan...");
    try {
      await hre.run("verify:verify", {
        address: address,
        constructorArguments: [],
      });
      console.log("  ✅ Contract verified!");
    } catch (err) {
      console.log(`  ⚠️  Verification failed: ${err.message}`);
    }
  }

  console.log("\n═══════════════════════════════════════════");
  console.log("  DEPLOYMENT COMPLETE");
  console.log(`  Contract: ${address}`);
  console.log("  Next: Copy address to frontend .env");
  console.log("═══════════════════════════════════════════\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
