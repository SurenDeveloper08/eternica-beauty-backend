const dotenv = require('dotenv');
const path = require('path')
dotenv.config({ path: path.join(__dirname, "config/config.env") });
const mongoose = require('mongoose');

const fixDuplicateSlugs = async () => {
  try {
    await mongoose.connect(process.env.DB_LOCAL_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to DB');

    const collections = await mongoose.connection.db.listCollections({ name: 'products' }).toArray();
    if (collections.length === 0) {
      console.log('Products collection does not exist. Skipping operations.');
      await mongoose.disconnect();
      process.exit(0);
    }
    
    const productsCollection = mongoose.connection.db.collection('products');

    // Aggregate duplicate slugs
    const duplicates = await productsCollection.aggregate([
      {
        $group: {
          _id: "$slug",
          count: { $sum: 1 },
          docs: { $push: { _id: "$_id" } }
        }
      },
      { $match: { count: { $gt: 1 } } }
    ]).toArray();

    if (duplicates.length === 0) {
      console.log('No duplicate slugs found.');
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log(`Found ${duplicates.length} duplicate slug(s). Fixing...`);

    for (const dup of duplicates) {
      const slug = dup._id;
      const docs = dup.docs;

      // Skip the first occurrence, rename the rest
      for (let i = 1; i < docs.length; i++) {
        const newSlug = `${slug}-${i}`;
        console.log(`Updating product ${docs[i]._id} slug to ${newSlug}`);

        await productsCollection.updateOne(
          { _id: docs[i]._id },
          { $set: { slug: newSlug } }
        );
      }
    }

    console.log('Duplicate slugs fixed.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error fixing duplicate slugs:', err);
    process.exit(1);
  }
};

fixDuplicateSlugs();
