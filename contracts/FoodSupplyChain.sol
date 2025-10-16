// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract FoodSupplyChain {
    enum Phase { COLLECTOR, TESTER, PROCESSING, MANUFACTURING }
    enum Status { PENDING, APPROVED, REJECTED }

    struct Product {
        uint256 id;
        string name;
        string batchNumber;
        address collector;
        uint256 collectionTimestamp;
        Phase currentPhase;
        Status status;
        bool exists;
    }

    struct PhaseData {
        address handler;
        uint256 timestamp;
        Status status;
        string notes;
        string ipfsHash;
    }

    mapping(uint256 => Product) public products;
    mapping(uint256 => mapping(Phase => PhaseData)) public phaseHistory;

    mapping(address => Phase) public userRoles;
    mapping(address => bool) public authorizedUsers;

    address public admin;
    uint256 public productCounter;

    event ProductCreated(uint256 indexed productId, string name, address collector);
    event PhaseCompleted(uint256 indexed productId, Phase phase, address handler, Status status);
    event UserAuthorized(address indexed user, Phase role);
    event UserRevoked(address indexed user);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier onlyAuthorized() {
        require(authorizedUsers[msg.sender], "User not authorized");
        _;
    }

    modifier productExists(uint256 _productId) {
        require(products[_productId].exists, "Product does not exist");
        _;
    }

    constructor() {
        admin = msg.sender;
        authorizedUsers[admin] = true;
    }

    function authorizeUser(address _user, Phase _role) external onlyAdmin {
        authorizedUsers[_user] = true;
        userRoles[_user] = _role;
        emit UserAuthorized(_user, _role);
    }

    function revokeUser(address _user) external onlyAdmin {
        authorizedUsers[_user] = false;
        emit UserRevoked(_user);
    }

    function createProduct(
        string memory _name,
        string memory _batchNumber,
        string memory _notes,
        string memory _ipfsHash
    ) external onlyAuthorized returns (uint256) {
        require(userRoles[msg.sender] == Phase.COLLECTOR, "Only collectors can create products");

        productCounter++;
        uint256 newProductId = productCounter;

        products[newProductId] = Product({
            id: newProductId,
            name: _name,
            batchNumber: _batchNumber,
            collector: msg.sender,
            collectionTimestamp: block.timestamp,
            currentPhase: Phase.COLLECTOR,
            status: Status.PENDING,
            exists: true
        });

        phaseHistory[newProductId][Phase.COLLECTOR] = PhaseData({
            handler: msg.sender,
            timestamp: block.timestamp,
            status: Status.PENDING,
            notes: _notes,
            ipfsHash: _ipfsHash
        });

        emit ProductCreated(newProductId, _name, msg.sender);
        return newProductId;
    }

    function updatePhase(
        uint256 _productId,
        Status _status,
        string memory _notes,
        string memory _ipfsHash
    ) external onlyAuthorized productExists(_productId) {
        Product storage product = products[_productId];
        Phase currentPhase = product.currentPhase;

        require(userRoles[msg.sender] == currentPhase, "Incorrect role for current phase");
        require(product.status == Status.PENDING, "Product already processed in this phase");

        phaseHistory[_productId][currentPhase] = PhaseData({
            handler: msg.sender,
            timestamp: block.timestamp,
            status: _status,
            notes: _notes,
            ipfsHash: _ipfsHash
        });

        product.status = _status;

        if (_status == Status.APPROVED && currentPhase != Phase.MANUFACTURING) {
            Phase nextPhase = Phase(uint(currentPhase) + 1);
            product.currentPhase = nextPhase;
            product.status = Status.PENDING;
        }

        emit PhaseCompleted(_productId, currentPhase, msg.sender, _status);
    }

    function getProduct(uint256 _productId) external view productExists(_productId) returns (
        uint256 id,
        string memory name,
        string memory batchNumber,
        address collector,
        uint256 collectionTimestamp,
        Phase currentPhase,
        Status status
    ) {
        Product memory product = products[_productId];
        return (
            product.id,
            product.name,
            product.batchNumber,
            product.collector,
            product.collectionTimestamp,
            product.currentPhase,
            product.status
        );
    }

    function getPhaseData(uint256 _productId, Phase _phase) external view productExists(_productId) returns (
        address handler,
        uint256 timestamp,
        Status status,
        string memory notes,
        string memory ipfsHash
    ) {
        PhaseData memory data = phaseHistory[_productId][_phase];
        return (
            data.handler,
            data.timestamp,
            data.status,
            data.notes,
            data.ipfsHash
        );
    }

    function getProductsByPhase(Phase _phase) external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i <= productCounter; i++) {
            if (products[i].exists && products[i].currentPhase == _phase && products[i].status == Status.PENDING) {
                count++;
            }
        }

        uint256[] memory result = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= productCounter; i++) {
            if (products[i].exists && products[i].currentPhase == _phase && products[i].status == Status.PENDING) {
                result[index] = i;
                index++;
            }
        }

        return result;
    }

    function getFullTraceability(uint256 _productId) external view productExists(_productId) returns (
        string memory name,
        string memory batchNumber,
        PhaseData memory collectorData,
        PhaseData memory testerData,
        PhaseData memory processingData,
        PhaseData memory manufacturingData
    ) {
        Product memory product = products[_productId];
        return (
            product.name,
            product.batchNumber,
            phaseHistory[_productId][Phase.COLLECTOR],
            phaseHistory[_productId][Phase.TESTER],
            phaseHistory[_productId][Phase.PROCESSING],
            phaseHistory[_productId][Phase.MANUFACTURING]
        );
    }
}
