const mongoose = require('mongoose');

const connectDatabase = async () => {
    try {
        mongoose.set('strictQuery', true);
        const con = await mongoose.connect(process.env.DB_LOCAL_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            autoIndex: true,
        });

        console.log(`MongoDB is connected to the host: ${con.connection.host}`);

        const productCollections = await mongoose.connection.db.listCollections({ name: 'products' }).toArray();
        if (productCollections.length > 0) {
            const productIndexes = await mongoose.connection.db.collection('products').indexes();
            const hasSlugIndex = productIndexes.find(index => index.name === 'slug_1');
            if (!hasSlugIndex) {
                console.log("Creating unique index on products.slug");
                await mongoose.connection.db.collection('products').createIndex({ slug: 1 }, { unique: true });
                console.log('Unique index on slug created.');
            }
        } else {
            console.log("Products collection does not exist. Skipping index creation.");
        }

        // Check if 'categories' collection exists
        const categoryCollections = await mongoose.connection.db.listCollections({ name: 'categories' }).toArray();
        if (categoryCollections.length > 0) {
            const indexes = await mongoose.connection.db.collection('categories').indexes();
            const hasSubSlugIndex = indexes.find(index => index.name === 'subcategories.slug_1');
            if (hasSubSlugIndex) {
                await mongoose.connection.db.collection('categories').dropIndex('subcategories.slug_1');
                console.log('Dropped subcategories.slug_1 index.');
            }
        } else {
            console.log("Categories collection does not exist. Skipping index operations.");
        }

    } catch (err) {
        process.exit(1);
    }
};

module.exports = connectDatabase;
