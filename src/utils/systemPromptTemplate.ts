import Mustache from 'mustache';

/**
 * Renders a Mustache template with provided values
 */
export function renderSystemPromptTemplate(
  template: string,
  parameters: Record<string, any>,
): string {
  if (!template || typeof template !== 'string') {
    return '';
  }

  if (!parameters || typeof parameters !== 'object') {
    return template;
  }

  try {
    // Process parameter values for Mustache rendering
    const processedParameters = processParametersForMustache(parameters);
    // Disable HTML escaping for our use case
    return Mustache.render(
      template,
      processedParameters,
      {},
      {
        escape: (text: string) => text,
      },
    );
  } catch (error) {
    console.warn('Failed to render Mustache template:', error);
    return template;
  }
}

/**
 * Processes parameter values for Mustache rendering
 */
function processParametersForMustache(
  parameters: Record<string, any>,
): Record<string, any> {
  const processed: Record<string, any> = {};

  for (const [key, value] of Object.entries(parameters)) {
    // Handle datetime_tag parameters
    if (value === '{{datetime}}') {
      processed[key] = new Date().toLocaleString();
      continue;
    }

    // Handle array values (select)
    if (Array.isArray(value)) {
      processed[key] = value.join(', ');
      continue;
    }

    // Handle boolean values
    if (typeof value === 'boolean') {
      processed[key] = value ? 'Yes' : 'No';
      continue;
    }

    // Handle null/undefined
    if (value == null) {
      processed[key] = '';
      continue;
    }

    processed[key] = String(value);
  }

  return processed;
}
