export type MicCaptureState = {
  stream?: MediaStream;
  context?: AudioContext;
  source?: MediaStreamAudioSourceNode;
  processor?: ScriptProcessorNode;
  sampleRate?: number;
};

export type MicCaptureCallbacks = {
  onAudioFrame?: (samples: Float32Array, sampleRate: number) => void;
};

export async function startMicCapture(
  callbacks: MicCaptureCallbacks = {}
): Promise<MicCaptureState> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const context = new AudioContext();
  const source = context.createMediaStreamSource(stream);
  const processor = context.createScriptProcessor(2048, 1, 1);

  processor.onaudioprocess = (event) => {
    const input = event.inputBuffer.getChannelData(0);
    callbacks.onAudioFrame?.(new Float32Array(input), context.sampleRate);
  };

  source.connect(processor);
  processor.connect(context.destination);

  return {
    stream,
    context,
    source,
    processor,
    sampleRate: context.sampleRate
  };
}

export async function stopMicCapture(state: MicCaptureState) {
  state.processor?.disconnect();
  state.source?.disconnect();
  state.stream?.getTracks().forEach((track) => track.stop());
  if (state.context?.state !== "closed") {
    await state.context?.close();
  }
}
