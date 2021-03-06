Loom
====

Weave your wefts betwixt the warps of loom generators and scaffolds.

![wefts and warps](http://ryanflorence.com/gifs/warp-weft.gif)

**Loom makes it easy to share best-practices and common patterns for app
development.**

- build a set of generators for public consumption based on some
  framework or library (like ember, angular, backbone, etc.)
- consume those sets of generators
- override those generators
- build your own generators for your specific app

Using Loom Generator Packages from NPM
--------------------------------------

Using generator packages from npm is easy:

```sh
npm install loom-generators-ember --save
generate model user name:string age:number
```

Then refer to the documentation for the generators you've installed.

You must install with `--save` or add the module to your package.json
instead (that's how loom knows how to use them).

Creating Your Own Generators
----------------------------

Also, see [the full generator API below](#generator-api)

While using generators others have created for you is great, its awesome
to have a simple way to make generators for our own apps. Even if you're
using a set of generators from npm, defining your own generators will
override them.

### Installation

```sh
npm install loom -g
generate --init
```

### Templates

Initializing loom simply creates some directories in your project. After
that, all you need is a template in `./loom/templates/`:

Lets say we have a lot of "meal" objects in our app, lets make a
template for what one of these objects looks like:

_loom/templates/app/meal.js.hbs_

```mustache
function {{objectName}}() {
  this.food = '{{params.food}}';
  this.venue = '{{params.venue}}';
}
```

And then you can generate files based on the template:

```sh
generate app/meal.js lunch food:taco venue:cart
```

This will create a file at `app/lunch.js` that looks like:

```js
function lunch() {
  this.food = 'taco';
  this.venue = 'cart';
}
```

Loom, by default, will save files to your app in the same relative
location they were found in your templates directory.

### Generators

We can define a generator to make everything a little nicer. First we'll
create a `present` method that determines what data goes to the
template. Then we'll tell it where to find the template so we can
simplify the generator command.

_loom/generators/meal.js_

```js
exports.present = function(name, params) {
  params.constructorName = name.charAt(0).toUpperCase() + name.slice(1);
  return params;
};

exports.template = 'app/meal.js.hbs';
```

Now our template is simpler, no more `{{params.food}}` and it
capitalizes our constructor like a propery lady or gent.

_loom/templates/meal.js.hbs_

```mustache
function {{constructorName}}() {
  this.food = '{{food}}';
  this.venue = '{{venue}}';
}
```

And finally our command is simpler, it now just matches a generator
named `meal` instead of a template found at `app/meal.js`.

`generate meal lunch food:taco venue:cart`

### Engines

The default generator uses handlebars, but we can swap it out for ejs by
creating a very simple "engine":

_loom/engines/ejs.js_

```js
var _ = require('underscore');
// module.exports = _.template
// that works, but for clarity:

module.exports = function(src, locals) {
  return _.template(src, locals);
};
```

Rename your template to `meal.js.ejs` and edit it:

```ejs
function <%= constructorName %>() {
  this.food = '<%= food %>';
  this.venue = '<%= venue %>';
}
```

Update your generator to point to the proper template:

```js
exports.template = 'app/meal.js.ejs';
```

Loom looks at the file extension of the template (in this case `ejs`)
and then tries to find a template engine named `ejs.js`.

Now generate your newly configured template:

`generate meal lunch food:taco venue:cart`

### Multiple templates for one generator

Its very common for a generator to create several files, like unit tests
and scaffoling. Lets add a unit test template to our meal generator.

_loom/templates/test/unit/meal.spec.js.ejs_

```ejs
describe('<%= constructorName %>', function() {
  it('sets food to "<%= food %>"', function() {
    var meal = new <%= constructorName %>();
    expect(meal.food).to.equal('<%= food %>');
  });
});
```

And add the template path to your generator, note the rename from
`exports.template` to `export.templates`.

```js
exports.templates = [
  'app/meal.js.ejs',
  'test/unit/meal.spec.js.ejs'
];
```

Both templates will get the same data from `generator.present` and the
files will be saved to the same relative path in your app as they are
defined in your templates directory.

### Default Generators

If you define `loom/generators/default.js`, loom will use it when a
specific generator is not found.

Publishing Generators to NPM for Everybody
------------------------------------------

Name your module `loom-generators-<name>` (like
`loom-generators-ember`), place generators, templates, and engines in
`./loom`, and then publish.  That's it. People can simply `npm install
loom-generators-<name> --save` and start using them.

Publishing Template Engines to NPM for Everybody
------------------------------------------------

To add support for your favorite templating engine you can either add a
file to `loom/engines` or publish a module to npm named
`loom-engine-<ext>`. Loom will attempt to require the engine if it
doesn't find it in your project.

Generator API
-------------

Loom has a generic generator that can be overridden to meet your specific
use case. Generators can export a few methods that loom will use.

Your generator can implement as many methods as you need, loom will
merge in the `generic_generator` methods that you don't provide.

Here's a generator that does nothing:

_loom/generators/noop.js_

```js
exports.before = function(){};
exports.present = function(){};
exports.savePath = function(){};
exports.write = function(){};
exports.render = function(){};
exports.template = '';
// exports.template = function(){};
// exports.templates = [];
// exports.templates = function(){};
```

Below is documentation on generator API, also, check out the [generic
generator](lib/generic_generator).

### generator.before

Executes before anything else happens. Useful if you need to set or
change some things on `env` before it moves through the other methods of
your generator.

#### signature

`function(env)`

#### arguments

1. env (Object) - the loom environment object.


### generator.present

#### signature

`function([argN] [, params], env)`

#### arguments

1. argN (String) - the space separated values used in the loom command
2. params (Object) - the key:value pairs used in the loom command
3. env (Object) - the loom environment object

#### examples

Lets make a generator that logs the arguments to explore how this works.

_loom/generators/user.js_

```js
exports.present = function() {
  console.log(arguments);
};
```

The following are commands followed by what is logged for the arguments:

```sh
generate model user name:string age:number
{ '0': 'user', '2': { name: 'string', age: 'number' } }

generate model foo bar baz qux:1 quux:2
{ '0': 'foo',
  '1': 'bar',
  '2': 'baz',
  '3': { qux: '1', quux: '2' } }
```

As you can see, the space separated values become the arguments and the
key=value pairs are wrapped up into an object for the final `params` argument.


### generator.template

Determines which template to render.

`exports.template` can simply be a string, or a function if you need to
compute it.

Paths are relative to the `./loom/templates` directory.

#### example

To use a template found at
`loom/templates/spec/models/model.spec.js.hbs`:

```js
exports.template = 'spec/models/model.spec.js.hbs';
exports.template = function() {
  // some computation
  return 'spec/models/model.spec.js.hbs';
};
```

#### notes

Unless you override `generator.write` the generated file will be saved
in the mirrored location in `loom/templates`, so the example above will
be saved to `spec/models/<name>.spec.js`.

### generator.templates

Same as `template` but is an array of template paths that take
precendence over `template`. Each template will receive the same locals
returned from `present`. Can also be a function that returns an array.

#### examples

```js
exports.templates = [
  'app/models/model.js.ejs',
  'spec/models/model.spec.js.ejs'
];

exports.templates = function() {
  return [
    'app/models/model.js.ejs',
    'spec/models/model.spec.js.ejs'
  ];
};
```

### generator.savePath

Determines the path in which to save a template.

#### signature

`function(template, env)`

#### arguments

1. template (String) - the path of the template being rendered
2. env (Object) - the loom environment object

### generator.write

Writes a rendered template to the file system, its unlikely you'll want
to override this.

#### signature

`function(templateName, src, env)`

### generator.render

Determines how to render the template, its unlinkely you'll want to
override this.

#### signature

`function(engine, templatePath, locals)`

TODO
====

- --force option to overwrite files (better for scripting so you don't
  get the prompt)
- async compatibility, right now all generator operations must be
  sync

