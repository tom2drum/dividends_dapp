// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Shares {
    mapping(address => uint256) shares;

    uint256 public totalShares;

    uint256 public dividends;

    address[] public stakeholders;

    constructor() {
        totalShares = 0;
        dividends = 0;
    }

    function getShare(address _holder) public view returns(uint256) {
        return shares[_holder];
    }

    function getTotalShares() public view returns(uint256) {
        return totalShares;
    }

    function getAccumulatedDividends() public view returns(uint256) {
        return dividends;
    }

    function addStakeholder(address _stakeholder, uint256 _value) public {
        shares[_stakeholder] += _value;
        totalShares += _value;
        stakeholders.push(_stakeholder);
    }

    function addDividends(uint256 _value) public {
        dividends += _value;
    }
}