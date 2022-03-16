const hre = require('hardhat');

async function main() {
	const Shares = await hre.ethers.getContractFactory('Shares');
	const sharesToken = await Shares.deploy();

	await sharesToken.deployed();

	console.log('Shares deployed to:', sharesToken.address);
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
