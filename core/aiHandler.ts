export interface AIParams {
  action: 'host_generate' | 'host_tts' | 'transcribe' | 'host_mood';
  payload: any;
}

export type AIDriver = (action: string, payload: any, config: any) => Promise<any>;

/**
 * 核心逻辑与部署平台解耦：纯函数，接收驱动、配置和参数，返回统一结果。
 */
export const handleAIRequest = async (params: AIParams, driver: AIDriver, config: any = {}) => {
  const { action, payload } = params;

  // host_mood contains purely local logic without invoking AI models
  if (action === 'host_mood') {
    const { weatherCode, isDay, temperature } = payload;
    let emotion = 'serene';
    let styleId = 'aurora';
    let msg = 'The ambient atmosphere is calm.';

    if (weatherCode !== undefined) {
      if (weatherCode <= 3) {
        if (isDay) {
          emotion = 'focused'; styleId = 'crystal'; msg = 'A bright, clear day. Sharpening frequencies for focus.';
        } else {
          emotion = 'serene'; styleId = 'aurora'; msg = 'A quiet night. Syncing to cosmic serenities.';
        }
      } else if (weatherCode >= 51 && weatherCode <= 67) {
        emotion = 'tender'; styleId = 'liquid'; msg = 'Rainfall detected. Flowing into a tender, liquid state.';
      } else if (weatherCode >= 71 && weatherCode <= 82) {
        emotion = 'serene'; styleId = 'bloom'; msg = 'Snowy conditions. Softening the atmosphere.';
      } else if (weatherCode >= 95) {
        emotion = 'energized'; styleId = 'vortex'; msg = 'Storm energies detected. Enhancing resonance for a vibrant pulse.';
      } else {
        emotion = 'focused'; styleId = 'nebula'; msg = 'Misty conditions. Drifting into a nebula of sound.';
      }
    }

    return { emotion, styleId, message: msg };
  }

  // Validate AI drivers before dispatching
  if (!driver) {
    throw new Error('No AI driver provided for the requested action.');
  }

  return await driver(action, payload, config);
};
