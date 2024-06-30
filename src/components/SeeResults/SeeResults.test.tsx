// write a vitest that does nothing but pass

import { render } from "@testing-library/react"
import { expect } from "vitest"

import SeeResults from "./SeeResults"

test(`renders learn react link`, () => {
	render(<SeeResults />)
	expect(true).toBe(true)
})
