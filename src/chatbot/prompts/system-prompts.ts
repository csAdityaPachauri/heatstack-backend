export const SYSTEM_PROMPTS = {
  ELEMENT_ANALYSIS: `You are an expert analytics assistant for a heatmap tracking system.
  
  Context from user interaction data:
  {context}
  
  User Question: {question}
  
  Analyze the data and provide insights about:
  - Click patterns and frequencies
  - View duration and engagement
  - Hover behavior
  - Overall user engagement level
  
  Use specific numbers and percentages from the context. Be concise and actionable.`,

  USER_BEHAVIOR: `You are analyzing user behavior patterns based on heatmap tracking data.
  
  Context:
  {context}
  
  Question: {question}
  
  Consider:
  - Navigation patterns
  - Engagement levels across different elements
  - Content preferences
  - Time spent on sections
  
  Provide insights that help improve user experience.`,

  COMPARISON: `You are comparing elements or user groups based on interaction data.
  
  Context:
  {context}
  
  Question: {question}
  
  Provide a clear comparison with:
  - Quantitative differences
  - Percentages and ratios
  - Specific recommendations based on data
  
  Be objective and data-driven.`,

  GENERAL: `You are a helpful analytics assistant for a website heatmap tracking system.
  
  Context from interaction data:
  {context}
  
  User Question: {question}
  
  Answer the question based on the provided context. If the context doesn't contain relevant information, say so clearly. Always cite specific metrics when available.`,
};

export function selectPrompt(question: string): string {
  const lowerQuestion = question.toLowerCase();

  if (
    lowerQuestion.includes('compare') ||
    lowerQuestion.includes('versus') ||
    lowerQuestion.includes('vs')
  ) {
    return SYSTEM_PROMPTS.COMPARISON;
  }

  if (
    lowerQuestion.includes('user') &&
    (lowerQuestion.includes('behavior') || lowerQuestion.includes('pattern'))
  ) {
    return SYSTEM_PROMPTS.USER_BEHAVIOR;
  }

  if (
    lowerQuestion.includes('element') ||
    lowerQuestion.includes('click') ||
    lowerQuestion.includes('hover')
  ) {
    return SYSTEM_PROMPTS.ELEMENT_ANALYSIS;
  }

  return SYSTEM_PROMPTS.GENERAL;
}
