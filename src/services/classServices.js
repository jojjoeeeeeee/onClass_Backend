const generator = require('generate-password');

const generateClasscode = () => {
    return generator.generate({
        length: 10,
        numbers: true
    });
}

module.exports.generateClasscode = generateClasscode();