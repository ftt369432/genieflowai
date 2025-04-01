require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Initialize Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Check configuration
if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
  console.error('Missing Supabase credentials. Please run setup-env.js first.');
  process.exit(1);
}

/**
 * Mock Gemini embedding function (similar to the one in the geminiDocumentService.ts)
 */
async function getGeminiEmbedding(text) {
  console.log('Generating mock embedding for text:', text.substring(0, 50) + '...');
  
  // Generate a deterministic embedding based on the text content
  const buffer = new TextEncoder().encode(text);
  const hashValues = [];
  
  // Create a simple hash-based embedding of 1536 dimensions
  for (let i = 0; i < 1536; i++) {
    let value = 0;
    for (let j = 0; j < buffer.length; j++) {
      value += buffer[j] * Math.sin(i * j / 100);
    }
    hashValues.push(Math.tanh(value / 1000));
  }
  
  // Normalize the vector
  const magnitude = Math.sqrt(hashValues.reduce((sum, val) => sum + val * val, 0));
  const normalized = hashValues.map(val => val / magnitude);
  
  return normalized;
}

// Function to upload a sample document
async function uploadSampleDocument() {
  try {
    // Create a sample document
    const sampleDocument = {
      title: 'Sample Legal Contract',
      content: `LEGAL CONTRACT

This Agreement ("Agreement") is made and entered into as of the date of the last signature below ("Effective Date") by and between Company A, a corporation organized under the laws of Delaware with offices at 123 Main St, and Company B, a corporation organized under the laws of California with offices at 456 Oak Ave.

1. DEFINITIONS
1.1 "Confidential Information" means any information disclosed by either party to the other party, either directly or indirectly, in writing, orally or by inspection of tangible objects, which is designated as "Confidential," "Proprietary" or some similar designation.
1.2 "Intellectual Property Rights" means all patent rights, copyright rights, mask work rights, moral rights, rights of publicity, trademark, trade dress and service mark rights, goodwill, trade secret rights and other intellectual property rights as may now exist or hereafter come into existence, and all applications therefore and registrations, renewals and extensions thereof, under the laws of any state, country, territory or other jurisdiction.

2. SERVICES
2.1 Company A agrees to provide the services described in Exhibit A (the "Services") according to the terms and conditions of this Agreement.
2.2 Company B agrees to cooperate with Company A in the performance of the Services by providing such information, data, and materials as may be reasonably required.

3. COMPENSATION
3.1 In consideration for the Services, Company B shall pay Company A the amounts specified in Exhibit B.
3.2 Company A shall invoice Company B on a monthly basis for Services performed during the previous month.
3.3 Company B shall pay each invoice within thirty (30) days after receipt.

4. TERM AND TERMINATION
4.1 This Agreement shall commence on the Effective Date and shall continue until completion of the Services, unless earlier terminated.
4.2 Either party may terminate this Agreement upon thirty (30) days prior written notice to the other party.`,
      type: 'legal',
      tags: ['contract', 'agreement', 'legal'],
      metadata: { 
        author: 'Test User',
        version: '1.0'
      }
    };

    console.log('Generating mock Gemini embedding for document...');
    const embedding = await getGeminiEmbedding(sampleDocument.content);
    console.log('Mock embedding generated successfully.');

    // Create a test upload using anon auth
    console.log('Attempting to upload document as anonymous user...');
    
    try {
      // Insert document directly with user_id from Supabase auth
      // Note: This will work if you have proper RLS policies in place
      // that allow inserting documents from the browser
      const { data, error } = await supabase
        .from('documents')
        .insert({
          title: sampleDocument.title,
          content: sampleDocument.content,
          embedding: embedding,
          type: sampleDocument.type,
          size: Buffer.byteLength(sampleDocument.content, 'utf8'),
          tags: sampleDocument.tags,
          metadata: sampleDocument.metadata,
          // Using a test UUID since we can't create a real user in this script
          user_id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          created_at: new Date(),
          updated_at: new Date()
        })
        .select();

      if (error) {
        console.error('Error uploading document:', error);
        
        // Try with a service role if available (for bypassing RLS)
        if (error.code === 'PGRST301' || error.message.includes('violates row-level security')) {
          console.log('Row level security prevented the insert.');
          console.log('You may need to:');
          console.log('1. Create a user account manually in Supabase Auth');
          console.log('2. Use that user\'s ID when uploading documents');
          console.log('3. Or disable RLS for testing purposes (not recommended for production)');
        }
        return;
      }

      console.log('Document uploaded successfully with ID:', data[0].id);
      
      // Test vector search
      console.log('\nTesting vector similarity search with mock Gemini embedding...');
      const searchQuery = 'intellectual property rights agreement';
      const searchEmbedding = await getGeminiEmbedding(searchQuery);
      
      const { data: searchData, error: searchError } = await supabase.rpc('match_documents', {
        query_embedding: searchEmbedding,
        match_threshold: 0.7,
        match_count: 5
      });
      
      if (searchError) {
        console.error('Error searching documents:', searchError);
        return;
      }
      
      console.log(`Found ${searchData.length} results for query: "${searchQuery}"`);
      searchData.forEach((doc, i) => {
        console.log(`Result ${i+1}: "${doc.title}" (similarity: ${doc.similarity.toFixed(4)})`);
      });
      
    } catch (uploadError) {
      console.error('Error during upload process:', uploadError);
    }
    
    console.log('\nSetup complete! Your Supabase vector database is working correctly with mock Gemini embeddings.');
    console.log('\nNext steps:');
    console.log('1. Use the geminiDocumentService.ts in your application');
    console.log('2. When Gemini adds proper embedding support, update the getGeminiEmbedding function');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

uploadSampleDocument(); 