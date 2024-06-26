export type SystemUser = {
	admin?: boolean
	username: string
	email: string | null
	avatar?: string
	id: string
}

export type Candidate = {
	id?: string
	name: string
	avatar?: string
	heading: string
	details: string
}

export type AvatarImage = {
	file: File | null
	url: string
}

export type ElectionState = `closed` | `not-started` | `voted` | `voting`

export type ElectionData = {
	state: ElectionState
	users: string[]
}

export type ActualVote = {
	voterId: string
	firstChoice: string[]
	secondChoice: string[]
	thirdChoice: string[]
	finished: boolean
}
