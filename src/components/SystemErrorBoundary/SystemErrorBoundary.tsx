import React from 'react';

class SystemErrorBoundary extends React.Component {
  state = {
    errorMessage: '',
  };

  static getDerivedStateFromError(error: any) {
    return { errorMessage: error.toString() };
  }

  componentDidCatch(error: any, info: any) {
    this.logErrorToServices(error.toString(), info.componentStack);
  }

  // A fake logging service.
  logErrorToServices = console.log;

  render() {
    if (this.state.errorMessage) {
      return <p>{this.state.errorMessage}</p>;
    }
    // @ts-expect-error ignore this
    return this.props.children;
  }
}

export default SystemErrorBoundary;