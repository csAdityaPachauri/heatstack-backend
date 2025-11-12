import { Pinecone } from '@pinecone-database/pinecone';
import * as dotenv from 'dotenv';

dotenv.config();

async function testPinecone() {
  console.log('🔍 Testing Pinecone Connection...\n');

  try {
    const pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    // List all indexes
    console.log('📋 Listing all indexes...');
    const indexes = await pinecone.listIndexes();

    if (indexes.indexes && indexes.indexes.length > 0) {
      console.log('\n✅ Found indexes:');
      indexes.indexes.forEach((idx) => {
        console.log(`  - ${idx.name} (${idx.dimension} dimensions, ${idx.metric} metric)`);
      });
    } else {
      console.log('\n⚠️  No indexes found. You need to create one!');
      console.log('\nRun: npx ts-node src/vectordb/init-pinecone.ts');
      return;
    }

    // Check if our specific index exists
    const indexName = 'heatstack-events-cohere';
    const ourIndex = indexes.indexes?.find((idx) => idx.name === indexName);

    if (ourIndex) {
      console.log(`\n✅ Your index "${indexName}" exists!`);

      // Get index stats
      const index = pinecone.Index(indexName);
      const stats = await index.describeIndexStats();

      console.log('\n📊 Index Stats:');
      console.log(`  Total vectors: ${stats.totalRecordCount || 0}`);
      console.log(`  Dimensions: ${stats.dimension}`);

      if (stats.dimension !== 384) {
        console.log('\n⚠️  WARNING: Index has wrong dimensions!');
        console.log(`  Expected: 384 (for Cohere)`);
        console.log(`  Actual: ${stats.dimension}`);
        console.log('\n  You need to delete this index and create a new one with 384 dimensions.');
      }
    } else {
      console.log(`\n❌ Index "${indexName}" not found!`);
      console.log('\n📝 Create it with:');
      console.log('   - Name: heatstack-events-cohere');
      console.log('   - Dimensions: 384');
      console.log('   - Metric: cosine');
      console.log('\nOr run: npx ts-node src/vectordb/init-pinecone.ts');
    }
  } catch (error: any) {
    console.error('\n❌ Error:', error.message);

    if (error.message.includes('401') || error.message.includes('Unauthorized')) {
      console.log('\n💡 Your Pinecone API key is invalid or missing.');
      console.log('   Check your .env file: PINECONE_API_KEY=your-key-here');
    }
  }
}

testPinecone();
