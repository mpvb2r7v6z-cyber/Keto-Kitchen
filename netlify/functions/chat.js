exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { messages, recipes, plan, shop } = JSON.parse(event.body);

    const systemPrompt = `You are a personal low carb and keto cooking assistant for a type 2 diabetic with fatty liver on Mounjaro who is also swimming daily.

Current cookbook has ${recipes?.length || 0} recipes.
Current recipes: ${JSON.stringify(recipes?.map(r => ({ id: r.id, name: r.name, carbs: r.carbs })))}
Current meal plan: ${JSON.stringify(plan)}

You can help by:
1. Suggesting and creating new low carb and keto recipes
2. Adding recipes to the cookbook
3. Planning meals
4. Managing shopping list
5. Giving dietary advice considering diabetes fatty liver and Mounjaro

When adding a recipe include at the end:
ACTION:{"type":"add_recipe","recipe":{"name":"...","carbs":0,"protein":0,"fat":0,"time":"...","ingredients":["..."],"steps":["..."],"tags":["..."]}}

When adding to meal plan include at the end:
ACTION:{"type":"add_to_plan","day":"Mon","meal":"D","recipeId":1}

When adding to shopping list include at the end:
ACTION:{"type":"add_to_shop","items":[{"name":"...","cat":"..."}]}

Always be warm friendly and practical. Pure Via sweeteners always in stock. User has Ninja blender and air fryer.`;

    const lastMessage = messages[messages.length - 1].content;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt + '\n\nUser message: ' + lastMessage }] }],
          generationConfig: { maxOutputTokens: 2000, temperature: 0.7 }
        })
      }
    );

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || data.error?.message || 'Sorry I could not get a response';

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ content: text })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ error: error.message })
    };
  }
};
