
export type SystemUser = {
  username: string
  email: string | null,
  avatar?: string,
  id: string,
}

export type Candidate = {
  id?: string,
  name: string,
  avatar?: string,
  heading: string,
  details: string,
}

export type AvatarImage = {
  file: File | null,
  url: string
}
