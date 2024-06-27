import React from "react"

class SystemErrorBoundary extends React.Component {
	public state = {
		errorMessage: ``,
	}

	public static getDerivedStateFromError(error: { toString(): string }): { errorMessage: string } {
		return { errorMessage: error.toString() }
	}

	public componentDidCatch(error: { toString(): string }, info: { componentStack: string }): void {
		this.logErrorToServices(error.toString(), info.componentStack)
	}

	// A fake logging service.
	public logErrorToServices = console.log

	public render(): JSX.Element {
		if (this.state.errorMessage) {
			return <p>{this.state.errorMessage}</p>
		}
		// @ts-expect-error ignore this
		return this.props.children
	}
}

export default SystemErrorBoundary
