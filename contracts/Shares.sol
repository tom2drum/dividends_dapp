// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

import "hardhat/console.sol";

contract Shares is Ownable {

	uint public constant STAKEHOLDERS_LIMIT = 20;

	struct Stakeholder {
		address id;
		uint16 shares;
		uint256 claimedAmount;
	}

	mapping(address => Stakeholder) private stakeholders;

	uint8 private stakeholdersNum;

	uint256 private dividendsTotal;

	uint16 private soldShares;

	uint16 private totalShares;

	uint8 private stakeholdersLimit;

	address[] private registeredStakeholders;

	event StakeholderRegistered(address _address, uint256 _share);
	event StakeholdersShareChanged(address _address, uint256 _share);
	event DividendsReceived(uint256 amount);
	event DividendsReleased(address recipient, uint256 amount);

	constructor(uint16 _totalShares, uint8 _stakeholdersLimit) {
		require(_totalShares > 1, "Total number of shares should be greater than 1");
		require(_stakeholdersLimit <= STAKEHOLDERS_LIMIT, "Maximum allowed stakeholders exceeded");

		totalShares = _totalShares;
		stakeholdersLimit = _stakeholdersLimit;
	}

	receive() external payable virtual onlyOwner {
		require(stakeholdersNum > 1, "There is not enough stakeholders yet");

		dividendsTotal += msg.value;
		emit DividendsReceived(msg.value);
	}

	function getStakeholderShares() public view returns (uint256) {
		require(stakeholders[_msgSender()].id == _msgSender(), "There is no such stakeholder");

		return stakeholders[_msgSender()].shares;
	}

	function getSoldShares() public view returns (uint256) {
		return soldShares;
	}

	function getTotalShares() public view returns (uint256) {
		return totalShares;
	}

	function getDividendsPool() public view returns (uint256) {
		return address(this).balance;
	}

	function registerShares(address _address, uint16 _shares) public onlyOwner {

		uint256 dividendsPool = getDividendsPool();
		require(dividendsPool == 0, "Contract has undistributed dividends");

		uint256 availableShares = totalShares - getSoldShares();
		require(availableShares >= _shares, "Unsufficient share amount");

		if (stakeholders[_address].id == _address) {
			changeStakeholderShares(_address, _shares);
		} else {
			addStakeholder(_address, _shares);
		}
	}

	function claimDividends() public {
		uint256 dividendsPool = getDividendsPool();
		require(dividendsPool > 0, "Dividends pool is empty");

		Stakeholder memory stakeholder = stakeholders[_msgSender()];

		require(stakeholder.id == _msgSender(), "There is no such stakeholder");

		uint256 amountToPay = getAmountToPay(stakeholder);

		require(amountToPay > 0, "No dividends to pay");
		require(amountToPay <= dividendsPool, "Not enought money in the pool");

		stakeholders[_msgSender()].claimedAmount += amountToPay;
		(bool sent, ) = stakeholder.id.call{ value: amountToPay }("");

		require(sent, "Failed to send dividends");

		emit DividendsReleased(_msgSender(), amountToPay);
	}

	function addStakeholder(address _address, uint16 _shares) private {
		require(_shares > 0, "Shares cannot be zero");
		Stakeholder memory stakeholder = Stakeholder({ id: _address, shares: _shares, claimedAmount: 0 });

		stakeholders[_address] = stakeholder;

		stakeholdersNum++;

		soldShares += _shares;

		registeredStakeholders.push(_address);

		emit StakeholderRegistered(_address, _shares);
	}

	function changeStakeholderShares(address _address, uint16 _shares) private {

		soldShares = soldShares - stakeholders[_address].shares + _shares;

		if (_shares == 0) {
			removeStakeHolderFromList(_address);
			delete stakeholders[_address];
		} else {
			stakeholders[_address].shares = _shares;
		}

		emit StakeholdersShareChanged(_address, stakeholders[_address].shares);
	}

	function removeStakeHolderFromList(address _address) private {
		uint indexToRemove = registeredStakeholders.length;

		for (uint index = 0; index < registeredStakeholders.length; index++) {
			if (registeredStakeholders[index] == _address) {
				indexToRemove = index;
				break;
			}
		}

		if (indexToRemove < registeredStakeholders.length) {
			registeredStakeholders[indexToRemove] = registeredStakeholders[registeredStakeholders.length - 1];
			registeredStakeholders.pop();
		}
	}

	function getAmountToPay(Stakeholder memory stakeholder) private view returns (uint256) {
		return (stakeholder.shares * dividendsTotal) / totalShares - stakeholder.claimedAmount;
	}
}
