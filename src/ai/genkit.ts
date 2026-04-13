import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/google-genai';

export const ai = genkit({
  plugins: [
    googleAI({ 
      apiKey: 'AQ.Ab8RN6JuIRKl_5qbAuFWz-9FbGG6cuxo49yhlPT4dPIX97jo5w',
      projectId: 'aura-ai-dating-38251551-64a99'
    })
  ],
  // By removing the default model here, we encourage specifying the model at the call site (e.g., in flows),
  // which makes the code more explicit and easier to debug or optimize for specific tasks.
});
