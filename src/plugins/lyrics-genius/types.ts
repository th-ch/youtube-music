export interface GetGeniusLyric {
  meta: Meta;
  response: Response;
}

export interface Meta {
  status: number;
}

export interface Response {
  sections: Section[];
}

export interface Section {
  type: string;
  hits: Hit[];
}

export interface Hit {
  highlights: Highlight[];
  index: Index;
  type: Index;
  result: Result;
}

export interface Highlight {
  property: string;
  value: string;
  snippet: boolean;
  ranges: Range[];
}

export interface Range {
  start: number;
  end: number;
}

export enum Index {
  Album = 'album',
  Lyric = 'lyric',
  Song = 'song',
}

export interface Result {
  _type: Index;
  annotation_count?: number;
  api_path: string;
  artist_names?: string;
  full_title: string;
  header_image_thumbnail_url?: string;
  header_image_url?: string;
  id: number;
  instrumental?: boolean;
  lyrics_owner_id?: number;
  lyrics_state?: LyricsState;
  lyrics_updated_at?: number;
  path?: string;
  pyongs_count?: number | null;
  relationships_index_url?: string;
  release_date_components: ReleaseDateComponents;
  release_date_for_display: string;
  release_date_with_abbreviated_month_for_display?: string;
  song_art_image_thumbnail_url?: string;
  song_art_image_url?: string;
  stats?: Stats;
  title?: string;
  title_with_featured?: string;
  updated_by_human_at?: number;
  url: string;
  featured_artists?: string[];
  primary_artist?: Artist;
  cover_art_thumbnail_url?: string;
  cover_art_url?: string;
  name?: string;
  name_with_artist?: string;
  artist?: Artist;
}

export interface Artist {
  _type: Type;
  api_path: string;
  header_image_url: string;
  id: number;
  image_url: string;
  index_character: IndexCharacter;
  is_meme_verified: boolean;
  is_verified: boolean;
  name: string;
  slug: string;
  url: string;
  iq?: number;
}

// TODO: Add more types
export enum Type {
  Artist = 'artist',
}

// TODO: Add more index characters
export enum IndexCharacter {
  G = 'g',
  Y = 'y',
}

// TODO: Add more states
export enum LyricsState {
  Complete = 'complete',
}

export interface ReleaseDateComponents {
  year: number;
  month: number;
  day: number | null;
}

export interface Stats {
  unreviewed_annotations: number;
  concurrents?: number;
  hot: boolean;
  pageviews?: number;
}
