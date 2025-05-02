require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);

// Check configuration
if (!process.env.VITE_SUPABASE_URL || !process.env.VITE_SUPABASE_ANON_KEY) {
  console.error('Missing Supabase credentials. Please run setup-env.js first.');
  process.exit(1);
}

if (!process.env.VITE_GEMINI_API_KEY) {
  console.error('Missing Gemini API key. Please run setup-env.js first.');
  process.exit(1);
}

// Function to generate embedding
async function getEmbedding(text) {
  try {
    const model = genAI.getGenerativeModel({ model: 'embedding-001' });
    const embedResult = await model.embedContent(text);
    return embedResult.embedding.values;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
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

    console.log('Generating embedding for document...');
    const embedding = await getEmbedding(sampleDocument.content);
    console.log('Embedding generated successfully.');

    // Try to sign in or sign up with a test email
    console.log('Creating test user...');
    const testEmail = 'test@example.com';
    const testPassword = 'Password123!';
    
    // Try to sign up first
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    });
    
    if (signUpError && signUpError.message !== 'User already registered') {
      console.error('Error creating test user:', signUpError);
      process.exit(1);
    }
    
    // Then sign in
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (signInError) {
      console.error('Error signing in:', signInError);
      process.exit(1);
    }
    
    const userId = signInData.user.id;
    console.log('Test user authenticated with ID:', userId);

    // Insert document into Supabase
    console.log('Uploading document to Supabase...');
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
        user_id: userId,
        created_at: new Date(),
        updated_at: new Date()
      })
      .select();

    if (error) {
      console.error('Error uploading document:', error);
      return;
    }

    console.log('Document uploaded successfully with ID:', data[0].id);
    
    // Test vector search
    console.log('\nTesting vector similarity search...');
    const searchQuery = 'intellectual property rights agreement';
    const searchEmbedding = await getEmbedding(searchQuery);
    
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
    
    console.log('\nSetup complete! Your Supabase vector database is working correctly.');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

uploadSampleDocument();