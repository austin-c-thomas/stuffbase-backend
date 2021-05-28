const passwordStrengthCheck = (password) => {
  if (password.length < 8) {
    throw Error('Password must be at least 8 characters long.');
  };
  if (!password.match(/[a-z]/g)) {
    throw Error('Password must include at least one lowercase letter.');
  };
  if (!password.match(/[A-Z]/g)) {
    throw Error('Password must include at least one uppercase letter.');
  };
  if (!password.match(/[0-9]/g)) {
    throw Error('Password must include at least one number.');
  };
}; 

module.exports = {
  passwordStrengthCheck,
}