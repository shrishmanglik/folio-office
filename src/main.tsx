import React from 'react';import{createRoot}from'react-dom/client';import App from './App';import './app.css';
import './Theme.css';
class ErrorBoundary extends React.Component<{children:React.ReactNode},{error:string}>{state={error:''};static getDerivedStateFromError(e:any){return{error:e.message||'An unexpected error occurred'};}render(){return this.state.error?<div className="recovery"><h1>This file couldn’t be opened</h1><p>{this.state.error}</p><p>Your saved workspace is still on disk.</p><button onClick={()=>location.reload()}>Return to workspace</button></div>:this.props.children;}}
createRoot(document.getElementById('root')!).render(<ErrorBoundary><App/></ErrorBoundary>);
