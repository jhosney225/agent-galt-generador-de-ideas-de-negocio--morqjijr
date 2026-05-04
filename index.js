
```javascript
const Anthropic = require("@anthropic-ai/sdk");

const client = new Anthropic();

// Validación de idea de negocio
function validateBusinessIdea(idea) {
  const validationRules = [
    {
      name: "Longitud mínima",
      check: (idea) => idea.length >= 10,
      message: "La idea debe tener al menos 10 caracteres",
    },
    {
      name: "Sin números solo",
      check: (idea) => !/^\d+$/.test(idea),
      message: "La idea no puede ser solo números",
    },
    {
      name: "Sin caracteres especiales excesivos",
      check: (idea) => (idea.match(/[!@#$%^&*]/g) || []).length <= 2,
      message:
        "La idea contiene demasiados caracteres especiales consecutivos",
    },
    {
      name: "Contiene palabras claves válidas",
      check: (idea) => {
        const keywords = [
          "servicio",
          "producto",
          "plataforma",
          "aplicación",
          "negocio",
          "empresa",
          "solución",
          "tecnología",
          "consultoria",
          "venta",
          "tienda",
          "agencia",
          "sistema",
        ];
        return keywords.some((keyword) =>
          idea.toLowerCase().includes(keyword)
        );
      },
      message: "La idea debe incluir palabras clave de negocios válidas",
    },
  ];

  const results = validationRules.map((rule) => ({
    name: rule.name,
    passed: rule.check(idea),
    message: rule.message,
  }));

  return {
    isValid: results.every((r) => r.passed),
    results,
    validationScore: (results.filter((r) => r.passed).length / results.length) * 100,
  };
}

// Función para generar ideas de negocio con Claude
async function generateBusinessIdea(category) {
  try {
    console.log(
      `\n📊 Generando idea de negocio para categoría: ${category}...`
    );

    const message = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: `Genera una idea de negocio innovadora y viable para la categoría "${category}". 
          Proporciona:
          1. Nombre de la idea (máximo 10 palabras)
          2. Descripción breve (2-3 oraciones)
          3. Mercado objetivo
          4. Diferenciador principal
          5. Inversión inicial estimada
          
          Sé conciso y práctico.`,
        },
      ],
    });

    const ideaContent =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Extrae el nombre de la idea (primera línea después de "Nombre de la idea:")
    const nameMatch = ideaContent.match(/Nombre de la idea[^:]*:\s*(.+)/i);
    const ideaName = nameMatch
      ? nameMatch[1].trim().substring(0, 50)
      : "Idea generada";

    // Valida la idea generada
    const validation = validateBusinessIdea(ideaContent);

    return {
      id: Date.now(),
      category,
      name: ideaName,
      fullDescription: ideaContent,
      generatedAt: new Date().toISOString(),
      validation,
      apiUsage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      },
    };
  } catch (error) {
    console.error("Error generando idea:", error.message);
    throw error;
  }
}

// Función para evaluar viabilidad de idea
async function evaluateIdeaViability(idea) {
  try {
    console.log(`\n🔍 Evaluando viabilidad de: ${idea.name}...`);

    const message = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: `Basándote en esta idea de negocio, proporciona una evaluación rápida:
          
          ${idea.fullDescription}
          
          Proporciona un score de viabilidad del 1-10 y 3 riesgos principales.`,
        },
      ],
    });

    const evaluationContent =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Extrae el score si está presente
    const scoreMatch = evaluationContent.match(/(?:score|puntuación)[^\d]*(\d+)/i);
    const viabilityScore = scoreMatch ? parseInt(scoreMatch[1]) : 5;

    return {
      ideaId: idea.id,
      viabilityScore: Math.min(10, viabilityScore),
      evaluation: evaluationContent,
      evaluatedAt: new Date().toISOString(),
      apiUsage: {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      },
    };
  } catch (error) {
    console.error("Error evaluando viabilidad:", error.message);
    throw error;
  }
}

// Función principal
async function main() {
  console.log("🚀 Generador de Ideas de Negocio con Validación");
  console.log("=".repeat(50));

  const categories = [
    "Tecnología y SaaS",
    "Comercio electrónico",
    "Servicios digitales",