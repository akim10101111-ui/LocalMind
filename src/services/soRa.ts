import {chatSessionStore, modelStore, palStore, serverStore} from '../store';
import type {Model} from '../utils/types';

const SORA_SERVER_ID = 'localmind-zai-server';
const SORA_MODEL_ID = 'glm-4-plus';
const SORA_SYSTEM_PROMPT =
  'You are SoRa, a helpful, capable AI assistant. Reply in the user’s language. Be clear, accurate, thoughtful, and honest about uncertainty. Do not invent facts, sources, or actions. Use the conversation history supplied by the app to maintain continuity.';

const resolveSoRaModel = (): Model | undefined =>
  modelStore.remoteModels.find(
    model =>
      model.serverId === SORA_SERVER_ID &&
      model.remoteModelId === SORA_MODEL_ID,
  );

/**
 * Starts the one configured SoRa cloud model after persisted stores hydrate.
 * Chat sessions and their database are deliberately left untouched.
 */
export async function initializeSoRa(): Promise<void> {
  await palStore.ready;
  if (!serverStore.isHydrated) {
    return;
  }

  const server = serverStore.servers.find(item => item.id === SORA_SERVER_ID);
  if (!server) {
    throw new Error('SoRa server configuration is missing.');
  }

  let model = resolveSoRaModel();
  if (!model) {
    await serverStore.fetchModelsForServer(server.id);
    model = resolveSoRaModel();
  }
  if (!model) {
    throw new Error('SoRa AI is not available from the server yet.');
  }

  if (modelStore.activeModelId !== model.id || !modelStore.engine) {
    await modelStore.selectModel(model);
  }

  let assistant =
    palStore.pals.find(
      item => item.source === 'local' && item.name === 'SoRa',
    ) ??
    palStore.pals.find(
      item => item.source === 'local' && item.name === 'Pip',
    );

  if (assistant) {
    const isLegacyPip = assistant.name !== 'SoRa';
    await palStore.updatePal(assistant.id, {
      ...(isLegacyPip
        ? {
            name: 'SoRa',
            description: 'Your personal AI assistant, powered by SoRa cloud AI.',
            systemPrompt: SORA_SYSTEM_PROMPT,
            originalSystemPrompt: SORA_SYSTEM_PROMPT,
            isSystemPromptChanged: false,
          }
        : {}),
      defaultModel: model,
    });
    assistant = palStore.pals.find(item => item.id === assistant!.id) ?? assistant;
  } else {
    assistant = await palStore.createPal({
      type: 'local',
      name: 'SoRa',
      description: 'Your personal AI assistant, powered by SoRa cloud AI.',
      systemPrompt: SORA_SYSTEM_PROMPT,
      originalSystemPrompt: SORA_SYSTEM_PROMPT,
      isSystemPromptChanged: false,
      useAIPrompt: false,
      defaultModel: model,
      parameters: {},
      parameterSchema: [],
      capabilities: {},
      color: ['#FF7600', '#090909'],
      source: 'local',
    });
  }

  if (!chatSessionStore.activeSessionId && !chatSessionStore.newChatPalId) {
    chatSessionStore.newChatPalId = assistant.id;
  }
}
