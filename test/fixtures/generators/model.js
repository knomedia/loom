exports.present = function(name, fields, callback) {
  callback({
    name: name,
    fields: fields
  });
};

exports.templates = [
  'app/model.js.hbs',
  'spec/model.spec.js.hbs'
];

