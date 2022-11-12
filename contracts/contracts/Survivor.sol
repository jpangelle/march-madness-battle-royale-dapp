// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

// Uncomment this line to use console.log
// import "hardhat/console.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Survivor is Ownable {
    struct Entry {
        string entryName;
        bool alive;
        string[] picks;
    }

    address[] public entryAddresses;
    bool public isRegistrationOpen = false;

    mapping(address => Entry[]) public entries;

    function registerEntry(string memory _entryName) public {
        require(isRegistrationOpen, "Registration is closed");
        Entry memory newEntry;
        newEntry.entryName = _entryName;
        newEntry.alive = true;
        entries[msg.sender].push(newEntry);
        entryAddresses.push(msg.sender);
    }

    function resetSurvivor() public onlyOwner{
        require(!isRegistrationOpen, "Registration must be closed in order to reset");
        for (uint i = 0; i < entryAddresses.length; i++) {
            delete entries[entryAddresses[i]];
        }
        delete entryAddresses;
    }

    function openRegistration() public onlyOwner {
        require(!isRegistrationOpen, "Registration is already open");
        isRegistrationOpen = true;
    }

    function closeRegistration() public onlyOwner{
        require(isRegistrationOpen, "Registration is already closed");
        isRegistrationOpen = false;
    }
}
