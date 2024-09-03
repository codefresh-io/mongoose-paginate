// @ts-check

/**
 * @typedef {Object}                    BaseOptions
 * @property {Object | string}          [select]
 * @property {Object | string}          [sort]
 * @property {Array | Object | string}  [populate]
 * @property {boolean}                  [lean=false]
 * @property {boolean}                  [leanWithId=true]
 * @property {number}                   [limit]
 * 
 * @typedef {Object}                    OffsetProps
 * @property {number}                   [offset=0] Use either `offset` or `page` to set skip position
 * @property {never}                    [page]
 * @typedef {OffsetProps & BaseOptions} OffsetOptions
 * 
 * @typedef {Object}                    PageProps
 * @property {never}                    [offset]
 * @property {number}                   [page=1] Use either `offset` or `page` to set skip position
 * @typedef {PageProps & BaseOptions}   PageOptions
 * 
 * @typedef {OffsetOptions|PageOptions} Options
 *
 * @typedef {Required<Pick<Options, 'lean' | 'leanWithId' | 'limit'>>} DefaultOptions
 *
 * @typedef {import('mongoose').FilterQuery<any>}   Filter
 * @typedef {import('mongoose').Schema}             Schema
 * @typedef {import('mongoose').Model}              Model
 * @typedef {import('mongoose').Query}              Query
 */

/** @type {DefaultOptions} */
const defaultOptions = {
    lean: false,
    leanWithId: true,
    limit: 10,
};

/**
 * @this {Model}
 * @param {Filter} [filter={}]
 * @param {Options} [opts] See {@link defaultOptions default options} for default values
 * @returns {Promise}
 */
async function paginate(filter = {}, opts = {}) {
    const options = {
        ...defaultOptions,
        ...paginate.options,
        ...opts,
    };

    const { lean, leanWithId, limit, select, sort, populate } = options;

        let skip, offset, page;
    if (options.hasOwnProperty('offset')) {
        offset = options.offset;
        skip = offset;
    } else if (options.hasOwnProperty('page')) {
        page = options.page;
        skip = (page - 1) * limit;
    } else {
        offset = 0;
        page = 1;
        skip = offset;
    }

    const countPromise = Object.keys(filter).length === 0
        ? this.estimatedDocumentCount().exec()
        : this.countDocuments(filter).exec();
    /** @type {Promise<any[]>}  */
    let docsPromise = Promise.resolve([]); // in case limit is 0

    if (limit !== 0) {
        /** @type {Query} */
        const query = this.find(filter)
            .select(select)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .lean(lean);

        if (populate) {
            [].concat(populate).forEach((item) => query.populate(item));
        }

        docsPromise = query.exec();

        if (lean && leanWithId) {
            docsPromise = docsPromise.then((docs) => {
                return docs.map((doc) => {
                    doc.id = String(doc._id);
                    return doc;
                });
            });
        }
    }

    const [docs, total] = await Promise.all([docsPromise, countPromise]);
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
}
/** @type {Options} */
paginate.options = defaultOptions;

/** @param {Schema} schema */
module.exports = function (schema) {
    schema.static('paginate', paginate);
};

module.exports.paginate = paginate;
