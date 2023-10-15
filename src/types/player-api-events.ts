export interface PlayerAPIEvents {
  videodatachange: {
    value: Record<string, unknown> & {
      videoId: string
      title: string
      author: string

      playlistId: string
      isUpcoming: boolean
      loading: boolean

      lengthSeconds: number
    }
  } & ({ name: 'dataloaded' } | { name: 'dataupdated ' })
}
