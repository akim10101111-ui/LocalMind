import {runInAction} from 'mobx';
import {chatSessionStore, modelStore, palStore, serverStore} from '../store';
import {ModelOrigin, type Model} from '../utils/types';

const SORA_SERVER_URL = 'https://d1c10as5tg10-d.space-z.ai';
const SORA_MODEL_ID = 'glm-4-plus';
const SORA_SYSTEM_PROMPT =
  'You are SoRa, a helpful, capable AI assistant. Reply in the user’s language. Be clear, accurate, thoughtful, and honest about uncertainty. Do not invent facts, sources, or actions. Use the conversation history supplied by the app to maintain continuity.';

const OBSOLETE_LOCAL_MODEL_IDS = [
  'bartowski/DeepSeek-R1-Distill-Qwen-1.5B-GGUF/DeepSeek-R1-Distill-Qwen-1.5B-Q4_K_S.gguf',
];

const removeBundledDeepSeek = async (): Promise<void> => {
  for (const id of OBSOLETE_LOCAL_MODEL_IDS) {
    const model = modelStore.models.find(
      item => item.id === id && item.origin !== ModelOrigin.REMOTE,
    );
    if (model) {
      try {
        await modelStore.deleteModel(model);
      } catch (error) {
        // Cleanup is best-effort: a stale local model must never block SoRa.
        console.warn('[SoRa] Could not remove obsolete local model:', error);
      }
    }
  }
};

const resolveSoRaModel = (serverId: string): Model | undefined =>
  modelStore.remoteModels.find(
    model =>
      model.serverId === serverId &&
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

  const server = serverStore.servers.find(
    item => item.url.replace(/\/+$/, '') === SORA_SERVER_URL,
  );
  if (!server) {
    throw new Error('SoRa server configuration is missing.');
  }

  let model = resolveSoRaModel(server.id);
  if (!model) {
    await serverStore.fetchModelsForServer(server.id);
    model = resolveSoRaModel(server.id);
  }
  if (!model) {
    throw new Error('SoRa AI is not available from the server yet.');
  }

  if (modelStore.activeModelId !== model.id || !modelStore.engine) {
    await modelStore.selectModel(model);
  }

  // Remove only the two exact bundled DeepSeek variants from older LocalMind
  // installs. Chat history, settings, and every unrelated user file remain.
  await removeBundledDeepSeek();

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
            ...(assistant.isSystemPromptChanged
              ? {}
              : {
                  systemPrompt: SORA_SYSTEM_PROMPT,
                  originalSystemPrompt: SORA_SYSTEM_PROMPT,
                  isSystemPromptChanged: false,
                }),
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

  // Existing custom assistants keep their names and system prompts, but
  // all of them now use the single SoRa cloud model instead of stale local
  // or removed server model references.
  for (const pal of [...palStore.pals]) {
    if (pal.defaultModel && pal.defaultModel.id !== model.id) {
      await palStore.updatePal(pal.id, {defaultModel: model});
    }
  }

  if (!chatSessionStore.activeSessionId && !chatSessionStore.newChatPalId) {
    runInAction(() => {
      chatSessionStore.newChatPalId = assistant!.id;
    });
  }
}
