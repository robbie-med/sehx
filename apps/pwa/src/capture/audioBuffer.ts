export type RingBuffer = {
  capacity: number;
  sampleRate: number;
  data: Float32Array;
  writeIndex: number;
  filled: boolean;
};

export function createRingBuffer(seconds: number, sampleRate: number): RingBuffer {
  const capacity = Math.max(1, Math.floor(seconds * sampleRate));
  return {
    capacity,
    sampleRate,
    data: new Float32Array(capacity),
    writeIndex: 0,
    filled: false
  };
}

export function writeToRingBuffer(buffer: RingBuffer, chunk: Float32Array) {
  const len = chunk.length;
  for (let i = 0; i < len; i += 1) {
    buffer.data[buffer.writeIndex] = chunk[i];
    buffer.writeIndex = (buffer.writeIndex + 1) % buffer.capacity;
    if (buffer.writeIndex === 0) buffer.filled = true;
  }
}

export function clearRingBuffer(buffer: RingBuffer) {
  buffer.data.fill(0);
  buffer.writeIndex = 0;
  buffer.filled = false;
}

export function readRingBuffer(buffer: RingBuffer) {
  if (!buffer.filled && buffer.writeIndex === 0) return buffer.data.slice(0, 0);
  if (!buffer.filled) {
    return buffer.data.slice(0, buffer.writeIndex);
  }
  const out = new Float32Array(buffer.capacity);
  out.set(buffer.data.subarray(buffer.writeIndex));
  out.set(buffer.data.subarray(0, buffer.writeIndex), buffer.capacity - buffer.writeIndex);
  return out;
}
