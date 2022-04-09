[![Test contracts](https://github.com/1n1t/shares/actions/workflows/contract-tests.yml/badge.svg?branch=master)](https://github.com/1n1t/shares/actions/workflows/contract-tests.yml)

# Dividends distribution contract

## Description

This contract allows to distribute a company's earnings among registered stakeholders. 

The owner which is also being the source of the income deploys the contract with appropriate amount of shares to sell. Once done, he can register stakeholders and transfer money directly to the contract address for later
usage as dividends. 

The dividends can be claimed by stakeholders upon request basis (pull payment model). This means that all payments will be not automatically forwarded to all eligible parties when new dividends are issued. Instead the actual transfer of the money should be manually triggered for every stakeholder account by calling the `claim` method.

During the lifetime of the contract the owner is able to change the shares allocation between stakeholders or add a new one even when some dividends were deposited and partly claimed. 

The contract also accumulate the part of the dividends that was not distributed among parties due to incomplete shares allocation. The owner can withdraw this amount of money at any given point.

## Local development

Compile the contract: `npm run contract:compile`
Run the local network: `npm run network:up`
Deploy contract to the network: `npm run contract:deploy:local`
Build UI and run local dev server: `npm run ui:start` and navigate to `http://localhost:3000/`

Make sure that you have Metamask extension installed in your browser. Import several accounts to the extension from the local blockchain network (see the log output when the local node was started). Note that by default the contract is deployed with the `Account #0`, so use it as the owner of the contract when interacting with the app page.

## Unit tests

Run contracts tests: `npm run contract:test`
Run contracts tests in watch mode: `npm run contract:test:watch`
Get code coverage report: `npm run contract:code-coverage`
