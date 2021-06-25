class errorClass {
  constructor (err) {
    this.err = err;
  }

  toString () {
    return this.err;
  }
}

module.exports = {
  errorClass: errorClass
};
