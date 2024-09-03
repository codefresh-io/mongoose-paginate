// @ts-check
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoosePaginate = require('../index');

/**
 * @typedef {import('mongoose').Model} Model
 * @typedef {import('../index').paginate} paginate
 */

const AuthorSchema = new mongoose.Schema({ name: String });
const Author       = mongoose.model('Author', AuthorSchema);
const BookSchema = new mongoose.Schema({
    title:  String,
    date:   Date,
    author: {
        type: mongoose.Schema.ObjectId,
        ref:  'Author'
    }
});
BookSchema.plugin(mongoosePaginate);
/**
 * @type {Model & { paginate: paginate }}
 */
// @ts-ignore
const Book = mongoose.model('Book', BookSchema);

describe('mongoose-paginate', function() {
    /** @type {MongoMemoryServer|null} */
    let server = null;

    beforeAll(async () => {
        server = await MongoMemoryServer.create();
        await mongoose.connect(server.getUri());

        const author = await Author.create({ name: 'Arthur Conan Doyle' });
        const date = new Date();
        const books = Array.from({ length: 100 }, (_, i) => ({
            title: `Book #${i + 1}`,
            date: new Date(date.getTime() + i),
            author: author._id,
        }));
        await Book.create(books);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await server?.stop();
    });

    it('should return thenable', function() {
        const promise = Book.paginate();
        expect(promise.then).toBeInstanceOf(Function);
    });

    it.each([
        undefined,
        {},
    ])('should count total if empty query passed: %o', async (query) => {
        const result = await Book.paginate(query);
        expect(result.total).toEqual(100);
    });

    describe('paginates', function() {
        it('with criteria', async function() {
            const result = await Book.paginate({ title: 'Book #10' });
            expect(result.docs).toBeInstanceOf(Array);
            expect(result.docs).toHaveLength(1);
            expect(result.docs[0].title).toEqual('Book #10');
        });

        it('with default options (page=1, limit=10, lean=false)', async function() {
            const result = await Book.paginate();
            expect(result.docs).toBeInstanceOf(Array);
            expect(result.docs).toHaveLength(10);
            expect(result.docs[0]).toBeInstanceOf(mongoose.Document);
            expect(result.total).toEqual(100);
            expect(result.limit).toEqual(10);
            expect(result.page).toEqual(1);
            expect(result.pages).toEqual(10);
            expect(result.offset).toEqual(0);
        });

        it('with custom default options', async function() {
            const optionsBackup = mongoosePaginate.paginate.options;
            try {
                mongoosePaginate.paginate.options = {
                    limit: 20,
                    lean:  true,
                };
    
                const result = await Book.paginate();
                expect(result.docs).toBeInstanceOf(Array);
                expect(result.docs).toHaveLength(20);
                expect(result.limit).toEqual(20);
                expect(result.docs[0]).not.toBeInstanceOf(mongoose.Document);
            } finally {
                mongoosePaginate.paginate.options = optionsBackup;
            }
        });

        it('with offset and limit', async function() {
            const result = await Book.paginate({}, { offset: 30, limit: 20 });
            expect(result.docs).toBeInstanceOf(Array);
            expect(result.docs).toHaveLength(20);
            expect(result.total).toEqual(100);
            expect(result.limit).toEqual(20);
            expect(result.offset).toEqual(30);
            expect(result).not.toHaveProperty('page');
            expect(result).not.toHaveProperty('pages');
        });

        it('with page and limit', async function() {
            const result = await Book.paginate({}, { page: 1, limit: 20 });
            expect(result.docs).toBeInstanceOf(Array);
            expect(result.docs).toHaveLength(20);
            expect(result.total).toEqual(100);
            expect(result.limit).toEqual(20);
            expect(result.page).toEqual(1);
            expect(result.pages).toEqual(5);
            expect(result).not.toHaveProperty('offset');
        });

        it('with zero limit', async function() {
            const result = await Book.paginate({}, { page: 1, limit: 0 });
            expect(result.docs).toHaveLength(0);
            expect(result.total).toEqual(100);
            expect(result.limit).toEqual(0);
            expect(result.page).toEqual(1);
            expect(result.pages).toEqual(Infinity);
        });

        it('with select', async function() {
            const result = await Book.paginate({}, { select: 'title' });
            expect(result.docs[0].title).toBeDefined();
            expect(result.docs[0].date).not.toBeDefined();
        });

        it('with sort', async function() {
            const result = await Book.paginate({}, { sort: { date: -1 } });
            expect(result.docs[0].title).toEqual('Book #100');
        });

        it('with populate', async function() {
            const result = await Book.paginate({}, { populate: 'author' });
            expect(result.docs[0].author.name).toEqual('Arthur Conan Doyle');
        });

        describe('with lean', function() {
            it('with default leanWithId=true', async function() {
                const result = await Book.paginate({}, { lean: true });
                expect(result.docs[0]).not.toBeInstanceOf(mongoose.Document);
                expect(result.docs[0].id).toEqual(String(result.docs[0]._id));
            });

            it('with leanWithId=false', async function() {
                const result = await Book.paginate({}, { lean: true, leanWithId: false });
                expect(result.docs[0]).not.toBeInstanceOf(mongoose.Document);
                expect(result.docs[0]).not.toHaveProperty('id');
            });
        });
    });
});
