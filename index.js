/**
 * @param {Object}              [query={}]
 * @param {Object}              [options={}]
 * @param {Object|String}         [options.select]
 * @param {Object|String}         [options.sort]
 * @param {Array|Object|String}   [options.populate]
 * @param {Boolean}               [options.lean=false]
 * @param {Boolean}               [options.leanWithId=true]
 * @param {Number}                [options.offset=0] - Use offset or page to set skip position
 * @param {Number}                [options.page=1]
 * @param {Number}                [options.limit=10]
 *
 * @returns {Promise}
 */
function paginate(query, options) {
    query   = query || {};
    options = Object.assign({}, paginate.options, options);

    var select     = options.select;
    var sort       = options.sort;
    var populate   = options.populate;
    var lean       = options.lean || false;
    var leanWithId = options.hasOwnProperty('leanWithId') ? options.leanWithId : true;

    var limit = options.hasOwnProperty('limit') ? options.limit : 10;
    var skip, offset, page;

    if (options.hasOwnProperty('offset')) {
        offset = options.offset;
        skip   = offset;
    } else if (options.hasOwnProperty('page')) {
        page = options.page;
        skip = (page - 1) * limit;
    } else {
        offset = 0;
        page   = 1;
        skip   = offset;
    }

    let docsPromise = Promise.resolve([]);
    const countPromise = Object.keys(query).length === 0
        ? this.estimatedDocumentCount().exec()
        : this.countDocuments(query).exec();

    if (limit) {
        var query = this.find(query)
                        .select(select)
                        .sort(sort)
                        .skip(skip)
                        .limit(limit)
                        .lean(lean);

        if (populate) {
            [].concat(populate).forEach(function(item) {
                query.populate(item);
            });
        }

        docsPromise = query.exec();

        if (lean && leanWithId) {
            docsPromise = docsPromise.then(function(docs) {
                docs.forEach(function(doc) {
                    doc.id = String(doc._id);
                });

                return docs;
            });
        }
    }

    return Promise.all([docsPromise, countPromise])
        .then(function([docs, total]) {
            return {
                docs,
                total,
                limit,
                ...(offset !== undefined && { offset }),
                ...(page !== undefined && {
                    page,
                    pages: Math.ceil(total / limit) || 1,
                }),
            };
        });
}

/**
 * @param {Schema} schema
 */
module.exports = function(schema) {
    schema.statics.paginate = paginate;
};

module.exports.paginate = paginate;
