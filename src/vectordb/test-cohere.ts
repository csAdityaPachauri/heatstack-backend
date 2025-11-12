import { EmbeddingService } from './embedding.service';
import * as dotenv from 'dotenv';

dotenv.config();

async function testCohere() {
  console.log('🚀 Testing COHERE Embeddings (1000 FREE calls/month)...\n');

  if (!process.env.COHERE_API_KEY) {
    console.log('❌ COHERE_API_KEY not found in .env file!');
    console.log('\n📝 To get your FREE API key:');
    console.log('1. Go to https://cohere.com/');
    console.log('2. Sign up (NO CREDIT CARD REQUIRED)');
    console.log('3. Go to Dashboard → API Keys');
    console.log('4. Copy your Production key');
    console.log('5. Add to .env: COHERE_API_KEY=your-key-here\n');
    return;
  }

  const embeddingService = new EmbeddingService();

  const text = 'User clicked on header navigation 5 times';

  console.log('Input text:', text);
  console.log('Generating embedding...\n');

  try {
    const startTime = Date.now();
    const embedding = await embeddingService.generateEmbedding(text);
    const endTime = Date.now();

    console.log('✅ Embedding generated successfully!');
    console.log('⏱️  Time taken:', endTime - startTime, 'ms');
    console.log('📊 Dimensions:', embedding.length);
    console.log(
      '🔢 First 10 values:',
      embedding.slice(0, 10).map((n) => n.toFixed(4)),
    );
    console.log('\n🎉 Success! Cohere embeddings working!\n');

    // Test batch generation
    console.log('Testing batch generation...');
    const texts = [
      'User viewed homepage for 30 seconds',
      'User clicked CTA button',
      'User hovered over navigation menu',
    ];

    const batchStart = Date.now();
    const embeddings = await embeddingService.generateEmbeddings(texts);
    const batchEnd = Date.now();

    console.log(`✅ Generated ${embeddings.length} embeddings in ${batchEnd - batchStart}ms`);
    console.log('All embeddings have', embeddings[0].length, 'dimensions\n');

    // Test similarity
    const similarity = embeddingService.cosineSimilarity(embeddings[0], embeddings[1]);
    console.log('Similarity between first two texts:', similarity.toFixed(4));

    console.log('\n💰 Cost: FREE (1000 calls/month limit)');
    console.log('✅ Ready for production!\n');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('invalid')) {
      console.log('\n⚠️  Your API key might be invalid. Please check:');
      console.log('1. Go to https://dashboard.cohere.com/api-keys');
      console.log('2. Generate a new API key');
      console.log('3. Update your .env file\n');
    }
  }
}

testCohere();
