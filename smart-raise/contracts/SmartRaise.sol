// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.13;

import "./Campanha.sol";

contract SmartRaise {
    
    address public owner;            // Endereço do criador do contrato
    address[] public campanhaOwners; // Endereços das contas que possuem campanhas
    address[] public campanhas;      // Endereços das campanhas criadas

    constructor() {
        owner = msg.sender;
    }

    // Mapa de campanhas relacionadas a uma conta
    mapping (address => address[]) campanhas_by_owner_address;
    
    // Eventos
    event NewCampanha(address,string,address,uint); // Campanha criada

    // Função que cria uma nova campanha
    function newCampanha(string memory _tittle, string memory _description, uint _goal) public {
        // Criando nova campanha
        Campanha c = new Campanha(_tittle, _description, _goal);
        campanhas_by_owner_address[tx.origin].push(address(c));
        campanhaOwners.push(tx.origin);
        campanhas.push(address(c));
        // Emitindo evento
        emit NewCampanha(tx.origin,_description,address(c),_goal);
    }

    //Função que realiza a doação
    function donate(address _contract) payable external returns (address) {
        Campanha c = Campanha(_contract);
        return c.deposit{value: msg.value}();
    }

    // Função que retorna uma campanha a partir do endereço
    function getCampanha(address _addressCampanha) public pure returns(Campanha){
        return Campanha(_addressCampanha);
    }

    // Função que retorna todas as campanhas
    function getAllCampanhas() public view returns(address[] memory){
        return campanhas;
    }
}