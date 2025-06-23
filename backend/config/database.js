const mongoose = require('mongoose');

const connectDatabase = async () => {
    try {
        mongoose.set('strictQuery', true);
        const con = await mongoose.connect(process.env.DB_LOCAL_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log(`MongoDB is connected to the host: ${con.connection.host}`);

        const indexes = await mongoose.connection.db.collection('categories').indexes();

        const hasSubSlugIndex = indexes.find(index => index.name === 'subcategories.slug_1');

        if (hasSubSlugIndex) {
            await mongoose.connection.db.collection('categories').dropIndex('subcategories.slug_1');
        }

    } catch (err) {
       process.exit(1);
    }
};

module.exports = connectDatabase;
