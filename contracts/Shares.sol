// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

import "hardhat/console.sol";

contract Shares is Ownable {
    struct Stakeholder {
        address id;
        uint256 shares;
        uint256 claimedAmount;
    }

    mapping(address => Stakeholder) public stakeholders;

    uint public stakeholdersNum;

    uint256 public dividendsPool;

    uint256 public dividendsTotal;

    uint public soldShares;

    uint public totalShares;

    event StakeholderRegistered(address _address, uint256 _share);
    event StakeholdersShareChanged(address _address, uint256 _share);
    event DividendsRegistered(uint256 amount);
    event DividendsReleased(address recipient, uint256 amount);

    constructor(uint _totalShares) {
        require(_totalShares > 1, "Total number of shares should be greater than 1");
        totalShares = _totalShares;
    }

    receive() external payable virtual {
        require(stakeholdersNum > 1, "There is not enough stakeholders yet");

        dividendsTotal += msg.value;
        emit DividendsRegistered(msg.value);
    }
    
    function getStakeholderShares(address _holder) public view returns(uint256) {
        // todo show shares amount only to stakehlolder
        require(stakeholders[_holder].id == _holder, "There is no such stakeholder");

        return stakeholders[_holder].shares;
    }

    function getSoldShares() public view returns(uint) {
        return soldShares;
    }

    function getTotalShares() public view returns(uint) {
        return totalShares;
    }

    function getDividendsPool() public view returns(uint256) {
        return address(this).balance;
    }

    function registerStakeholder(address _address, uint256 _shares) public {
        require(_shares != 0, "Share cannot be zero");

        dividendsPool = getDividendsPool();

        require(dividendsPool == 0, "Contract has undistributed dividends");

        uint availableShares = totalShares - soldShares;

        require(availableShares >= _shares, "Unsufficient share amount");

        if(stakeholders[_address].id == _address) {
            stakeholders[_address].shares += _shares;

            emit StakeholdersShareChanged(_address, stakeholders[_address].shares);
        } else {
            Stakeholder memory stakeholder = Stakeholder({
                id: _address,
                shares: _shares,
                claimedAmount: 0
            });

            stakeholders[_address] = stakeholder;

            stakeholdersNum++;

            emit StakeholderRegistered(_address, _shares);
        }

        soldShares += _shares;
    }

    function claimDividends(address payable recipient) public {
        dividendsPool = getDividendsPool();
        require(dividendsPool > 0, "Dividends pool is empty");

        Stakeholder memory stakeholder = stakeholders[recipient];

        require(stakeholder.id == recipient, "There is no such stakeholder");

        uint256 amountToPay = _getAmountToPay(stakeholder);

        require(amountToPay > 0, "No dividends to pay");
        require(amountToPay <= dividendsPool, "Not enought money in the pool");

        stakeholders[recipient].claimedAmount += amountToPay;
        (bool sent, ) = stakeholder.id.call{ value: amountToPay }("");

        require(sent, "Failed to send dividends");

        emit DividendsReleased(recipient, amountToPay);
    }

    function _getAmountToPay(Stakeholder memory stakeholder) private view returns(uint256) {
        return stakeholder.shares * dividendsTotal / soldShares - stakeholder.claimedAmount;
    }
}