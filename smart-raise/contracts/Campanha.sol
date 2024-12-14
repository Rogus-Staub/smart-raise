// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

 contract Campanha {

    address public campanhaAddress; // Endereço da campanha
    address public ownerAddress;    // Endereço da conta que criou a campanha
    string public tittle;           // Título da campanha
    string public description;      // Descrição da campanha
    string public image;            // Imagem da campanha
    uint public currentBalance;     // Valor atual disponível para saque
    uint public totalBalance;       // Valor total já arrecadado
    uint public goal;               // Valor objetivo a ser arrecadado
    uint public timestamp;          // Horário da criação da campanha
    uint public numApoiadores;      // Numero de apoios já recebidos
    bool public active;             // Status da campanha [true=Ativa;false=Inativa]
    
    //Estrutura para ter o controle sobre as doações
    struct Donation {
        address donor;  // Endereço do doador
        uint256 amount; // Valor doado
        uint timestamp; // Horário da doação
    }

    // Lista de todas as doações feitas
    Donation[] public donationList;

    // Eventos
    event DonationReceived(address indexed donor, uint256 amount, uint timestamp); // Doação recebida
    event withdrawTransfered(uint256 amount);                      // Saque realizado

    //Construtor
    constructor(string memory _tittle, string memory _description, uint _goal) {
        ownerAddress = tx.origin;
        tittle =_tittle;
        description = _description;
        goal = _goal;
        currentBalance = 0;
        totalBalance = 0;
        numApoiadores = 0;
        timestamp = block.timestamp;
        active = true;
       campanhaAddress = address(this);
    }

    //Função que realiza o depósito
    function deposit() external payable returns (address){
        //Verifica se o valor doado é igual a zero
        require(msg.value > 0, "O valor doado deve ser maior que zero!");
        //Somando valor doado
        totalBalance += msg.value;
        //Somando valor disponível para saque
        currentBalance += msg.value;
        //Incrementando numero de doadores
        numApoiadores++;
        // Adicionar a doação à lista
        donationList.push(Donation({
            donor: tx.origin,
            amount: msg.value,
            timestamp: block.timestamp
        }));
        //Emitindo evento
        emit DonationReceived(msg.sender, msg.value, block.timestamp);
        return msg.sender;
    }

    // Função que retorna 
    function balance() external view returns(uint256){
        return address(this).balance;
    }

    // Função que realiza o saque
    function withdrawTransfer(uint256 _amount, address payable _address) external payable{
        // Verifica se o dono do contrato é quem está tentando realizar a operação
        require(tx.origin == ownerAddress, "Somente o dono da campanha pode sacar os fundos!");
        // Verifica se existe saldo o suficiente para realizar a operação
        require(address(this).balance >= _amount, "Saldo insuficiente para realizar a operacao!");
        // Realiza a transferencia
        _address.transfer(_amount);
        // Decrementa o saldo atual
        currentBalance -= _amount;
        // Emite o evento
        emit withdrawTransfered(_amount);
    }

    // Função que retorna a lista de doações
    function getDonations() external view returns (Donation[] memory) {
        return donationList;
    }

    // Função que atualiza os dados da campanha 
    function updateCampanha(string memory _tittle, string memory _description, uint _goal, bool _active) external {
        // Verifica se o dono do contrato é quem está tentando realizar a operação
        require(tx.origin == ownerAddress, "Somente o dono da campanha pode alterar os dados do contrato!");
        tittle =_tittle;
        description = _description;
        goal = _goal;
        active = _active;
    }

}