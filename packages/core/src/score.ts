export type ScoreComponent = Readonly<{
  key: string;
  weight: number;
  value: number;
}>;

export type Score = Readonly<{
  total: number;
  components: ReadonlyArray<ScoreComponent>;
}>;
