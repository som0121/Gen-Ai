import * as dotenv from 'dotenv';
dotenv.config();

import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { GoogleGenerativeAIEmbeddings } from '@langchain/google-genai';
import { Pinecone } from '@pinecone-database/pinecone';
import { PineconeStore } from '@langchain/pinecone';

async function indexDocument(){
   
    // load pdf

    const PDF_PATH = './rag.pdf';
    const pdfLoader = new PDFLoader(PDF_PATH);
    const rawDocs = await pdfLoader.load();
    console.log("PDF loaded");

    // chunking

    const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 200,
    chunkOverlap: 50,
  });

    const chunkedDocs = await textSplitter.splitDocuments(rawDocs);

    console.log("Chunking Completed");

    // Vector Embedding model

    const embeddings = new GoogleGenerativeAIEmbeddings({
    apiKey: process.env.GEMINI_API_KEY,
    model: 'gemini-embedding-001',
  });

  console.log("Embedding model configured");

  //Database configure
  //Initialize Pincone Client

  const pinecone = new Pinecone();
  const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);

  console.log("Pinecone model configured");

  // langchain (chunking,embedding,database)


  await PineconeStore.fromDocuments(chunkedDocs, embeddings, {

    pineconeIndex,
    maxConcurrency:5,
  });

  console.log("Data stored successfully");


    console.log(rawDocs.length)

}
indexDocument();