const Campanha = artifacts.require("Campanha");

module.exports = function (deployer) {
    deployer.deploy(Campanha);
};