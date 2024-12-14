//Endereço do contrato
const contractAddressID = '0x9F74Ed7E4b0f5944928e6D3d23cf3E86DDD3FBb8';
//Endereço da conta externa (usuário logado)
let externalAccountID;
//Contas conectadas a MetaMask
let accounts;

document.getElementById("conectWallet").addEventListener("click", conectWallet);
document.getElementById("disconnectButton").addEventListener("click", disconnectUser);
document.getElementById("searchButton").addEventListener("click", filtrarCampanhas);
document.getElementById("createButton").addEventListener("click", criarNovaCampanha);
document.getElementById('bntCriarCampanha').addEventListener('click', enableDisablePainelCriarCampanha);
document.getElementById('bntMinhasCampanhas').addEventListener('click', enableDisablePainelMinhasCampanhas);

//Função que atualiza a tela (refresh)
async function updateScreen() {
    const contractAddressLabel = document.getElementById('contractAddress');
    const bntCriarCampanha = document.getElementById('bntCriarCampanha');
    const bntMinhasCampanhas = document.getElementById('bntMinhasCampanhas');
    // Exibe o painel de criação de campanha apenas se o usuário estiver logado
    let web3 = new Web3(window.ethereum);
    accounts = await web3.eth.getAccounts();
    externalAccountID = accounts[0];
    if (externalAccountID != null) {
        let bool = await usuarioPossuiCampanhas();
        bntMinhasCampanhas.style.display = bool ? 'block' : 'none';
        bntCriarCampanha.style.display = 'block';
    } else {
        bntCriarCampanha.style.display = 'none';
        bntMinhasCampanhas.style.display = 'none';
    }

    //Buscando todas as campanhas existentes
    let projects = await getCampanhas();
    //Adiciona o numero do contrato na label
    contractAddressLabel.innerText = contractAddressID;

    // Renderiza todos os cartões inicialmente
    carregarCampanhasNoPainel(projects);

    if(externalAccountID != null){
        conectWallet();
    }
}

//Função para conectar a MetaMask na plataforma
async function conectWallet() {
    const connectButton = document.getElementById('conectWallet');
    const accountInfo = document.getElementById('accountInfo');
    const walletPanel = document.getElementById('walletPanel');
    //Verifica se o MetaMask está instalado
    if (typeof window.ethereum !== 'undefined') {
        try {
            //Solicita o acesso ao MetaMask
            await ethereum.request({
                method: "eth_requestAccounts"
            });
            //Buscando as contas conectadas
            let web3 = new Web3(window.ethereum);
            accounts = await web3.eth.getAccounts();
            externalAccountID = accounts[0];
            //Atualizando o painel de login para exibir a conta conectada
            connectButton.style.display = 'none';
            accountInfo.style.display = 'flex';
            const shortAccount = `${String(externalAccountID).slice(0, 4)}...${String(externalAccountID).slice(-4)}`;
            accountInfo.innerHTML = `
                    <img src="https://www.gravatar.com/avatar/${externalAccountID}?d=identicon" alt="Ícone da conta" />
                    <span>${shortAccount}</span>
                `;
            accountInfo.style.top = '5px';
            accountInfo.style.right = '10px';
            accountInfo.onclick = () => {
                walletPanel.style.display = walletPanel.style.display === 'none' ? 'block' : 'none';
            };
        } catch (error) {
            window.alert("Erro ao conectar, operação cancelada.");
        }
    } else {
        alert('MetaMask não está instalado. Por favor, instale o MetaMask e tente novamente.');
    }
}

//Função que carrega na tela as campanhas
async function carregarCampanhasNoPainel(campanhasFiltradas) {
    let web3 = new Web3(window.ethereum);
    let contrato = new web3.eth.Contract(await loadABISmartRaise(), contractAddressID);
    // Limpa o container
    cardContainer.innerHTML = '';
    //Itera cada uma das campanhas e adiciona no formato de card
    campanhasFiltradas.forEach(async project => {
        let isCampanhaAtiva = await project.methods.active().call();
        if (isCampanhaAtiva) {
            const card = document.createElement('div');
            card.classList.add('card');
            card.setAttribute('data-title', await project.methods.tittle().call());
            card.setAttribute('data-value', await project.methods.totalBalance().call());
            card.setAttribute('data-goal', await project.methods.goal().call());

            card.innerHTML = `
                <div class="card-title">${await project.methods.tittle().call()}</div>
                <img src="image_not_uploaded.jpg" alt="${await project.methods.tittle().call()}">
                <div class="card-details">${weiToEther(await project.methods.totalBalance().call())} de ${weiToEther(await project.methods.goal().call())} ETH</div>
            `;

            card.addEventListener('click', async () => {
                // Carregar o conteúdo do arquivo HTML
                const response = await fetch('campaignPanel.html');
                let htmlContent = await response.text();

                const date = new Date(Number(await project.methods.timestamp().call()) * 1000);
                const formattedDate = date.toLocaleString('pt-BR', {
                    year: 'numeric',
                    month: 'short',
                    day: '2-digit'
                });

                htmlContent = htmlContent
                    .replace('${title}', await project.methods.tittle().call())
                    .replace('${campanhaAddress}', await project.methods.campanhaAddress().call())
                    .replace('${totalBalance}', weiToEther(await project.methods.totalBalance().call()))
                    .replace('${numApoiadores}', await project.methods.numApoiadores().call())
                    .replace('${goal}', weiToEther(await project.methods.goal().call()))
                    .replace('${timestamp}', formattedDate)
                    .replace('${description}', await project.methods.description().call())
                    .replace('${donationList}', await carregarDoacoes(await project.methods.campanhaAddress().call()));


                projectDetails.innerHTML = htmlContent;
                detailsPanel.style.display = 'block';

                const donateButton = document.getElementById('donateButton');
                donateButton.addEventListener('click', async () => {
                    const campanhaAddress = await project.methods.campanhaAddress().call();
                    const donationValue = etherToWei(document.getElementById('donationValue').value);
                    await contrato.methods.donate(campanhaAddress).send({
                        from: externalAccountID,
                        value: donationValue
                    });
                });
            });
            cardContainer.appendChild(card);
        }
    });
}

//Função que habilita e desabilita o painel de 'Criar Campanha'
function enableDisablePainelCriarCampanha() {
    //Desabilitando a outra tab caso esteja ativa
    const panel = document.getElementById('myCampaignsPanel');
    panel.style.display = 'none';

    const createPanel = document.getElementById('createCampaignPanel');
    createPanel.style.display = createPanel.style.display === 'none' ? 'block' : 'none';
}

//Função que habilita e desabilita o painel das 'Minhas Campanhas'
function enableDisablePainelMinhasCampanhas() {
    //Desabilitando a outra tab caso esteja ativa
    const createPanel = document.getElementById('createCampaignPanel');
    createPanel.style.display = 'none';

    const panel = document.getElementById('myCampaignsPanel');
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    document.getElementById('createCampaignPanel').style.display = 'none';
    exibirCampanhas();
}

//Função que exibe as campanhas no painel 'Minhas Campanhas'
async function exibirCampanhas() {
    const list = document.getElementById('campaignList');
    list.innerHTML = '';
    let campaigns = await getCampanhas();
    campaigns.forEach(async (campaign) => {
        let ownerAddress = await campaign.methods.ownerAddress().call();
        if (ownerAddress == externalAccountID) {
            const li = document.createElement('li');
            li.textContent = await campaign.methods.tittle().call();
            li.addEventListener('click', () => exibirDetalhesDaCampanha(campaign));
            list.appendChild(li);
        }
    });
}

//Função que exibe os detalhes da campanha no painel 'Minhas Campanhas'
async function exibirDetalhesDaCampanha(campaign) {
    document.getElementById('editTitleInput').value = await campaign.methods.tittle().call();
    document.getElementById('editGoalInput').value = weiToEther(await campaign.methods.goal().call());
    document.getElementById('editDescricaoInput').value = await campaign.methods.description().call();
    document.getElementById('currentBalance').textContent = weiToEther(await campaign.methods.currentBalance().call()) + " ETH";

    document.getElementById('statusContrato').checked = await campaign.methods.active().call();
    document.getElementById('campaignDetails').style.display = 'block';
    document.getElementById('saveButton').onclick = () => updateCampanha(campaign);
    document.getElementById('currentBalance').onclick = () => withdrawTransfer(campaign);
}

//Função que realiza o saque do valor disponível da campanha selecioanda
async function withdrawTransfer(campaign) {
    let currentBalance = await campaign.methods.currentBalance().call();
    let receipt = await campaign.methods.withdrawTransfer(currentBalance, externalAccountID).send({
        from: externalAccountID
    });
}

//Função que salva as alterações feitas na campanha
async function updateCampanha(campaign) {
    let _tittle = document.getElementById('editTitleInput').value;
    let _goal = etherToWei(document.getElementById('editGoalInput').value);
    let _description = document.getElementById('editDescricaoInput').value;
    let _active = document.getElementById('statusContrato').checked;

    let receipt = await campaign.methods.updateCampanha(_tittle, _description, _goal, _active).send({
        from: externalAccountID
    });
}

//Função que verifica se o usuário possui campanhas criadas
async function usuarioPossuiCampanhas() {
    let campaigns = await getCampanhas();

    for (let i = 0; i < campaigns.length; i++) {
        let ownerAddress = await campaigns[i].methods.ownerAddress().call();
        if (ownerAddress == externalAccountID) {
            return true;
        }
    }
    return false;
}

//Função que retorna todas as campanhas
async function getCampanhas() {
    let web3 = new Web3(window.ethereum);
    let contrato = new web3.eth.Contract(await loadABISmartRaise(), contractAddressID);
    let campanhasAddress = await contrato.methods.getAllCampanhas().call();
    let projects = [];
    for (let i = 0; i < campanhasAddress.length; i++) {
        let campanha = new web3.eth.Contract(await loadABICampanha(), campanhasAddress[i]);
        projects.push(campanha);
    }
    return projects;
}

//Função para criar nova campanha
async function criarNovaCampanha() {
    const title = document.getElementById('titleInput').value;
    const descricao = document.getElementById('descricaoInput').value;
    const goal = etherToWei(document.getElementById('goalInput').value);


    // Verifica se todos os campos foram preenchidos
    if (title && descricao && goal > 0) {
        createCampanha(title, descricao, goal);
        carregarCampanhasNoPainel(await getCampanhas()); // Atualiza a renderização dos cartões
        // Limpa os campos após o cadastro
        document.getElementById('titleInput').value = '';
        document.getElementById('descricaoInput').value = '';
        document.getElementById('goalInput').value = '';
    } else {
        alert("Por favor, preencha todos os campos!"); // Alerta se os campos não estiverem preenchidos
    }
}

//Função que filtra as campanhas a partir do filtro de busca
async function filtrarCampanhas() {
    const detailsPanel = document.getElementById('detailsPanel');
    //Buscando as campanhas
    let projects = await getCampanhas();
    //Buscando o valor inserido no filtro de busca
    const filterValue = filterInput.value.toLowerCase();
    // Cria um array para armazenar os projetos filtrados
    const campanhasFiltradas = [];
    // Itera sobre os projetos e aguarda a resolução de cada tittle
    for (const project of projects) {
        const title = String(await project.methods.tittle().call()).toLowerCase();
        if (title.includes(filterValue)) {
            campanhasFiltradas.push(project); // Adiciona o projeto filtrado
        }
    }
    // Renderiza as campanhas filtradas
    carregarCampanhasNoPainel(campanhasFiltradas);
    // Reseta o painel de detalhes se o filtro for aplicado
    detailsPanel.style.display = 'none';
}

//Função que carrega as doações no painel
async function carregarDoacoes(_campanhaAddress) {
    let web3 = new Web3(window.ethereum);
    let campanha = new web3.eth.Contract(await loadABICampanha(), _campanhaAddress);
    let doacoesList = await campanha.methods.getDonations().call();
    let ultimasDoacoes = doacoesList.slice(-4);
    let donationsHTML = '';
    ultimasDoacoes.forEach(donation => {
        const date = new Date(Number(donation.timestamp) * 1000);
        const formattedDate = date.toLocaleString('pt-BR', {
            year: 'numeric',
            month: 'short',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
        donationsHTML += `
            <div class="donation-item">
                <div class="donation-header">${formattedDate }</div>
                <div class="donation-address">${donation.donor}</div>
                <div class="donation-amount">${weiToEther(donation.amount)} ETH</div>
            </div>
        `;
    });
    return donationsHTML;
}

//Função que converte wei para ether
function weiToEther(wei) {
    return Web3.utils.fromWei(wei, 'ether');
}

//Função que converte ether para wei
function etherToWei(ether) {
    return Web3.utils.toWei(ether, 'ether');
}

// Função para "desconectar" o usuário
async function disconnectUser() {
    const connectButton = document.getElementById('conectWallet');
    const accountInfo = document.getElementById('accountInfo');
    const walletPanel = document.getElementById('walletPanel');

    connectButton.style.display = 'block';
    accountInfo.style.display = 'none';
    walletPanel.style.display = 'none';
}

//Função que retorna a ABI do contrato SmartRaise
async function loadABISmartRaise() {
    const response = await fetch('../build/contracts/SmartRaise.json');
    const abiValue = await response.json();
    return abiValue.abi;
}

//Função que retorna a ABI do contrato Campanha
async function loadABICampanha() {
    const response = await fetch('../build/contracts/Campanha.json');
    const abiValue = await response.json();
    return abiValue.abi;
}

//Função que cria uma campanha
async function createCampanha(titulo, descricao, objetivo) {
    let web3 = new Web3(window.ethereum);
    let contrato = new web3.eth.Contract(await loadABISmartRaise(), contractAddressID);

    const estimatedGas = await contrato.methods.newCampanha(titulo, descricao, objetivo).estimateGas({
        from: externalAccountID
    });

    let receipt = await contrato.methods.newCampanha(titulo, descricao, objetivo).send({
        from: externalAccountID,
        gas: estimatedGas
    });
    console.log("Nova campanha criada: " + receipt);
}
