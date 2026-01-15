// WebCodecs API type declarations
interface VideoEncoderConfig {
  codec: string
  width: number
  height: number
  bitrate?: number
  framerate?: number
  hardwareAcceleration?: 'no-preference' | 'prefer-hardware' | 'prefer-software'
  alpha?: 'discard' | 'keep'
  scalabilityMode?: string
  bitrateMode?: 'constant' | 'variable'
  latencyMode?: 'quality' | 'realtime'
}

interface VideoEncoderInit {
  output: (chunk: EncodedVideoChunk, metadata?: EncodedVideoChunkMetadata) => void
  error: (error: DOMException) => void
}

interface EncodedVideoChunk {
  type: 'key' | 'delta'
  timestamp: number
  duration: number | null
  byteLength: number
  copyTo(destination: BufferSource): void
}

interface EncodedVideoChunkMetadata {
  decoderConfig?: {
    codec: string
    codedWidth?: number
    codedHeight?: number
    displayAspectWidth?: number
    displayAspectHeight?: number
    colorSpace?: VideoColorSpaceInit
    description?: BufferSource
  }
}

interface VideoColorSpaceInit {
  primaries?: 'bt709' | 'bt470bg' | 'smpte170m'
  transfer?: 'bt709' | 'smpte170m' | 'iec61966-2-1'
  matrix?: 'rgb' | 'bt709' | 'bt470bg' | 'smpte170m'
  fullRange?: boolean
}

interface VideoFrameInit {
  timestamp: number
  duration?: number
  alpha?: 'discard' | 'keep'
  visibleRect?: DOMRectInit
  displayWidth?: number
  displayHeight?: number
}

declare class VideoEncoder {
  constructor(init: VideoEncoderInit)
  configure(config: VideoEncoderConfig): void
  encode(frame: VideoFrame, options?: { keyFrame?: boolean }): void
  flush(): Promise<void>
  close(): void
  reset(): void
  readonly state: 'unconfigured' | 'configured' | 'closed'
  readonly encodeQueueSize: number
  static isConfigSupported(config: VideoEncoderConfig): Promise<{ supported: boolean; config: VideoEncoderConfig }>
}

declare class VideoFrame {
  constructor(source: CanvasImageSource | HTMLVideoElement | VideoFrame | ImageBitmap | OffscreenCanvas, init?: VideoFrameInit)
  readonly format: string | null
  readonly codedWidth: number
  readonly codedHeight: number
  readonly displayWidth: number
  readonly displayHeight: number
  readonly timestamp: number
  readonly duration: number | null
  readonly visibleRect: DOMRectReadOnly | null
  readonly colorSpace: VideoColorSpace
  close(): void
  clone(): VideoFrame
  copyTo(destination: BufferSource, options?: { rect?: DOMRectInit; layout?: PlaneLayout[] }): Promise<PlaneLayout[]>
  allocationSize(options?: { rect?: DOMRectInit; layout?: PlaneLayout[] }): number
}

interface VideoColorSpace {
  readonly primaries: string | null
  readonly transfer: string | null
  readonly matrix: string | null
  readonly fullRange: boolean | null
}

interface PlaneLayout {
  offset: number
  stride: number
}
