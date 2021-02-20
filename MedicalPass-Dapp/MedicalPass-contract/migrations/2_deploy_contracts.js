var MedicalPass = artifacts.require("MedicalPass");

module.exports = function(deployer) {
  deployer.deploy(MedicalPass,4);
};
