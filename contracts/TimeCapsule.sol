// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract TimeCapsule {

    struct Capsule {
        uint256 id;
        address owner;
        string title;
        string message;
        uint256 unlockTime;
        uint256 createdAt;
    }

    uint256 private nextCapsuleId = 1;

    mapping(uint256 => Capsule) private capsules;

    mapping(address => uint256[]) private ownerCapsules;

    event CapsuleCreated(
        uint256 indexed capsuleId,
        address indexed owner,
        string title,
        uint256 unlockTime
    );

    function createCapsule(
        string memory _title,
        string memory _message,
        uint256 _unlockTime
    ) public {

        require(bytes(_title).length > 0, "Title is required");

        require(bytes(_message).length > 0, "Message is required");

        require(
            _unlockTime > block.timestamp,
            "Unlock time must be in the future"
        );

        uint256 capsuleId = nextCapsuleId;

        capsules[capsuleId] = Capsule({
            id: capsuleId,
            owner: msg.sender,
            title: _title,
            message: _message,
            unlockTime: _unlockTime,
            createdAt: block.timestamp
        });

        ownerCapsules[msg.sender].push(capsuleId);

        nextCapsuleId++;

        emit CapsuleCreated(
            capsuleId,
            msg.sender,
            _title,
            _unlockTime
        );
    }

    function getCapsule(uint256 _capsuleId)
        public
        view
        returns (Capsule memory)
    {
        require(
            capsules[_capsuleId].owner == msg.sender,
            "Not your capsule"
        );

        return capsules[_capsuleId];
    }

    function getMyCapsules()
        public
        view
        returns (uint256[] memory)
    {
        return ownerCapsules[msg.sender];
    }

    function deleteCapsule(uint256 _capsuleId) public {
    require(
        capsules[_capsuleId].owner == msg.sender,
        "Not your capsule"
    );

    uint256[] storage userCapsules = ownerCapsules[msg.sender];

    for (uint256 i = 0; i < userCapsules.length; i++) {
        if (userCapsules[i] == _capsuleId) {

            userCapsules[i] =
                userCapsules[userCapsules.length - 1];

            userCapsules.pop();

            break;
        }
    }

    delete capsules[_capsuleId];
    }

    function isUnlocked(uint256 _capsuleId)
        public
        view
        returns (bool)
    {
        require(
            capsules[_capsuleId].owner == msg.sender,
            "Not your capsule"
        );

        return block.timestamp >= capsules[_capsuleId].unlockTime;
    }
}