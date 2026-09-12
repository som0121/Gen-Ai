import "dotenv/config";
import { GoogleGenAI } from "@google/genai";
import readlineSync from 'readline-sync';

const History = []

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});




async function Chatting(userProblem){

  History.push( {

    role: 'user',
    parts: [{text:userProblem}]
  })

const interaction = await ai.models.generateContent({
  model: "gemini-3.6-flash",
  
  contents:History
});

 History.push( {

    role: 'model',
    parts: [{text: interaction.text}]
  })


console.log("AI:", interaction.text);
}

async function main(){

  while (true) {

  const userProblem = readlineSync.question("Ask me anything--");
  await Chatting(userProblem);

}
}

main();
