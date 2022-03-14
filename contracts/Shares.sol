// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "hardhat/console.sol";

contract Shares {
    struct Stakeholders {
        mapping(address => uint256) shares;
        address[] addresses;
    }

    Stakeholders stakeholders;

    uint256 public totalShares;

    uint256 public dividends;

    event DividendsRegistered(uint256 amount);
    event DividendsReleased(address recipient, uint256 amount);

    constructor() {
        totalShares = 0;
        dividends = 0;
    }

    function getShare(address _holder) public view returns(uint256) {
        return stakeholders.shares[_holder];
    }

    function getTotalShares() public view returns(uint256) {
        return totalShares;
    }

    function getAccumulatedDividends() public view returns(uint256) {
        return dividends;
    }

    function addStakeholder(address _stakeholder, uint256 _value) public {
        stakeholders.shares[_stakeholder] += _value;
        totalShares += _value;
        stakeholders.addresses.push(_stakeholder);
    }

    function addDividends(uint256 _value) public {
        dividends += _value;
        emit DividendsRegistered(_value);
    }

    function payDividends() public {

        for (uint index = 0; index < stakeholders.addresses.length; index++) {
            address stakeholder = stakeholders.addresses[index];
            uint256 share = getShare(stakeholder) / totalShares;
            uint256 amount = share * dividends;

            dividends -= amount;

            emit DividendsReleased(stakeholder, amount);
        }
    }
}