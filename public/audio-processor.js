class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.port.onmessage = (event) => {
      // This can be used for two-way communication if needed
    };
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input.length > 0) {
      const pcmData = input[0];
      this.port.postMessage(pcmData);
    }
    return true; // Keep the processor alive
  }
}

registerProcessor('audio-processor', AudioProcessor);