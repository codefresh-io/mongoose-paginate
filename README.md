
# @codefresh-io/mongoose-paginate

> Fork of [`mongoose-paginate`](https://github.com/edwardhotchkiss/mongoose-paginate), maintained by [Codefresh](https://codefresh.io/).

Pagination plugin for [Mongoose](http://mongoosejs.com).


## Installation

```sh
npm install @codefresh-io/mongoose-paginate
```

## Usage

Add plugin to a schema and then use model `paginate` method:

```js
const { Model, Schema } = require('mongoose');
const mongoosePaginate = require('mongoose-paginate');

const schema = new mongoose.Schema({ /* schema definition */ });
schema.plugin(mongoosePaginate);

const Model = mongoose.model('Model',  schema);
Model.paginate();
```

### Model.paginate([filter], [options])

**Parameters**

* `[filter]` {Object} - Query filter. [*(Documentation)*](https://mongoosejs.com/docs/api/model.html#Model.find())
* `[options]` {Object}
  - `[select]` {Object | String} - Fields to return (by default returns all fields). [*(Documentation)*](http://mongoosejs.com/docs/api.html#query_Query-select)
  - `[sort]` {Object | String} - Sort order. [*(Documentation)*](http://mongoosejs.com/docs/api.html#query_Query-sort)
  - `[populate]` {Array | Object | String} - Paths which should be populated with other documents. [*(Documentation)*](http://mongoosejs.com/docs/api.html#query_Query-populate)
  - `[lean=false]` {Boolean} - Should return plain javascript objects instead of Mongoose documents? [*(Documentation)*](http://mongoosejs.com/docs/api.html#query_Query-lean)
  - `[leanWithId=true]` {Boolean} - If `lean` and `leanWithId` are `true`, adds `id` field with string representation of `_id` to every document.
  - `[offset=0]` {Number} - Use either `offset` or `page` to set skip position
  - `[page=1]` {Number} - Use either `offset` or `page` to set skip position
  - `[limit=10]` {Number} - If `limit===0`, empty array will be returned.

**Return value**

Promise fulfilled with object having properties:
* `docs` {Array} - Array of documents. Empty array, if `limit===0`.
* `total` {Number} - Total number of documents in collection that match a query. If query filter was omit or empty, estimated number of docs will be returned.
* `limit` {Number} - Limit that was used
* `[page]` {Number} - Only if specified or default `page`/`offset` values were used 
* `[pages]` {Number} - Only if `page` specified or default `page`/`offset` values were used 
* `[offset]` {Number} - Only if specified or default `page`/`offset` values were used

### Examples

#### Skip 20 documents and return 10 documents

```js
const result = await Model.paginate({}, { page: 3, limit: 10 });
/*
{
  docs: <Array>,
  total: <Number>,
  limit: 10,
  page: 3,
  pages: <Number>,
}
*/
```

Or you can do the same with `offset` and `limit`:

```js
const result = await Model.paginate({}, { offset: 20, limit: 10 });
/*
{
  docs: <Array>,
  total: <Number>,
  limit: 10,
  offset: 20,
}
*/
```

#### More advanced example

```js
const filter = {};
const options = {
  select: 'title date author',
  sort: { date: -1 },
  populate: 'author',
  lean: true,
  offset: 20, 
  limit: 10
};

const result = Book.paginate(filter, options);
```

#### Zero limit

You can use `limit=0` to get only metadata:

```js
const result = await Model.paginate({}, { offset: 100, limit: 0 });
/*
{
  docs: [],         // empty array
  total: <Number>,
  limit: 0,
  offset: 100,
}
*/
```

#### Set custom default options for all queries

```js
const { paginate } = require('mongoose-paginate');

paginate.options = { 
  lean:  true,
  limit: 20
};

// ...

const result = await Model.paginate();
/*
{
  docs: <Array>,  // array of POJO
  limit: 20,      // default limit 20 was applied
}
*/
```

## Tests

```sh
yarn install
yarn test
```

## License

[MIT](LICENSE)
